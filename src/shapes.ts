import { SArc }    from "./shapes/sarc.js"
import { SBase }   from "./shapes/_base.js"
import { SBox }    from "./shapes/sbox.js"
import { SCircle } from "./shapes/scircle.js"
import { SGroup }  from "./shapes/sgroup.js"
import { SLabel }  from "./shapes/slabel.js"
import { SLine }     from "./shapes/sline.js"
import { SPoint }    from "./shapes/spoint.js"
import { SPolyline } from "./shapes/spolyline.js"

export { SArc }      from "./shapes/sarc.js"
export { SBase }     from "./shapes/_base.js"
export { SBox }      from "./shapes/sbox.js"
export { SCircle }   from "./shapes/scircle.js"
export { SGroup }    from "./shapes/sgroup.js"
export { SLabel }    from "./shapes/slabel.js"
export { SLine }     from "./shapes/sline.js"
export { LineLike }  from "./shapes/line_like.js"
export { SPoint }    from "./shapes/spoint.js"
export { SPolyline } from "./shapes/spolyline.js"

export type { ProcessedWithConstraint } from "./shapes/_base.js"
export { CardinalAttributes } from "./shapes/_base.js"
export type { WithConstraint } from "./shapes/_base.js"

export type Args = Record<string, any>

export type ShapeFunction = Record<string, SBase>
export type ShapeModule = {
  [ name: string] : ShapeFunction
}

export const ShapeConstructors:{ [name: string]: typeof SBase } = {
  SArc,
  SBase,
  SBox,
  SCircle,
  SGroup,
  SLabel,
  SLine,
  SPoint,
  SPolyline,
}
