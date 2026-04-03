import { AnimatorBase, AnimationParams } from "./_base.js"
import { TA } from "../types.js"
import { Binding } from "../binding.js"
import type { Dispatcher } from "../dispatcher.js"

const InstantParams: AnimationParams = { take: 0 }

export class SetVariableAnimator extends AnimatorBase {
  constructor(
    private binding: Binding,
    private _dispatcher: Dispatcher,
    private varName: string,
    private newValue: TA,
  ) {
    super(InstantParams)
  }

  duration() { return 0 }

  start() {
    this._step(this.newValue)
  }

  _step(_value: TA) {
    this.binding.set_variable(this.varName, this.newValue)
    this._dispatcher.propagateDirtyFromVariable(this.varName)
    this._done = true
  }
}
