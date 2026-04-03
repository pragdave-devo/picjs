import { RTE } from "../runtime_error.js"
import { Interpreter } from "../interpreter.js"
import { AnimationStyle, TBase, TA } from "./_base.js"
import { TNumber } from "./tnumber.js"
import { TNative } from "./tnative.js"
import { TString } from "../types.js"
import * as Iterable from "./iterable.js"


// native functions

export class TList extends TBase<TA[]> {

  constructor(list: TA[]) {
    super(list, AnimationStyle.none)

    this.attrs.push   = new TNative(`push`, [`item`],
                                    `add a new item to the end of a list`,
    (_: Interpreter, item: TA) => {
      this.value.push(item)
      return this
    })

    this.attrs.pop   = new TNative(`pop()`, [],
                                   `remove the last item from a list and return that item`,
    (_: Interpreter) => {
      if (this.value.length === 0) 
        throw new RTE(`Cannot pop an item from an empty list`)
      return <TA>(this.value.pop())
    })

    Iterable.addToAttrs(this)
  }

  opPlus(other: TA)   { return this.doOp(other, `opPlus`) }
  opMinus(other: TA)  { return this.doOp(other, `opMinus`) }
  opTimes(other: TA)  { return this.doOp(other, `opTimes`) }
  opDivide(other: TA) { return this.doOp(other, `opDivide`) }
  opPow(other: TA)    { return this.doOp(other, `opPow`) }


  getAtIndex(offset: TA) {
    if (offset instanceof TString) {
      return this.getAtAttr(offset.value)
    }
    return this.indexableGet(offset)
  }

  setAtIndex(index: any | number, value: any) {
    if (index instanceof TString) {
      this.setAtAttr(index.value, value)
      return
    }

    if (index < 0) {
      throw new RTE(`List index "${index} is less than zero. This isn't PHP or JavaScript...`)
    }

    this.value[index] = value
  }

  // computed attributes

  handle_attr_length() {
    return new TNumber(this.value.length)
  }

  // callb acks to support _Iterable_

  default_step() {
    return 1
  }

  first_index() {
    return 0
  }

  last_index() {
    return this.value.length - 1
  }

  at(n: number) {
    if (Number.isInteger(n) && n >= 0 && n < this.value.length)
      return this.value[n]

    throw new RTE(`Index "${n}" out of bounds (or is not an integer)`)
  }
  // helpers

  doOp(other: TA, op: string) {
    if (other instanceof TList) 
      return this.applyListOp(other, op)
    if (other instanceof TNumber)
      return this.applyScalarOp(other, op)

    throw `incompatible types: ${this.value} ${op} ${other.value}`
  }

  applyListOp(other: TA, op: string) {
    if (other.value.length !== this.value.length) {
      throw new Error(`cannot perform operation between\n` +
                      `\t${this.value}\nand\n\t${other}\nbecause they are different lengths`) 
    }
    const result = this.value.map((v, i) => v[op](other.value[i]))
    return new TList(result)
  }


  applyScalarOp(other: TA, op: string) {
    const result = this.value.map(v => v[op](other))
    return new TList(result)
  }

  indexableGet(offset: any) {
    if (! (offset instanceof TNumber)) {
      throw `attempt to index with ${offset.value}`
    }
    let index = offset.value
    const len = this.value.length

    if (index < 0)
      index = len + index

    if (index < 0 || index >= len)
      throw `index ${index} outside list bounds (0..${len - 1})`

    return this.value[index]
  }
  toNative() {
    return this.value.map(v => v.toNative())
  }

  toString() {
    const contents = this.value.map(v => v.toString())
    return `[ ${contents.join(`, `)} ]`
  }
}


