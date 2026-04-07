import { SBase }from "./_base.js"
import { TNumber } from "../types.js"
import { XY } from "../position.js"

export interface PathPoint {
  x: number
  y: number
  tangentAngle: number
  radiusAngle: number  // For arcs: angle from center to point. For lines: perpendicular to tangent.
}

export class LineLike extends SBase {
  // Set during the post-layout connector scan for connectors with no explicit endpoints.
  // Used by geometry.positionLine to avoid relying on stale lastShape state.
  predecessorShape?: SBase
  successorShape?:   SBase
  _layoutDirection?: XY

  // Implemented by subclasses to enable start/end access in geometry
  get start(): XY { throw new Error(`start not implemented`) }
  set start(_val: XY) { throw new Error(`start not implemented`) }
  get end(): XY { throw new Error(`end not implemented`) }
  set end(_val: XY) { throw new Error(`end not implemented`) }

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
  // Must be overridden by subclasses
  pointAtPercent(_t: number): PathPoint {
    throw new Error(`pointAtPercent not implemented for ${this.constructor.name}`)
  }

  // Return direction multiplier for perpendicular offset based on side
  // -1 for above/outside, +1 for below/inside, 0 for center
  isInsideDirection(_side: string): number {
    return 0
  }
}
 

