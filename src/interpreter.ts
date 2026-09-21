import { RTE } from "./runtime_error.js"
import { Defaults } from "./defaults.js"
import { Binding } from "./binding.js"
import * as Shapes from "./shapes.js"
import { MoveToAnimator, MoveByAnimator, createAttributeAnimator, RotateAnimator, DrawAnimator, SetVariableAnimator } from "./animations.js"
import { Visitor } from "./visitor.js"
import { Cardinals, CardinalVectors, XY } from "./position.js"
import { Dispatcher } from "./dispatcher.js"
import  * as AST from "./ast.js"

import {
  TBase,
  TBool,
  TColor,
  TFont,
  TFunction,
  TList,
  TNative,
  TNumber,
  TPosition,
  TRange,
  TString,
  TTimeline,
} from "./types.js"

import { SGroup } from "./shapes/sgroup.js"
import { isKnownAttribute, acceptedAttributesFor } from "./shapes/attributes.js"

import { RegenerateSource } from "./regenerate_source.js"


interface InterpreterResult {
}

const BinOps: { [op: string]: string } = {
  "+": `opPlus`,
  "-": `opMinus`,
  "*": `opTimes`,
  "/": `opDivide`,
  "%": `opModulo`,
  "^": `opPow`,

  "==": `opEqual_to`,
  "!=": `opNot_equal_to`,
  "<":  `opLess_than`,
  "<=": `opLess_than_or_equal_to`,
  ">":  `opGreater_than_than`,
  ">=": `opGreater_than_than_or_equal_to`,
}

function undefinedbinop(op: string): never   {
  throw `undefined operator ` + op
}


//////////////////////////////////////////////////////////////////////
//
export class Interpreter extends Visitor{

  binding: Binding
  cssPrefix: string
  stylesheets: string[]
  result:    InterpreterResult | null = null

  constructor(
    public dispatcher: Dispatcher, 
    public runNumber: number
  ) {
    super()
    this.binding = new Binding()
    this.stylesheets = []
    this.cssPrefix = `_myopic-${runNumber}`
  }

  dispatcherIsReady() {
    if (this.binding.isToplevel()) {
      this.binding.set_variable(`@`, new TTimeline(this.dispatcher.getTimeline()))
      this.binding.bulkSetDefaults(Defaults)
      this.binding.addBuiltinFunctions()
    }
  }

  getAllDefaultAttributes(category: string, base: string, klass: string) {
    return this.binding.getAllDefaultAttributes(category, base, klass)
  }

  getCurrentBinding() {
    return this.binding
  }

  value() {
    return this.result
  }

  VisitArrayExpression(node: AST.ArrayExpression) {
    return new TList(node.elements.map((n: AST.Node) => this.accept(n)))
  }

  VisitAssignment(node: AST.Assignment) {
    const rv = this.accept(node.rvalue)
    if (node.lvalue.type === `Identifier`) {
      this.binding.set_variable(this.accept(node.lvalue), rv)
    }

    else if (node.lvalue.type  === `QualifiedLValue`) {
      // left is the expression excluding the last qualifier

      const lvalue = this.accept((node.lvalue as AST.QualifiedLValue).left)
      const last = (node.lvalue as AST.QualifiedLValue).right

      switch (last.qtype) {
        case `attr`:
          lvalue.setAtAttr(this.accept(last.qvalue), rv)
          break
        case `index`:
          lvalue.setAtIndex(this.accept(last.qvalue), rv)
          break
        default:
          throw new RTE(`The left hand side of an expression cannot end with a ${last.qtype}`)
      }
    }

    else {
      throw new RTE(`The left hand side of an assignment can only be a variable ` +
                    `with an optional list of attributes, indexes, or calls `)
    }
    return rv
  }

  VisitBinaryExpression(node: AST.BinaryExpression) {
    const op = node.operator

    // && and || short-circuit, so they cannot go through the table below —
    // that evaluates both sides first, and evaluating an expression in picjs
    // can have side effects (creating shapes, assigning variables).
    if (op === `&&` || op === `||`)
      return this.shortCircuit(node, op)

    const lv = this.accept(node.left)
    const rv = this.accept(node.right)
    const fn = BinOps[op] || undefinedbinop(op)
    if (typeof lv[fn] !== `function`)
      throw new Error(`internal error: unknown binop "${fn}" on ${JSON.stringify(lv)}`)
    return lv[fn](rv)
  }

  // `&&` and `||` take boolean operands only and yield a boolean. The right
  // side is evaluated only when the left does not already decide the result.
  private shortCircuit(node: AST.BinaryExpression, op: string) {
    const left = this.booleanOperand(this.accept(node.left), op)

    if (op === `&&` && !left) return new TBool(false)
    if (op === `||` && left)  return new TBool(true)

    return new TBool(this.booleanOperand(this.accept(node.right), op))
  }

  private booleanOperand(value: TA, op: string): boolean {
    if (value instanceof TBool)
      return value.value
    throw new RTE(
      `"${op}" needs boolean operands, but was given ${value.constructor.name} (${value.toNative()})`
    )
  }

  VisitBlockStatement(node: AST.ExpressionList) {
    return this.visitListOfStatements(node.body)
  }

  VisitBoolean(node: AST.Boolean) {
    return new TBool(node.value)
  }

  VisitColorDynamic(node: AST.ColorDynamic) {
    const name = this.accept(node.expr)
    return TColor.fromString(name.toString())
  }

  VisitColorLiteralString(node: AST.ColorLiteralString) {
    return TColor.fromString(node.spec)
  }

  VisitColorLiteralWithModel(node: AST.ColorLiteralWithModel) {
    const args = node.params.map((n: AST.Node) => this.accept(n).value)
    return TColor.fromColorModel(node.model, args)
  }

  // VisitDirectiveStyle(node: AST.Node) {
  //   this.stylesheets.push(addCssPrefix(node.style, this.cssPrefix))
  //   return new TString(node.style)
  // }

  VisitFaceAngle(node: AST.FaceAngle) {
    const angle = this.accept(node.angle)
    if (angle instanceof TNumber)
      this.dispatcher.setDirectionFromAngle(angle.toNative())
    else if (angle instanceof TString) {
      const unitVector = CardinalVectors[angle.value as Cardinals]
      if (unitVector)
        this.dispatcher.setDefaultDirection(unitVector)
      else
        throw new RTE(`"${node.angle}" is not a cardinal direction. Should be nw, n, ne, …`)
    }
    else
      throw new RTE(`"Face" takes either a cardinal direction (n, sw, …) or an angle`)
  }

  VisitFaceCardinalDirection(node: AST.FaceCardinalDirection) {
    this.dispatcher.setDefaultDirection(node.direction)
  }

  private lastGap: { direction: XY, distance: number } | null = null

  // Gap: invisible line — exits last shape's edge, next shape's entry edge starts there
  VisitLayoutGap(node: AST.LayoutGap) {
    let direction: XY
    let distance: number

    if (node.same && this.lastGap) {
      direction = this.lastGap.direction
      distance = this.lastGap.distance
    } else {
      direction = node.direction ?? this.dispatcher.getDirection()
      distance = 1
      if (node.distance) {
        const d = this.accept(node.distance)
        distance = d.toNative()
      }
    }

    if (node.direction) {
      this.dispatcher.setDefaultDirection(node.direction)
    }

    this.lastGap = { direction, distance }

    // Start from exit edge of last shape
    const lastShape = this.dispatcher.getLastShape()
    let startX: number, startY: number

    if (lastShape.width === 0 && lastShape.height === 0) {
      startX = lastShape.x
      startY = lastShape.y
    } else {
      const c = lastShape.c
      const projection = { x: c.x + direction.x, y: c.y + direction.y }
      const exitPoint = lastShape.cropLineTo(null, projection)
      startX = exitPoint.x
      startY = exitPoint.y
    }

    const at = {
      x: startX + direction.x * distance,
      y: startY + direction.y * distance,
    }

    const shape = this.dispatcher.addShape('SPoint', undefined, { at })
    shape.visible = false
    shape.layoutAsEdge = true  // next shape aligns by entry edge, not center
    this.addShapeToGeometry(shape)
    return shape
  }

  // Goto: position cursor; next shape centers there
  VisitLayoutGoto(node: AST.LayoutGoto) {
    // `Goto <place>` and `Goto <distance>` are the same expression to the
    // grammar, so a bare number arrives here as a place. Only its value tells
    // the two apart.
    const placeValue = node.place ? this.accept(node.place) : null

    if (placeValue instanceof Shapes.SBase) {
      this.dispatcher.setLastShape(placeValue)
      return placeValue
    }

    if (placeValue !== null && !(placeValue instanceof TNumber)) {
      return this.gotoPoint(placeValue.toNative())
    }

    const direction = node.direction ?? this.dispatcher.getDirection()

    const distance = (placeValue instanceof TNumber) ? placeValue.toNative()
                   : node.distance                   ? this.accept(node.distance).toNative()
                   :                                   1

    if (node.direction) {
      this.dispatcher.setDefaultDirection(node.direction)
    }

    const last = this.dispatcher.getLastShape().c
    return this.gotoPoint({
      x: last.x + direction.x * distance,
      y: last.y + direction.y * distance,
    })
  }

  // Move the layout position without drawing anything.
  private gotoPoint(at: XY) {
    const shape = this.dispatcher.addShape('SPoint', undefined, { at })
    shape.visible = false
    this.addShapeToGeometry(shape)
    return shape
  }

  VisitFont(node: AST.Font) {   // this is for literal CSS-style font specs
    return new TFont(node.spec)
  }

  VisitFunctionExpression(node: AST.FunctionExpression) {
    return new TFunction(node.params, node.body, this.binding)
  }

  VisitGetTime(_node: AST.GetTime) {
    return new TNumber(this.dispatcher.currentRecordingTime())
  }

  VisitAside(node: AST.Aside) {
    const savedLastShape = this.dispatcher.getLastShape()
    const savedDirection = this.dispatcher.getDirection()
    this.dispatcher.asideDepth++
    const result = this.accept(node.body)
    this.dispatcher.asideDepth--
    this.dispatcher.setLastShape(savedLastShape)
    this.dispatcher.restoreDirection(savedDirection)
    return result
  }

  VisitGroup(node: AST.Group) {
    // 1. Push binding scope (scopes defaults and variables)
    const outerBinding = this.binding
    this.binding = this.binding.push()

    // 2. Save geometry state
    const savedDirection = this.dispatcher.getDirection()
    const predecessorShape = this.dispatcher.getLastShape()

    // 3. Track shapes created before the body
    const shapesBefore = this.dispatcher.shapes().length

    // 4. Bind `self` so the body can export attributes via self.name = value
    const selfCollector = new TBase(null)
    selfCollector.toNative = () => selfCollector
    selfCollector.toString = () => `<self>`
    this.binding.set_local_variable(`self`, selfCollector)

    // 5. Execute body
    const autolayoutBefore = this.dispatcher.getAutolayoutCount()
    this.accept(node.body)
    const bodyUsedAutolayout = this.dispatcher.getAutolayoutCount() > autolayoutBefore

    // 6. Collect shapes created by the body
    const allShapes = this.dispatcher.shapes()
    const newShapes = allShapes.slice(shapesBefore)

    // 7. Pop binding scope (before creating group shape, so it lives in outer scope)
    this.binding = outerBinding

    // 8. Evaluate group attributes (opacity, etc.)
    const groupArgs: Record<string, any> = {}
    const behindAST = node.args?._behind
    if (node.args) {
      const argsForEval = { ...node.args }
      delete argsForEval._behind
      Object.assign(groupArgs, this.visit_object(argsForEval))
    }

    // 9. Create the SGroup shape
    const group = this.dispatcher.addShape(
      'SGroup',
      undefined,
      groupArgs,
      node.withConstraint,
    ) as SGroup

    // 10. Register group children and compute bounding box
    for (const child of newShapes) {
      group.groupChildren.push(child)
    }

    // 11. Copy self-assigned attributes to the group
    Object.assign(group.attrs, selfCollector.attrs)

    group.computeBoundingBox()
    group.predecessorShape = predecessorShape
    group.needsFlowLayout = bodyUsedAutolayout

    // Register children as depending on the group so dirty propagation works
    for (const child of group.groupChildren) {
      this.dispatcher.recordDependency(child, group)
    }

    // 12. Propagate group attributes to children
    if (groupArgs.opacity !== undefined) {
      const val = Number(groupArgs.opacity)
      for (const child of group.groupChildren) {
        child.params.opacity = val
      }
    }

    // 13. Handle behind constraint
    if (behindAST) {
      const target = this.accept(behindAST)
      if (!(target instanceof Shapes.SBase))
        throw new RTE(`"behind" expects a shape, but got ${target}`)
      group.behind = target
    }

    // 12. Restore direction before positioning so the group flows correctly
    this.dispatcher.restoreDirection(savedDirection)

    // 13. Position and add to timeline
    this.addShapeToGeometry(group)
    this.addCreateShapeToTimeline(group)

    return group
  }

  VisitIdentifier(node: AST.Identifier) {
    return node.name
  }

  VisitIfExpression(node: AST.IfExpression) {
    const pred = this.accept(node.test)
    if (pred.isTrue()) {
      return this.accept(node.consequent)
    }
    return this.accept(node.alternate)
  }

  VisitInspect(node: AST.Inspect) {
    const result = this.accept(node.value)
    const loc = this.lastLocation
    if (node.value.type === "String") {
      this.dispatcher.log(loc, (node.value as AST.String).value)
    }
    else {
      const src = new RegenerateSource().convert(node.value)
      this.dispatcher.log(loc, result.toString(), src)
    }
    return result
  }

  // This is more complex than it should be, because I wanted to cheat and
  // allow `move a.nw to (1,2)`, which means that the first agument to move
  // is actually an lvalue. But, if I say `move a to ...` then the `a`
  // is just an rvalue.
  //
  // This means I needs to manually take the parse apart here and treat
  // the two cases differently. It means the language isn't consistent here, but
  // at the same it's more natural for the user than
  //
  //     move a so that .s is at (1, 2)

  VisitMoveTo(node: AST.MoveTo) {
    let shape
    let cardinal = `c`

    if (node.what.type === `VariableValue`) { // move myshape ...
      shape = this.accept(node.what)
    }
    else if (node.what.type === `QualifiedLValue`) { // move myshape.nw
      shape = this.accept(node.what.left)
      const cardinalAttr = node.what.right
      if (cardinalAttr.qtype !== `attr`) {
        throw new RTE(`Looking for a cardinal position at the end of the shape to move`)
      }
      cardinal = this.accept(cardinalAttr.qvalue)
    }
    else {
      throw new RTE(`Don't know how to move a ${node.what.type}`)
    }

    const mover = new MoveToAnimator(
      shape,
      cardinal,
      this.accept(node.place), 
      this.visit_object(node.params)
    )
    this.dispatcher.addAnimation(mover)
    return shape
  }

  VisitMoveBy(node: AST.MoveBy) {
    let shape

    if (node.what.type === `VariableValue`) {
      shape = this.accept(node.what)
    }
    else if (node.what.type === `QualifiedLValue`) {
      shape = this.accept(node.what.left)
    }
    else {
      throw new RTE(`Don't know how to move a ${node.what.type}`)
    }

    const distance = this.accept(node.distance).toNative()
    const dx = node.direction.x * distance
    const dy = node.direction.y * distance

    const mover = new MoveByAnimator(
      shape,
      dx,
      dy,
      this.visit_object(node.params)
    )
    this.dispatcher.addAnimation(mover)
    return shape
  }

  VisitNumber(node: AST.Number) {
    return new TNumber(node.value)
  }

  VisitPosition(node: AST.Position) {
    const result =  new TPosition(this.accept(node.x), this.accept(node.y))
    return result
  }

  // VisitPositionValue(node: AST.PositionValue) {
  //   const pos = this.accept(node.position)
  //   return pos
  // }

  VisitDraw(node: AST.Draw) {
    const shape = this.accept(node.what)
    if (!(shape instanceof Shapes.SBase)) {
      throw new RTE(`The first argument to "draw" should be a shape value`)
    }
    const animator = new DrawAnimator(
      shape,
      this.visit_object(node.params)
    )
    this.dispatcher.addAnimation(animator)
    return shape
  }

  VisitExpressionList(node: AST.ExpressionList) {
    return this.visitListOfStatements(node.body)
  }

  VisitProgram(node: AST.Program) {
    return this.accept(node.body)
  }

  // for LValues, we need the name of the last qualifier, not the value of applying it.
  VisitQualifiedLValue(node: AST.QualifiedLValue) {
    const lv = this.accept(node.left)
    switch (node.right.qtype) {
      case `attr`:
        const attr = this.accept(node.right.qvalue)
        return lv.getAtAttr(attr)

      case `call`:
        const args = node.right.qvalue.map((a: AST.Node) => this.accept(a))
        return this.callFunction(lv, args)

      case `index`:
        const index = this.accept(node.right.qvalue)
        return lv.getAtIndex(index)

      default:
        throw new Error(`Unknown qualifier type "${node.right}"`)
    }
  }


  VisitQualifiedRValue(node: AST.QualifiedRValue) {
    const lv = this.accept(node.left)
    switch (node.right.qtype) {
      case `attr`:
        const attr = this.accept(node.right.qvalue)
        return lv.getAtAttr(attr)

      case `call`:
        const args = node.right.qvalue.map((a: AST.Node) => this.accept(a))
        return this.callFunction(lv, args)

      case `index`:
        const index = this.accept(node.right.qvalue)
        return lv.getAtIndex(index)

      default:
        throw new Error(`Unknown qualifier type "${node.right}"`)
    }
  }



  VisitRange(node: AST.Range) {
    const start = this.accept(node.start)
    const end   = this.accept(node.end)

    if (start.isSameTypeAs(end)) {
      if (start.isInterpolatable) {
        return new TRange(start, end)
      }
      throw new RTE(`the limits of a range must be interpolatable (numbers, colors, ...)`)
    }

    throw new RTE(`the start and end of a range must be the same type`)
  }


  VisitRotate(node: AST.Rotate) {
    const what = this.accept(node.what)
    if (!(what instanceof Shapes.SBase)) {
      throw new RTE(`The first argument to "rotate" should be a shape value`)
    }
    const angle = this.accept(node.angle)
    const about = this.accept(node.about)
    const rotater = new RotateAnimator(
      what,
      angle,
      about,
      this.visit_object(node.params)
    )

    this.dispatcher.addAnimation(rotater)
    return what
  }

  VisitSet(node: AST.Set) {
    const what = node.what

    if (what.type === `Identifier`) {
      const varName = what.name
      const value = this.accept(node.value)
      const animator = new SetVariableAnimator(this.binding, this.dispatcher, varName, value)
      this.dispatcher.addAnimation(animator)
      return value
    }

    if (what.type !== `QualifiedLValue`)
      throw new RTE(`The first argument to "set" should be a variable name or "shape.attribute"`)

    if (what.right.qtype !== `attr`)
      throw new RTE(`You can only set a shape's attribute`)

    const setter = createAttributeAnimator(
      this.accept(what.left),
      this.accept(what.right.qvalue),
      this.accept(node.value),
      this.visit_object(node.params)
    )
    this.dispatcher.addAnimation(setter)
    return this.accept(what.left)
  }

  VisitSetTime(_node: AST.Node) {
    this.dispatcher.setRecordingTime(`now`)
    return new TNumber(this.dispatcher.currentRecordingTime())
  }

  VisitPause(node: AST.Pause) {
    const message = node.message ? String(this.accept(node.message)) : null
    this.dispatcher.addPause(message)
    return new TNumber(0)
  }


  VisitShape(node: AST.Shape) {
    if (this.dispatcher.isReEvaluating && (node as any)._memoizedShape)
      return (node as any)._memoizedShape

    const label = <AST.Shape>node.args.label
    const shapeLabels = node.args._shapeLabels as AST.Shape[] | undefined
    const lineLabels = node.args._labels as { text: AST.Node, pathPercent: number, side: string | null }[] | undefined
    const behindAST = node.args._behind
    const hasSame = node.args._same

    // Work on a copy to avoid mutating the shared AST (breaks when functions
    // call the same shape node multiple times).
    const argsForEval = { ...node.args }
    delete argsForEval.label
    delete argsForEval._shapeLabels
    delete argsForEval._labels
    delete argsForEval._behind
    delete argsForEval._same

    let evaluatedArgs = this.visit_object(argsForEval)

    if (hasSame) {
      const prev = this.dispatcher.findLastShapeOfType(node.shape)
      if (prev) {
        evaluatedArgs = { ...prev.params, ...evaluatedArgs }
      }
    }

    const shape = this.dispatcher.addShape(
      node.shape,
      argsForEval,                 // clean copy for re-evaluation (label/behind/same stripped)
      evaluatedArgs,
      node.withConstraint,   // defer evaluation
    )

    if (behindAST) {
      const target = this.accept(behindAST)
      if (!(target instanceof Shapes.SBase))
        throw new RTE(`"behind" expects a shape, but got ${target}`)
      shape.behind = target
    }

    // position it
    this.addShapeToGeometry(shape)

    // and arrange for it to be created at @now
    this.addCreateShapeToTimeline(shape)

    // Handle single label (for non-line shapes)
    if (label) {
      const child = shape.setupChildWithConstraint(label)
      const slabel = this.dispatcher.addShape(
        child.shape,
        child.args,
        this.visit_object(child.args),
        child.withConstraint
      )
      // Mark as child BEFORE adding to geometry so it doesn't become lastShape
      shape.addChild(slabel)
      this.addShapeToGeometry(slabel)
      this.addCreateShapeToTimeline(slabel)
    }

    // Handle multiple labels (stacked vertically, centered)
    if (shapeLabels && shapeLabels.length > 0) {
      this.createStackedLabels(shape, shapeLabels)
    }

    // Size to the labels once they all exist. Line labels are excluded: they
    // sit along the path rather than inside the shape.
    this.fitShapeToLabels(shape)

    // Handle line labels with above/below positioning
    if (lineLabels && lineLabels.length > 0) {
      this.createLineLabels(shape, lineLabels)
    }

    Object.defineProperty(node, '_memoizedShape', { value: shape, configurable: true })
    return shape
  }

  // `fit` sizes a shape to its labels, shrinking as well as growing. The size
  // is derived from all the labels every time rather than accumulated: growing
  // only would never shrink, and using just the latest label would let the last
  // one win instead of the widest.
  private fitShapeToLabels(shape: Shapes.SBase) {
    if (!shape.params.fit || shape.children.length === 0)
      return

    let width = 0
    let height = 0

    for (const child of shape.children) {
      const padding = Number(child.params.font_size) || 0.14
      width  = Math.max(width,  (Number(child.width)  || 0) + padding * 2)
      height = Math.max(height, (Number(child.height) || 0) + padding * 2)
    }

    shape.params.width  = width
    shape.params.height = height
  }

  // Check if a label AST has any styling attributes beyond just text
  private labelHasStyling(labelArgs: Record<string, any>): boolean {
    const stylingKeys = Object.keys(labelArgs).filter(k => k !== 'text' && !k.startsWith('_'))
    return stylingKeys.length > 0
  }

  // Create labels from multiple label ASTs, stacking them vertically
  private createStackedLabels(parent: Shapes.SBase, labels: AST.Shape[]) {
    // Check if any label has custom styling - if so, create separate labels
    const hasCustomStyling = labels.some(label => this.labelHasStyling(label.args))

    if (hasCustomStyling) {
      this.createSeparateLabels(parent, labels)
    } else {
      this.createCombinedLabel(parent, labels)
    }
  }

  // Create separate label children when styling differs between labels
  private createSeparateLabels(parent: Shapes.SBase, labels: AST.Shape[]) {
    const totalLabels = labels.length
    const fontSize = 0.14  // default font size
    const lineHeight = fontSize * 1.2
    const totalHeight = totalLabels * lineHeight
    const startY = -(totalHeight / 2) + (lineHeight / 2)

    for (let i = 0; i < labels.length; i++) {
      const label = labels[i]
      const evaluated = this.visit_object(label.args)
      const yOffset = startY + i * lineHeight

      const child = parent.setupChildWithConstraint(label)
      const slabel = this.dispatcher.addShape(
        child.shape,
        child.args,
        evaluated,
        child.withConstraint
      )
      // Apply vertical offset for stacking
      slabel.params._stackOffset = yOffset
      parent.addChild(slabel)
      this.addShapeToGeometry(slabel)
      this.addCreateShapeToTimeline(slabel)
    }
  }

  // Create a single combined label when all labels have the same (default) styling
  private createCombinedLabel(parent: Shapes.SBase, labels: AST.Shape[]) {
    // Evaluate each label's text
    const texts: string[] = []
    let firstEvaluatedArgs: Record<string, any> | null = null

    for (const label of labels) {
      const evaluated = this.visit_object(label.args)
      texts.push(String(evaluated.text))
      if (!firstEvaluatedArgs) firstEvaluatedArgs = evaluated
    }

    // Build a single label with joined text, using first label's styling
    // Use double-newline so each label is a separate paragraph (won't be reflowed to a single line)
    const joinedText = texts.join('\n\n')
    const evaluatedArgs = { ...firstEvaluatedArgs!, text: joinedText }

    // AST node for re-evaluation (e.g., during animation)
    const combinedAst: AST.Shape = {
      type: `Shape`,
      shape: `SLabel`,
      args: { ...labels[0].args },
      withConstraint: null,
    }

    const child = parent.setupChildWithConstraint(combinedAst)
    const slabel = this.dispatcher.addShape(
      child.shape,
      child.args,
      evaluatedArgs,
      child.withConstraint
    )
    parent.addChild(slabel)
    this.addShapeToGeometry(slabel)
    this.addCreateShapeToTimeline(slabel)

  }

  // Create labels for lines/arcs with path-based positioning
  private createLineLabels(line: Shapes.SBase, labels: { text: AST.Node, pathPercent: number, side: string | null, _labelArgs?: Record<string, any> }[]) {
    // Resolve default sides for labels without explicit positioning
    const resolvedLabels = this.resolveLineLabelSides(labels)

    for (const labelDef of resolvedLabels) {
      // Create the label AST node, merging any rich label attrs (font, align, etc.)
      const args: Record<string, any> = { text: labelDef.text }
      if (labelDef._labelArgs) {
        Object.assign(args, labelDef._labelArgs)
      }
      const labelAst: AST.Shape = {
        type: `Shape`,
        shape: `SLabel`,
        args,
        withConstraint: null,
      }

      // Setup constraint with path percent and side
      const child = line.setupLineLabelConstraint(labelAst, labelDef.pathPercent, labelDef.side)
      const slabel = this.dispatcher.addShape(
        child.shape,
        child.args,
        this.visit_object(child.args),
        child.withConstraint
      )

      line.addChild(slabel)
      this.addShapeToGeometry(slabel)
      this.addCreateShapeToTimeline(slabel)
    }
  }

  // Resolve default sides for labels:
  // - 1 label with no side: center (or outside for arcs)
  // - 2 labels with no sides: above/below
  // - explicit sides are preserved
  private resolveLineLabelSides(labels: { text: AST.Node, pathPercent: number, side: string | null, _labelArgs?: Record<string, any> }[]): { text: AST.Node, pathPercent: number, side: string, _labelArgs?: Record<string, any> }[] {
    const n = labels.length

    if (n === 1 && !labels[0].side) {
      return [{ ...labels[0], side: `above` }]
    }

    if (n === 2 && !labels[0].side && !labels[1].side) {
      return [
        { ...labels[0], side: `above` },
        { ...labels[1], side: `below` },
      ]
    }

    return labels.map(l => ({ ...l, side: l.side || `center` }))
  }

  // Map user-facing attribute names to the internal names used by renderers.
  // This must match the mappings in the PEG grammar's inline shape args.
  // A default setter takes its attribute name from the grammar's AttrName rule,
  // which returns the text the user typed — so `Box.wid = 3` arrives as `wid`.
  // Inline attributes do not have this problem, because there the matching
  // rule's own return value is used. Documented abbreviations must therefore be
  // resolved here, or the default is stored under a name nothing ever reads.
  static readonly DefaultAttrAliases: Record<string, string[]> = {
    thickness: [ `stroke_width` ],
    thick:     [ `stroke_width` ],
    wid:       [ `width` ],
    ht:        [ `height` ],
    rot:       [ `rotation` ],
    len:       [ `length` ],
    pad:       [ `padding` ],
  }

  // `radius` is not one attribute: a circle has a single radius, everything
  // else has a pair of corner radii.
  static readonly RadiusAliases: Record<string, string[]> = {
    SCircle: [ `r` ],
  }

  private defaultAttrNames(shape: string, attr: string): string[] {
    if (attr === `radius` || attr === `rad`)
      return Interpreter.RadiusAliases[shape] ?? [ `rx`, `ry` ]

    return Interpreter.DefaultAttrAliases[attr] ?? [ attr ]
  }

  // The user writes `Line` for both straight lines and polylines,
  // so defaults set on SLine should also apply to SPolyline.
  static readonly DefaultShapeAliases: Record<string, string[]> = {
    SLine: [`SLine`, `SPolyline`],
  }

  VisitShapeDefaultGetter(node: AST.ShapeDefaultGetter) {
    const shape = (Interpreter.DefaultShapeAliases[node.shape] || [node.shape])[0]
    const attr = this.defaultAttrNames(shape, node.attr)[0]
    const defaults = this.binding.getAllDefaultAttributes(`Shapes`, shape, node.klass)
    const value = defaults[attr]
    if (value === undefined)
      throw new RTE(`${node.shape}.${node.attr} is not defined`)
    if (value instanceof TBase)
      return value
    if (typeof value === `number`)
      return new TNumber(value)
    if (typeof value === `string`)
      return value.startsWith(`#`) ? TColor.fromString(value) : new TString(value)
    return value
  }

  VisitShapeDefaultSetter(node: AST.ShapeDefaultSetter) {
    const value = this.accept(node.value)
    const shapes = Interpreter.DefaultShapeAliases[node.shape] || [node.shape]

    // Defaults bypass SBase.setupParams, so they need the same check: setting
    // `Box.align` would otherwise be stored and never looked at.
    //
    // A name may cover more than one shape — the user writes `Line` for both
    // lines and polylines — so the attribute need only be valid for one of
    // them. `Line.rx` rounds polyline corners; `Line.length` sets a line's
    // length. Neither is valid for both.
    const attrs = this.defaultAttrNames(shapes[0], node.attr)

    if (!attrs.every(a => shapes.some((s: string) => isKnownAttribute(s, a)))) {
      const name = shapes[0].replace(/^S/, ``)
      throw new RTE(
        `"${name}" has no attribute "${node.attr}". ` +
        `It accepts: ${acceptedAttributesFor(shapes[0]).join(`, `)}`
      )
    }

    // Shape params hold native values: built-in defaults are plain strings and
    // numbers, and inline attributes are converted by visit_object. Store user
    // defaults the same way, or consumers that expect a native value (such as
    // Palette.getForegroundFor, via a label's _parentFill) receive a TBase.
    const nativeValue = value instanceof TBase ? value.toNative() : value
    for (const shape of shapes) {
      for (const attr of attrs) {
        this.binding.setDefault(`Shapes`, shape, node.klass, attr, nativeValue)

        const slotKey = `_${attr}_slot`
        if (value instanceof TColor && value.paletteSlot) {
          this.binding.setDefault(`Shapes`, shape, node.klass, slotKey, value.paletteSlot)
        } else {
          this.binding.setDefault(`Shapes`, shape, node.klass, slotKey, undefined)
        }
      }
    }
    return value
  }

  VisitInterpolatedString(node: AST.InterpolatedString) {
    const result = node.parts.map(part => {
      const val = this.accept(part)
      return val.toString()
    }).join(``)
    return new TString(result)
  }

  VisitString(node: AST.String) {
    return new TString(node.value)
  }

  VisitUnaryExpression(node: AST.UnaryExpression) {
    const val = this.accept(node.argument)

    switch (node.operator) {
      case `+`:
        return val.opUnaryPlus()
      case `-`:
        return val.opUnaryMinus()
      case `!`:
        return val.opNot()
    }

    throw new Error(`Invalid unary operator "${node.operator}"`)
  }

  VisitVariableValue(node: AST.VariableValue) {
    const shape = this.dispatcher.currentEvaluatingShape
    if (shape) this.dispatcher.recordVariableDependency(shape, node.name)
    return this.binding.get_variable_value(node.name)
  }

  // VisitWait(node: AST.Wait) {
  //   const until = node.until
  //   const waiter = new WaitAnimator(
  //     until.type,
  //     node.signedOffset.sign,
  //     this.accept(node.signedOffset.offset),
  //   )
  //   this.timeline.addAnimator(waiter)
  //   return new TNumber(waiter.endTime)
  // }

  valueOf(tree: AST.Node, binding: Binding) {
    if (!binding)
      throw new Error(`Missing binding on call to valueOf`)
    const saveBinding = this.binding
    this.binding = binding
    const result = this.accept(tree)
    this.binding = saveBinding
    return result
  }

  evaluateArgs(astArgs: Record<string, any>, binding: Binding) {
    const saveBinding = this.binding
    this.binding = binding
    const result = this.visit_object(astArgs)
    this.binding = saveBinding
    return result
  }


  addShapeToGeometry(shape: Shapes.SBase) {
    this.dispatcher.addShapeToGeometry(shape)
  }

  addCreateShapeToTimeline(shape: Shapes.SBase) {
    this.dispatcher.addCreateShapeToTimeline(shape)
  }


  callFunction(callee: TNative | TFunction, args: any[]) {
    if (callee instanceof TFunction)  {
      if (args.length < callee.formals.length) {
        let msg = `function called with ${args.length} parameters, ` +
          `but it takes ${callee.formals.length} parameter`
        throw new RTE(msg)
      }
      args = args.slice(0, callee.formals.length)

      const myBinding = this.binding
      this.binding = callee.binding.push()
      callee.formals.forEach((name, i) => {
        this.binding.set_local_variable(name.name, args[i])
      })

      const result = this.accept(callee.body)
      this.binding = myBinding
      return result
    }

    if (callee instanceof TNative) {
      callee.acceptableParameters(args)
      return callee.value(this, ...args)
    }
  }

  visit_object(obj: any) {
    const result: { [name: string]: any } = {}
    for (let k of Object.keys(obj)) {
      if (k.startsWith(`_`))  // don't evaluate things such as line.start which are dynamic
        result[k] = obj[k]
      else {
        const value = this.accept(obj[k])
        result[k] = value.toNative()
        if (value instanceof TColor && value.paletteSlot) {
          result[`_${k}_slot`] = value.paletteSlot
        }
      }
    }
    return result
  }

  visitListOfStatements(list: AST.Node[]) {
    return list.reduce((_, s) => this.accept(s), null)
  }

  bindingAsTable() {
    return this.binding.dumpAsTable()
  }
}
