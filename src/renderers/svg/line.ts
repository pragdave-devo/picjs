import { LineDirection, SvgBase, arrowDimensions, toSvgAttrNames, addUsedSlot } from "./_base.js"
import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"
import { SvgNode, svgNode } from "../../svg-node.js"


export class Line extends SvgBase {

  cropped = true
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
    if (this.attrs.transform) {
      groupAttrs.transform = this.attrs.transform
      delete this.attrs.transform
    }
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
      Convert.rotation,
      Convert.linestyle,
    ])
    this.attrs.d = this.pathForLine()
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

  requiredPosition() {
    return null
  }

  pathForLine() {
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

    if (deltaX < 5 || deltaY < 5) {
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

    if (deltaX < 5 || deltaY < 5) {
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
