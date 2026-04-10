import { SvgBase, LineDirection, arrowDimensions, toSvgAttrNames } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"
import { RenderParameters } from "../../types.js"
import { setAttr, svg } from "redom"


const two_cos_45 = 2.0 * Math.cos(Math.PI / 4.0)

export class Arc extends SvgBase {

  cropped = false
  private lineEl!: SVGElement
  private pendingMarkers!: string[]
  private hideMarkers!: boolean

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.buildGroup()
  }

  private buildGroup() {
    const strokeColor = this.attrs.stroke || 'currentColor'
    // Extract opacity for the group so it applies to both line and markers
    const groupAttrs: Shape.Args = {}
    if (this.attrs.opacity !== undefined) {
      groupAttrs.opacity = this.attrs.opacity
      delete this.attrs.opacity
    }
    this.lineEl = svg('path', this.attrs)
    this.el = svg('g', groupAttrs)
    this.el.appendChild(this.lineEl)
    this.appendMarkers(strokeColor)
  }

  private appendMarkers(strokeColor: string) {
    if (this.hideMarkers) {
      this.pendingMarkers = []
      return
    }
    for (const d of this.pendingMarkers) {
      this.el.appendChild(svg('path', { d, fill: strokeColor, stroke: 'none' }))
    }
    this.pendingMarkers = []
  }

  rerender(position: RenderParameters, attrs: Shape.Args) {
    this.pendingMarkers = []
    this.attrs = toSvgAttrNames(this.convertToSVG(position, attrs))
    const strokeColor = this.attrs.stroke || 'currentColor'

    // Extract opacity for the group
    if (this.attrs.opacity !== undefined) {
      setAttr(this.el, { opacity: this.attrs.opacity })
      delete this.attrs.opacity
    } else {
      this.el.removeAttribute('opacity')
    }

    setAttr(this.lineEl, this.attrs)
    for (const attr of [`pathLength`, `stroke-dasharray`, `stroke-dashoffset`]) {
      if (!(attr in this.attrs)) {
        this.lineEl.removeAttribute(attr)
      }
    }

    while (this.el.childNodes.length > 1) {
      this.el.removeChild(this.el.lastChild!)
    }
    this.appendMarkers(strokeColor)
    return this
  }

  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    this.pendingMarkers = []
    this.normalizeAttrs()
    this.attrs = Convert.run(position, attrs, [
      Convert.anchorToSvgNW,
      Convert.linestyle,
    ])
    this.attrs.d = this.pathForLine()
    this.attrs.fill = `none`
    // Hide markers when line is not fully drawn
    const dp = this.attrs.draw_progress
    const dpValue = typeof dp === 'object' && dp !== null ? (dp.value ?? dp.toNative?.()) : dp
    this.hideMarkers = dpValue !== undefined && dpValue < 1
    this.applyDrawProgress(this.attrs)
    delete this.attrs.start
    delete this.attrs.end
    delete this.attrs.line_path
    delete this.attrs.line_start
    delete this.attrs.line_end
    return this.attrs
  }

  requiredPosition() {
    return null
  }

  normalizeAttrs() {
  }

  pathForLine() {
    const start = this.attrs.start
    const end = this.attrs.end

    const deltaX = end.x - start.x
    const deltaY = end.y - start.y

    const angle = Math.atan2(deltaY, deltaX) / 0.0174533

    const rx = Math.hypot(end.x - start.x, end.y - start.y) / two_cos_45
    const ry = rx

    if (this.attrs.line_start) {
      this.pendingMarkers.push(this.markerPath(this.attrs.line_start, start, -1, angle))
    }

    if (this.attrs.line_end) {
      this.pendingMarkers.push(this.markerPath(this.attrs.line_end, end, +1, angle))
    }

    // turn can be plain string "cw" or AST node { type: "String", value: "cw" }
    const turnValue = typeof this.attrs.turn === `string` ? this.attrs.turn : this.attrs.turn?.value
    const turn = turnValue === `cw` ? 1 : 0

    return ` M ${start.x} ${start.y}` +
    ` A ${rx} ${ry} ${angle} 0 ${turn} ${end.x} ${end.y} `
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

  drawCircleMarker(pos: XY, dir: -1 | 1, angle: number) {
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

  circleMarkerPath(pos: XY, dir: -1 | 1, angle: number) {
    return this.drawCircleMarker(pos, dir, angle)
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
