import { TNumber } from "../../src/types.js"
import { valueOf } from "../helpers/eval.js"

function t(ip: string, expected: TNumber) {
  const result = valueOf(ip)
  expect(result.toNative()).toEqual(expected.toNative())
}

function n(val: number) {
  return new TNumber(val)
}

describe(`simple arithmetic expression evaluation`, () => {

  it(`supports constants`, () => {// constants
t(`1`, n(1))
t(`-1`, n(-1))
t(`1.25`, n(1.25))
t(`-1.25`, n(-1.25))
t(`1.25e2`, n(125))
t(`-1.25e2`, n(-125))
t(`125e-2`, n(1.25))
t(`-125e-2`, n(-1.25))
  })

// precedence

// `%` is documented at precedence 6 (docs/picjs-reference.md) and the grammar
// accepts it as a MultiplicativeOperator, but it had no BinOps entry.
it(`supports modulo`, () => {
t(`5 % 3`, n(2))
t(`10 % 5`, n(0))
t(`7 % 2.5`, n(2))
})

it(`gives modulo the same precedence as multiplication`, () => {
t(`1 + 7 % 3`, n(2))
t(`2 * 7 % 3`, n(2))
})

it(`supports precedence`, () => {
t(`1+2*3`, n(7))
t(`(1+2)*3`, n(9))
t(`10 - 6/2`, n(7))
t(`(10-6)/2`, n(2))
t(`1+2^3`, n(9))
})

it(`binds the minus sign correctly`, () => {

t(`1+2`, n(3))
t(`1+-2`, n(-1))
t(`-1+2`, n(1))
t(`-(1+2)`, n(-3))
t(`-1-2`, n(-3))
t(`-(1-2)`, n(1))
})

t(`a=1+2 a`, n(3))
t(`a=3 a+=2 a`, n(5))

})
