import { SBase } from "./_base.js"
import { TNumber } from "../types.js"

export class SBox extends SBase {

  handle_attr_rx()     { return new TNumber(this.rx) }
  handle_attr_ry()     { return new TNumber(this.ry) }
  handle_attr_r()      { return new TNumber(this.rx) }
  handle_attr_rad()    { return new TNumber(this.rx) }
  handle_attr_radius() { return new TNumber(this.rx) }

  get rx()             { return this.params.rx       }
  get ry()             { return this.params.ry       }
}

