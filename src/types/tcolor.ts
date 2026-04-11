import {
  parse, converter, formatHex, formatHex8, interpolate as culoriInterpolate, clampGamut
} from 'culori'
import type { Color, Oklch, Rgb } from 'culori'
import { RTE } from "../runtime_error.js"
import { AnimationStyle, TBase, TA } from "./_base.js"
import { TBool } from "./tbool.js"
import { TNative } from "./tnative.js"
import { Palette } from "../palette.js"

const toOklch = converter('oklch')
const toRgb   = converter('rgb')
const clampRgb = clampGamut('rgb')

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

/** Convert to OKLCH, zeroing chroma at the lightness extremes (pure black/white). */
function oklchOf(color: Color): Oklch {
  return toOklch(color) as Oklch
}

function adjustL(color: Color, delta: number): Color {
  const ok = oklchOf(color)
  const l = clamp01(ok.l + delta)
  const c = (l <= 0 || l >= 1) ? 0 : ok.c
  return clampRgb({ ...ok, l, c })!
}

/** Canonical color string: #rrggbb for opaque, #rrggbbaa for transparent. */
function colorToString(color: Color): string {
  const rgb = toRgb(color) as Rgb
  return (rgb.alpha !== undefined && rgb.alpha < 1) ? formatHex8(rgb) : formatHex(rgb)
}

export class TColor extends TBase<Color> {

  static fromExisting(color: Color): TColor {
    return new TColor(color)
  }

  static fromString(spec: string): TColor {
    // Alias: ~none → ~transparent
    if (spec === 'none') spec = 'transparent'

    // Check palette colors first (b1-b8, f1-f8)
    if (Palette.isPaletteColor(spec)) {
      const hex = Palette.getColor(spec)
      if (hex) {
        const color = parse(hex)
        if (color) return new TColor(color)
      }
    }

    // Fall back to culori parsing (CSS named colors, hex, etc.)
    const color = parse(spec)
    if (!color)
      throw new RTE(`Invalid color specification: "${spec}"`)
    return new TColor(color)
  }

  /** Called from the interpreter with native-number args (rgb: 0-255, hsl/hsv: h 0-360, s/l/v 0-100, oklch: L 0-1, C 0-0.4, h 0-360). */
  static fromColorModel(model: string, args: any[]): TColor {
    const baseModel = model.startsWith('oklch') ? 'oklch' : model.slice(0, 3)
    const [a, b, c, alpha] = args as number[]
    const hasAlpha = args.length === 4

    let color: Color
    switch (baseModel) {
      case 'rgb':
        color = { mode: 'rgb', r: a/255, g: b/255, b: c/255,
                  ...(hasAlpha ? { alpha } : {}) } as Color
        break
      case 'hsl':
        color = { mode: 'hsl', h: a, s: b/100, l: c/100,
                  ...(hasAlpha ? { alpha } : {}) } as Color
        break
      case 'hsv':
        color = { mode: 'hsv', h: a, s: b/100, v: c/100,
                  ...(hasAlpha ? { alpha } : {}) } as Color
        break
      case 'oklch':
        color = { mode: 'oklch', l: a, c: b, h: c,
                  ...(hasAlpha ? { alpha } : {}) } as Color
        break
      default:
        throw new RTE(`Unknown color model: "${model}"`)
    }
    return new TColor(color)
  }

  constructor(color: Color) {
    super(color, AnimationStyle.continuous)
    this.addNativeFunctions()
    this.isInterpolatable = true
  }

  addNativeFunctions() {
    this.attrs.lighten = new TNative(`lighten`, [`ratio`],
      `return a lighter version of this color (ratio is 0 to 1)`,
      (_: any, ratio: TA) => new TColor(adjustL(this.value,  ratio.toNative())))

    this.attrs.darken = new TNative(`darken`, [`ratio`],
      `return a darker version of this color (ratio is 0 to 1)`,
      (_: any, ratio: TA) => new TColor(adjustL(this.value, -ratio.toNative())))

    this.attrs.brighten = new TNative(`brighten`, [`ratio`],
      `add white to this color (ratio is 0 to 1)`,
      (_: any, ratio: TA) => {
        const rgb = toRgb(this.value) as Rgb
        const amt = ratio.toNative()
        return new TColor({
          mode: 'rgb',
          r: clamp01((rgb.r ?? 0) + amt),
          g: clamp01((rgb.g ?? 0) + amt),
          b: clamp01((rgb.b ?? 0) + amt),
          ...(rgb.alpha !== undefined ? { alpha: rgb.alpha } : {}),
        })
      })

    this.attrs.desaturate = new TNative(`desaturate`, [`amount`],
      `reduce chroma (amount is 0 to 1, with 1 producing grayscale)`,
      (_: any, ratio: TA) => {
        const ok = oklchOf(this.value)
        return new TColor(clampRgb({ ...ok, c: ok.c * (1 - ratio.toNative()) })!)
      })

    this.attrs.saturate = new TNative(`saturate`, [`amount`],
      `increase chroma (amount is 0 to 1)`,
      (_: any, ratio: TA) => {
        const ok = oklchOf(this.value)
        return new TColor(clampRgb({ ...ok, c: ok.c + ratio.toNative() * 0.4 })!)
      })

    this.attrs.grayscale = new TNative(`grayscale`, [],
      `convert this color to grayscale`,
      (_: any) => {
        const ok = oklchOf(this.value)
        return new TColor(clampRgb({ ...ok, c: 0 })!)
      })

    this.attrs.spin = new TNative(`spin`, [`angle`],
      `rotate the hue by the given angle in oklch space (−360 to 360)`,
      (_: any, angle: TA) => {
        const ok = oklchOf(this.value)
        const h = ((ok.h ?? 0) + angle.toNative() + 360) % 360
        return new TColor(clampRgb({ ...ok, h })!)
      })
  }

  /** Interpolate in oklch space for perceptually uniform hue transitions. */
  interpolate(other: TColor, ratio: number): TColor {
    const mix = culoriInterpolate([this.value, other.value], 'oklch')
    return new TColor(mix(ratio))
  }

  opEqual_to(other: TA) {
    return this.checkAndApplyBool(other, `==`, (a, b) => this.colorEqual(a, b))
  }

  opNot_equal_to(other: TA) {
    return this.checkAndApplyBool(other, `!=`, (a, b) => !this.colorEqual(a, b))
  }

  checkAndApplyBool(other: TA, op: string, opFn: (a: Color, b: Color) => boolean) {
    if (other instanceof TColor)
      return new TBool(opFn(this.value, other.value))
    throw new Error(`Cannot execute color ${op} ${other.constructor.name}`)
  }

  /** Compare by normalised #rrggbbaa hex so format differences don't matter. */
  colorEqual(a: Color, b: Color): boolean {
    return formatHex8(toRgb(a) as Rgb) === formatHex8(toRgb(b) as Rgb)
  }

  toNative(): string {
    return typeof this.value === 'string' ? this.value : colorToString(this.value)
  }

  toString(): string {
    return colorToString(this.value)
  }
}
