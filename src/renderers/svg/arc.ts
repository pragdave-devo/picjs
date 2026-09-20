import { LineLikeRenderer } from "./line_like_renderer.js"
import { arrowDimensions } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"
import { RenderParameters } from "../../types.js"
import { SvgNode, svgNode } from "../../svg-node.js"


const two_cos_45 = 2.0 * Math.cos(Math.PI / 4.0)

export class Arc extends LineLikeRenderer {

  cropped = false

  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    this.pendingMarkers = []
    this.strokeSlot = attrs._stroke_slot
    this.normalizeAttrs()
    this.attrs = Convert.run(position, attrs, [
      Convert.rotation,
      Convert.anchorToSvgNW,
      Convert.linestyle,
    ])
    this.attrs.d = this.buildPath()
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
    // arc-only, consumed by the path builder above; neither means anything in SVG
    delete this.attrs.turn
    delete this.attrs.rotation
    return this.attrs
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

  protected buildPath() {
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
}
