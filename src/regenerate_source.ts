import { Visitor } from "./visitor.js"
import * as AST from "./ast.js"

export class RegenerateSource extends Visitor{

  convert(tree: AST.Node) {
    const result = this.start(tree)
    // console.dir(result.flat(1000).join(``))
    if (Array.isArray(result))
      return (result as string[]).flat(1000).join(``)
    return result.toString()
  }

  VisitArrayExpression(node: AST.ArrayExpression) {
    return [
      `[`,
        node.elements.map(e => this.accept(e)).join(`, `),
          `]`,
    ]
  }

  VisitAssignment(node: AST.Assignment) {
    return [ this.accept(node.lvalue), ` = `, this.accept(node.rvalue) ]
  }

  VisitBinaryExpression(node: AST.BinaryExpression) {
    return [ this.accept(node.left), node.operator, this.accept(node.right) ]
  }

  VisitBlockStatement(node: AST.ExpressionList) {
    return [`{\n`, this.visitListOfStatements(node.body), `}\n`]
  }

  VisitBoolean(node: AST.Boolean) {
    return node.value ? `true` : `false`
  }

  // VisitCallExpression(node) {
  //   return [ 
  //     this.accept(node.callee), 
  //     `(`,
  //     node.arguments.map(a => this.accept(a)).join(`, `),
  //     `)`,
  //   ]
  // }

  VisitColorLiteralString(node: AST.ColorLiteralString) {
    return node.spec
  }

  VisitColorLiteralWithModel(node: AST.ColorLiteralWithModel) {
    const args = node.params.map((n: AST.Node) => this.accept(n).value)
    return [
      node.model,
      `(`,
        args.join(`, `),
        `)`,
    ]
  }

  VisitExpressionList(node: AST.ExpressionList) {
    return this.visitListOfStatements(node.body)
  }

  VisitFaceAngle(node: AST.FaceAngle) {
    return [ `Face `, this.accept(node.angle) ]
  }

  VisitFaceCardinalDirection(node: AST.FaceCardinalDirection) {
    return [ `Face `, node.direction ]
  }

  VisitFunctionExpression(node: AST.FunctionExpression) {
    return [
      `(`,
        node.params,
        `) => {`,
          this.accept(node.body),
        `}`,
    ]
  }

  VisitGetTime(_node: AST.GetTime) {
    return `@`
  }

  VisitIdentifier(node: AST.Identifier) {
    return node.name
  }

  VisitIfExpression(node: AST.IfExpression) {
    return [
      `if (`,
           this.accept(node.test),
         `) {`,
           this.accept(node.consequent),
           `} else {`,
           this.accept(node.alternate),
           `}`,
    ].join(``)
  }

  VisitInspect(_node: AST.Inspect) {
    return []
  }

  VisitLValueAttrReference(node: AST.QualifierAttr) {
    return this.accept(node.qvalue)
  }

  VisitLValueIndexReference(node: AST.QualifierIndex) {
    return this.accept(node.qvalue)
  }

  VisitNumber(node: AST.Number) {
    return node.value.toString()
  }

  VisitPosition(node: AST.Position) {
    return [ `(`, this.accept(node.x), `, `, this.accept(node.y), `)` ]
  }


  VisitProgram(node: AST.ExpressionList) {
    return this.visitListOfStatements(node.body)
  }

  VisitQualifiedLValue(node: AST.QualifiedLValue) {
    return this.VisitQualifiedRValue(node)
  }

  VisitQualifiedRValue(node: AST.QualifiedLValue) {
    const lv = this.accept(node.left)

    switch (node.right.qtype) {
      case `attr`:
        const attr = this.accept(node.right.qvalue)
      return `${lv}.${attr}`

      case `call`:
        const args = node.right.qvalue.map(a => this.accept(a))
      return `${lv}(${args.join(`, `)})`

      case `index`:
        const index = this.accept(node.right.qvalue)
      return `${lv}[${index}]`

      default:
        throw new Error(`Unknown qualifier type "${node.right}"`)
    }
  }

  // VisitQualifiedVariableName(node) {
  //   const baseValue = this.accept(node.baseValue)
  //   const qualifiers = node.qualifiers.map(q => this.accept(q))
  //   return [ `VARQUAL`, baseValue, qualifiers ]
  // }



  VisitRange(node: AST.Range) {
    const start = this.accept(node.start)
    const end   = this.accept(node.end)

    return `[${start}..${end}]`
  }

  VisitShapeDefaultGetter(node: AST.ShapeDefaultGetter) {
    return `${node.shape}.${node.attr}`
  }

  VisitShapeDefaultSetter(node: AST.ShapeDefaultSetter) {
    return [ `${node.shape}.${node.attr} = `, this.accept(node.value) ]
  }

  VisitLayoutGap(node: AST.LayoutGap) {
    return node.same ? `Gap same` : `Gap`
  }

  VisitLayoutGoto(_node: AST.LayoutGoto) {
    return `Goto`
  }

  VisitShape(node: AST.Shape) {
    return [ 
      node.shape,
      ` `,
      this.visit_object(node.args).join(` `),
    ]
    // node.withConstraint,   // defer evaluation
  }

  VisitString(node: AST.String) {
    return `"${node.value}"`
  }

  VisitUnaryExpression(node: AST.UnaryExpression) {
    return [ node.operator, this.accept(node.argument) ]
  }

  // VisitVariableName(node) {
  //   return node.name
  // }

  VisitVariableValue(node: AST.VariableValue) {
    return node.name
  }


  visit_object(obj: Record<string, AST.Node>) {
    const result = []
    for (let k of Object.keys(obj)) {
      let value = this.accept(obj[k])
      result.push([k, value])
    }
    return result
  }

  visitListOfStatements(list: AST.Node[]) {
    return list.reduce((_, s) => this.accept(s), null)
  }

  value() {
    return null
  }

}

