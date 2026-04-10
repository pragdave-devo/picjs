import { RTE } from "../runtime_error.js"
import { TBase, TA, TypeofTA } from "./_base.js"
import { TBool } from "./tbool.js"
// import { TList } from "./tlist.js"
import { TNumber } from "./tnumber.js"
import { TString } from "./tstring.js"
import { Timeline } from "../timeline.js"

export class TTimeline extends TBase<Timeline> {



  // opPlus(other)   { 
  //   if (other instanceof TString) 
  //     return new TString(this.value + other.value)

  //   if (`toString` in other)
  //     return new TString(this.value + other.toString())
  //   throw new RTE(`Cannot concatenate a ${other.constructor.name} to the string "${this.value}"`)
  // }

  // opTimes(other)   { 
  //   return this.checkAndApply(other, TNumber, `*`, (a, b) => a.repeat(b), TString) 
  // }

  // opDivide(other) { 
  //   return this.checkAndApply(other, TString, `/`, (a, b) => 
  //     a.split(b).map((part) => new TString(part))
  //   , 
  //   TList) 
  // }

  // opEqual_to(other) {
  //   return this.checkAndApplyBool(other, `==`, (a, b) => a === b) 
  // }

  // opNot_equal_to(other) {
  //   return this.checkAndApplyBool(other, `!=`, (a, b) => a !== b) 
  // }

  // opLess_than(other) { 
  //   return this.checkAndApplyBool(other, `<`, (a, b) => a < b) 
  // }

  // opLess_than_or_equal_to(other)         { 
  //   return this.checkAndApplyBool(other, `<=`, (a, b) => a <= b) 
  // }

  // opGreater_than_than(other)             {
  //   return this.checkAndApplyBool(other, `>`, (a, b) => a > b) 
  // }

  // opGreater_than_than_or_equal_to(other) {
  //   return this.checkAndApplyBool(other, `>=`, (a, b) => a >= b) 
  // }

  // opNegate() {
  //   return new TNumber(-this.value)
  // }


  handle_attr_now() {
    return new TNumber(this.value.now())
  }

  handle_attr_max_time() {
    return new TNumber(this.value.maxTime())
  }

  handle_attr_last_animation_start() {
    return new TNumber(this.value.lastAnimationStart())
  }

  handle_attr_last_animation_end() {
    return new TNumber(this.value.lastAnimationEnd())
  }

  handle_attr_start_from() {
    return new TNumber(this.value.startFrom ?? 0)
  }

  setAtAttr(name: string, value: any) {
    switch (name) {
      case `now`:
        this.value.setAtTime(value.toNative())
        return this
      case `start_from`:
        this.value.startFrom = value.toNative()
        return this
      default:
        throw new RTE(`The assignable attributes of the timeline are "@.now" and "@.start_from"`)
    }
  }


  checkAndApply(
    other: TA, 
    otherType: TypeofTA, 
    op: string, 
    opFn: (a: Timeline, b:any) => any, 
    resultType: TypeofTA
  ) {
    if (other instanceof otherType)
      return new resultType(opFn(this.value, other.value))
    throw new RTE(
      `Cannot execute "${this.value} ${op} ${(<object>other).constructor.name}"`
    )
  }

  checkAndApplyBool(other: TA, op: string, opFn: (a:Timeline, b:string) => boolean) {
    if (other instanceof TString)
      return new TBool(opFn(this.value, other.value))
    throw new RTE(
      `Cannot compare "${this.value} using ${op} ${other.constructor.name} (${other.value})"`
    )
  }

  toString() {
    return `@(.now=${this.value.now()})`
  }

  toNative() {
    return this.value.timeline.toArray()
  }
}



