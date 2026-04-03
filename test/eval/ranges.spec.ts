import { valueOf } from "../helpers/eval.js"

function t(ip: string, expected: number) {
  it(ip, () => {
    const result = valueOf(ip)
    expect(result.toNative()).toBe(expected)
  })
}


describe(`ranges`, () => {

  describe(`have starts and ends`, () => {
    t(`[1..3].start()`, 1)
    t(`[1..3].end()`, 3)
  })

  describe(`can be interpolated`, () => {
    t(`[1..3].interpolate(0)`, 1)
    t(`[1..3].interpolate(1)`, 3)
    t(`[1..3].interpolate(0.5)`, 2)
    t(`[1..3].interpolate(0.25)`, 1.5)
  })

  describe(`support funky ration syntax`, () => {
    t(`0 * [1..3]`,    1)
    t(`1 * [1..3]`,    3)
    t(`0.5 * [1..3]`,  2)
    t(`0.25 * [1..3]`, 1.5)

    t(`[1..3] * 0`,    1)
    t(`[1..3] * 1`,    3)
    t(`[1..3] * 0.5`,  2)
    t(`[1..3] * 0.25`, 1.5)
  })


})
