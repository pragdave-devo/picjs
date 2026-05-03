import { SvgBase, LineDirection, arrowDimensions, toSvgAttrNames, addUsedSlot } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"
import { RenderParameters } from "../../types.js"
import { SvgNode, svgNode } from "../../svg-node.js"


const two_cos_45 = 2.0 * Math.cos(Math.PI / 4.0)

export class Arc extends SvgBase {

  cropped = false
  private pendingMarkers!: string[]
  private hideMarkers!: boolean
  private strokeSlot?: string

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.buildGroup()
  }

  private buildGroup() {
    const id = this.node?.attrs["data-jp-id"]
    const strokeColor = this.attrs.stroke || 'currentColor'
    const groupAttrs: Record<string, string | number> = {}
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

  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    this.pendingMarkers = []
    this.strokeSlot = attrs._stroke_slot
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

  private arcGeometry(start: XY, end: XY) {
    const chordX = end.x - start.x
    const chordY = end.y - start.y
    const chord = Math.hypot(chordX, chordY)
    if (chord < 1e-6) return null

    const turnValue = typeof this.attrs.turn === `string` ? this.attrs.turn : this.attrs.turn?.value
    const isCW = turnValue === `cw`

    const r = chord / two_cos_45
    const ux = chordX / chord
    const uy = chordY / chord
    const px = -uy
    const py = ux
    const halfChord = chord / 2
    const d = Math.sqrt(r * r - halfChord * halfChord)
    const sign = isCW ? 1 : -1
    const cx = (start.x + end.x) / 2 + sign * px * d
    const cy = (start.y + end.y) / 2 + sign * py * d

    let startAngle = Math.atan2(start.y - cy, start.x - cx)
    let endAngle   = Math.atan2(end.y - cy, end.x - cx)
    if (isCW) {
      while (endAngle < startAngle) endAngle += 2 * Math.PI
    } else {
      while (endAngle > startAngle) endAngle -= 2 * Math.PI
    }

    return { cx, cy, r, startAngle, endAngle, isCW }
  }

  pathForLine() {
    const start = this.attrs.start
    const end = this.attrs.end

    const chordX = end.x - start.x
    const chordY = end.y - start.y
    const chordAngleDeg = Math.atan2(chordY, chordX) / 0.0174533

    const geo = this.arcGeometry(start, end)
    if (!geo) {
      return ` M ${start.x} ${start.y} L ${end.x} ${end.y}`
    }

    const { cx, cy, r, startAngle, endAngle, isCW } = geo
    const rx = r
    const ry = r
    const turn = isCW ? 1 : 0
    const tangentOffset = isCW ? Math.PI / 2 : -Math.PI / 2

    const startTangent = startAngle + tangentOffset
    const endTangent   = endAngle + tangentOffset

    // Markers mutate pos to the arrow base — use that as the arc endpoint
    // so the stroke meets the arrow exactly.
    const arcStart = { ...start }
    const arcEnd   = { ...end }

    if (this.attrs.line_start) {
      const { length: w } = arrowDimensions(this.attrs[`stroke_width`])
      const baseAngle = startAngle + (isCW ? 1 : -1) * (w / r)
      const baseTangent = baseAngle + tangentOffset
      this.pendingMarkers.push(this.markerPath(this.attrs.line_start, arcStart, -1, baseTangent))
    }

    if (this.attrs.line_end) {
      const { length: w } = arrowDimensions(this.attrs[`stroke_width`])
      const baseAngle = endAngle - (isCW ? 1 : -1) * (w / r)
      const baseTangent = baseAngle + tangentOffset
      this.pendingMarkers.push(this.markerPath(this.attrs.line_end, arcEnd, +1, baseTangent))
    }

    return ` M ${arcStart.x} ${arcStart.y}` +
    ` A ${rx} ${ry} ${chordAngleDeg} 0 ${turn} ${arcEnd.x} ${arcEnd.y} `
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
