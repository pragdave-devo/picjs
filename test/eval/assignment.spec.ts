import { TA } from "../../src/types.js"

import { valueOf } from "../helpers/eval.js"

function t(ip: string, expected: any) {
  const result = valueOf(ip)
  it(ip, () => {
    if (Array.isArray(result.value))
      expect(result.value.map((v: TA) => v.value)).toEqual(expected)
    else
      expect(result.value).toBe(expected)
  })
}


describe(`assignment`, () => {

  describe(`returns its rhs`, () => {
    t(`a = 1`, 1)
    t(`a = 1 a`, 1)
    t(`a = 1 + 2 a`, 3)
    t(`a = b = 4 a`, 4)
    t(`a = b = 4 b`, 4)
    t(`a = 2 + (b = 3) a`, 5)
    t(`a = 2 + (b = 3) b`, 3)
  })

  describe(`supports op=`, () => {
    t(`a=3 a+=2 a`, 5)
    t(`a=3 a-=2 a`, 1)
    t(`a=3 a*=2 a`, 6)
    t(`a=3 a/=2 a`, 1.5)
  })

  describe(`correctly treats attributes as l and rvalues`, () => {
    t(`a = "cat"  a.b = 99 a`, "cat")
    t(`a = "cat"  a.b = 99 a.b`, 99)
    t(`a = "cat"  a.b = 99 a.b += 1 a+a.b`, "cat100")
  })

  // list accessors

  describe(`treats array indexing as l and r values`, () => {
    t(`l = [1 2 3] l[1] = 99 l`, [1,99,3])
    t(`l = [1 2 3] l[1] += 1 l`, [1,3,3])
  })

  describe(`index access with numeric keys acts as attribute storage`, () => {
    t(`a = "obj" a[1] = 42 a[1]`, 42)
    t(`a = "obj" a[5] = 99 a[5]`, 99)
  })

  describe(`has() works with numeric and string keys`, () => {
    t(`a = "obj" a["x"] = 1 a.has("x")`, true)
    t(`a = "obj" a.has("x")`, false)
    t(`a = "obj" a[3] = 1 a.has(3)`, true)
    t(`a = "obj" a.has(3)`, false)
  })
})
