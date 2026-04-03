import { Interpreter } from "../interpreter.js"
import { AnimationStyle, TBase, TA, TInterpolatable } from "./_base.js"
import { TBool } from "./tbool.js"
import { TNative } from "./tnative.js"

// Define our native functions out here, so we can share pointers to them
// between all instances of Numbers. (We don't make them instance methods because they
// are accessed via `attrs`

///////////////////////////////////////////////////////////////////////////////////

type OpFn = (a:number, b:number) => any

export class TNumber extends TInterpolatable<number> {

  constructor(value: number) {
    super(value, AnimationStyle.continuous)
    this.addNativeFunctions()
    this.isInterpolatable = true
  }

  addNativeFunctions() {
    this.attrs.abs = new TNative(
      `abs`, [ ],
      `return the absolute value of number`,

      (_: Interpreter) => {
        if (this.value >= 0)
          return this
        return new TNumber(-this.value)
      })

    this.attrs.interpolate = new TNative(
      `interpolate`, [ `other`, `ratio` ],
      `return the number that is _ratio_ of the way between this number and other ` +
      `(where ratio == 0 returns this number and ratio == 1 the other)`,

      (_: Interpreter, other: TA, ratio: TA) => {
        return this.interpolate(other, ratio.toNative())
      })

    this.attrs.times = new TNative(
      `times`, [ `callback` ],
      `Invoke the callback «number» times, passing it from 0 to n-1`,
      (interpreter: Interpreter, callback) => {
        for (let i = 0; i < this.value; i++) {
          const arg = []
          if (callback.formals.length > 0)
            arg.push(new TNumber(i))
          interpreter.callFunction(callback, arg)
        }
        return this
      })
  }

  opUnaryPlus()   { return this }
  opUnaryMinus()  { return new TNumber(-this.value) }

  opPlus(other: TA)   { return this.checkAndApplyTrans(other, `opPlus`, `+`, (a:number, b:number) => a + b) }
  opMinus(other: TA)  { return this.checkAndApply(other, `-`, (a:number, b:number) => a - b) }
  opTimes(other: TA)  { return this.checkAndApplyTrans(other, `opTimes`, `*`, (a:number, b:number) => a * b) }
  opDivide(other: TA) { return this.checkAndApply(other, `/`, (a:number, b:number) => a / b) }
  opPow(other: TA)    { return this.checkAndApply(other, `^`, (a:number, b:number) => Math.pow(a, b)) }

  opEqual_to(other: TA)     { return this.checkAndApplyBool(other, `==`, (a:number, b:number) => a === b) }
  opNot_equal_to(other: TA) { return this.checkAndApplyBool(other, `!=`, (a:number, b:number) => a !== b) }
  opLess_than(other: TA)    { return this.checkAndApplyBool(other, `<`, (a:number, b:number) => a < b) }

  opLess_than_or_equal_to(other: TA)         { 
    return this.checkAndApplyBool(other, `<=`, (a:number, b:number) => a <= b) 
  }

  opGreater_than_than(other: TA)             {
    return this.checkAndApplyBool(other, `>`, (a:number, b:number) => a > b) 
  }

  opGreater_than_than_or_equal_to(other: TA) {
    return this.checkAndApplyBool(other, `>=`, (a:number, b:number) => a >= b) 
  }

  opNegate() {
    return new TNumber(-this.value)
  }

  checkAndApplyTrans(other: TA, funcName: string,  op: string, opFn: OpFn) {
    return this.checkAndApply(other, op, opFn, /* transitive */ funcName)
  }

  checkAndApply(other: TA, op: string, opFn: OpFn, transitive?: string) {
    if (other instanceof TNumber)
      return new TNumber(opFn(this.value, other.value))
    if (transitive)
      return other[transitive](this)

    throw new Error(
      `Cannot execute "${this.value} ${op} ${other.constructor.name}"`
    )
  }

  checkAndApplyBool(other: TA , op: string, opFn: OpFn) {
    if (other  instanceof TNumber)
      return new TBool(opFn(this.value, other.value))
    throw new Error(
      `Cannot compare "${this.value} using ${op} ${other.constructor.name} (${other.value})"`
    )
  }

  interpolate(other: TA, ratio: number) {
    const v1 = this.value
    const v2 = other.value
    return new TNumber(v1 + (v2 - v1) * ratio)
  }

  toNative() {
    return this.value
  }
}


