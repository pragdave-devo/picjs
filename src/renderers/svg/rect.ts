import { SvgBase } from "./_base.js"

import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"

export class Rect extends SvgBase {

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.build(`rect`)
  }

  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    return Convert.run(position, attrs, [
      Convert.rotation,
      Convert.anchorToSvgNW,
      Convert.linestyle,
    ])
  }

}



