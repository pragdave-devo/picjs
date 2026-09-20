import { LineLikeRenderer } from "./line_like_renderer.js"
import { MIN_STEP_OFFSET } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"
import { SvgNode, svgNode } from "../../svg-node.js"


export class Polyline extends LineLikeRenderer {


  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    this.pendingMarkers = []
    this.strokeSlot = attrs._stroke_slot
    this.attrs = Convert.run(position, attrs, [
      Convert.rotation,
      Convert.linestyle,
    ])
    this.attrs.d = this.buildPath()

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

  protected buildPath() {
    const radius = this.attrs.rx || 0
    if (radius > 0) return this.roundedPolyline(radius)

    switch (this.attrs.line_path) {
      case `smooth`:  return this.smoothPolyline()
      case `stepped`: return this.steppedPolyline()
      default:        return this.straightPolyline()
    }
  }

  // Markers follow the first and last *leg* of the rendered path, which is not
  // the same as the first and last segment once a diagonal has been stepped.
  // markerPath shortens the endpoint in place, so pts must hold the real
  // endpoint objects.
  private polylineMarkers(pts: XY[], closed: boolean) {
    if (pts.length < 2) return

    if (this.attrs.line_start) {
      const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x)
      this.pendingMarkers.push(this.markerPath(this.attrs.line_start, pts[0], -1, angle))
    }

    if (this.attrs.line_end && !closed) {
      const last = pts[pts.length - 1]
      const prev = pts[pts.length - 2]
      const angle = Math.atan2(last.y - prev.y, last.x - prev.x)
      this.pendingMarkers.push(this.markerPath(this.attrs.line_end, last, +1, angle))
    }
  }

  // Replace each diagonal segment with axis-aligned legs — the same dog-leg a
  // two-point stepped line draws. Segments already on one axis pass through
  // untouched.
  //
  // A dog-leg enters and leaves on the axis it splits, so two consecutive
  // segments splitting on the same axis double back over the waypoint between
  // them, leaving a visible spur. Each segment therefore splits on the axis the
  // previous one did not, which yields a staircase.
  private stepPoints(pts: XY[]): XY[] {
    const out: XY[] = [pts[0]]
    let exitAxis: `x` | `y` | null = null

    for (let i = 1; i < pts.length; i++) {
      const from = pts[i - 1]
      const to = pts[i]
      const dx = Math.abs(to.x - from.x)
      const dy = Math.abs(to.y - from.y)

      if (dx >= MIN_STEP_OFFSET && dy >= MIN_STEP_OFFSET) {
        const axis: `x` | `y` =
          exitAxis === `y` ? `x` :
          exitAxis === `x` ? `y` :
          dx > dy ? `x` : `y`

        if (axis === `x`) {
          const split = from.x + (to.x - from.x) / 2
          out.push({ x: split, y: from.y }, { x: split, y: to.y })
        } else {
          const split = from.y + (to.y - from.y) / 2
          out.push({ x: from.x, y: split }, { x: to.x, y: split })
        }
        exitAxis = axis
      }
      // An already-aligned segment leaves along whichever axis it runs on.
      else if (dx >= MIN_STEP_OFFSET) exitAxis = `x`
      else if (dy >= MIN_STEP_OFFSET) exitAxis = `y`

      out.push(to)
    }

    return out
  }

  steppedPolyline() {
    const start = this.attrs.start
    const waypoints: XY[] = this.attrs.waypoints || []
    const closed = this.attrs.closed

    if (waypoints.length === 0) return `M ${start.x} ${start.y}`

    const corners = [start, ...waypoints]
    if (closed) corners.push(start)

    const pts = this.stepPoints(corners)
    this.polylineMarkers(pts, closed)

    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++)
      d += ` L ${pts[i].x} ${pts[i].y}`
    if (closed) d += ` Z`

    return d
  }

  // A Catmull-Rom spline through the waypoints, expressed as cubic beziers so
  // the curve passes through every point (unlike `radius`, which cuts corners).
  smoothPolyline() {
    const start = this.attrs.start
    const waypoints: XY[] = this.attrs.waypoints || []
    const closed = this.attrs.closed

    if (waypoints.length === 0) return `M ${start.x} ${start.y}`

    const pts = [start, ...waypoints]
    this.polylineMarkers(pts, closed)

    if (pts.length < 3) {
      const d = `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`
      return closed ? d + ` Z` : d
    }

    // Neighbours of the endpoints: wrap around when closed, otherwise repeat
    // the endpoint so the curve starts and ends without an overshoot.
    const at = (i: number): XY => {
      const n = pts.length
      if (closed) return pts[(i % n + n) % n]
      return pts[Math.max(0, Math.min(n - 1, i))]
    }

    const last = closed ? pts.length : pts.length - 1
    let d = `M ${pts[0].x} ${pts[0].y}`

    for (let i = 0; i < last; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
      d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`
    }

    if (closed) d += ` Z`

    return d
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

}
