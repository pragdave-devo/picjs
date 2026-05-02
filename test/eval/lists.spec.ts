import { valueOf } from "../helpers/eval.js"
import { TA } from "../../src/types.js"

function t(ip: string, expected: number | number[]) {
  const result = valueOf(ip)
  it(ip, () => {
    if (Array.isArray(result.value))
      expect(result.value.map((v: TA) => v.value)).toEqual(expected)
    else
      expect(result.value).toBe(expected)
  })
}

function n(val: number) {
  return val
}

function list(l: number[]) {
  return l
}

const n1 = n(1)
const n2 = n(2)
const n3 = n(3)
const n4 = n(4)
const n6 = n(6)
const n9 = n(9)

describe(`lists`, () => {
  describe(`can be constructed`, () => {
    t(`[]`,       list([]))
    t(`[ 1 ]`,    list([ n1 ]))
    t(`[ 1, 2 ]`, list([ n1, n2 ]))
  })

  describe(`supports vector operations`, () => {
    t(`[ 1, 2 ] + [ 3, 4 ]`, list([ n4, n6 ]))
    t(`[ 6, 4 ] - [ 2, 1 ]`, list([ n4, n3 ]))
    t(`[ 2, 3 ] * [ 3, 1 ]`, list([ n6, n3 ]))
    t(`[ 2, 3 ] / [ 2, 2 ]`, list([ n1, n(1.5) ]))
  })

  // scalar ops

  describe(`supports scalar operations`, () => {
    t(`[ 1, 2 ] + 2`, list([ n3, n4 ]))
    t(`[ 3, 2 ] - 1`, list([ n2, n1 ]))
    t(`[ 2, 3 ] * 2`, list([ n4, n6 ]))
    t(`[ 4, 5 ] / 2`, list([ n2, n(2.5) ]))
    t(`[ 2, 3 ] ^ 2`, list([ n4, n9 ]))
  })

  // indexing

  describe(`can be indexed`, () => {
    t(`([5, 6, 7, 8])[1]`, n(6))
    t(`([5, 6, 7, 8])[1+2]`, n(8))
    t(`([5, 6, 7, 8] - [ 4, 3, 2, 1])[1+2]`, n(7))
  })

  describe(`has built-in functions`, () => {
    t(`[1, 2, 3].length`, n3)
    t(`([1,2].push(3))[2]`, n3)
    t(`[1,2,3].pop()`, n3)
  })

  describe(`map ignores extra arguments`, () => {
    t(`double = (x) => x * 2\n[1, 2, 3].map(double)`, list([ n2, n4, n6 ]))
  })

  describe(`setAtIndex extends the list when index is beyond current length`, () => {
    t(`a = []\na[0] = 10\na[0]`, n(10))
    t(`a = []\na[2] = 99\na.length`, n3)
    t(`a = []\na[2] = 99\na[2]`, n(99))
  })

  describe(`setAtIndex then getAtIndex round-trips with numeric keys`, () => {
    t(`a = [1]\na[0] = 42\na[0]`, n(42))
    t(`a = [0, 0, 0]\na[2] = 9\na`, list([ n(0), n(0), n9 ]))
  })

  describe(`out-of-bounds index throws`, () => {
    it(`a = [] then a[1] throws`, () => {
      expect(() => valueOf(`a = []\na[1]`)).toThrow()
    })
  })
})
