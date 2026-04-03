import {
  parse, converter, formatHex, formatHex8, clampGamut
} from 'culori'
import type { Color } from 'culori'
import { valueOf } from "../helpers/eval.js"
import { TBool, TColor } from "../../src/types.js"

const toOklch = converter('oklch')
const toRgb   = converter('rgb')
const clampRgb = clampGamut('rgb')

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

// ---------------------------------------------------------------------------
// Helpers mirroring the operations in TColor so tests are self-documenting
// ---------------------------------------------------------------------------

function adjustL(color: Color, delta: number): Color {
  const ok = toOklch(color) as any
  const l = clamp01(ok.l + delta)
  const c = (l <= 0 || l >= 1) ? 0 : ok.c
  return clampRgb({ ...ok, l, c })!
}

function brightenColor(color: Color, amt: number): Color {
  const rgb = toRgb(color) as any
  return { mode: 'rgb', r: clamp01(rgb.r + amt), g: clamp01(rgb.g + amt), b: clamp01(rgb.b + amt),
           ...(rgb.alpha !== undefined ? { alpha: rgb.alpha } : {}) } as Color
}

function desaturateColor(color: Color, amount: number): Color {
  const ok = toOklch(color) as any
  return clampRgb({ ...ok, c: ok.c * (1 - amount) })!
}

function saturateColor(color: Color, amount: number): Color {
  const ok = toOklch(color) as any
  return clampRgb({ ...ok, c: ok.c + amount * 0.4 })!
}

function grayscaleColor(color: Color): Color {
  const ok = toOklch(color) as any
  return clampRgb({ ...ok, c: 0 })!
}

function spinColor(color: Color, angle: number): Color {
  const ok = toOklch(color) as any
  return clampRgb({ ...ok, h: ((ok.h ?? 0) + angle + 360) % 360 })!
}

/** Parse a color spec, including non-CSS hsv() format. */
function c(spec: string): Color {
  const hsvMatch = spec.match(/^(hsva?)\(([^)]+)\)$/)
  if (hsvMatch) {
    const [h, s, v, alpha] = hsvMatch[2].split(',').map(Number)
    return { mode: 'hsv', h, s: s/100, v: v/100,
             ...(!isNaN(alpha) ? { alpha } : {}) } as Color
  }
  const hslMatch = spec.match(/^(hsla?)\(([^)]+)\)$/)
  if (hslMatch) {
    const [h, s, l, alpha] = hslMatch[2].split(',').map(Number)
    return { mode: 'hsl', h, s: s/100, l: l/100,
             ...(!isNaN(alpha) ? { alpha } : {}) } as Color
  }
  const color = parse(spec)
  if (!color) throw new Error(`Cannot parse test color: "${spec}"`)
  return color
}

const cTrue = new TBool(true)

/** Compare two colors via normalised 8-digit hex (format-independent). */
function sameColor(a: Color, b: Color): boolean {
  return formatHex8(toRgb(a) as any) === formatHex8(toRgb(b) as any)
}

function t(ip: string, expected: Color) {
  it(ip, () => {
    const result = valueOf(ip)
    expect(result).toBeInstanceOf(TColor)
    expect(sameColor((result as TColor).value, expected)).toBeTruthy()
  })
}

// ---------------------------------------------------------------------------

describe(`evaluating color literals`, () => {
  describe(`must represent colors in different formats`, () => {
    t(`rgb(1, 2, 3)`,           c(`rgb(1, 2, 3)`))
    t(`rgb(1, 2, 3, 0.5)`,      c(`rgba(1, 2, 3, 0.5)`))

    t(`hsv(1, 2, 3)`,           c(`hsv(1, 2, 3)`))
    t(`hsv(1, 2, 3, 0.5)`,      c(`hsva(1, 2, 3, 0.5)`))

    t(`hsl(1, 2, 3)`,           c(`hsl(1, 2, 3)`))
    t(`hsl(1, 2, 3, 0.5)`,      c(`hsla(1, 2, 3, 0.5)`))

    t(`#112233`,                 c(`rgb(17, 34, 51)`))
    t(`#11223380`,               c(`rgba(17, 34, 51, ${128 / 255})`))

    t(`#123`,                    c(`rgb(17, 34, 51)`))
    t(`#1235`,                   c(`rgba(17, 34, 51, ${1 / 3})`))
  })

  describe(`should be able to compare colors in different formats`, () => {
    expect(valueOf(`rgb(16, 32, 64) == #102040`)).toEqual(cTrue)
    expect(valueOf(`rgb(16, 32, 64, 128 / 255) == #10204080`)).toEqual(cTrue)
    expect(valueOf(`rgb(255, 0, 0) == #ff0000`)).toEqual(cTrue)
    expect(valueOf(`hsl(0, 100, 50) == #ff0000`)).toEqual(cTrue)
    expect(valueOf(`hsv(0, 100, 100) == #ff0000`)).toEqual(cTrue)
    expect(valueOf(`hsv(0, 100, 100, 128 / 255) == #ff000080`)).toEqual(cTrue)
  })

  // Manipulation — expected values computed from culori oklch operations
  // (see helpers above, which mirror the TColor implementation exactly)

  const red = c(`#f00`)
  const lowSat = c(`hsl(0, 10, 50)`)   // hsl(0, 10%, 50%)

  const tests: [string, Color][] = [
    [ `(#f00).lighten(0.1)`,                   adjustL(red,  0.1)             ],
    [ `(#f00).lighten(1)`,                     adjustL(red,  1)               ],
    [ `(#f00).brighten(0.1)`,                  brightenColor(red, 0.1)        ],
    [ `(#f00).darken(0.1)`,                    adjustL(red, -0.1)             ],
    [ `(#f00).darken(1)`,                      adjustL(red, -1)               ],
    [ `(#f00).desaturate(0.1)`,                desaturateColor(red, 0.1)      ],
    [ `(#f00).desaturate(1)`,                  desaturateColor(red, 1)        ],
    [ `(hsl(0, 10, 50)).saturate(0.1)`,        saturateColor(lowSat, 0.1)     ],
    [ `(#f00).grayscale()`,                    grayscaleColor(red)            ],
    [ `(#f00).spin(180)`,                      spinColor(red, 180)            ],
    [ `(#f00).spin(-90)`,                      spinColor(red, -90)            ],
    [ `(#f00).spin(90)`,                       spinColor(red, 90)             ],
  ]

  describe(`should support color manipulation`, () => {
    tests.forEach(([operation, expected]) => {
      t(operation, expected)
    })
  })
})
