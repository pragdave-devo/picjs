import { LineDirection, SvgBase, arrowDimensions } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"


export class Polyline extends SvgBase {

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.build(`path`)
  }

  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    this.attrs = Convert.run(position, attrs, [
      Convert.linestyle,
    ])
    this.attrs.d = this.pathForPolyline()

    if (!this.attrs.closed) {
      this.attrs.fill = `none`
    }

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

    if (waypoints.length === 0) return `M ${start.x} ${-start.y}`

    let pathPrefix = ``
    let pathSuffix = ``

    // Handle start marker
    if (this.attrs.line_start) {
      const angle = Math.atan2(waypoints[0].y - start.y, waypoints[0].x - start.x)
      pathPrefix = this.drawMarker(this.attrs.line_start, start, -1, angle)
    }

    // Handle end marker (only for open polylines)
    if (this.attrs.line_end && !closed) {
      const last = waypoints[waypoints.length - 1]
      const prev = waypoints.length > 1 ? waypoints[waypoints.length - 2] : start
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
      pathSuffix = this.drawMarker(this.attrs.line_end, last, +1, angle)
    }

    let d = `M ${start.x} ${-start.y}`
    for (const wp of waypoints) {
      d += ` L ${wp.x} ${-wp.y}`
    }
    if (closed) d += ` Z`

    return pathPrefix + d + pathSuffix
  }

  roundedPolyline(r: number) {
    const start = this.attrs.start
    const waypoints: XY[] = this.attrs.waypoints || []
    const closed = this.attrs.closed

    if (waypoints.length === 0) return `M ${start.x} ${-start.y}`

    const pts = [start, ...waypoints]
    if (closed) pts.push(start)  // close the loop for iteration

    let pathPrefix = ``
    let pathSuffix = ``

    // Handle markers
    if (this.attrs.line_start && !closed) {
      const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x)
      pathPrefix = this.drawMarker(this.attrs.line_start, pts[0], -1, angle)
    }
    if (this.attrs.line_end && !closed) {
      const last = waypoints[waypoints.length - 1]
      const prev = waypoints.length > 1 ? waypoints[waypoints.length - 2] : start
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
      pathSuffix = this.drawMarker(this.attrs.line_end, last, +1, angle)
    }

    let d = ``

    if (closed) {
      const mid = this.cornerOffset(pts[pts.length - 2], pts[0], r)
      d = `M ${mid.x} ${-mid.y}`

      for (let i = 0; i < pts.length - 1; i++) {
        const prev = i === 0 ? pts[pts.length - 2] : pts[i - 1]
        const curr = pts[i]
        const next = pts[i + 1]
        const before = this.cornerOffset(prev, curr, r)
        const after = this.cornerOffset(next, curr, r)
        const sweep = this.arcSweep(prev, curr, next)

        if (i > 0) d += ` L ${before.x} ${-before.y}`
        d += ` A ${r} ${r} 0 0 ${sweep} ${after.x} ${-after.y}`
      }
      d += ` Z`
    } else {
      d = `M ${pts[0].x} ${-pts[0].y}`

      for (let i = 1; i < pts.length - 1; i++) {
        const prev = pts[i - 1]
        const curr = pts[i]
        const next = pts[i + 1]

        const before = this.cornerOffset(prev, curr, r)
        const after = this.cornerOffset(next, curr, r)
        const sweep = this.arcSweep(prev, curr, next)

        d += ` L ${before.x} ${-before.y}`
        d += ` A ${r} ${r} 0 0 ${sweep} ${after.x} ${-after.y}`
      }

      // Final point
      const last = pts[pts.length - 1]
      d += ` L ${last.x} ${-last.y}`
    }

    return pathPrefix + d + pathSuffix
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

  drawMarker(type: string, pos: XY, dir: LineDirection, angle: number) {
    switch (type) {
      case `<`:
      case `>`:
        return this.drawArrowMarker(pos, dir, angle)
      case `o`:
        return this.drawCircleMarker(pos, dir, angle)
      case `|`:
        return this.drawBarMarker(pos, dir, angle)
      default:
        throw new Error(`Invalid line end "${type}"`)
    }
  }

  drawArrowMarker(pos: XY, dir: LineDirection, angle: number) {
    const stroke_width = this.attrs[`stroke-width`]
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

    return `M ${basex} ${-basey} ${base1x} ${-base1y} L ${pointx} ${-pointy} L ${base2x} ${-base2y} L ${basex} ${-basey}`
  }

  drawCircleMarker(pos: XY, dir: LineDirection, angle: number) {
    const { length: w } = arrowDimensions(this.attrs[`stroke-width`])
    const radius = w / 2
    const basex = pos.x - dir * w * Math.cos(angle)
    const basey = pos.y - dir * w * Math.sin(angle)
    const ex = pos.x
    const ey = pos.y
    pos.x = basex
    pos.y = basey
    return `M ${basex} ${-basey} A ${radius} ${radius} 0 1 0 ${ex} ${-ey}` +
      `A ${radius} ${radius} 0 1 0 ${basex} ${-basey}`
  }

  drawBarMarker(pos: XY, dir: LineDirection, angle: number) {
    const stroke_width = this.attrs[`stroke-width`]
    const { length: w, halfWidth: w_2 } = arrowDimensions(stroke_width)
    const basex = pos.x - dir * w * Math.cos(angle)
    const basey = pos.y - dir * w * Math.sin(angle)
    const base1x = basex + dir * w_2 * Math.sin(angle)
    const base1y = basey - dir * w_2 * Math.cos(angle)
    const base2x = basex - dir * w_2 * Math.sin(angle)
    const base2y = basey + dir * w_2 * Math.cos(angle)
    pos.x = basex
    pos.y = basey
    return `M ${base1x} ${-base1y} L ${base2x} ${-base2y} M ${basex} ${-basey}`
  }
}
