import { Visitor } from "./visitor.js"

export class ToDotVisitor extends Visitor {

  constructor() {
    super()
    this.result = [` digraph {`]
    this.count = 0
  }

  value() {
    return this.result.join(`\n`) + `\n}\n`
  }


  nextName(label: any) {
    const nodeName = `n${this.count++}`
    this.result.push(`${nodeName} [label="${label}"]`)
    return nodeName
  }

  VisitAssignmentExpression(node: any) {
    return this.VisitBinaryExpression(node)
  }

  VisitBinaryExpression(node: any) {
    const me = this.nextName(`${node.operator}`)
    const left = this.accept(node.left)
    const right = this.accept(node.right)
    this.result.push(`${me} -> ${left}`)
    this.result.push(`${me} -> ${right}`)
    return me
  }

  VisitBlockStatement(node: any) {
    return this.visitContainer(`block`, node.body)
  }

  VisitCallExpression(node: any) {
    const callee = this.accept(node.callee)
    const args = this.visitContainer(`args`, node.arguments)
    const me = this.nextName(`call()`)
    this.result.push(`${me} -> ${callee}`)
    this.result.push(`${me} -> ${args}`)
  }

  // VisitExpressionStatement(node) {
  //   const me = this.nextName(`ExpressionStatement`)
  //   const content = this.accept(node.expression)
  //   this.result.push(`${me} -> ${content}`)
  //   return me
  // }

  VisitFunctionExpression(node: any) {
    const me = this.nextName(`fndef`)
    const params = this.visitContainer(`params`, node.params)
    const body = this.accept(node.body)
    this.result.push(`${me} -> ${params}`)
    this.result.push(`${me} -> ${body}`)
    return me
  }

  VisitIdentifier(node: any) {
    return this.nextName(`ID: ${node.name}`)
  }

  VisitLiteral(node: any) {
    return this.nextName(`${node.value}`)
  }

  VisitPositionLiteral(node: any) {
    const me = this.nextName(`Position`)
    const x = this.accept(node.x)
    const y = this.accept(node.y)
    this.result.push(`${me} -> ${x} [label="X"]`)
    this.result.push(`${me} -> ${y} [label="Y"]`)
    return me
  }

  VisitProgram(node: any) {
    return this.visitContainer(`program`, node.body)
  }

  visitContainer(name: any, body: any) {
    const me = this.nextName(name)
    body.forEach((stmt: any) => {
      const child = this.accept(stmt)
      this.result.push(`${me} -> ${child}`)
    })
    return me
  }


}
