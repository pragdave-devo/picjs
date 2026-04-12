import { AnimationStyle, TBase } from "./_base.js"
import { Binding } from "../binding.js"
import * as AST from "../ast.js"

export class TFunction extends TBase<null> {
  constructor(
    public formals: AST.Identifier[], 
    public body: AST.ExpressionOrBlock, 
    public binding: Binding
  ) {
    super(null, AnimationStyle.none)
  }

  toNative() {
    const formals = this.formals.map(f => this.toText(f)).join(`, `)

    return `(${formals}) => «function body»`
  }

  attributesAsTable() {
    return this.binding.dumpAsTable()
  }

  toText(ast: AST.Base) {
    switch (ast.type) {
      case `Identifier`:
        return (<AST.Identifier>ast).name

      default:
        console.error(`Can't run toText() on ${JSON.stringify(ast)}`)
        return `X`
    }
  }
}



