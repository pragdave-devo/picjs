import { RTE } from "../runtime_error.js"
import { AnimationStyle, TBase, TA, TypeofTA } from "./_base.js"
import { TBool } from "./tbool.js"
import { TList } from "../types.js"
import { TNumber } from "./tnumber.js"

export class TString extends TBase<string> {

  constructor(value: string) {
    super(value, AnimationStyle.crossfade)
    this.isInterpolatable = true
  }

  opPlus(other: TA)   { 
    if (other instanceof TString) 
      return new TString(this.value + other.value)

    if (`toString` in other)
      return new TString(this.value + other.toString())
    throw new RTE(`Cannot concatenate a ${(other as TA).constructor.name} to the string "${this.value}"`)
  }

  opTimes(other: TA)   { 
    return this.checkAndApply(other, TNumber, `*`, (a, b) => a.repeat(b), TString) 
  }

  opDivide(other: TA) { 
    return this.checkAndApply(other, TString, `/`, (a, b) => 
      a.split(b).map((part) => new TString(part))
    , 
    TList) 
  }

  opEqual_to(other: TA) {
    return this.checkAndApplyBool(other, `==`, (a, b) => a === b) 
  }

  opNot_equal_to(other: TA) {
    return this.checkAndApplyBool(other, `!=`, (a, b) => a !== b) 
  }

  opLess_than(other: TA) { 
    return this.checkAndApplyBool(other, `<`, (a, b) => a < b) 
  }

  opLess_than_or_equal_to(other: TA)         { 
    return this.checkAndApplyBool(other, `<=`, (a, b) => a <= b) 
  }

  opGreater_than_than(other: TA)             {
    return this.checkAndApplyBool(other, `>`, (a, b) => a > b) 
  }

  opGreater_than_than_or_equal_to(other: TA) {
    return this.checkAndApplyBool(other, `>=`, (a, b) => a >= b) 
  }

  opNegate() {
    return new TNumber(-this.value)
  }


  handle_attr_length() {
    return new TNumber(this.value.length)
  }

  checkAndApply(
    other: TA, 
    otherType: TypeofTA, 
    op: string, 
    opFn: (a: string, b:any) => any, 
    resultType: TypeofTA
  ) {
    if (other instanceof otherType)
      return new resultType(opFn(this.value, other.value))
    throw new RTE(
      `Cannot execute "${this.value} ${op} ${(<TA>other).typeName}"`
    )
  }

  checkAndApplyBool(other: TA, op: string, opFn: (a:string, b:string) => boolean) {
    if (other instanceof TString)
      return new TBool(opFn(this.value, other.value))
    throw new RTE(
      `Cannot compare "${this.value} using ${op} ${other.constructor.name} (${other.value})"`
    )
  }


  interpolate(other: TString, ratio: number) {
    if (ratio > 0.5)
      return other
    else
      return this
  }

  toNative() {
    return this.value
  }
}



