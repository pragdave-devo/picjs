import { SvgNode, svgNode } from "../../svg-node.js"
import * as Shape from "../../shapes.js"
import { RenderParameters     } from "../../types.js"

export type LineDirection = -1 | 1

export class SvgBase {

  position: RenderParameters
  attrs: Shape.Args
  node!: SvgNode

  constructor(position: RenderParameters, attrs: Shape.Args) {
    this.position = position
    this.attrs = toSvgAttrNames(this.convertToSVG(position, attrs))
  }


  rerender(position: RenderParameters, attrs: Shape.Args) {
    const id = this.node?.attrs["data-jp-id"]
    this.position = position
    this.attrs = toSvgAttrNames(this.convertToSVG(position, attrs))
    this.node = svgNode(this.node.tag, this.attrs as Record<string, string | number>)
    if (id !== undefined) this.node.attrs["data-jp-id"] = id
    return this
  }

  build(tag: string) {
    this.node = svgNode(tag, this.attrs as Record<string, string | number>)
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
      if (drawProgress <= 0) {
        // Zero-length dash + full gap: nothing visible, no browser rounding artifacts
        attrs[`stroke_dasharray`] = `0 1`
        attrs[`stroke_dashoffset`] = 0
      } else {
        attrs[`stroke_dasharray`] = 1
        attrs[`stroke_dashoffset`] = 1 - drawProgress
      }
    }
  }
}

// Convert internal underscore attribute names to SVG hyphenated names
export function toSvgAttrNames(attrs: Shape.Args): Shape.Args {
  const result: Shape.Args = {}
  for (const [k, v] of Object.entries(attrs)) {
    result[k.replace(/_/g, '-')] = v
  }
  return result
}

export function arrowDimensions(strokeWidth: number) {
  const ratio = strokeWidth <= 0.05 ? 2
              : strokeWidth >= 0.25 ? 0.7
              : 2 - 6.5 * (strokeWidth - 0.05)
  const width = ratio * strokeWidth * 1.5
  const length = 1.8 * width
  return { length, halfWidth: width / 2 }
}
