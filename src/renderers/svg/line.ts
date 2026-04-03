import { LineDirection, SvgBase, arrowDimensions } from "./_base.js"
// import { attr_linestyle, attr_start_end } from "./attribute_setters.js"
import * as Convert from "./attribute_converters.js"
import { RenderParameters } from "../../types.js"
import * as Shape from "../../shapes.js"
import { XY } from "../../position.js"


export class Line extends SvgBase {

  cropped = true

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.build(`path`)
  }

  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    this.attrs = Convert.run(position, attrs, [
      Convert.rotation,
      // Convert.anchorToSvgNW,
      Convert.linestyle,
    ])
    this.attrs.d = this.pathForLine()
    this.attrs.fill = `none`
    this.applyDrawProgress(this.attrs)
    delete this.attrs.start
    delete this.attrs.end
    delete this.attrs.line_path
    delete this.attrs.line_start
    delete this.attrs.line_end
    return this.attrs
  }

  requiredPosition() {                    //
    return null                           //
  }                                       //

  // fixup_linestyle() {
  //   const lineThickness = this.attrs[`stroke-width`]
  //   let wanted

  //   switch (this.attrs.linestyle) {
  //     case `dotted`:
  //       const dotLen = Math.max(1, 0.75 * lineThickness)
  //       wanted = [ dotLen, 4 * dotLen ]
  //       break
  //     case `dashed`:
  //       const gapLen = Math.max(4, lineThickness)
  //       wanted = [ 2 * gapLen, gapLen ]
  //       break
  //     case `solid`:
  //     default:
  //       wanted = undefined
  //   }

  //   if (wanted) 
  //     this.attrs[`stroke-dasharray`] = wanted
  //   else
  //     delete this.attrs[`stroke-dasharray`]
    
  // }

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

    let pathPrefix = ``
    let pathSuffix = ``

    if (this.attrs.line_start) {
      pathPrefix = this.drawMarker(this.attrs.line_start, start, -1, angle)
    }

    if (this.attrs.line_end) {
      pathSuffix = this.drawMarker(this.attrs.line_end, end, +1, angle)
    }

    return `${pathPrefix} M ${start.x} ${-start.y} L ${end.x} ${-end.y} ${pathSuffix}`
  }

  steppedLine() {
    const start = this.attrs.start
    const end = this.attrs.end

    let deltaX = Math.abs(start.x - end.x)
    let deltaY = Math.abs(start.y - end.y)
    let angle

    if (deltaX < 5 || deltaY < 5) {
      return this.straightLine()
    }

    let cmds: string[] = []

    if (deltaX > deltaY) {
      let split = start.x + (end.x - start.x) / 2
      cmds = cmds.concat(`L ${split} ${-start.y}`)
      cmds = cmds.concat(`L ${split} ${-end.y}`)
      angle = 0
      if (start.x > end.x)
        angle += Math.PI
    }
    else {
      let split = start.y + (end.y - start.y) / 2
      cmds = cmds.concat(`L ${start.x} ${-split}`)
      cmds = cmds.concat(`L ${end.x} ${-split}`)
      angle = Math.PI / 2
      if (start.y > end.y)
        angle += Math.PI
    }

    if (this.attrs.line_start) {
      cmds.unshift(this.drawMarker(this.attrs.line_start, start, -1, angle))
    }
    cmds.unshift(`M ${start.x} ${-start.y}`)

    if (this.attrs.line_end) {
      const marker = this.drawMarker(this.attrs.line_end, end, +1, angle)
      cmds.push(`L ${end.x} ${-end.y}`)  // need to create the marker to get the updated end position
      cmds.push(marker)
    }
    else {
      cmds.push(`L ${end.x} ${-end.y}`)
    }

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

    let linePrefix = ``
    let lineSuffix = ``

    if (this.attrs.line_start) {
      const angle = -this.angleToCenter(start, end, deltaX, deltaY)
      linePrefix = this.drawMarker(this.attrs.line_start, start, 1, angle)
    }

    if (this.attrs.line_end) {
      const angle = -this.angleToCenter(end, start, deltaX, deltaY)
      lineSuffix = this.drawMarker(this.attrs.line_end, end, 1, angle)
    }


    let head = `M ${start.x} ${-start.y}`
    let mid
    let tail = `, ${end.x} ${-end.y}`

    if (deltaX > deltaY) {
      let split = start.x + (end.x - start.x) / 2
      mid = `C ${split} ${-start.y}, ${split} ${-end.y}`
    }
    else {
      let split = start.y + (end.y - start.y) / 2
      mid = `C ${start.x} ${-split}, ${end.x} ${-split}`
    }

    return linePrefix + head + mid + tail + lineSuffix
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

