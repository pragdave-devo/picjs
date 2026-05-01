import { RTE } from "../runtime_error.js"
import { AnimationStyle, TBase, TA, TInterpolatable } from "./_base.js"
import { TList } from "./tlist.js"
import { TNative } from "./tnative.js"
import { TNumber } from "./tnumber.js"
import { TString } from "./tstring.js"
import { EasingNames } from "../animators/_base.js"


const BFreq = 0.3 


type InternalReduceCallback = (acc: any, i: number) => any
type EaseFn = (x: number) => number

export const Easing:Record<EasingNames, EaseFn> = {

  linear:     (x: number) => x,
  cubicIn:    (x: number) => Math.pow(x, 3),
  cubicOut:   (x: number) => 1 - Math.pow(1 - x, 3),
  quadIn:     (x: number) => Math.pow(x, 2),
  quadOut:    (x: number) => 1 - Math.pow(1 - x, 2),

  // from https://joshondesign.com/2013/03/01/improvedEasingEquations
  bounce:     (x: number) => Math.pow(2, -10 * x) * Math.sin((x - BFreq / 4) * 2 * Math.PI / BFreq) + 1,

  // filled in later
  cubic:      (x: number) => x,
  cubicInOut: (x: number) => x,
  quad:       (x: number) => x,
  quadInOut:  (x: number) => x,
}

function combine(inFn: EaseFn, outFn: EaseFn) {
  return (x: number) => x < 0.5 ? inFn(2 * x) / 2 : (1 + outFn(2 * x - 1)) / 2
}

Easing.cubicInOut = Easing.cubic = combine(Easing.cubicIn, Easing.cubicOut)
Easing.quadInOut  = Easing.quad  = combine(Easing.quadIn, Easing.quadOut)


export class TRange extends TBase<null> {

  easingFunction = Easing.linear

  constructor(public start: TInterpolatable<any>, public  end: TInterpolatable<any>) {
    super(null, AnimationStyle.none)

    this.addNativeFunctions()
  }

  opTimes(other: TA) {
    if (!(other instanceof TNumber))
      throw new RTE(`You can only multiply a range by a number (got ${other.toString()}`)

    const ratio = other.toNative()

    if (ratio < 0 || ratio > 1) 
      throw new RTE(`You can only multiply a range by a number between 0 and 1 (got ${ratio})`)

    return this.interpolate(ratio)
  }

  addNativeFunctions() {

    //---------------------------------------------------------------------- start
    this.attrs.start = new TNative(`start`, [],
      `return the first value in the range`,
      (_) => {
        return this.start
      })

    //---------------------------------------------------------------------- end
    this.attrs.end = new TNative(`end`, [],
      `return the last value in the range`,
      (_) => {
        return this.end
      })

    //---------------------------------------------------------------------- ease
    this.attrs.ease = new TNative(`ease`, [ `style` ],
      `Apply easing to the interpolation. Style is one of: ${Object.keys(Easing).join(`, `)}`,

      (_, style: TString) => {
        const name = style.toNative()
        if (name in Easing) {
          this.easingFunction = Easing[<EasingNames>name]
          return this
        }
        else
          throw new RTE(`unknown easting style "${name}`)
      })

    //---------------------------------------------------------------------- interpolate
    this.attrs.interpolate = new TNative(`interpolate`, [`ratio`],
      `return the value that is _ratio_ of the way between start and end ` +
      `(where ratio is between 0 and 1 inclusive)`,

      (_, ratio) =>  {
        return this.interpolate(ratio.toNative())
      })

    //---------------------------------------------------------------------- steps
    this.attrs.steps = new TNative(`steps`, [ `number_of_steps`, `callback` ],
      `Invoke the callback _steps_ times, passing equally spaced interpolations ` +
      `from the range`,

      (interpreter, steps, callback) => {

        if (!(steps instanceof TNumber))
          throw new RTE(`the steps parameter must be a number`)

        const iSteps = steps.toNative()

        if (iSteps < 0)   throw new RTE(`steps cannot be less than zero`)
        if (iSteps === 0) return this

        if (iSteps === 1) {
          interpreter.callFunction(callback, [ this.interpolate(0.5) ])
          return this
        }

        const stepGap = 1.0 / (iSteps - 1)

        for (let i = 0, ratio = 0; i < iSteps; ratio += stepGap, i++) {
          interpreter.callFunction(callback, [ this.interpolate(ratio) ])
        }

        return this
      })

    //---------------------------------------------------------------------- each
    this.attrs.each = new TNative(`each`, [ `callback` ],
      `If (and only if) start and end are integers, invokes the callback ` +
      `"end - start + 1" times, passing it the current value and ` +
      `the index.`,

      (interpreter, callback) => {
    
        this.reduce(0, (index: number, i: number) => {
          interpreter.callFunction(callback, [ new TNumber(i), new TNumber(index) ])
          return index + 1
        })

        return this
      })

    //---------------------------------------------------------------------- map
    this.attrs.map = new TNative(`map`, [ `callback` ],
      `If (and only if) start and end are integers, invokes the callback ` +
      `"end - start + 1" times, passing it the current value. Collects ` +
      `and returns a list of the values returned by each invocation.`,

      (interpreter, callback) => {

        const result = this.reduce([], (acc: TA[], i: number) => {
          const thisTerm = interpreter.callFunction(callback, [ new TNumber(i) ])
          acc.push(thisTerm)
          return acc
        })

        return new TList(result)
      })
  }

  reduce(acc: any, internalCallback: InternalReduceCallback) {
    const ErrMsg = `You can only use [a..b].map/each if a and b are integers`
    if (!(this.start instanceof TNumber && this.end instanceof TNumber))
      throw new RTE(ErrMsg)

    const start = this.start.toNative()
    const end = this.end.toNative()

    if (!(Number.isInteger(start) && Number.isInteger(end)))
      throw new RTE(ErrMsg)

    if (start <= end) {
      for (let i = start; i <= end; i++) {
        acc = internalCallback(acc, i)
      }
    }
    else {
      for (let i = start; i >= end; i--) {
        acc = internalCallback(acc, i)
      }
    }
    return acc
  }


  // functions used both by interpreted code and by the interpreter

  ease(style: string) {
    if (style in Easing) {
      this.easingFunction = Easing[<EasingNames>style]
      return this
    }
    throw new RTE(`Invalid easing style "${style}".\n` +
      `Valid styles are:  ${Object.keys(Easing).join(`, `)}`)
  }

  interpolate(ratio: number) {
    if (!(typeof ratio === `number`))
      throw new RTE(`Interpolation ratio should be a number (got "${ratio}")`)

    if (ratio < -0.1 || ratio > 1.1)
      throw new RTE(`Ratio should be from 0 to 1 (got "${ratio}")`)

    // allow for rounding...
    if (ratio < 0) ratio = 0
    if (ratio > 1) ratio = 1

    const position = this.easingFunction(ratio)

    return this.start.interpolate(this.end, position)
  }

  toString() {
    return `[ ${this.start.toString()} .. ${this.end.toString()} ]`
  }

  toNative() {
    return [ this.start.toNative(), this.end.toNative() ]
  }
}



