import { LineLike } from "./line_like.js"
import { TColor, TNumber, TPosition } from "../types.js"
import { Cardinals, CardinalFactorsFromCenter, UnitVector, XY } from "../position.js"
  
export class SLine extends LineLike {


  // we aren't really anchored, but we can pretend 
  //
  getCardinalOffsetsFromAnchor(cardinal: Cardinals) {
    const [ fx, fy ] = CardinalFactorsFromCenter[cardinal]
    return [ fx * this.width, fy * this.height ]
  }


  handle_attr_thickness() { return new TNumber(this.thickness) }
  handle_attr_length()    { return new TNumber(this.length)    }
  handle_attr_width()     { return new TNumber(this.width)     }
  handle_attr_height()    { return new TNumber(this.height)    }
  handle_attr_stroke()    { return new TColor(this.stroke)     }
  handle_attr_start()     { return new TPosition(this.start)   }
  handle_attr_end()       { return new TPosition(this.end)     }

  // these two are the thunk versions, for dynamic evaluation
  get _start()            { return this.hidden._start          }
  get _end()              { return this.hidden._end            }

  // and these are filled in with actual coordinates by the geometry
  get start()             { return this.params.start           }
  set start(val)          { this.params.start = val            }
  get end()               { return this.params.end             }
  set end(val)            { this.params.end = val              }

  get thickness()         { return this.params.thickness       }
  get stroke()            { return this.params.stroke          }
  get width()             { return Math.abs(this.start.x - this.end.x) }
  get height()            { return Math.abs(this.start.y - this.end.y) }
  get default_length()    { return this.params.length ?? 1              }
  get line_path()         { return this.params.line_path               }
  get length()            {
    return Math.hypot(
      this.start.x - this.end.x, 
      this.start.y - this.end.y
    ) 
  }


  getEndAndNewDirection(startAsXY: XY, direction: UnitVector) {
    const endAsXY = { 
      x: startAsXY.x + this.default_length * direction.x,
      y: startAsXY.y + this.default_length * direction.y,
    }

    // direction isn't changed
    return [ endAsXY, direction ]
  }

  cropStrategy() {
    switch (this.line_path) {
      case `smooth`:
      case `stepped`:
        return `cardinalToCardinal`

      default:
        return `centerToCenter`
    }
  }

  // Return point and tangent angle at a given fraction along the line (0.0 to 1.0)
  pointAtPercent(t: number): { x: number, y: number, tangentAngle: number, radiusAngle: number } {
    const start = this.start
    const end = this.end

    // Linear interpolation
    const x = start.x + t * (end.x - start.x)
    const y = start.y + t * (end.y - start.y)

    // Tangent angle is the line's direction
    const tangentAngle = Math.atan2(end.y - start.y, end.x - start.x)

    // For lines, use perpendicular to tangent (pointing "up" relative to travel direction)
    // This is tangent - 90° which points to the left of travel direction
    const radiusAngle = tangentAngle - Math.PI / 2

    return { x, y, tangentAngle, radiusAngle }
  }

  // For lines, "above" means to the left of travel direction (negative perpendicular offset)
  // "below" means to the right of travel direction (positive perpendicular offset)
  isInsideDirection(side: string): number {
    // Lines don't have inside/outside, but we treat them the same as above/below
    if (side === `above` || side === `outside`) return -1
    if (side === `below` || side === `inside`) return 1
    return 0  // center
  }
}


