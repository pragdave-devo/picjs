import { SBase, ShapeArgs } from "./_base.js"
import { TNumber } from "../types.js"

export class SBox extends SBase {

  handle_attr_rx()     { return new TNumber(this.rx) }
  handle_attr_ry()     { return new TNumber(this.ry) }
  handle_attr_r()      { return new TNumber(this.rx) }
  handle_attr_rad()    { return new TNumber(this.rx) }
  handle_attr_radius() { return new TNumber(this.rx) }

  get rx()             { return this.params.rx       }
  get ry()             { return this.params.ry       }

  // If only rx or ry is explicitly set, sync the other to match
  setupParams(args: ShapeArgs) {
    super.setupParams(args)
    const hasRx = `rx` in args
    const hasRy = `ry` in args
    if (hasRx && !hasRy) {
      this.params.ry = this.params.rx
    } else if (hasRy && !hasRx) {
      this.params.rx = this.params.ry
    }
  }
}

