import { Arc }      from "./arc.js"
import { Circle }   from "./circle.js"
import { Label }    from "./label.js"
import { Line }     from "./line.js"
import { Polyline } from "./polyline.js"
import { Rect }     from "./rect.js"
import * as Shape from "../../shapes.js"

import { SvgBase } from "./_base.js"


export const ShapeToRenderer:Record<string, typeof SvgBase> = {
  SArc:      Arc,
  SBox:      Rect,
  SCircle:   Circle,
  SLabel:    Label,
  SLine:     Line,
  SPolyline: Polyline,
}

export class Renderer {


  renderers: { [sid: string]: SvgBase } = {}

  constructor(_dispatcher: unknown) {
  }

  render(shapes: Shape.SBase[]) {
    const elements: SVGElement[] = []

    shapes.forEach(shape => {
      const sid = shape.id
      const params = shape.params
      if (sid in this.renderers) {
        const existingElement = this.renderers[sid].rerender(shape.requiredPosition(), params).el
        elements.push(existingElement)
      }
      else {
        const specificRenderer = ShapeToRenderer[shape.shapeName]
        if (specificRenderer) {
          const renderer = new specificRenderer(shape.requiredPosition(), params)
          renderer.el.setAttribute(`data-jp-id`, sid)
          this.renderers[sid] = renderer
          elements.push(renderer.el)
        }
        // else
        // throw new Error(`Unknown shape "${shape.shapeName}" in renderer`)
      }
    })

    return elements
  }
}
