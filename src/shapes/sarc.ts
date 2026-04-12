import { LineLike } from "./line_like.js"
import { TColor, TNumber } from "../types.js"
import { Cardinals, CardinalFactorsFromCenter, UnitVector, XY } from "../position.js"

const DefaultLength = 0.625

export class SArc extends LineLike {

  getCardinalOffsetsFromAnchor(cardinal: Cardinals) {
    const [ fx, fy ] = CardinalFactorsFromCenter[cardinal]
    return [ fx * this.width, fy * this.height ]
  }


  handle_attr_thickness() { return new TNumber(this.thickness) }
  handle_attr_length()    { return new TNumber(this.length) }
  handle_attr_width()     { return new TNumber(this.width) }
  handle_attr_height()    { return new TNumber(this.height) }
  handle_attr_stroke()    { return new TColor(this.stroke) }

  // these two are the thunk versions, for dynamic evaluation
  get _start()          { return this.hidden._start }
  get _end()            { return this.hidden._end }

  // and these are filled in with actual coordinates by the geometry
  get start()          { return this.params.start }
  set start(val)       { this.params.start = val }
  get end()            { return this.params.end }
  set end(val)         { this.params.end = val }

  get thickness()      { return this.params.thickness }

  // turn can be a plain string (from defaults) or AST node { type: "String", value: "cw" }
  get turn(): string | undefined {
    const t = this.params.turn
    if (typeof t === `string`) return t
    if (t && typeof t === `object` && `value` in t) return t.value
    return undefined
  }
  get stroke()         { return this.params.stroke }
  get width()          { return Math.abs(this.start.x - this.end.x) }
  get height()         { return Math.abs(this.start.y - this.end.y) }
  get default_length() { return DefaultLength }
  get length()         { 
    return Math.hypot(
      this.start.x - this.end.x, 
      this.start.y - this.end.y
    ) 
  }


  getEndAndNewDirection(startAsXY: XY, direction: UnitVector) {
    let { x,  y } = startAsXY
    // dx = cos α, dy = sin α, where α is the clockwise angle from the x axis 
    let { x: dx,  y: dy } = direction 
    let endX, endY
    const len = this.default_length

    // rotate the direction vector
    if (this.turn === `ccw`) {
      endX =   len * dx + len * dy
      endY =   len * dy - len * dx
      dx =  direction.y
      dy = -direction.x
    }
    else {
      endX = len * dx - len * dy
      endY = len * dy + len * dx
      dx = -direction.y
      dy =  direction.x
    }
    
    return [ { x: x + endX, y: y + endY }, { x: dx, y: dy } ]
  }

  cropLineRelative(center: XY, _target: unknown) {
    // regardless, we always line to the end of the line.
    return { x: this.end.x - center.x, y: this.end.y - center.y }
  }
  
  cropStrategy() {
    return `centerToCenter`
  }

  // Return point and tangent angle at a given fraction along the arc (0.0 to 1.0)
  pointAtPercent(t: number) {
    const start = this.start
    const end = this.end

    // Chord midpoint
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2

    // Chord vector and length
    const chordX = end.x - start.x
    const chordY = end.y - start.y
    const chord = Math.hypot(chordX, chordY)

    if (chord < 0.01) {
      // Degenerate arc — just return the point
      return { x: start.x, y: start.y, tangentAngle: 0 }
    }

    // Radius (same formula as renderer: chord / (2 * cos(45°)))
    const two_cos_45 = 2.0 * Math.cos(Math.PI / 4.0)
    const r = chord / two_cos_45

    // Unit chord vector and perpendicular
    const ux = chordX / chord
    const uy = chordY / chord
    // Perpendicular: rotate 90° counterclockwise
    const px = -uy
    const py = ux

    // Distance from midpoint to center: sqrt(r² - (chord/2)²)
    const halfChord = chord / 2
    const d = Math.sqrt(r * r - halfChord * halfChord)

    // Center position depends on turn direction
    const sign = this.turn === `cw` ? 1 : -1
    const cx = midX + sign * px * d
    const cy = midY + sign * py * d

    // Angles from center to start and end
    const startAngle = Math.atan2(start.y - cy, start.x - cx)
    let endAngle = Math.atan2(end.y - cy, end.x - cx)

    // Adjust end angle for correct arc direction
    if (this.turn === `cw`) {
      while (endAngle < startAngle) endAngle += 2 * Math.PI
    } else {
      while (endAngle > startAngle) endAngle -= 2 * Math.PI
    }

    // Interpolate angle
    const angle = startAngle + t * (endAngle - startAngle)

    // Point on arc
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)

    // Tangent is perpendicular to radius, in direction of travel
    let tangentAngle
    if (this.turn === `cw`) {
      tangentAngle = angle + Math.PI / 2
    } else {
      tangentAngle = angle - Math.PI / 2
    }

    // Also return the radius angle (from center to point) for offset calculations
    return { x, y, tangentAngle, radiusAngle: angle }
  }

  // For arcs, "inside" means toward arc center, "outside" means away from center
  isInsideDirection(side: string): number {
    // Return +1 for inside (toward center), -1 for outside (away from center)
    if (side === `inside`) return 1
    if (side === `outside`) return -1
    if (side === `above`) return -1  // treat above as outside for consistency
    if (side === `below`) return 1   // treat below as inside
    return 0  // center
  }
}




