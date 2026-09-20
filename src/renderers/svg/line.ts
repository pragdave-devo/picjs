import { LineLikeRenderer } from "./line_like_renderer.js"
import { MIN_STEP_OFFSET } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"
import { SvgNode, svgNode } from "../../svg-node.js"


export class Line extends LineLikeRenderer {

  cropped = true

  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    this.pendingMarkers = []
    this.strokeSlot = attrs._stroke_slot
    this.attrs = Convert.run(position, attrs, [
      Convert.rotation,
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
    delete this.attrs.length
    return this.attrs
  }

  protected buildPath() {
    switch (this.attrs.line_path) {
      case `smooth`:
        return this.smoothLine()
      case `stepped`:
        return this.steppedLine()
      default:
        return this.straightLine()
    }
  }

  straightLine() {
    const start = this.attrs.start
    const end = this.attrs.end

    const deltaX = end.x - start.x
    const deltaY = end.y - start.y

    const angle = Math.atan2(deltaY, deltaX)

    if (this.attrs.line_start) {
      this.pendingMarkers.push(this.markerPath(this.attrs.line_start, start, -1, angle))
    }

    if (this.attrs.line_end) {
      this.pendingMarkers.push(this.markerPath(this.attrs.line_end, end, +1, angle))
    }

    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }

  steppedLine() {
    const start = this.attrs.start
    const end = this.attrs.end

    let deltaX = Math.abs(start.x - end.x)
    let deltaY = Math.abs(start.y - end.y)

    if (deltaX < MIN_STEP_OFFSET || deltaY < MIN_STEP_OFFSET) {
      return this.straightLine()
    }

    let cmds: string[] = []
    let angle

    if (deltaX > deltaY) {
      let split = start.x + (end.x - start.x) / 2
      cmds = cmds.concat(`L ${split} ${start.y}`)
      cmds = cmds.concat(`L ${split} ${end.y}`)
      angle = 0
      if (start.x > end.x)
        angle += Math.PI
    }
    else {
      let split = start.y + (end.y - start.y) / 2
      cmds = cmds.concat(`L ${start.x} ${split}`)
      cmds = cmds.concat(`L ${end.x} ${split}`)
      angle = Math.PI / 2
      if (start.y > end.y)
        angle += Math.PI
    }

    if (this.attrs.line_start) {
      this.pendingMarkers.push(this.markerPath(this.attrs.line_start, start, -1, angle))
    }
    cmds.unshift(`M ${start.x} ${start.y}`)

    if (this.attrs.line_end) {
      this.pendingMarkers.push(this.markerPath(this.attrs.line_end, end, +1, angle))
    }
    cmds.push(`L ${end.x} ${end.y}`)

    return cmds.join(` `)
  }

  smoothLine() {
    const start = this.attrs.start
    const end = this.attrs.end

    let deltaX = Math.abs(start.x - end.x)
    let deltaY = Math.abs(start.y - end.y)

    if (deltaX < MIN_STEP_OFFSET || deltaY < MIN_STEP_OFFSET) {
      return this.straightLine()
    }

    if (this.attrs.line_start) {
      const angle = -this.angleToCenter(start, end, deltaX, deltaY)
      this.pendingMarkers.push(this.markerPath(this.attrs.line_start, start, 1, angle))
    }

    if (this.attrs.line_end) {
      const angle = -this.angleToCenter(end, start, deltaX, deltaY)
      this.pendingMarkers.push(this.markerPath(this.attrs.line_end, end, 1, angle))
    }

    let head = `M ${start.x} ${start.y}`
    let mid
    let tail = `, ${end.x} ${end.y}`

    if (deltaX > deltaY) {
      let split = start.x + (end.x - start.x) / 2
      mid = `C ${split} ${start.y}, ${split} ${end.y}`
    }
    else {
      let split = start.y + (end.y - start.y) / 2
      mid = `C ${start.x} ${split}, ${end.x} ${split}`
    }

    return head + mid + tail
  }

  // Marker methods: modify pos (to shorten the line) and return a closed path string

  angleToCenter(start: XY, end: XY, deltaX: number, deltaY: number) {
    if (deltaX > deltaY) { // horizontal
      if (start.x < end.x)
        return -Math.PI
      else
        return 0
    }
    if (start.y < end.y)
      return Math.PI / 2
    return -Math.PI / 2
  }


}
