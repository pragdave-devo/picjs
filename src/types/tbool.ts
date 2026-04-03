import { AnimationStyle, TBase, TA } from "./_base.js"

export class TBool extends TBase<boolean> {
  constructor(value: any) {
    super(!!value, AnimationStyle.none)
  }

  isTrue()                { return this.value }
  equal_to(other: TA)     { return this.checkAndApply(other, `==`, (a, b) => a === b) }
  not_equal_to(other: TA) { return this.checkAndApply(other, `!=`, (a, b) => a !== b) }

  negate() {
    return new TBool(!this.value)
  }

  checkAndApply(other: TA, op: string, opFn: (a:boolean, b:boolean) => boolean) {
    if (other instanceof TBool)
      return new TBool(opFn(this.value, other.value))
    throw new Error(
      `Cannot execute "${this.value} ${op} ${other.constructor.name}"`
    )
  }


  toNative() {
    return this.value
  }
}



