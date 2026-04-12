import { valueOf } from "../helpers/eval.js"

const defaultX = 0, defaultY = 0


function pos(x: number, y: number) {
  return { x, y }
}


describe(`1. Line with no constraints`, () => {
  const l1 = valueOf(`Line`)
  it(`has default width of 1`, () => expect(l1.width).toBe(1))
  it(`has default height of 0`, () => expect(l1.height).toBe(0))
  it(`starts at origin`, () => expect(l1.start).toEqual(pos(defaultX, defaultY)))
  it(`ends 1 unit to the right`, () => expect(l1.end).toEqual(pos(defaultX + 1, defaultY)))
  it(`has default length of 1`, () => expect(l1.length).toBe(1))
})

describe(`2. Line with start and no end`, () => {
  const l1 = valueOf(`Line (111, 222)`)
  it(`has width of 1`, () => expect(l1.width).toBe(1))
  it(`has height of 0`, () => expect(l1.height).toBe(0))
  it(`starts at specified position`, () => expect(l1.start).toEqual(pos(111, 222)))
  it(`ends 1 unit to the right of start`, () => expect(l1.end).toEqual(pos(112, 222)))
  it(`has length of 1`, () => expect(l1.length).toBe(1))
})

describe(`3. Line with no start and an end starts from current point`, () => {
  const l1 = valueOf(`Line to (${defaultX + 3}, ${defaultY + 4})`) // 3-4-5 triangle
  it(`has width matching horizontal distance`, () => expect(l1.width).toBe(3) )
  it(`has height matching vertical distance`, () => expect(l1.height).toBe(4))
  it(`starts at origin`, () => expect(l1.start).toEqual(pos(defaultX, defaultY)))
  it(`ends at specified position`, () => expect(l1.end).toEqual(pos(defaultX + 3, defaultY + 4)))
  it(`has length of 5 (3-4-5 triangle)`, () => expect(l1.length).toBe(5))
})

describe(`4. Line joins to previous`, () => {
  const [l1, l2] = valueOf(`l1 = Line\nl2 = Line to (200,300)\n[l1, l2]`).value
  it(`second line starts where first line ends`, () => expect(l1.end).toEqual(l2.start))
})

describe(`5. Line joins edges if shapes given`, () => {
  const [b1, b2, l] =
    valueOf(`a = Box (100, 100) b = Box (100, 200) l = Line from a to b\n [a,b,l]`).value
  it(`starts at south edge of first box`, () => expect(l.start).toEqual(b1.s))
  it(`ends at north edge of second box`, () => expect(l.end).toEqual(b2.n))
  it(`has length equal to gap between boxes`, () => expect(l.length).toEqual(100 - (b1.height + b2.height) / 2))
})

describe(`6. Line joins centers if shape cardinals given`, () => {
  const l =
    valueOf(`a = Box (100, 100) b = Box (100, 200) Line from a.c to b.c`)
  it(`starts at center of first box`, () => expect(l.start).toEqual(pos(100, 100)))
  it(`ends at center of second box`, () => expect(l.end).toEqual(pos(100, 200)))
})
