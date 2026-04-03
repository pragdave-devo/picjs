import { CardinalFactorsFromNW } from "../../position.js"
import * as Shape from "../../shapes.js"
import { RenderParameters } from "../../types.js"

type Converter = (position: RenderParameters, attrs: Shape.Args) => void


export function run(position: RenderParameters, incomingAttrs: Shape.Args, converters: Converter[]) {
  const result = { ...incomingAttrs }
  for (let converter of converters) {
    converter(position, result)
  }
  return result
}

export function anchorToSvgNW(position: RenderParameters, attrs: Shape.Args) {
  const [ fx, fy ] = CardinalFactorsFromNW[position.cardinal]
  attrs.x = position.x - fx * position.width
  attrs.y = -position.y - fy * position.height
}

//------------------------------------------------------------ font

export function font(_position: RenderParameters, attrs: Shape.Args) {
  const fontSpec = attrs.font
  if (fontSpec)
    fontSpec.injectIntoAttrs(attrs)
}

//------------------------------------------------------------ linestyle

export function linestyle(_position: RenderParameters, attrs: Shape.Args) {
  const lineThickness = attrs[`stroke-width`] || 1
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
    attrs[`stroke-dasharray`] = dashSpec
  }
  else {
    delete attrs[`stroke-dasharray`]
  }
  delete attrs.linestyle
}

////------------------------------------------------------------ rotatio

export function rotation(position: RenderParameters, attrs: Shape.Args) {
  if (!attrs.rotation)
    return

  const center = position.rotationCenter
  if (!center || !center.x)
    throw new Error(`the rotation center does not look like a position: ${JSON.stringify(center)}`)

  attrs.transform = `rotate(${attrs.rotation}, ${center.x}, ${-center.y})`
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


