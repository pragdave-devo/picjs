import { RTE } from "./runtime_error.js"
import { Defaults } from "./defaults.js"
import { Binding } from "./binding.js"
import * as Shapes from "./shapes.js"
import { MoveToAnimator, createAttributeAnimator, RotateAnimator, DrawAnimator, SetVariableAnimator } from "./animations.js"
import { Visitor } from "./visitor.js"
import { Cardinals, CardinalVectors } from "./position.js"
import { Dispatcher } from "./dispatcher.js"
import  * as AST from "./ast.js"

import {
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

import { RegenerateSource } from "./regenerate_source.js"


interface InterpreterResult {
}

const BinOps: { [op: string]: string } = {
  "+": `opPlus`,
  "-": `opMinus`,
  "*": `opTimes`,
  "/": `opDivide`,
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

// TODO: very fragile, I suspect
// function addCssPrefix(css: string, prefix: string) {
//   return css.replace(/^\s*[a-zA-Z0-9-_.]+[ \t]*{/gm, `${prefix} $&`)
// }


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
    const lv = this.accept(node.left)
    const rv = this.accept(node.right)
    const op = node.operator
    const fn = BinOps[op] || undefinedbinop(op)
    if (typeof lv[fn] !== `function`)
      throw new Error(`internal error: unknown binop "${fn}" on ${JSON.stringify(lv)}`)
    return lv[fn](rv)
  }

  VisitBlockStatement(node: AST.ExpressionList) {
    return this.visitListOfStatements(node.body)
  }

  VisitBoolean(node: AST.Boolean) {
    return new TBool(node.value)
  }

  // TODO: move me 

  callFunction(callee: TNative | TFunction, args: any[]) {
    if (callee instanceof TFunction)  {
      if (args.length < callee.formals.length) {
        let msg = `function called with ${args.length} parameters, ` +
          `but it takes ${callee.formals.length} parameter`
        throw new RTE(msg)
      }
      args = args.slice(0, callee.formals.length)

      // console.log({arguments: node.arguments})
      // console.log({arguments: this.accept(node.arguments[0])})
      // console.log({ argValues })
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

  VisitFont(node: AST.Font) {   // this is for literal CSS-style font specs
    return new TFont(node.spec)
  }

  VisitFunctionExpression(node: AST.FunctionExpression) {
    return new TFunction(node.params, node.body, this.binding)
  }

  VisitGetTime(_node: AST.GetTime) {
    return new TNumber(this.dispatcher.currentRecordingTime())
  }

  VisitGroup(node: AST.Group) {
    // 1. Push binding scope (scopes defaults and variables)
    const outerBinding = this.binding
    this.binding = this.binding.push()

    // 2. Save geometry state
    const savedDirection = this.dispatcher.getDirection()

    // 3. Track shapes created before the body
    const shapesBefore = this.dispatcher.shapes().length

    // 4. Execute body
    this.accept(node.body)

    // 5. Collect shapes created by the body
    const allShapes = this.dispatcher.shapes()
    const newShapes = allShapes.slice(shapesBefore)

    // 6. Pop binding scope (before creating group shape, so it lives in outer scope)
    this.binding = outerBinding

    // 7. Create the SGroup shape
    const group = this.dispatcher.addShape(
      'SGroup',
      undefined,
      {},
      node.withConstraint,
    ) as SGroup

    // 8. Register group children and compute bounding box
    for (const child of newShapes) {
      group.groupChildren.push(child)
    }
    group.computeBoundingBox()

    // 9. Position and add to timeline
    this.addShapeToGeometry(group)
    this.addCreateShapeToTimeline(group)

    // 10. Restore direction (lastShape is now the group, which is correct)
    this.dispatcher.restoreDirection(savedDirection)

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
      console.log("what", node.what)
      throw new RTE(`Dont know how to move this`)
    }

    const mover = new MoveToAnimator(
      shape,
      cardinal,
      this.accept(node.place), 
      this.visit_object(node.params)
    )
    this.dispatcher.addAnimation(mover)
    return node.what
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
    return what
  }

  VisitSetTime(_node: AST.Node) {
    this.dispatcher.setRecordingTime(`now`)
    return new TNumber(this.dispatcher.currentRecordingTime())
  }


  VisitShape(node: AST.Shape) {
    const label = <AST.Shape>node.args.label
    const lineLabels = node.args._labels as { text: AST.Node, pathPercent: number, side: string | null }[] | undefined

    if (label) {
      delete node.args.label
    }
    if (lineLabels) {
      delete node.args._labels
    }

    const shape = this.dispatcher.addShape(
      node.shape,
      node.args,                   // original AST for re-evaluation
      this.visit_object(node.args),
      node.withConstraint,   // defer evaluation
    )

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

    // Handle line labels with above/below positioning
    if (lineLabels && lineLabels.length > 0) {
      this.createLineLabels(shape, lineLabels)
    }

    return shape
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
      return [{ ...labels[0], side: `center` }]
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
  static readonly DefaultAttrAliases: Record<string, string> = {
    thickness: `stroke-width`,
  }

  // The user writes `Line` for both straight lines and polylines,
  // so defaults set on SLine should also apply to SPolyline.
  static readonly DefaultShapeAliases: Record<string, string[]> = {
    SLine: [`SLine`, `SPolyline`],
  }

  VisitShapeDefaultSetter(node: AST.ShapeDefaultSetter) {
    const value = this.accept(node.value)
    const attr = Interpreter.DefaultAttrAliases[node.attr] || node.attr
    const shapes = Interpreter.DefaultShapeAliases[node.shape] || [node.shape]
    for (const shape of shapes) {
      this.binding.setDefault(`Shapes`, shape, node.klass, attr, value)
    }
    return value
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
    }

    throw new Error(`Invalid unary operator "${node.operator}`)
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


  visit_object(obj: any) {
    const result: { [name: string]: any } = {}
    for (let k of Object.keys(obj)) {
      if (k.startsWith(`_`))  // don't evaluate things such as line.start which are dynamic
        result[k] = obj[k]
      else {
        const value = this.accept(obj[k])
        result[k] = value.toNative()
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
