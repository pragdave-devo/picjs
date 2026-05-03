import { LineDirection, SvgBase, arrowDimensions, toSvgAttrNames, addUsedSlot } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"
import { SvgNode, svgNode } from "../../svg-node.js"


export class Polyline extends SvgBase {

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
    this.attrs = Convert.run(position, attrs, [
      Convert.linestyle,
    ])
    this.attrs.d = this.pathForPolyline()

    if (!this.attrs.closed) {
      this.attrs.fill = `none`
    }

    // Hide markers when line is not fully drawn
    const dp = this.attrs.draw_progress
    const dpValue = typeof dp === 'object' && dp !== null ? (dp.value ?? dp.toNative?.()) : dp
    this.hideMarkers = dpValue !== undefined && dpValue < 1
    this.applyDrawProgress(this.attrs)
    delete this.attrs.start
    delete this.attrs.waypoints
    delete this.attrs.closed
    delete this.attrs.line_path
    delete this.attrs.line_start
    delete this.attrs.line_end
    return this.attrs
  }

  requiredPosition() {
    return null
  }

  pathForPolyline() {
    const radius = this.attrs.rx || 0
    if (radius > 0) return this.roundedPolyline(radius)
    return this.straightPolyline()
  }

  straightPolyline() {
    const start = this.attrs.start
    const waypoints: XY[] = this.attrs.waypoints || []
    const closed = this.attrs.closed

    if (waypoints.length === 0) return `M ${start.x} ${start.y}`

    // Handle start marker
    if (this.attrs.line_start) {
      const angle = Math.atan2(waypoints[0].y - start.y, waypoints[0].x - start.x)
      this.pendingMarkers.push(this.markerPath(this.attrs.line_start, start, -1, angle))
    }

    // Handle end marker (only for open polylines)
    if (this.attrs.line_end && !closed) {
      const last = waypoints[waypoints.length - 1]
      const prev = waypoints.length > 1 ? waypoints[waypoints.length - 2] : start
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
      this.pendingMarkers.push(this.markerPath(this.attrs.line_end, last, +1, angle))
    }

    let d = `M ${start.x} ${start.y}`
    for (const wp of waypoints) {
      d += ` L ${wp.x} ${wp.y}`
    }
    if (closed) d += ` Z`

    return d
  }

  roundedPolyline(r: number) {
    const start = this.attrs.start
    const waypoints: XY[] = this.attrs.waypoints || []
    const closed = this.attrs.closed

    if (waypoints.length === 0) return `M ${start.x} ${start.y}`

    const pts = [start, ...waypoints]
    if (closed) pts.push(start)

    // Handle markers
    if (this.attrs.line_start && !closed) {
      const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x)
      this.pendingMarkers.push(this.markerPath(this.attrs.line_start, pts[0], -1, angle))
    }
    if (this.attrs.line_end && !closed) {
      const last = waypoints[waypoints.length - 1]
      const prev = waypoints.length > 1 ? waypoints[waypoints.length - 2] : start
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
      this.pendingMarkers.push(this.markerPath(this.attrs.line_end, last, +1, angle))
    }

    let d = ``

    if (closed) {
      // For the starting mid-point, compute effective radius for first corner
      const firstPrev = pts[pts.length - 2]
      const firstCurr = pts[0]
      const firstNext = pts[1]
      const firstLen1 = Math.hypot(firstPrev.x - firstCurr.x, firstPrev.y - firstCurr.y)
      const firstLen2 = Math.hypot(firstNext.x - firstCurr.x, firstNext.y - firstCurr.y)
      const firstEffectiveR = Math.min(r, firstLen1 / 2, firstLen2 / 2)
      const mid = this.cornerOffsetWithRadius(firstPrev, firstCurr, firstEffectiveR)
      d = `M ${mid.x} ${mid.y}`

      for (let i = 0; i < pts.length - 1; i++) {
        const prev = i === 0 ? pts[pts.length - 2] : pts[i - 1]
        const curr = pts[i]
        const next = pts[i + 1]

        const len1 = Math.hypot(prev.x - curr.x, prev.y - curr.y)
        const len2 = Math.hypot(next.x - curr.x, next.y - curr.y)
        const effectiveR = Math.min(r, len1 / 2, len2 / 2)

        const before = this.cornerOffsetWithRadius(prev, curr, effectiveR)
        const after = this.cornerOffsetWithRadius(next, curr, effectiveR)
        const sweep = this.arcSweep(prev, curr, next)

        if (i > 0) d += ` L ${before.x} ${before.y}`
        d += ` A ${effectiveR} ${effectiveR} 0 0 ${sweep} ${after.x} ${after.y}`
      }
      d += ` Z`
    } else {
      d = `M ${pts[0].x} ${pts[0].y}`

      for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1]
        const curr = pts[i]
        const next = pts[i + 1]

        // Compute effective radius: minimum of r and half of each adjacent segment
        const len1 = Math.hypot(prev.x - curr.x, prev.y - curr.y)
        const len2 = Math.hypot(next.x - curr.x, next.y - curr.y)
        const effectiveR = Math.min(r, len1 / 2, len2 / 2)

        const before = this.cornerOffsetWithRadius(prev, curr, effectiveR)
        const after = this.cornerOffsetWithRadius(next, curr, effectiveR)
        const sweep = this.arcSweep(prev, curr, next)

        d += ` L ${before.x} ${before.y}`
        d += ` A ${effectiveR} ${effectiveR} 0 0 ${sweep} ${after.x} ${after.y}`
      }

      // Final point
      const last = pts[pts.length - 1]
      d += ` L ${last.x} ${last.y}`
    }

    return d
  }

  // Point that is `radius` away from `vertex` toward `other` (no clamping)
  private cornerOffsetWithRadius(other: XY, vertex: XY, radius: number): XY {
    const dx = other.x - vertex.x
    const dy = other.y - vertex.y
    const len = Math.hypot(dx, dy)
    if (len < 0.01) return vertex
    return {
      x: vertex.x + (dx / len) * radius,
      y: vertex.y + (dy / len) * radius,
    }
  }

  // Point that is `radius` away from `vertex` toward `other`
  private cornerOffset(other: XY, vertex: XY, radius: number): XY {
    const dx = other.x - vertex.x
    const dy = other.y - vertex.y
    const len = Math.hypot(dx, dy)
    if (len < 0.01) return vertex
    const clampedR = Math.min(radius, len / 2)
    return {
      x: vertex.x + (dx / len) * clampedR,
      y: vertex.y + (dy / len) * clampedR,
    }
  }

  // Determine SVG arc sweep flag: 1 for clockwise turn, 0 for counterclockwise
  private arcSweep(prev: XY, curr: XY, next: XY): number {
    const cross = (curr.x - prev.x) * (next.y - curr.y) - (curr.y - prev.y) * (next.x - curr.x)
    return cross > 0 ? 1 : 0
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
