/* eslint-disable max-len */
const ShapeDefaults = `
SArc    | stroke      | stroke_width     | linestyle | turn  | rotation | reveal_time | hide_time
-----------------------------------------------------------------------
.normal | LineStroke  | LineStrokeWidth  | solid     | cw    | 0        | 0.3         | 0.3

SLabel   | align | fill           | font_family | font_size | font_style | font_variant | font_weight | font_stretch | line_height | rotation | reveal_time | hide_time
---------------------------------------------------------------------------------------------------------------------------
.normal  |   c   | BodyTextColor  | BodyFont    | FS        | normal     | normal       | normal      | normal       | 0           | 0        | 0.3         | 0.3
.h1      |   w   | H1Color        | HeadingFont | =FS*4.5   |
.h2      |   w   | H2Color        | HeadingFont | =FS*3     |
.h3      |   w   | H3Color        | HeadingFont | =FS*2     |
.h4      |   w   | H4Color        | HeadingFont | =FS*1.5   |
.p       |   w

SBox     | width      | height      | fill           | stroke      | stroke_width     | linestyle  | rx      | ry      | rotation | reveal_time | hide_time
---------------------------------------------------------------------------------------------------------------------------------
.normal  | ShapeWidth | ShapeHeight | BoxFill0       | ShapeStroke | ShapeStrokeWidth | LineStyle  | ShapeRX | ShapeRY | 0        | 0.3         | 0.3
.v1      |            |             | BoxFill1
.v2      |            |             | BoxFill2
.v3      |            |             | BoxFill3
.v4      |            |             | BoxFill4

SLine   | stroke      | stroke_width     | linestyle | length | rotation | reveal_time | hide_time
-----------------------------------------------------------------------
.normal | LineStroke  | LineStrokeWidth  | solid     | 1      | 0        | 0.3         | 0.3

SPolyline | stroke      | stroke_width     | linestyle | fill     | rotation | reveal_time | hide_time
--------------------------------------------------------------------------
.normal   | LineStroke  | LineStrokeWidth  | solid     | none     | 0        | 0.3         | 0.3
.v1       |            |                  |           | BoxFill1
.v2       |            |                  |           | BoxFill2
.v3       |            |                  |           | BoxFill3
.v4       |            |                  |           | BoxFill4

SPoint  | rotation | reveal_time | hide_time
---------------------------------------------------------------
.normal | 0        | 0           | 0

SGroup  | rotation | reveal_time | hide_time
---------------------------------------------------------------
.normal | 0        | 0           | 0

SCircle  | r            | fill           | stroke      | stroke_width     | linestyle  | rotation | reveal_time | hide_time
-------------------------------------------------------------------------------------------------
.normal  | CircleRadius | BoxFill0       | ShapeStroke | ShapeStrokeWidth | LineStyle  | 0        | 0.3         | 0.3
.v1      |              | BoxFill1
.v2      |              | BoxFill2
.v3      |              | BoxFill3
.v4      |              | BoxFill4

SEllipse | rx           | ry             | fill           | stroke      | stroke_width     | linestyle  | rotation | reveal_time | hide_time
-------------------------------------------------------------------------------------------------
.normal  | =ShapeWidth*0.5 | =ShapeHeight*0.5 | BoxFill0       | ShapeStroke | ShapeStrokeWidth | LineStyle  | 0        | 0.3         | 0.3
.v1      |              |                | BoxFill1
.v2      |              |                | BoxFill2
.v3      |              |                | BoxFill3
.v4      |              |                | BoxFill4

SOval    | width      | height      | fill           | stroke      | stroke_width     | linestyle  | rx      | ry      | rotation | reveal_time | hide_time
---------------------------------------------------------------------------------------------------------------------------------
.normal  | ShapeWidth | ShapeHeight | BoxFill0       | ShapeStroke | ShapeStrokeWidth | LineStyle  | ShapeRX | ShapeRY | 0        | 0.3         | 0.3
.v1      |            |             | BoxFill1
.v2      |            |             | BoxFill2
.v3      |            |             | BoxFill3
.v4      |            |             | BoxFill4
`


type ThemeType = {
  [ themeName: string ]: {
    [ attribute: string ]:  string | number
  }
}

// Shared geometry — same in all themes
const SharedGeometry = {
  FS:  0.14,
  CircleRadius: 0.5,
  LineStrokeWidth: 0.04,
  LineStyle: `straight`,
  ShapeHeight: 0.75,
  ShapeRX: 0.06,
  ShapeRY: 0.06,
  ShapeStrokeWidth: 0.015,
  ShapeWidth: 1,
}

// All fills tested for WCAG contrast ratio ≥ 4.5:1 against BodyTextColor
const Themes: ThemeType = {
  Dark: {
    ...SharedGeometry,
    HeadingFont: `'Fira Sans', sans-serif`,
    BodyFont: `Roboto, sans-serif`,

    // White text on deep fills — all ≥ 4.5:1
    BodyTextColor: `#ffffff`,
    BoxFill0: `#1a7a9a`,  // deep cerulean    (4.9:1)
    BoxFill1: `#7b2d8e`,  // deep purple      (8.1:1)
    BoxFill2: `#2d6e2d`,  // deep green       (6.2:1)
    BoxFill3: `#a84800`,  // burnt orange     (5.9:1)
    BoxFill4: `#0a6e68`,  // deep teal        (6.1:1)
    ShapeStroke: `none`,

    // Lines — bright on dark background
    LineStroke: `#5aacff`,

    // Headings — bright on dark background
    H1Color: `#ffc233`,
    H2Color: `#e8713a`,
    H3Color: `#d4a020`,
    H4Color: `#6ab040`,
  },

  Light: {
    ...SharedGeometry,
    HeadingFont: `'Fira Sans', sans-serif`,
    BodyFont: `Roboto, sans-serif`,

    // Dark text on light fills — all ≥ 4.5:1
    BodyTextColor: `#1a1a2e`,
    BoxFill0: `#7cc8e0`,  // soft blue        (9.1:1)
    BoxFill1: `#c49ed8`,  // soft purple      (7.5:1)
    BoxFill2: `#8ac08a`,  // soft green       (8.1:1)
    BoxFill3: `#e8a070`,  // soft orange      (7.9:1)
    BoxFill4: `#7ac8c0`,  // soft teal        (8.8:1)
    ShapeStroke: `#666`,

    // Lines — dark enough for light background
    LineStroke: `#0058a0`,

    // Headings — dark enough for light background
    H1Color: `#8b5e00`,
    H2Color: `#b83a10`,
    H3Color: `#6b5000`,
    H4Color: `#2d6a00`,
  },
}

export type ShapeDefaultsType = {
    [ name: string ]: {            // name of thing in category (eg SBox)
      [ className: string ]: {     // class name  (eg .normal)
        [ attribute: string ]: any // attribute name
  }}
}

export type DefaultsType = {
  [ category: string ] : ShapeDefaultsType
}

let currentThemeName = 'Dark'
let Theme = { ...Themes.Dark }

export const Defaults: DefaultsType = {
  Shapes: parseShapeDefaults(ShapeDefaults),
}

export function setTheme(name: string) {
  if (!Themes[name]) throw new Error(`Unknown theme: "${name}". Available: ${Object.keys(Themes).join(', ')}`)
  currentThemeName = name
  Theme = { ...Themes[name] }  // Copy to avoid mutating original
  Defaults.Shapes = parseShapeDefaults(ShapeDefaults)
}

/**
 * Reset theme to original values (undo any palette modifications).
 * Call this before starting a new program.
 */
export function resetTheme(): void {
  Theme = { ...Themes[currentThemeName] }
  Defaults.Shapes = parseShapeDefaults(ShapeDefaults)
}

export function getThemeName(): string {
  return currentThemeName
}

export function getThemeNames(): string[] {
  return Object.keys(Themes)
}

/**
 * Update theme colors based on palette colors.
 * Called when Palette.current is set.
 */
export function applyPaletteToTheme(colors: Record<string, string>): void {
  Theme.BoxFill0 = colors.b1
  Theme.BoxFill1 = colors.b2
  Theme.BoxFill2 = colors.b3
  Theme.BoxFill3 = colors.b4
  Theme.BoxFill4 = colors.b5
  Theme.LineStroke = colors.b1
  // Re-parse defaults to pick up new theme values
  Defaults.Shapes = parseShapeDefaults(ShapeDefaults)
}

function convertValue(value: string) {
  const firstChar = value[0]
  if (firstChar === `=`) {  // assume always ThemeVariable (rest of expression)
    const match = value.match(/^=([A-Z][a-zA-Z]*)(.*)/)
    if (!match)
      throw new Error(`Invalid theme specification value: "${value}"`)

    // look up value of first part of expression
    const baseValue = Theme[match[1]]
    const valueParts = baseValue.toString().match(/^(-?\d+(\.\d+)?)(.*)/)
    if (!valueParts)
      throw new Error(`can't find a number in ${baseValue}`)
    const valueNumber = Number.parseFloat(valueParts[1])
    const evaluator = Function(`return ${valueNumber}${match[2]}`)
    return `${evaluator()}${valueParts[3] || ``}`
  }
  else if (firstChar >= `A` && firstChar <= `Z`) {  // just ASCII for now
    const result = Theme[value]

    if (result)
      return result

    throw new Error(`unknown theme attr ${value}`)
  }
  else {
    const numeric = Number.parseFloat(value)
    if (isNaN(numeric))
      return value
    else
      return numeric
  }
}


function parseForOneShape(spec: string, result: ShapeDefaultsType) {
  const lines = spec.split(/\n/)
  let   hdr = lines.shift()?.split(/\s+\|/)
  if (!hdr)
    throw new Error(`Missing header line`)

  const shapeName = hdr.shift()
  if (!shapeName)
    throw new Error(`Missing shape name in header line`)

  hdr = hdr.map(h => h.trim())

  if (lines[0][0] === `-`)
    lines.shift()

  if (!result.shapeName)
    result[shapeName] = {}

  const shapeSpec = result[shapeName]

  lines.forEach(line => {
    const fields = line.split(/\s+\|/)
    const className = fields.shift()

    if (!className)
      throw new Error(`Missing class name in default spec`)

    if (!shapeSpec[className])
      shapeSpec[className] = {}

    const classSpec = shapeSpec[className]

    hdr?.forEach((attrName, i) => {
      const value = fields[i]
      let result: string | number = value
      if (value?.length > 0) {
        result = convertValue(value.trim())

        classSpec[attrName] = result
      }
    })
  })
}

function parseShapeDefaults(spec: string) {
  const result = {}
  const perShape = spec.trim().split(/\n\n/)
  perShape.forEach(shape => parseForOneShape(shape, result))

  return result
}
