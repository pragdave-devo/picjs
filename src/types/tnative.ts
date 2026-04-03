import { Interpreter } from "../interpreter.js"
import { RTE } from "../runtime_error.js"
import { AnimationStyle, TA, TBase } from "./_base.js"

type NativeCallback = (a: Interpreter, ...b: any[]) => TA

export class TNative extends TBase<NativeCallback> {
    minParams = 0
    maxParams = 0

  constructor(
    public name: string, 
    public formals: string[], 
    public description: string, 
    public funcPtr: NativeCallback
  ) {
    super(funcPtr, AnimationStyle.none)
    this.name = name
    this.formals = formals
    this.workoutParamsCount()
    this.description = description
  }

  acceptableParameters(params: TA[]) {
    const len = params.length
    if (len < this.minParams)
      throw new RTE(`${this.name} called with ${len} parameters, but it needs at least ${this.minParams}`)
    if (len > this.maxParams)
      throw new RTE(`${this.name} called with ${len} parameters, but it needs at most ${this.maxParams}`)
  }

  workoutParamsCount() {
    for (let name of this.formals) {
      this.maxParams++
      if (!name.startsWith(`[`))
        this.minParams++
    }
  }

  toJSON() {
    return this.toString()
  }

  toString() {
    return this.toNative()
  }

  toNative() {
    return `${this.name}(${this.formals.join(`' `)})\t// built-in`
  }
}




