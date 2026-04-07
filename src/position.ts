// We represent the desired position of a shape. For example, if 
// we want the north east corner of a box to be at SVG coordinates (30, 40),
// we'd contain { cardinal: "ne", x: 30, y: 40 }
//
// Individual shapes have a `normalizePosition` function that takes this
// structure and converts it to whatever SVG parameters the underlying
// tag requires.

// the offsets off all cardinal points from the nw corner, 
// expressed as fractions of the width/height
//
export type Cardinals = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "c"
export type XY        = { x: number, y: number }
       type Offsets   = [ number, number ]
export type UnitVector = XY

export const CardinalFactorsFromNW: Record<Cardinals, Offsets> = {
  nw:  [  0.0,  0.0 ],   n: [  0.5,  0.0 ],   ne: [  1.0,  0.0 ],
  w:   [  0.0,  0.5 ],   c: [  0.5,  0.5 ],   e:  [  1.0,  0.5 ],
  sw:  [  0.0,  1.0 ],   s: [  0.5,  1.0 ],   se: [  1.0,  1.0 ],
}

// the offsets off all cardinal points from the center
export const CardinalFactorsFromCenter: Record<Cardinals, Offsets> = {
  nw:  [ -0.5, -0.5 ],   n: [  0.0, -0.5 ],   ne: [  0.5, -0.5 ],
  w:   [ -0.5,  0.0 ],   c: [  0.0,  0.0 ],   e:  [  0.5,  0.0 ],
  sw:  [ -0.5,  0.5 ],   s: [  0.0,  0.5 ],   se: [  0.5,  0.5 ],
}

// And cardinal unit vectors

const r2 = 1.0 / Math.sqrt(2.0)   // r2^2 + r2^2 = 1

export const CardinalVectors: Record<Cardinals, XY> = {
  nw:  { x:  -r2, y: -r2 },   n: { x: 0.0, y: -1.0 },   ne: { x:  r2, y: -r2 },
  w:   { x: -1.0, y: 0.0 },   c: { x: 0.0, y:  0.0 },   e:  { x: 1.0, y: 0.0 },
  sw:  { x:  -r2, y:  r2 },   s: { x: 0.0, y:  1.0 },   se: { x:  r2, y:  r2 },
}

export interface Position {
  cardinal: Cardinals
  x: number
  y: number
}

export function newPosition(cardinal: Cardinals, x: number, y: number): Position {
  return { cardinal, x, y }
}


