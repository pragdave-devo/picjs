import { RTE } from "./runtime_error.js"
import { TA, TNative, TNumber, TPosition } from "./types.js"
import { TPalette } from "./types/tpalette.js"

const D2R = 2*Math.PI/360.0
const R2D = 1 / D2R
  

function valueOf(number: TA | number, _caller: any) {
  if (!(number instanceof TNumber))
    throw new RTE(`for now, you can only call "%{caller}" with a numeric parameter`)
  return number.value
}


function functionOnFloatDegrees(name: string, fn: (x:number) => number, degrees: number) {
  const deg = valueOf(degrees, name)
  const result = fn(deg * D2R)
  return new TNumber(result)
}

function arcFunction(name: string, fn: (x:number) => number, ratio: number) {
  const rat = valueOf(ratio, name)
  const radians = fn(rat)
  return new TNumber(radians * R2D)
}


export const BuiltinConstants: {[name: string]: TA} = {
  PI: new TNumber(Math.PI),
  Palette: new TPalette(),
}

export const BuiltinFunctions: {[name: string]: TNative} = {
  //---------------------------------------------------------------------- d2r
  d2r: new TNative(`d2r`, [`degrees`],
    `convert degrees to radians`,
    (_, degrees) => {
      return new TNumber(valueOf(degrees, `d2r`) * D2R)
    }),

  //---------------------------------------------------------------------- r2d
  r2d: new TNative(`r2d`, [`radians`],
    `convert radians to degrees`,
    (_, radians) => {
      return new TNumber(valueOf(radians, `r2d`) * R2D)
    }),
  //---------------------------------------------------------------------- sin
  sin: new TNative(`sin`, [`angle-in-degrees`],
    `return the sine (-1...+1) of the given angle (in degrees)`,
    (_, angle) => {
      return functionOnFloatDegrees(`sin`, Math.sin, angle)
    }),

  //---------------------------------------------------------------------- cos
  cos: new TNative(`cos`, [`angle-in-degrees`],
    `return the cosine (-1...+1) of the given angle (in degrees)`,
    (_, angle) => {
      return functionOnFloatDegrees(`cos`, Math.cos, angle)
    }),

  //---------------------------------------------------------------------- tan
  tan: new TNative(`tan`, [`angle-in-degrees`],
    `return the tangent (-1...+1) of the given angle (in degrees)`,
    (_, angle) => {
      return functionOnFloatDegrees(`tan`, Math.tan, angle)
    }),

  //---------------------------------------------------------------------- asin
  asin: new TNative(`asin`, [`ratio`],
    `return the angle (in degrees) whose sine is _ratio_`,
    (_, ratio) => {
      return arcFunction(`asin`, Math.asin, ratio)
    }),

  //---------------------------------------------------------------------- acos
  acos: new TNative(`acos`, [`ratio`],
    `return the angle (in degrees) whose sine is _ratio_`,
    (_, ratio) => {
      return arcFunction(`acos`, Math.acos, ratio)
    }),

  //---------------------------------------------------------------------- atan2
  atan2: new TNative(`atan2`, [`dy`, `dx`],
    `return the angle (in degrees) between the x-axis and the point (dx,dy). ` +
    `(note the parameter order: y, x, not x, y)`,
    (_, dy, dx) => {
      const y = valueOf(dy, `atan2`)
      const x = valueOf(dx, `atan2`)
      const radians = Math.atan2(y, x)
      return new TNumber(radians * R2D)
    }),

  //---------------------------------------------------------------------- atan2
  polar: new TNative(`polar`, [`radius`, `theta`],
    `return the posiio of the point "radius" away from the origin along a line ` +
    `at angle "theta" (degrees)`,
    (_, radius, theta) => {
      const angle = theta * D2R
      const y = radius * Math.sin(angle)
      const x = radius * Math.cos(angle)
      return new TPosition(x, y)
    }),

  //---------------------------------------------------------------------- ln
  ln: new TNative(`ln`, [`number`],
    `return the natural logarithm of number`,
    (_, number) => {
      const num = valueOf(number, `ln`)
      return new TNumber(Math.log(num))
    }),

  //---------------------------------------------------------------------- log10
  log10: new TNative(`log10`, [`number`],
    `return the logarithm (base 10) of number`,
    (_, number) => {
      const num = valueOf(number, `log10`)
      return new TNumber(Math.log10(num))
    }),

}


// max
// min
// sum
// mean

