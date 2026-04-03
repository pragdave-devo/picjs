import { valueOf } from "../helpers/eval.js"
import { TNumber, TA, TPosition } from "../../src/types.js"

function t(ip: string, expected: TA) {
  const result = valueOf(ip)
  it(ip, () => {
    expect(result.value).toEqual(expected.value)
  })
}

function n(val: number) {
  return new TNumber(val)
}

function pos(x: number, y: number) {
  return new TPosition(n(x), n(y)) 
}

describe(`positions`, () => {

  describe(`can be constructed`, () => {
    t(`( 1, 2 )`,       pos(1, 2))
    t(`( 1+2, 3*4-3 )`,       pos(3, 9))
  })

  describe(`have scalar and vector operations`, () => {
    t(`( 1, 2 ) + 3`, pos(4, 5))
    t(`( 1, 2 ) + ( 3, 4 )`, pos(4, 6))
    t(`( 1, 2 ) + [ 3, 4 ]`, pos(4, 6))

    t(`( 1, 2 ) - 3`, pos(-2, -1))
    t(`( 1, 2 ) - ( 3, 4 )`, pos(-2, -2))
    t(`( 1, 2 ) - [ 3, 4 ]`,  pos(-2, -2))
  })

  describe(`can be indexed`, () => {
    t(`((4, 5))[0]`, n(4))
    t(`((4, 5))[1]`, n(5))
  })

  describe(`have attributes`, () => {
    t(`((1, 2)).length`, n(2))
    t(`((1, 2)).x`, n(1))
    t(`((1, 2)).y`, n(2))
  })

  describe(`don't need commas`, () => {
    t(`( 1 2 )`,       pos(1, 2))
    t(`( 1+2 3*4-3 )`,       pos(3, 9))

    t(`( 1 2 ) + 3`, pos(4, 5))
    t(`( 1 2 ) + ( 3 4 )`, pos(4, 6))
    t(`( 1 2 ) + [ 3 4 ]`, pos(4, 6))

    t(`( 1 2 ) - 3`, pos(-2, -1))
    t(`( 1 2 ) - ( 3 4 )`, pos(-2, -2))
    t(`( 1 2 ) - [ 3 4 ]`,  pos(-2, -2))
  })


})
