// import { setAttr } from "redom"
import { SvgBase } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"

export class Circle extends SvgBase {

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.build(`circle`)
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

