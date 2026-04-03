import { AnimationStyle, TBase } from "./_base.js"
import { TString } from "./tstring.js"

interface FontAttributes  {
  "font-family":  string
  "font-size":    string
  "font-stretch": string
  "font-style":   string
  "font-variant": string
  "font-weight":  string
  "line-height":  string
}

type OptionalFontAttributes = {
  [Property in keyof FontAttributes]+?: FontAttributes[Property]
}

const FontDefaults: FontAttributes = {
  "font-family":  `sans-serif`,
  "font-size":    `0.14`,
  "font-stretch": `normal`,
  "font-style":   `normal`,
  "font-variant": `normal`,
  "font-weight":  `normal`,
  "line-height":  `normal`,
}

export class TFont extends TBase<FontAttributes> {
  constructor(spec: OptionalFontAttributes) {
    super({ ... FontDefaults, ...spec }, AnimationStyle.none)
  }

  handle_attr_family()  { return new TString(this.family) }
  handle_attr_height()  { return new TString(this.height) }
  handle_attr_size()    { return new TString(this.size) }
  handle_attr_stretch() { return new TString(this.stretch) }
  handle_attr_style()   { return new TString(this.style) }
  handle_attr_variant() { return new TString(this.variant) }
  handle_attr_weight()  { return new TString(this.weight) }

  get family()  { return this.value[`font-family`] }
  get height()  { return this.value[`line-height`] }
  get size()    { return this.value[`font-size`] }
  get stretch() { return this.value[`font-stretch`] }
  get style()   { return this.value[`font-style`] }
  get variant() { return this.value[`font-variant`] }
  get weight()  { return this.value[`font-weight`] }


  injectIntoAttrs(attrs: FontAttributes) {
    if (this.style   !== `normal`) attrs[`font-style`]   = this.style
    if (this.variant !== `normal`) attrs[`font-variant`] = this.variant
    if (this.stretch !== `normal`) attrs[`font-stretch`] = this.stretch
    if (this.weight  !== `normal`) attrs[`font-weight`]  = this.weight
    if (this.family  !== `normal`) attrs[`font-family`]  = this.family
    if (this.height  !== `normal`) attrs[`line-height`]  = this.height

    attrs[`font-size`] = this.size
  }

  toString() {
    const result = []
    if (this.style   !== `normal`) result.push(this.style)
    if (this.variant !== `normal`) result.push(this.variant)
    if (this.stretch !== `normal`) result.push(this.stretch)
    if (this.weight  !== `normal`) result.push(this.weight)
    if (this.height  === `normal`)
      result.push(this.size)
    else
      result.push(`${this.size}/${this.height}`)

    result.push(this.family)   // already a string

    return result.join(` `)
  }

  toNative() {
    return this.value
  }

}




