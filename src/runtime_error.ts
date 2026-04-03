import { Interpreter } from "./interpreter.js" 
import { Visitor } from "./visitor.js"

export interface Location {
  content: string
  line: number
  column: number
}

interface ErrorContext {
  loc: Location
  interpreter: Visitor
}

export class RTE extends Error {

  interpreter?: Interpreter = undefined
  context?: ErrorContext[]

  constructor(message: string, public loc?: Location) {
    super(message)
    Object.setPrototypeOf(this, new.target.prototype)
    this.name = RTE.name
  }

  showLocation(loc: Location, msg: string, source?: string): string {
    const { line, column } = loc.start
    const prefix = `«${line}:${column}»: `
    const content = loc.content ?? source
    if (content) {
      const lines = content.split(/\n/)
      const srcLine = lines[line - 1] ?? ``
      return prefix + `${srcLine}\n${``.padStart(prefix.length + column - 1)}^——— ${msg}`
    }
    return `${prefix}${msg}`
  }

  get locationString(): string {
    if (this.context?.[0]?.loc) {
      const { line, column } = this.context[0].loc.start
      return `«${line}:${column}»`
    }
    if (this.loc) {
      return `«${this.loc.start.line}:${this.loc.start.column}»`
    }
    return ``
  }
}

