import { SBase } from "./_base.js"
import { TNumber } from "../types.js"
import { Cardinals, XY } from "../position.js"

const R2 = 1.0 / Math.sqrt(2.0)

// For a circle, diagonal cardinals sit on the circumference, not the bounding box corner
const CircleCardinalFactors: Record<Cardinals, [number, number]> = {
  nw: [-R2, -R2],   n: [ 0, -1],   ne: [R2, -R2],
  w:  [-1,   0 ],   c: [ 0,  0],   e:  [1,   0 ],
  sw: [-R2,  R2],   s: [ 0,  1],   se: [R2,  R2],
}

export class SCircle extends SBase {
  override shapeName = "SCircle"

  missingDimensions() {
    return false
  }


  handle_attr_wid()    { return new TNumber(this.width) }
  handle_attr_width()  { return new TNumber(this.width) }
  handle_attr_ht()     { return new TNumber(this.height) }
  handle_attr_height() { return new TNumber(this.height) }
  
  handle_attr_r()     { return new TNumber(this.r) }
  handle_attr_rad()     { return new TNumber(this.r) }
  handle_attr_radius()     { return new TNumber(this.r) }
 
  get width() { return 2 * this.r }
  get wid() { return 2 * this.r }
  get height() { return 2 * this.r }
  get ht() { return 2 * this.r }

  get r()  { return this.params.r  }
  get rad()  { return this.params.r  }
  get radius()  { return this.params.r  }

  getCardinalOffsetsFromAnchor(cardinal: Cardinals) {
    const [fx, fy] = CircleCardinalFactors[cardinal]
    return [fx * this.r, fy * this.r]
  }

  cropLineRelative(_center: XY, target: XY) {
    let startX = this.x
    let startY = this.y

    let endX   =  target.x
    let endY   =  target.y

    if (startX === null || startY === null)
      throw new Error(`missing start coordinate on line crop`)

    let theta = Math.atan2(endY - startY, endX - startX)

    let x = this.radius * Math.cos(theta)
    let y = this.radius * Math.sin(theta)

    return { x, y }
  }}



