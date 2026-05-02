import { RTE } from "../runtime_error.js"

// Late-bound factory for the `has()` method — avoids circular imports
// (TNative → Interpreter → TBase). Registered once from types.ts.
let _hasMethodFactory: ((host: TBase<any>) => any) | null = null
export function registerHasMethodFactory(factory: (host: TBase<any>) => any) {
  _hasMethodFactory = factory
}

export enum AnimationStyle  {
  none = `none`,
  continuous = `continuous`,
  crossfade = `crossfade`,
}

export type TA = TBase<any>
type AttributeAccessors = { [attr_name: string]: () => TA }

const BaseAttrs: AttributeAccessors = {}

export class TBase<ValueType, > {
  attrs: Record<string, any>
  isInterpolatable = false
  typeName = this.constructor.name


  constructor(public value: ValueType, public animationStyle: AnimationStyle = AnimationStyle.none) {
    this.attrs = {}
  }


  supportedAnimationStyle() {
    return this.animationStyle // none or continuous or crossfade
  }

  // A bunch of predefined callbacks from the interpreter...
  
  opUnaryPlus()  { this.operatorNotSupported(`(unary) +`) }
  opUnaryMinus() { this.operatorNotSupported(`(unary) -`) }

  opPlus(_: TA)      { this.operatorNotSupported(`+`) }
  opMinus(_: TA)     { this.operatorNotSupported(`-`) }
  opTimes(_: TA)     { this.operatorNotSupported(`*`) }
  opDivide(_: TA)    { this.operatorNotSupported(`/`) }
  opExp(_: TA)       { this.operatorNotSupported(`^`) }
  opNegate(_: TA)    { this.operatorNotSupported(`- (negation)`) }
  isTrue()       { this.operatorNotSupported(`test if true`) }

  opEqual_to(_: TA)                      { this.operatorNotSupported(`==`) }
  opNot_equal_to(_: TA)                  { this.operatorNotSupported(`!=`) }
  opLess_than(_: TA)                     { this.operatorNotSupported(`<`) }
  opLess_than_or_equal_to(_: TA)         { this.operatorNotSupported(`<=`) }
  opGreater_than_than(_: TA)             { this.operatorNotSupported(`>`) }
  opGreater_than_than_or_equal_to(_: TA) { this.operatorNotSupported(`>=`) }
  opIndex(_: TA)                         { this.operatorNotSupported(`[ ] (indexing)`) }


  getUserDefinedAttribute(name: string) {
    return this.attrs[name]
  }

  getAtAttr(name: string, _args = []) {
    if (name in this.attrs) {
      return this.getUserDefinedAttribute(name)
    }
    if (name === `has` && _hasMethodFactory) {
      this.attrs.has = _hasMethodFactory(this)
      return this.attrs.has
    }
    return this.handleBuiltInAttribute(name)
  }

  setAtAttr(name: string, value: any) {
    this.attrs[name] = value
    return this
  }

  getAtIndex(index: any) {
    const key = String(index?.value ?? index)
    return this.getAtAttr(key)
  }

  setAtIndex(index: any, value: any) {
    const key = String(index?.value ?? index)
    return this.setAtAttr(key, value)
  }

  // end of the bunch of callbacks

  builtins() {
    return {}
  }

  // Index signature for dynamic attribute dispatch: this[`handle_attr_${name}`]
  // TypeScript lacks string-pattern index types, so `any` is required here
  [name: string]: any

  handleBuiltInAttribute(name: string) {
    const handlerName = `handle_attr_` + name

    if (!(handlerName in this))
      throw new RTE(`Unknown attribute "${name}" for ${this}`)

    const handler = this[handlerName]

    if (typeof handler !== `function`)
      throw new RTE(`Unknown attribute "${name}" for ${this}`)

    return handler.apply(this)
  }

  toNative(): any {
    throw new Error(`type ${this.constructor.name} does not implement "toNative()"`)
  }


  toString() {
    return this.toNative().toString()
  }

  operatorNotSupported(op: string) {
    throw new RTE(
      `${this.constructor.name} (${this.toNative()}) does not implement "${op}"`
    )
  }

  isSameTypeAs(other: TA) {
    return this.constructor.name === other.constructor.name
  }

  attributesAsTable() {
    const result:Record<string, any> = {}
    Object.entries(this.attrs).forEach(([k, v]) => {
      if (!(typeof v === `object` && v.constructor.name === `TNative`))
        result[k] = v
    })
    return result
  }
}

export interface Interpolatable {
  interpolate(other: TA, ratio: number): TA
}

export abstract class TInterpolatable<Type>  extends TBase<Type> implements Interpolatable { 
  abstract interpolate(other: TA, ratio: number): TA
}

export type TypeofTA = new (...args: any[]) => TA
