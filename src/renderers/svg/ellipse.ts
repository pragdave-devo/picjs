import { SvgBase } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"

export class Ellipse extends SvgBase {

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.build(`ellipse`)
  }

  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    return Convert.run(position, attrs, [
      (position, attrs) => {
        attrs.cx = position.x
        attrs.cy = position.y
      },
      Convert.rotation,
      Convert.linestyle,
    ])
  }
}
