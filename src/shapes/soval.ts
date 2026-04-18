import { SBase, ShapeArgs } from "./_base.js"
import { TNumber } from "../types.js"

export class SOval extends SBase {

  handle_attr_rx()     { return new TNumber(this.rx) }
  handle_attr_ry()     { return new TNumber(this.ry) }

  get rx() { return this.params.rx }
  get ry() { return this.params.ry }

  // Auto-round: rx/ry = half the smaller dimension
  setupParams(args: ShapeArgs) {
    super.setupParams(args)
    const halfMin = Math.min(this.params.width, this.params.height) / 2
    if (!(`rx` in args)) this.params.rx = halfMin
    if (!(`ry` in args)) this.params.ry = halfMin
  }
}
