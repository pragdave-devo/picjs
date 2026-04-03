// import { Geometry } from "../../src/geometry.js"
import { valueOf } from "../helpers/eval.js"

const defaultX = 0, defaultY = 0


function pos(x: number, y: number) {
  return { x, y }
}


describe(`1. Line with no constraints`, () => {
  const l1 = valueOf(`Line`)
  it(`has default width`, () => expect(l1.width).toBe(1)) // default geometry
  it(`has default height`, () => expect(l1.height).toBe(0)) // default geometry
  it(`has default start`, () => expect(l1.start).toEqual(pos(defaultX, defaultY)))
  it(`has default end`, () => expect(l1.end).toEqual(pos(defaultX + 1, defaultY)))
  it(`has default length`, () => expect(l1.length).toBe(1))
})

describe(`2. Line with start and no end`, () => {
  const l1 = valueOf(`Line (111, 222)`)
  it(`has default `, () => expect(l1.width).toBe(1)) // default geometry
  it(`has default `, () => expect(l1.height).toBe(0)) // default geometry
  it(`has default `, () => expect(l1.start).toEqual(pos(111, 222)))
  it(`has default `, () => expect(l1.end).toEqual(pos(112, 222)))
  it(`has default `, () => expect(l1.length).toBe(1))
})

describe(`3. Line with no start and an end starts from current point`, () => {
  const l1 = valueOf(`Line to (${defaultX + 3}, ${defaultY + 4})`) // 3-4-5 triangle
  it(`has default `, () => expect(l1.width).toBe(3) )
  it(`has default `, () => expect(l1.height).toBe(4))
  it(`has default `, () => expect(l1.start).toEqual(pos(defaultX, defaultY)))
  it(`has default `, () => expect(l1.end).toEqual(pos(defaultX + 3, defaultY + 4)))
  it(`has default `, () => expect(l1.length).toBe(5))
})

describe(`4. Line joins to previous`, () => {
  const [l1, l2] = valueOf(`l1 = Line\nl2 = Line to (200,300)\n[l1, l2]`).value
  it(`has default `, () => expect(l1.end).toEqual(l2.start))
})

describe(`5. Line joins edges if shapes given`, () => {
  const [b1, b2, l] = 
    valueOf(`a = Box (100, 100) b = Box (100, 200) l = Line from a to b\n [a,b,l]`).value
  it(`has default `, () => expect(l.start).toEqual(b1.n))
  it(`has default `, () => expect(l.end).toEqual(b2.s))
  it(`has default `, () => expect(l.length).toEqual(100 - (b1.height + b2.height) / 2))
})

describe(`6. Line joins centers if shape cardinals given`, () => {
  const l =
    valueOf(`a = Box (100, 100) b = Box (100, 200) Line from a.c to b.c`)
  it(`has default `, () => expect(l.start).toEqual(pos(100, 100)))
  it(`has default `, () => expect(l.end).toEqual(pos(100, 200)))
})

// describe(`Line follows shape when shape is moved`, () => {
//   const l = valueOf(t, 
//     `a = Box (300, 300) 
//      line = Line from (100,100) to a
//      a.cx = 500
//      line`)
//   t.deepEqual(l.end, pos(460, 280))
// })

// t(`Line follows cardinal when shape is moved`,
//   `a = Box (300, 300) 
//    Line from (100,100) to a.n
//    a.cx = 500`,
//   (t, [ _b, l ]) => {
//     t.deepEqual(l.end, pos(500, 270))
//   })
