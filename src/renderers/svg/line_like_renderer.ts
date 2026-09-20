import { LineDirection, SvgBase, arrowDimensions, addUsedSlot, toSvgAttrNames } from "./_base.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"
import { SvgNode, svgNode } from "../../svg-node.js"

// Shared scaffolding for the two line-like renderers.
//
// A Line and a Polyline draw different paths, but everything around the path is
// the same: the <g> wrapper, the end markers and their geometry, and the
// re-render cycle. That code was copy-pasted between the two, and drifted —
// polylines silently lost `rotation` because only Line's buildGroup handled the
// transform that Convert.rotation produces.
//
// Subclasses supply buildPath(); markerPath() shortens the endpoint it is given
// in place, so the path builder must call it before reading the coordinates.

export abstract class LineLikeRenderer extends SvgBase {

  protected pendingMarkers!: string[]
  protected hideMarkers!: boolean
  protected strokeSlot?: string

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.buildGroup()
  }

  /** The `d` attribute for this shape, queueing any end markers as it goes. */
  protected abstract buildPath(): string

  private buildGroup() {
    const id = this.node?.attrs["data-jp-id"]
    const strokeColor = this.attrs.stroke || 'currentColor'
    const groupAttrs: Record<string, string | number> = {}
    if (this.attrs.transform) {
      groupAttrs.transform = this.attrs.transform
      delete this.attrs.transform
    }
    if (this.attrs.opacity !== undefined) {
      groupAttrs.opacity = this.attrs.opacity
      delete this.attrs.opacity
    }
    const lineNode = svgNode('path', this.attrs as Record<string, string | number>)
    const markerNodes = this.buildMarkers(strokeColor)
    this.node = svgNode('g', groupAttrs, [lineNode, ...markerNodes])
    if (id !== undefined) this.node.attrs["data-jp-id"] = id
  }

  private buildMarkers(strokeColor: string): SvgNode[] {
    if (this.hideMarkers) { this.pendingMarkers = []; return [] }
    const nodes = this.pendingMarkers.map(d => {
      if (this.strokeSlot) {
        addUsedSlot('fill', this.strokeSlot)
        const cssSlot = this.strokeSlot.replace(':', '-')
        return svgNode('path', { d, stroke: 'none', class: `pj-fill-${cssSlot}` })
      }
      return svgNode('path', { d, fill: strokeColor, stroke: 'none' })
    })
    this.pendingMarkers = []
    return nodes
  }

  rerender(position: RenderParameters, attrs: Shape.Args) {
    this.pendingMarkers = []
    this.attrs = toSvgAttrNames(this.convertToSVG(position, attrs))
    this.buildGroup()
    return this
  }

  requiredPosition() {
    return null
  }

  markerPath(type: string, pos: XY, dir: LineDirection, angle: number) {
    switch (type) {
      case `<`:
      case `>`:
        return this.arrowMarkerPath(pos, dir, angle)

      case `o`:
        return this.circleMarkerPath(pos, dir, angle)

      case `|`:
        return this.barMarkerPath(pos, dir, angle)

      default:
        throw new Error(`Invalid line end "${type}"`)
    }
  }

  arrowMarkerPath(pos: XY, dir: LineDirection, angle: number) {
    const stroke_width = this.attrs[`stroke_width`]
    const { length: w, halfWidth: w_2 } = arrowDimensions(stroke_width)

    const basex = pos.x - dir * w * Math.cos(angle)
    const basey = pos.y - dir * w * Math.sin(angle)

    const base1x = basex + dir * w_2 * Math.sin(angle)
    const base1y = basey - dir * w_2 * Math.cos(angle)

    const base2x = basex - dir * w_2 * Math.sin(angle)
    const base2y = basey + dir * w_2 * Math.cos(angle)

    const pointx = pos.x - dir * 1.5 * stroke_width * Math.cos(angle)
    const pointy = pos.y - dir * 1.5 * stroke_width * Math.sin(angle)

    pos.x = basex
    pos.y = basey

    return `M ${base1x} ${base1y} L ${pointx} ${pointy} L ${base2x} ${base2y} Z`
  }

  circleMarkerPath(pos: XY, dir: LineDirection, angle: number) {
    const { length: w } = arrowDimensions(this.attrs[`stroke_width`])
    const radius = w / 2

    const basex = pos.x - dir * w * Math.cos(angle)
    const basey = pos.y - dir * w * Math.sin(angle)

    const ex = pos.x
    const ey = pos.y

    pos.x = basex
    pos.y = basey

    return `M ${basex} ${basey} A ${radius} ${radius} 0 1 0 ${ex} ${ey}` +
      `A ${radius} ${radius} 0 1 0 ${basex} ${basey}`
  }

  barMarkerPath(pos: XY, dir: LineDirection, angle: number) {
    const stroke_width = this.attrs[`stroke_width`]
    const { length: w, halfWidth: w_2 } = arrowDimensions(stroke_width)

    const basex = pos.x - dir * w * Math.cos(angle)
    const basey = pos.y - dir * w * Math.sin(angle)

    const base1x = basex + dir * w_2 * Math.sin(angle)
    const base1y = basey - dir * w_2 * Math.cos(angle)

    const base2x = basex - dir * w_2 * Math.sin(angle)
    const base2y = basey + dir * w_2 * Math.cos(angle)

    pos.x = basex
    pos.y = basey

    return `M ${base1x} ${base1y} L ${base2x} ${base2y}`
  }
}
