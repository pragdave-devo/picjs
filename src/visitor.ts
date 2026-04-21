import { RTE } from "./runtime_error.js"
import * as AST from "./ast.js"
import { Location } from "./location.js"


export abstract class Visitor {

  // Index signature for dynamic visitor dispatch: this[`Visit${node.type}`]
  // TypeScript lacks string-pattern index types, so `any` is required here
  [visitor: string]: any

  // we nest interpreters when we invoke thunks, which means exceptions will
  // ripple up through the running programs stack, so we can
  // capture the information for a backtrace here...

  lastLocation?: Location
  private stepCount = 0
  private stepLimit = 500_000
  private cancelled = false

  abstract value() : any;

  cancel() {
    this.cancelled = true
  }

  setStepLimit(limit: number) {
    this.stepLimit = limit
  }

  start(tree: AST.Node) {
    try {
      return this.accept(tree) || this.value()
    }
    catch (e) {
      const loc = this.lastLocation
      if ((e instanceof RTE) && loc) {
        (e.context || (e.context = []))    // ava doesn't recognize ??=...
        e.context.push({ loc, interpreter: this })
      }

      throw e
    }
  }

  accept(tree: AST.Node) {
    if (!tree) {
      debugger
      throw new Error(`Missing
                      tree`)
    }

    if (this.cancelled)
      throw new RTE(`execution cancelled`)

    if (++this.stepCount > this.stepLimit)
      throw new RTE(`execution exceeded ${this.stepLimit.toLocaleString()} steps — possible infinite loop or very deep recursion`)

    const type = tree.type

    if (tree.location)
      this.lastLocation = tree.location

    return (this[`Visit${type}`] || this.error).call(this, tree)
  }

  error(tree: AST.Node) {
    try {
      console.error(`No visitor defined for node type ${tree.type}
                    ${JSON.stringify(tree, null, 4)}`)
    }
    catch (e) {
      console.error(`No visitor defined for node type ${tree.type}
                    ${tree}`)
    }
    throw new Error(`No visitor defined for node type ${tree.type}
                    ${tree}`)
  }
}


