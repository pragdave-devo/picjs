import { SBase }from "./_base.js"
import { TNumber } from "../types.js"
import { XY } from "../position.js"

export interface PathPoint {
  x: number
  y: number
  tangentAngle: number
  radiusAngle: number  // For arcs: angle from center to point. For lines: perpendicular to tangent.
}

export abstract class LineLike extends SBase {
  // Set during the post-layout connector scan for connectors with no explicit endpoints.
  // Used by geometry.positionLine to avoid relying on stale lastShape state.
  predecessorShape?: SBase
  successorShape?:   SBase
  _layoutDirection?: XY

  // Subclasses must implement start/end accessors for geometry positioning
  abstract get start(): XY
  abstract set start(val: XY)
  abstract get end(): XY
  abstract set end(val: XY)

  handle_attr_draw_progress() {
    return new TNumber(this.params.draw_progress ?? 1)
  }

  isConnector() {
    return true
  }

  // For lines, return the endpoint closest to the target rather than
  // cropping a bounding box.  This ensures a chain of lines connects
  // end-to-end instead of hitting the middle of the bbox.
  cropLineTo(_: unknown, target: XY) {
    const dStart = Math.hypot(target.x - this.start.x, target.y - this.start.y)
    const dEnd   = Math.hypot(target.x - this.end.x,   target.y - this.end.y)
    return dStart < dEnd ? { ...this.start } : { ...this.end }
  }

  // Return point and tangent at a given fraction along the path (0.0 to 1.0)
  abstract pointAtPercent(t: number): PathPoint

  // Return direction multiplier for perpendicular offset based on side
  // -1 for above/outside, +1 for below/inside, 0 for center
  isInsideDirection(_side: string): number {
    return 0
  }
}
 

