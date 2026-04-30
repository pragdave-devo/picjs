import { RTE } from "../runtime_error.js"
import { RenderParameters, TBase, TBool, TColor, TNumber, TPosition, TNative } from "../types.js"
import { DegreesToRadians } from "../geometry.js"
import { CardinalFactorsFromCenter, Cardinals, XY } from "../position.js"
import { Dispatcher } from "../dispatcher.js"
import * as AST from "../ast.js"
import { Binding } from "../binding.js"
import type { SGroup } from "./sgroup.js"  // type-only import avoids circular dependency

export type ShapeArgs = Record<string, any>
export type ProcessedWithConstraint =  {
  type: `ProcessedWithConstraint`,
  cardinal: Cardinals,
  targetAsShapeObject: SBase,
}

export type WithConstraint = AST.ASTWithConstraint | ProcessedWithConstraint

export const CardinalAttributes = {
  c: 1,
  n: 1,
  ne: 1,
  e: 1,
  se: 1,
  s: 1,
  sw: 1,
  w: 1,
  nw: 1,
}

const OtherGeometryAttributes = {
  x: 1,
  y: 1,
  width: 1,
  height: 1,
}

const StyleAttributes = {
  thickness: 1,
  fill: 1,
  stroke: 1,
}

const AbbreviatedAttrNames: { [abbrev: string]: string } = {
  ht: `height`,
  wid: `width`,
}


let sID = 1

function formatAttrs(attrs: Record<string, any>) {
  const result = []
  for (const k of Object.keys(attrs).sort()) {
    let val = attrs[k]
    if (val)
      val = val.toString()
    else
      val = `␀`
    result.push(`${k} ${val}`)
  }
  return result.join(` | `)
}

//////////////////////////////////////////////////////////////////////

export class SBase extends TBase<null> {

  // These are the SVG parameters
  public id        = `s-id-${sID++}`
  public shapeName = this.constructor.name

  public params:         ShapeArgs = {}
  public anchorX:        number | null = null
  public anchorY:        number | null = null
  public _hasExplicitAt = false
  public withConstraint?: WithConstraint

  protected dispatcher: Dispatcher
  protected hidden: ShapeArgs = {}
  protected bindingAtCreation: Binding
  protected childShape?: SBase
  parentShape?: SBase
  children: SBase[] = []

  // rotation trig values
  protected sinR = 0.0
  protected cosR = 0.0

  // dirty bits for rendering and geometry
  protected renderNeeded = false
  protected hasMoved = false
  variableDirty = false
  visible = false   // set true when CreateShape timeline entry is processed
  insideAside = false  // shapes created inside Aside blocks are not implicit connector targets

  // When true, autolayout accounts for next shape's entry edge (Gap endpoint)
  layoutAsEdge = false

  // Draw this shape before `behind` (so it appears behind it in SVG)
  behind?: SBase

  // Relative positioning within a parent group (see sgroup.ts)
  parentGroup?: SGroup
  relativeX?: number      // X offset from parent group anchor
  relativeY?: number      // Y offset from parent group anchor

  // Original AST args for re-evaluation when variables change
  astArgs?: Record<string, any>

  // ---------------------------------
  //
  constructor(args: ShapeArgs, withConstraint: WithConstraint | undefined, dispatcher: Dispatcher) {
    super(null)
    this.withConstraint = withConstraint
    this.dispatcher = dispatcher
    this.bindingAtCreation = dispatcher.getCurrentBinding()
    this.setupParams(args)

    this.attrs.has = new TNative(`has`, [`attr_name`],
      `return true if this shape has the named attribute`,
      (_interpreter, attr_name) => {
        const name = String(attr_name)
        const resolved = AbbreviatedAttrNames[name] || name
        if (resolved in this.attrs) return new TBool(true)
        if (resolved in this.params) return new TBool(true)
        if (resolved in this.hidden) return new TBool(true)
        if (CardinalAttributes.hasOwnProperty(resolved)) return new TBool(true)
        if (OtherGeometryAttributes.hasOwnProperty(resolved)) return new TBool(true)
        if (StyleAttributes.hasOwnProperty(resolved)) return new TBool(true)
        if ((`handle_attr_` + resolved) in this) return new TBool(true)
        return new TBool(false)
      })
  }

  reEvaluateArgs() {
    if (!this.astArgs) return
    const prev = this.dispatcher.currentEvaluatingShape
    this.dispatcher.currentEvaluatingShape = this
    const newArgs = this.dispatcher.evaluateArgs(this.astArgs, this.bindingAtCreation)
    this.dispatcher.currentEvaluatingShape = prev
    this.setupParams(newArgs)
  }

  valueOfAttr(attribute: string) {
    return this.valueOfTree(this[attribute])
  }

  valueOfTree(tree: AST.Node) {
    const prev = this.dispatcher.currentEvaluatingShape
    this.dispatcher.currentEvaluatingShape = this
    const result = this.dispatcher.valueOf(tree, this.bindingAtCreation)
    this.dispatcher.currentEvaluatingShape = prev
    return result
  }

  setupParams(args: ShapeArgs) {
    if (args._shapeName) {
      this.shapeName = args._shapeName
    }
    this.params = this.dispatcher.getAllDefaultAttributes(
      `Shapes`,
      this.shapeName,
      args._class || `.normal`
    )

    for (let k of Object.keys(args)) {
      const val = args[k]
      if (k.startsWith(`_`)) {
        this.hidden[k] = val
      }
      else if (k === `at`) {
        this.anchorX = val.x
        this.anchorY = val.y
        this._hasExplicitAt = true
      }
      // else if (k === `x`) {
      //   this.anchorX = val
      // }
      // else if (k === `y`) {
      //   this.anchorY = val
      // }
      else {
        this.params[k] = val
      }
    }
    this.setRotationVector()
  }

  setRotationVector() {
    const radians = this.rotation * DegreesToRadians
    this.sinR = Math.sin(radians)
    this.cosR = Math.cos(radians)
  }


  missingDimensions() {
    return !(`width` in this.params && `height` in this.params)
  }

  calculateDimensions() {
    this.params.width  ??= 1
    this.params.height ??= 1
  }

  requiredPosition(): RenderParameters {
    if (this.anchorX === null || this.anchorY === null)
      throw new Error(`render called by anchor not set`)

    const rc =
      this.rotationCenter
        ? this.valueOfTree(this.rotationCenter)
        : this.c

        return {
          cardinal: `c`,
          x: this.anchorX,
          y: this.anchorY,
          nw: this.nw,
          width: this.width,
          height: this.height,
          rotation: this.rotation,
          rotationCenter: rc,
        }
  }


  // here we deal with child nodes (for example when a shape has a text label)

  setupChildWithConstraint(child: AST.Shape) {
    child.withConstraint = this.createOverlappingWithConstraint()
    child.isChildShape = true  // Mark so geometry knows not to make this lastShape
    return child
  }

  // For line/arc labels with path-based positioning
  setupLineLabelConstraint(child: AST.Shape, pathPercent: number, side: string) {
    child.withConstraint = this.createLineLabelConstraint(pathPercent, side)
    child.isChildShape = true
    return child
  }

  // Create a constraint that positions label along path with perpendicular offset
  protected createLineLabelConstraint(pathPercent: number, side: string): WithConstraint {
    return {
      type: `LineLabelConstraint`,
      cardinal: `c`,
      parentShape: this,
      pathPercent,
      side,
    }
  }

  addChild(child: SBase) {
    if (!this.childShape) {
      this.childShape = child
    }
    // Allow multiple children (for multiple line labels)
    child.parentShape = this
    this.children.push(child)
    child.params._parentWidth = this.width
    child.params._parentHeight = this.height
    // Pass fill for auto-text coloring with palette colors
    child.params._parentFill = this.params.fill
  }

  isChild() {
    return !!this.parentShape
  }

  isConnector() {
    return false
  }

  // ------------------- this part is used by the interpreter. all values are wrapped in Txxx types
  //

  handle_attr_x()         { return new TNumber(this.x || -1)          }
  handle_attr_y()         { return new TNumber(this.y || -1)          }
  handle_attr_wid()       { return new TNumber(this.width)            }
  handle_attr_width()     { return new TNumber(this.width)            }
  handle_attr_ht()        { return new TNumber(this.height)           }
  handle_attr_height()    { return new TNumber(this.height)           }

  handle_attr_fill()      { return new TColor(this.params.fill)       }
  handle_attr_stroke()    { return new TColor(this.params.stroke)     }

  handle_attr_opacity()   { return new TNumber(this.params.opacity ?? 1) }
  handle_attr_rotation()  { return new TNumber(this.rotation)         }
  handle_attr_thickness() { return new TNumber(this.params.thickness) }

  // cardinal points are dynamically generated based on the current center, width, and height

  handle_attr_c()         { return new TPosition(this.c)              }
  handle_attr_n()         { return new TPosition(this.n)              }
  handle_attr_ne()        { return new TPosition(this.ne)             }
  handle_attr_e()         { return new TPosition(this.e)              }
  handle_attr_se()        { return new TPosition(this.se)             }
  handle_attr_s()         { return new TPosition(this.s)              }
  handle_attr_sw()        { return new TPosition(this.sw)             }
  handle_attr_w()         { return new TPosition(this.w)              }
  handle_attr_nw()        { return new TPosition(this.nw)             }

  // we need to intercept attribute changes, because we're going to put them on the
  // timeline as well. 
  //
  // We still update the shape version of the attribute now: the repr version will
  // get updated when the timeline triggers a geometry update

  setAtAttr(name: string, value: any) {
    if (name.startsWith(`_`)) {
      this.hidden[name.slice(1)] = value
      return this
    }

    name = AbbreviatedAttrNames[name] || name

    if (CardinalAttributes.hasOwnProperty(name)) {
      if (!(value instanceof TPosition))
        throw new RTE(`the ".${name}" attribute needs a position, but I got ${value.toNative()}`)
      this.dispatcher.setCardinalToPoint(this, name as Cardinals, value.x, value.y)
    }
    else if (OtherGeometryAttributes.hasOwnProperty(name)) {
      this.dispatcher.updateOtherGeometry(this, name, value.toNative())
    }
    else if (StyleAttributes.hasOwnProperty(name)) {
      this.dispatcher.updateShapeStyle(this, name, value)
    }
    else {
      // assume no special processing for user defined attributes
    }

    if (name === `rotation`) {
      this.setRotationVector()
    }

    return super.setAtAttr(name, value)
  }


  // ------------------- this part is used by the layout. Typoes are JavaScript native

  hasNoXCoordinate() {
    return this.anchorX === null
  }

  hasNoYCoordinate() {
    return this.anchorY === null
  }

  hasExplicitPosition() {
    return this._hasExplicitAt || !!this.withConstraint
  }

  // these assume the anchor point is the center. This can be overridden
  // by particular shapes (such as text)

  get x() { return this.anchorX }
  get y() { return this.anchorY }

  get width() { return this.params.width }
  get height() { return this.params.height }

  get rotation() { return this.params.rotation }
  get rotationCenter() { return this.hidden._rotationCenter }

  get nw() { return this.corner(`nw`) }
  get n() { return this.corner(`n`) }
  get ne() { return this.corner(`ne`) }
  get e() { return this.corner(`e`) }
  get se() { return this.corner(`se`) }
  get s() { return this.corner(`s`) }
  get sw() { return this.corner(`sw`) }
  get w() { return this.corner(`w`) }
  get c() { return this.corner(`c`) }


  getCardinalOffsetsFromAnchor(cardinal: Cardinals) {
    let [fx, fy] = CardinalFactorsFromCenter[cardinal]
    fx = fx * this.width
    fy = fy * this.height
    return [
      fx * this.cosR - fy * this.sinR,
      fx * this.sinR + fy * this.cosR
    ]
  }

  corner(cardinal: Cardinals) {
    this.checkAnchorSet()
    let [dx, dy] = this.getCardinalOffsetsFromAnchor(cardinal)
    let x = (this.anchorX || 0) + dx
    let y = (this.anchorY || 0) + dy

    // If this shape is in a group, transform from local to absolute coordinates
    if (this.parentGroup) {
      const group = this.parentGroup
      const gx = group.anchorX ?? 0
      const gy = group.anchorY ?? 0
      const rotation = (group.params.rotation ?? 0) * DegreesToRadians
      const cos = Math.cos(rotation)
      const sin = Math.sin(rotation)
      // Apply group rotation then translation
      const absX = gx + x * cos - y * sin
      const absY = gy + x * sin + y * cos
      x = absX
      y = absY
    }

    return { x, y }
  }

  // animation

  getAnimatablePosition() {
    return this.handle_attr_c()
  }

  setAnimatablePosition(x: number, y: number) {
    if (this.params.x != x || this.params.y != y || this.anchorX === null) {
      this.params.x = this.anchorX = x
      this.params.y = this.anchorY = y
      this.rememberRenderNeeded(true)
      this.dispatcher.propagateDirty(this)
    }
  }

  // Crossfade animation support (for non-interpolatable attributes)
  // Subclasses can override to implement visual crossfade effects
  prepareForCrossfade(_targetValue: unknown) {}
  updateCrossFade(_ratio: number) {}
  finalizeCrossFade() {}

  // Index signature for dynamic attribute dispatch: this[`handle_attr_${attr}`]
  // TypeScript lacks string-pattern index types, so `any` is required here
  [attr_name: string]: any

  getAnimatableAttr(attr: string) {
    const attr_getter: () => any = this[`handle_attr_${attr}`]
    if (attr_getter)
      return attr_getter.call(this)
    throw new RTE(`Unknown attribute "${attr}" for ${this.shapeName}`)
  }

  setAnimatableAttr(attr: string, newValue: any) {
    this.params[attr] = newValue.toNative()
    if (attr === `rotation`)
      this.setRotationVector()
    this.rememberRenderNeeded()
    this.dispatcher.propagateDirty(this)
  }


  // cardinal(posn) {
  //   const { x, y } = this.cardinalOffset(posn)
  //   return new TPosition(
  //     new TNumber(this.nwx + x),
  //     new TNumber(this.nwy + y)
  //   )
  // }


  // It would be nice to optimize this, but only the renderer knows the actual
  // corners (as opposed to the BBox corners)
  cardinalOffset(corner: Cardinals) {
    const point = this[corner]
    const center = this.c

    return { x: point.x - center.x, y: point.y - center.y }
  }


  // The default is to assume a rectangular box. Individual widgets
  // can override

  cropLineTo(_: unknown, target: XY) {
    const center = this.c
    const { x, y } = this.cropLineRelative(center, target)
    return { x: x + center.x, y: y + center.y }


    // const center = this.c
    // switch (line.cropStrategy()) {
    //  case `centerToCenter`:
    //    return this.cropLineBetweenCenters(center, target)

    //  case `cardinalToCardinal`:
    //    return this.cropLineBetweenCardinals(center, target)

    //  default:
    //    throw new Error(`Unknown crop strategy ${line.cropStrategy()}`)
    // }
  }


  cropLineRelative(center: XY, target: XY) {
    let halfWidth = this.width / 2
    let halfHeight = this.height / 2
    let startX = center.x
    let startY = center.y

    let endX = target.x
    let endY = target.y

    let deltaX = endX - startX
    let deltaY = endY - startY

    let xSide, ySide

    if (deltaX < 0)
      xSide = -halfWidth
    else
      xSide = halfWidth

    if (deltaY < 0)
      ySide = -halfHeight
    else
      ySide = halfHeight

    if (Math.abs(deltaX) < 0.01)
      return { x: 0, y: ySide }

    if (Math.abs(deltaY) < 0.01)
      return { x: xSide, y: 0 }

    // now see if it intercepts the top/bottom, or the left/right
    let xRatio = xSide / deltaX
    let h = deltaY * xRatio

    if (Math.abs(h) <= Math.abs(ySide))
      return {
        x: xSide,
        y: h,
      }
      else
        return {
          x: deltaX / deltaY * ySide,
          y: ySide,
        }
  }


  cropLineBetweenCenters(center: XY, target: XY) {
    let halfWidth = this.width / 2
    let halfHeight = this.height / 2
    let startX = center.x
    let startY = center.y

    let endX = target.x    // assumes toSpex calculates corners & offsets
    let endY = target.y

    let deltaX = endX - startX
    let deltaY = endY - startY

    let xSide, ySide

    if (deltaX < 0)
      xSide = -halfWidth
    else
      xSide = halfWidth

    if (deltaY < 0)
      ySide = -halfHeight
    else
      ySide = halfHeight

    if (Math.abs(deltaX) < 0.01)
      return { x: 0, y: ySide }

    if (Math.abs(deltaY) < 0.01)
      return { x: xSide, y: 0 }

    // now see if it intercepts the top/bottom, or the left/right
    let xRatio = xSide / deltaX
    let h = deltaY * xRatio

    if (Math.abs(h) <= Math.abs(ySide))
      return {
        x: center.x + xSide + center.x,
        y: center.y + h,
        orientation: `ns`,
      }
      else
        return {
          x: center.x + deltaX / deltaY * ySide,
          y: center.y + ySide,
          orientation: `ew`,
        }
  }

  // work out which side the line passes through, and return that cardinal
  // cropLineBetweenCenters(center: XY, target: XY) {
  //   const lineDeltaY = target.y - center.y
  //   const lineDeltaX = target.x - center.x
  //   const lineSlope = Math.abs(lineDeltaY / lineDeltaX)
  //   const slopeToCorner = this.height / this.width

  //   if (lineSlope > slopeToCorner) {
  //     return (lineDeltaY < 0) ? this.n : this.s
  //   }

  //   return (lineDeltaX < 0) ? this.w : this.e
  // }

  toString() {
    const shapeAttrs = formatAttrs(this.params)
    return `${this.constructor.name}\t\tattrs: ${shapeAttrs}\n`
  }

  toNative() {
    return this
  }

  rememberRenderNeeded(moved = false) {
    this.renderNeeded = true
    this.hasMoved = moved
  }

  needsRendering() {
    return this.renderNeeded
  }

  moved() {
    return this.hasMoved
  }

  checkAnchorSet() {
    if (this.anchorX === null || this.anchorY === null)
      throw new Error(`shape anchor not set`)
  }

  // this has to be an AST tree, because we need to evaluate it dynamically 
  // should the parent move
  createOverlappingWithConstraint(): ProcessedWithConstraint {
    return {
      type: `ProcessedWithConstraint`,
      cardinal: `c`,
      targetAsShapeObject: this,
    }
  }
}

