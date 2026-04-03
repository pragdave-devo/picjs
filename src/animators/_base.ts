import { Easing, TA, TInterpolatable, TNumber, TRange, TPosition, } from "../types.js"
import { Cardinals, XY } from "../position.js"
import { RTE } from "../runtime_error.js"
import * as Shape from "../shapes.js"

let n = 0

export type EasingNames =
  `linear` | `cubicIn` | `cubicOut` | `quadIn` | `quadOut` |
  `bounce` | `cubic` | `cubicInOut` | `quad` | `quadInOut` 

// export interface AnimationParams {
//   ease: EasingNames
//   take: number
//   followsPrevious: boolean
// }

export type AnimationParams = Record<string, any>

const DefaultParams: AnimationParams = {
  take: 0.7,
  ease: `linear` ,
  followsPrevious: false,
}


export abstract class AnimatorBase {

  protected params: AnimationParams
  protected range?: TRange

  protected _done = false
  protected id = `anim-${n++}`

  constructor(animationParams: AnimationParams) {
    this.params = { ...DefaultParams, ...animationParams }
    if (!(this.params.ease in Easing)) {
      throw new RTE(`The "ease" parameter must be one of ${Object.keys(Easing).join(`, `)}`)
    }
  }

  duration() {
    return this.params.take
  }

  ease() {
    return this.params.ease
  }

  done() {
    return this._done
  }

  followsPrevious() { // set by parser if this animation is prefixed by `then`
    return this.params.followsPrevious
  }

  // interface
  setupRange<T>(start: TInterpolatable<T>, end: TInterpolatable<T>) { 
    this.range = new TRange(start, end)
    this.range.ease(this.params.ease)
  }

  step(timeIntoAnimation: number) {

    if (!this.range)
      throw new Error(`animation.step called before animation.start`)

    let ratio = timeIntoAnimation / this.params.take

    if (ratio >= 1.0) { 
      this._done = true 
      ratio = 1.0
    }
    const nextValue = this.range.interpolate(ratio)
    this._step(nextValue)
  }

  stop() { 
    delete this.range
  }

  abstract _step(value: TA): void
  abstract start(): void
}

export class MoveToAnimator extends AnimatorBase {

  protected shape
  protected cardinal
  protected place

  constructor(
    shape: Shape.SBase, 
    cardinal: string, 
    place: TPosition | XY, 
    params: AnimationParams
  ) {
    super(params)

    if (!cardinal)
      debugger
    this.shape = shape
    this.cardinal = <Cardinals>cardinal
    if (place instanceof TPosition)
      this.place = place
    else
      this.place = new TPosition(place)
  }

  start() {
    const offset = this.shape.cardinalOffset(this.cardinal)
    const start = this.shape.getAnimatablePosition()
    const end = new TPosition({ x: this.place.x - offset.x, y: this.place.y - offset.y })

    this.setupRange(start, end)
  }

  _step(nextValue: TPosition) {
    this.shape.setAnimatablePosition(nextValue.x, nextValue.y)
  }

  stop() {
    // this.shape.setAnimatablePosition(this.end.x, this.end.y) 
    super.stop()
  }
}

export class RotateAnimator extends AnimatorBase {
  protected shape
  protected angle
  protected about

  constructor(
    shape: Shape.SBase, 
    angle: TNumber, 
    about: XY, 
    params: AnimationParams
  ) {
    super(params)

    this.shape = shape
    this.angle = angle
    this.about = about
  }

  start() {
    const start = this.shape.getAnimatableAttr(`rotation`)
    const end   = new TNumber(start.value + this.angle.value)

    this.setupRange(start, end)
  }

  _step(nextValue: TNumber) {
    this.shape.setAnimatableAttr(`rotation`, nextValue)
  }

  stop() {
    super.stop()
  }
}

// some attributes (such as colors) can be smoothly animated, and others cannot. For the
// latter, we fake it using a cross fade
//
export function createAttributeAnimator<T>(
  shape: Shape.SBase, 
  attr: string, 
  finalValue: TInterpolatable<T>, 
  params: AnimationParams
) {
  const currentValue = shape.getAnimatableAttr(attr)

  switch (currentValue.supportedAnimationStyle()) {
    case `continuous`:
      return new SetAttrAnimator(shape, attr, finalValue, params)

    case `crossfade`:
      return new CrossFadeAnimator(shape, attr, finalValue, params)

    default:
      throw new RTE(`You cannot animate ${shape.shapeName}.${attr}`)
  }
}

class SetAttrAnimator extends AnimatorBase {

  constructor(
    public shape: Shape.SBase, 
    public attrName: string, 
    public value: TInterpolatable<any>, 
    params: AnimationParams
  ) {
    super(params)
  }

  start() {
    const start = this.shape.getAnimatableAttr(this.attrName)
    const end   = this.value
    this.setupRange(start, end)
  }

  _step<T>(nextValue: TInterpolatable<T>) {
    this.shape.setAnimatableAttr(this.attrName, nextValue)
  }

  stop() {
    // this.shape.setAnimatableAttr(this.attrName, this.end) 
    super.stop()
  }
}

class CrossFadeAnimator extends AnimatorBase {

  constructor(
    public shape: Shape.SBase, 
    public attrName: string, 
    public value: TInterpolatable<any>, 
    params: AnimationParams
  ) {
    super(params)
  }

  start() { 
    this.shape.prepareForCrossfade(this.value.toNative())
  }

  step(timeIntoAnimation: number) {
    let ratio = timeIntoAnimation / this.params.take
    if (ratio >= 1.0) { 
      this._done = true 
      ratio = 1.0
    }
    this.shape.updateCrossFade(ratio)
  }

  _step(_value: TA) {
    throw new Error(`never called`)
  }

  stop() { 
    this.shape.finalizeCrossFade()
  }
}


// export class WaitAnimator extends AnimatorBase {
//   constructor(type, sign, offset) {
//     super({ take: 0 })
//     this.type = type
//     this.offset = sign === `+` ? offset : -offset
//   }
// }

