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
export { TPalette } from "./types/tpalette.js"

import { registerHasMethodFactory } from "./types/_base.js"
import { TNative } from "./types/tnative.js"
import { TBool } from "./types/tbool.js"

registerHasMethodFactory((host) =>
  new TNative(`has`, [`attr_name`],
    `return true if the object has the named attribute`,
    (_interpreter, attr_name) => {
      const name = String(attr_name)
      if (name in host.attrs) return new TBool(true)
      if ((`handle_attr_` + name) in host) return new TBool(true)
      return new TBool(false)
    })
)

import { Location } from "./location.js"
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
