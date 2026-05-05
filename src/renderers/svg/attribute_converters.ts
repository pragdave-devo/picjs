import { CardinalFactorsFromNW } from "../../position.js"
import * as Shape from "../../shapes.js"
import { RenderParameters } from "../../types.js"

type Converter = (position: RenderParameters, attrs: Shape.Args) => void


export function run(position: RenderParameters, incomingAttrs: Shape.Args, converters: Converter[]) {
  const result = { ...incomingAttrs }
  for (let converter of converters) {
    converter(position, result)
  }
  if (result.opacity !== undefined)
    result.opacity = Number(result.opacity)
  delete result.reveal_time
  delete result.hide_time
  return result
}

export function anchorToSvgNW(position: RenderParameters, attrs: Shape.Args) {
  const [ fx, fy ] = CardinalFactorsFromNW[position.cardinal]
  attrs.x = position.x - fx * position.width
  attrs.y = position.y - fy * position.height
}

//------------------------------------------------------------ font

const BASE_FONT_SIZE = 0.14

// CSS named sizes as multipliers of medium (≈ base)
const NamedFontSizes: Record<string, number> = {
  'xx-small':  0.6,
  'x-small':   0.75,
  'small':     0.89,
  'medium':    1.0,
  'large':     1.2,
  'x-large':   1.5,
  'xx-large':  2.0,
  'xxx-large': 3.0,
  'smaller':   0.83,
  'larger':    1.2,
}

// Convert font sizes with units to internal coordinate system
// Assumes 1 internal unit = 1 inch
// 72pt = 1 inch, 96px = 1 inch, 1in = 1 inch, 1cm = 0.3937 inch
const UnitToInches: Record<string, number> = {
  'pt': 1/72,
  'px': 1/96,
  'in': 1,
  'cm': 0.3937,
  'mm': 0.03937,
  'em': BASE_FONT_SIZE,  // 1em = base font size
}

// Parse a font size string (e.g., "12pt", "16px", "small") to internal units
// Returns undefined if the input cannot be parsed
export function parseFontSize(fs: string | number | undefined): number | undefined {
  if (fs === undefined || fs === null || fs === '') return undefined
  if (typeof fs === 'number') return fs

  const str = String(fs)

  // Check for named sizes first
  const multiplier = NamedFontSizes[str]
  if (multiplier !== undefined) {
    return BASE_FONT_SIZE * multiplier
  }

  // Check for numeric value with unit (e.g., "12pt", "16px")
  const match = str.match(/^(\d+(?:\.\d+)?)\s*(pt|px|in|cm|mm|em)$/)
  if (match) {
    const value = parseFloat(match[1])
    const unit = match[2]
    const conversion = UnitToInches[unit]
    if (conversion !== undefined) {
      return value * conversion
    }
  }

  // Try parsing as plain number (already in internal units)
  const num = parseFloat(str)
  if (!isNaN(num)) return num

  return undefined
}

export function fontSize(_position: RenderParameters, attrs: Shape.Args) {
  const parsed = parseFontSize(attrs.font_size)
  if (parsed !== undefined) {
    attrs.font_size = parsed
  }
}

export function font(_position: RenderParameters, attrs: Shape.Args) {
  const fontSpec = attrs.font
  if (fontSpec)
    fontSpec.injectIntoAttrs(attrs)
}

//------------------------------------------------------------ linestyle

export function linestyle(_position: RenderParameters, attrs: Shape.Args) {
  const lineThickness = attrs[`stroke_width`] || 1
  let dashSpec 

  switch (attrs.linestyle) {
    case `dotted`:
      const dotLen = 0.75 * lineThickness
      dashSpec = [ dotLen, 4 * dotLen ]
      break
    case `dashed`:
      const gapLen = lineThickness
      dashSpec = [ 2 * gapLen, gapLen ]
      break
    case `solid`:
    default:
      dashSpec = undefined
  }

  if (dashSpec) {
    attrs[`stroke_dasharray`] = dashSpec
  }
  else {
    delete attrs[`stroke_dasharray`]
  }
  delete attrs.linestyle
}

////------------------------------------------------------------ rotatio

export function rotation(position: RenderParameters, attrs: Shape.Args) {
  if (!attrs.rotation) {
    delete attrs.rotation
    return
  }

  const center = position.rotationCenter
  if (!center || center.x === undefined)
    throw new Error(`the rotation center does not look like a position: ${JSON.stringify(center)}`)

  attrs.transform = `rotate(${attrs.rotation}, ${center.x}, ${center.y})`
  delete attrs.rotation
}



////------------------------------------------------------------ width, height

//export function attr_width_height(renderer, name, value) {

//  if (name === `width`) {
//    renderer.width = value
//    setAttr(renderer.el, { width: value })
//    return true
//  }

//  if (name === `height`) {
//    renderer.height = value
//    setAttr(renderer.el, { height: value })
//    return true
//  }

//  return false
//}

////------------------------------------------------------------ r (radius)

//export function attr_circle_radius(renderer, name, value) {
//  if (name === `r`) {
//    renderer.width = renderer.height = value * 2
//    setAttr(renderer.el, { [name]: value })
//    return true
//  }
//  return false
//}


