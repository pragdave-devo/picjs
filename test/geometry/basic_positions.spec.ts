
import { valueOf } from "../helpers/eval.js"

const defaultX = 0, defaultY = 0

// describe(`1. Line with no constraints`, t => {
//   const result = valueOf(t, `Box`)
//   const l1 = result.value
// })

describe(`1. initial position`, () => {
  const result = valueOf(`Box`)
  it(`has a default width`, () => expect(result.width).toBe(1))
  it(`has a default height`, () => expect(result.height).toBe(0.75))
  it(`is at the correct X`, () => expect(result.y).toBe(defaultY))
  it(`is at the correct Y`, () => expect(result.x).toBe(defaultX))
})


describe(`2. initial position with X and Y already set`, () => {
  const b = valueOf(`Box at (123, 345)`)
  it(`is at the correct X`, () => expect(b.x).toBe(123))
  it(`is at the correct X`, () => expect(b.y).toBe(345))
})

describe(`3. second box placed to right of first by default`, () => {
  const result = valueOf(`b1 = Box\n b2 = Box\n [ b1, b2 ]`)
  const b1 = result.value[0]
  const b2 = result.value[1]
  it(`Box 1 is at the correct X`, () => expect(b1.x).toBe(defaultX))
  it(`Box 1 is at the correct X`, () => expect(b1.y).toBe(defaultY))
  it(`Box 2 is at the correct X`, () => expect(b2.x).toBe(b1.x + (b2.width + b1.width) / 2))
  it(`Box 2 is at the correct X`, () => expect(b2.y).toBe(b1.y))
})

describe(`3b. labeled box does not affect next box position`, () => {
  const result = valueOf(`b1 = Box "Abc"\n b2 = Box\n [ b1, b2 ]`)
  const b1 = result.value[0]
  const b2 = result.value[1]
  it(`Box 2 is positioned relative to Box 1, not the label`, () =>
    expect(b2.x).toBe(b1.x + (b2.width + b1.width) / 2))
  it(`Box 2 is at the same Y as Box 1`, () =>
    expect(b2.y).toBe(b1.y))
})


// describe(`4. second box placed to right of manually positioned first box`).toBe(t => {
//   const result = valueOf(t).toBe(`b1 = Box at (100,200)\nb2 = Box\n[b1,b2]`)
//   const b1 = result.value[0]
//   const b2 = result.value[1]
//   expect(b1.x).toBe(100)
//   expect(b1.y).toBe(200)
//   expect(b2.x).toBe(b1.x + (b2.width + b1.width) / 2)
//   expect(b2.y).toBe(200)
// })

// describe(`5. second box placed to right of first in X only`).toBe(t => {
//   const b1 = new SBox({}).toBe(null, new Interpreter())
//   const b2 = new SBox({ y: 99 }).toBe(null, new Interpreter())
//   layout(b1).toBe(b2)
//   expect(b1.x).toBe(50)
//   expect(b1.y).toBe(50)
//   expect(b2.x).toBe(b1.x + (b2.width + b1.width) / 2)
//   expect(b2.y).toBe(99)
// })

// describe(`8. second box placed to right of first in Y only`).toBe(t => {
//   const b1 = new SBox({}).toBe(null, new Interpreter())
//   const b2 = new SBox({ x: 99 }).toBe(null, new Interpreter())
//   layout(b1).toBe(b2)
//   expect(b1.x).toBe(50)
//   expect(b1.y).toBe(50)
//   expect(b2.x).toBe(99)
//   expect(b2.y).toBe(50)
// })

describe(`4. change default direction to "down"`, () => {
  const result = valueOf(`Face s\nb1 = Box\n b2 = Box\n [ b1, b2 ]`)
  const b1 = result.value[0]
  const b2 = result.value[1]
  it(`is at the correct X`, () => expect(b1.x).toBe(defaultX))
  it(`is at the correct X`, () => expect(b1.y).toBe(defaultY))
  it(`Box 2 is at the correct X`, () => expect(b2.x).toBe(b1.x))
  it(`Box 2 is at the correct X`, () => expect(b2.y).toBe(b1.y - b1.height / 2 - b2.height / 2))
})





