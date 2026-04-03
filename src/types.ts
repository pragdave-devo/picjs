export { TBase } from "./types/_base.js"
export type { TA } from "./types/_base.js"

export { TBool } from "./types/tbool.js"
export { TColor } from "./types/tcolor.js"
export { TFont } from "./types/tfont.js"
export { TFunction } from "./types/tfunction.js"
export { TInterpolatable } from "./types/_base.js"
export { TNumber } from "./types/tnumber.js"
export { TList } from "./types/tlist.js"
export { TNative } from "./types/tnative.js"
export { TPosition } from "./types/tposition.js"
export { TRange, Easing } from "./types/trange.js"
export { TString } from "./types/tstring.js"
export { TTimeline } from "./types/ttimeline.js"

import { Location } from "./parser.js"
import { XY } from "./position.js"

export type LoggerInterface = (location: Location | undefined, result: any, source?: string) => void 

export interface RenderParameters {
  cardinal: `c`
  x: number
  y:  number
  nw: XY
  width: number
  height: number
  rotation: number
  rotationCenter: XY
}
