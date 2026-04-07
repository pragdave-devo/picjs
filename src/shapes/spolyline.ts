import { LineLike, PathPoint } from "./line_like.js"
import { TColor, TNumber, TPosition } from "../types.js"
import { Cardinals, CardinalFactorsFromCenter, XY } from "../position.js"

export class SPolyline extends LineLike {

  // Thunk versions for dynamic evaluation
  get _start()      { return this.hidden._start }
  get _waypoints()  { return this.hidden._waypoints }  // Array of AST nodes

  // Resolved coordinates (filled by geometry)
  get start(): XY        { return this.params.start }
  set start(val: XY)     { this.params.start = val }
  get waypoints(): XY[]  { return this.params.waypoints || [] }
  set waypoints(val: XY[]) { this.params.waypoints = val }

  // end is the last waypoint
  get end(): XY     { const wp = this.waypoints; return wp.length > 0 ? wp[wp.length - 1] : this.start }
  set end(_val: XY) { /* computed from waypoints */ }

  get closed(): boolean { return this.params.closed || this.hidden._closed || false }
  get thickness()       { return this.params.thickness }
  get stroke()          { return this.params.stroke }
  get line_path()       { return this.params.line_path }

  // All points including start
  get allPoints(): XY[] { return [this.start, ...this.waypoints] }

  get width() {
    const xs = this.allPoints.map(p => p.x)
    return Math.max(...xs) - Math.min(...xs)
  }

  get height() {
    const ys = this.allPoints.map(p => p.y)
    return Math.max(...ys) - Math.min(...ys)
  }

  get length(): number {
    let total = 0
    const pts = this.allPoints
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
    }
    if (this.closed && pts.length > 1) {
      total += Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y)
    }
    return total
  }

  handle_attr_thickness() { return new TNumber(this.thickness) }
  handle_attr_length()    { return new TNumber(this.length) }
  handle_attr_width()     { return new TNumber(this.width) }
  handle_attr_height()    { return new TNumber(this.height) }
  handle_attr_stroke()    { return new TColor(this.stroke) }
  handle_attr_start()     { return new TPosition(this.start) }
  handle_attr_end()       { return new TPosition(this.end) }
  handle_attr_closed()    { return new TNumber(this.closed ? 1 : 0) }

  getCardinalOffsetsFromAnchor(cardinal: Cardinals) {
    const [fx, fy] = CardinalFactorsFromCenter[cardinal]
    return [fx * this.width, fy * this.height]
  }

  cropStrategy() {
    return `centerToCenter`
  }

  // Return point and tangent at a given fraction along the full path (0.0 to 1.0)
  pointAtPercent(t: number): PathPoint {
    const pts = this.allPoints
    if (pts.length < 2) return { x: pts[0].x, y: pts[0].y, tangentAngle: 0, radiusAngle: 0 }

    // Build array of segments (include closing segment if closed)
    const segments: { from: XY, to: XY, len: number }[] = []
    for (let i = 1; i < pts.length; i++) {
      segments.push({ from: pts[i - 1], to: pts[i], len: Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y) })
    }
    if (this.closed && pts.length > 1) {
      const last = pts[pts.length - 1], first = pts[0]
      segments.push({ from: last, to: first, len: Math.hypot(first.x - last.x, first.y - last.y) })
    }

    const totalLen = segments.reduce((s, seg) => s + seg.len, 0)
    const targetLen = t * totalLen

    // Find which segment contains the target
    let accumulated = 0
    for (const seg of segments) {
      if (accumulated + seg.len >= targetLen || seg === segments[segments.length - 1]) {
        const segT = seg.len > 0 ? (targetLen - accumulated) / seg.len : 0
        const x = seg.from.x + segT * (seg.to.x - seg.from.x)
        const y = seg.from.y + segT * (seg.to.y - seg.from.y)
        const tangentAngle = Math.atan2(seg.to.y - seg.from.y, seg.to.x - seg.from.x)
        const radiusAngle = tangentAngle - Math.PI / 2
        return { x, y, tangentAngle, radiusAngle }
      }
      accumulated += seg.len
    }

    // Fallback: return end point
    const last = pts[pts.length - 1]
    return { x: last.x, y: last.y, tangentAngle: 0, radiusAngle: 0 }
  }

  isInsideDirection(side: string): number {
    if (side === `above` || side === `outside`) return -1
    if (side === `below` || side === `inside`) return 1
    return 0
  }
}
