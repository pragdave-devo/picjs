import { SBase } from "./_base.js"
import { TNumber } from "../types.js"
import { Cardinals, XY } from "../position.js"

export class SEllipse extends SBase {

  missingDimensions() {
    return false
  }

  handle_attr_rx()     { return new TNumber(this.rx) }
  handle_attr_ry()     { return new TNumber(this.ry) }
  handle_attr_r()      { return new TNumber(this.rx) }
  handle_attr_rad()    { return new TNumber(this.rx) }
  handle_attr_radius() { return new TNumber(this.rx) }
  handle_attr_wid()    { return new TNumber(this.width) }
  handle_attr_width()  { return new TNumber(this.width) }
  handle_attr_ht()     { return new TNumber(this.height) }
  handle_attr_height() { return new TNumber(this.height) }

  get width()  { return 2 * this.rx }
  get height() { return 2 * this.ry }
  get rx()     { return this.params.rx }
  get ry()     { return this.params.ry }

  getCardinalOffsetsFromAnchor(cardinal: Cardinals) {
    const factors: Record<Cardinals, [number, number]> = {
      nw: [-1, -1],  n: [ 0, -1],   ne: [1, -1],
      w:  [-1,  0],  c: [ 0,  0],   e:  [1,  0],
      sw: [-1,  1],  s: [ 0,  1],   se: [1,  1],
    }
    const [fx, fy] = factors[cardinal]
    // Ellipse cardinals on the bounding box, not the perimeter
    return [fx * this.rx, fy * this.ry]
  }

  cropLineRelative(_center: XY, target: XY) {
    let startX = this.x
    let startY = this.y
    if (startX === null || startY === null)
      throw new Error(`missing start coordinate on line crop`)

    let theta = Math.atan2(target.y - startY, target.x - startX)
    let x = this.rx * Math.cos(theta)
    let y = this.ry * Math.sin(theta)
    return { x, y }
  }
}
