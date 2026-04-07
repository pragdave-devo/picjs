import { AnimationStyle, TBase } from "./_base.js"
import { TString } from "./tstring.js"

interface FontAttributes  {
  "font_family":  string
  "font_size":    string
  "font_stretch": string
  "font_style":   string
  "font_variant": string
  "font_weight":  string
  "line_height":  string
}

type OptionalFontAttributes = {
  [Property in keyof FontAttributes]+?: FontAttributes[Property]
}

const FontDefaults: FontAttributes = {
  "font_family":  `sans-serif`,
  "font_size":    `0.14`,
  "font_stretch": `normal`,
  "font_style":   `normal`,
  "font_variant": `normal`,
  "font_weight":  `normal`,
  "line_height":  `normal`,
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

  get family()  { return this.value[`font_family`] }
  get height()  { return this.value[`line_height`] }
  get size()    { return this.value[`font_size`] }
  get stretch() { return this.value[`font_stretch`] }
  get style()   { return this.value[`font_style`] }
  get variant() { return this.value[`font_variant`] }
  get weight()  { return this.value[`font_weight`] }


  injectIntoAttrs(attrs: FontAttributes) {
    if (this.style   !== `normal`) attrs[`font_style`]   = this.style
    if (this.variant !== `normal`) attrs[`font_variant`] = this.variant
    if (this.stretch !== `normal`) attrs[`font_stretch`] = this.stretch
    if (this.weight  !== `normal`) attrs[`font_weight`]  = this.weight
    if (this.family  !== `normal`) attrs[`font_family`]  = this.family
    if (this.height  !== `normal`) attrs[`line_height`]  = this.height

    attrs[`font_size`] = this.size
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



