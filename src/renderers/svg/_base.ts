import { RedomComponent, setAttr, svg } from "redom"
import * as Shape from "../../shapes.js"
import { RenderParameters     } from "../../types.js"

export type LineDirection = -1 | 1

export class SvgBase implements RedomComponent {

  position: RenderParameters
  attrs: Shape.Args
  el!: SVGElement

  constructor(position: RenderParameters, attrs: Shape.Args) {
    this.position = position
    this.attrs = this.convertToSVG(position, attrs)
  }


  rerender(position: RenderParameters, attrs: Shape.Args) {
    this.attrs = this.convertToSVG(position, attrs)
    setAttr(this.el, this.attrs)
    // redom's setAttr only adds/updates attributes, never removes.
    // Clean up draw-animation attributes when no longer active.
    for (const attr of [`pathLength`, `stroke-dasharray`, `stroke-dashoffset`]) {
      if (!(attr in this.attrs)) {
        this.el.removeAttribute(attr)
      }
    }
    return this
  }

  build(tag: string) {
    this.el = svg(tag, this.attrs)
  }

  convertToSVG(_position: RenderParameters, _attrs: Shape.Args): Shape.Args {
    throw new Error(`renderer class is missing "convertToSVG"`)
  }

  // Apply draw animation: uses pathLength=1 so stroke-dashoffset ranges over [0,1].
  // Call this AFTER linestyle conversion and path computation.
  protected applyDrawProgress(attrs: Shape.Args) {
    const drawProgress = attrs.draw_progress
    delete attrs.draw_progress

    if (drawProgress !== undefined && drawProgress < 1) {
      attrs.pathLength = 1
      attrs[`stroke-dasharray`] = 1
      attrs[`stroke-dashoffset`] = 1 - drawProgress
    }
  }
}

export function arrowDimensions(strokeWidth: number) {
  const ratio = strokeWidth <= 0.05 ? 2
              : strokeWidth >= 0.25 ? 0.7
              : 2 - 6.5 * (strokeWidth - 0.05)
  const width = ratio * strokeWidth
  const length = 1.8 * width
  return { length, halfWidth: width / 2 }
}
