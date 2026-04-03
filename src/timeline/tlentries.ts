import { XY } from "../position.js"
import { Timeline } from "../timeline.js"
import { SBase } from "../shapes.js"
import { AnimatorBase } from "../animators/_base.js"

export const BigNumber = 0x40000000

let entryCounter = 0
const Incr = 1/65536   // power of two, so exact repr.

export abstract class TLEntry {

  key: number

  constructor(
    public thing: any,
    public start: number, 
    public end = BigNumber
  ) {
    this.key = start + (entryCounter += Incr)  // ensure order is stable
  }

  abstract process(timeline: Timeline): void  

  interval() {
    return [ this.start, this.end ]
  }

  dump() {
    const end = this.end === BigNumber ? `∞` : this.end.toPrecision(5)
    const start = this.start.toPrecision(5)
    console.log(`[${start}…${end}]\t${this.name()}\t` +
                `${this.thing.shapeName || this.thing.constructor.name}`) 
  }

  toHash() {
    const end = this.end === BigNumber ? `∞` : this.end.toPrecision(5)
    return {
      start: this.start,
      end,
      entryType: this.constructor.name,
      updates: this.thing.shapeName || this.thing.constructor.name
    }
  }
 
  name() {
    return this.constructor.name
  }
}

export class CreateShape extends TLEntry {
  constructor(shape: SBase, start: number) {
    super(shape, start, start)  // instantaneous — end = start
  }

  process(_timeline: Timeline) {
    this.thing.visible = true
    this.thing.rememberRenderNeeded()
  }
}

export class UpdateShapeNoAnimation extends TLEntry {

  constructor(
    shape: SBase, 
    start: number, 
    public attr_name: string, 
    public attr_value: any
  ) {
    super(shape, start)
  }

  process(_timeline: Timeline) {
    this.thing.setAnimatableAttr(this.attr_name, this.attr_value)
  }

  name() {
    return `UpdateImmediate`
  }
}

export class PositionShapeNoAnimation extends TLEntry {

  constructor(
    shape: SBase, 
    start: number, 
    public cardinal: string, 
    public pos: XY
  ) {
    super(shape, start)
  }

  process(_timeline: Timeline) {
    const pos = this.pos
    const shape = this.thing
    const offset = shape.cardinalOffset(this.cardinal)
    shape.setAnimatablePosition(pos.x - offset.x, pos.y - offset.y)
  }

  name() {
    return `PositionImmediate`
  }
}


export class Animation extends TLEntry {
  constructor(animation: AnimatorBase, start: number) {
    super(animation, start, start + animation.duration())
    if (isNaN(this.end)) {
      debugger
    }
  }

  process(timeline: Timeline) {
    timeline.processAnimationShouldBeRun(this)
  }

  name() {
    return `Animate`
  }
}


