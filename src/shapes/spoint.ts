import { SBase } from "./_base.js"
import { TNumber } from "../types.js"
import { Cardinals, UnitVector, XY } from "../position.js"

export class SPoint extends SBase {
  override shapeName = "SPoint"

  // we aren't really anchored, but we can pretend 
  //
  getCardinalOffsetsFromAnchor(_cardinal: Cardinals) {
    return [ 0, 0 ]
  }

  missingDimensions() {
    return false
  }

  setRorarionVector() {
    return
  }

  handle_attr_length()    { return new TNumber(0) }
  handle_attr_width()     { return new TNumber(0) }
  handle_attr_height()    { return new TNumber(0) }

  // and these are filled in with actual coordinates by the geometry
  get end()            { return this.c }

  get width()          { return 0 }
  get height()         { return 0 }
  get default_length() { return 0 }
  get length()         { return 0 }

  getEndAndNewDirection(startAsXY: XY, direction: UnitVector) {
    return [ startAsXY, direction ]
  }

}



