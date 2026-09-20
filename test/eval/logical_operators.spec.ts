import { TBool } from "../../src/types.js"
import { valueOf } from "../helpers/eval.js"

// The grammar defines `||`, `&&` and unary `!`, and docs/picjs-reference.md
// lists them at precedence levels 1, 2 and 8. None of them were implemented in
// the interpreter: the BinOps table had no entries, and TBool's existing
// negate()/equal_to()/not_equal_to() were dead code under names the dispatcher
// does not look for.
//
// Semantics: `&&` and `||` short-circuit and yield a boolean; all three accept
// boolean operands only.

function t(src: string, expected: boolean) {
  const result = valueOf(src)
  expect(result.toNative()).toEqual(new TBool(expected).toNative())
}

describe(`logical operators`, () => {
  it(`evaluates &&`, () => {
    t(`true && true`, true)
    t(`true && false`, false)
    t(`false && true`, false)
    t(`false && false`, false)
  })

  it(`evaluates ||`, () => {
    t(`true || true`, true)
    t(`true || false`, true)
    t(`false || true`, true)
    t(`false || false`, false)
  })

  it(`evaluates unary !`, () => {
    t(`!true`, false)
    t(`!false`, true)
  })

  it(`gives && higher precedence than ||`, () => {
    t(`true || false && false`, true)
    t(`(true || false) && false`, false)
  })

  it(`combines comparisons with && and ||`, () => {
    t(`1 < 2 && 3 > 2`, true)
    t(`1 > 2 || 3 >= 3`, true)
  })

  // `mark` records that it ran and returns a boolean, so it is a legal operand
  // and its evaluation is observable.
  const withMark = (expr: string) =>
    `x = 0\nmark = (v) => { x = 1\n v }\n${expr}\nx`

  it(`does not evaluate the right side of && when the left is false`, () => {
    expect(valueOf(withMark(`false && mark(true)`)).toNative()).toEqual(0)
  })

  it(`does not evaluate the right side of || when the left is true`, () => {
    expect(valueOf(withMark(`true || mark(true)`)).toNative()).toEqual(0)
  })

  it(`evaluates the right side of && when the left is true`, () => {
    expect(valueOf(withMark(`true && mark(true)`)).toNative()).toEqual(1)
  })

  it(`evaluates the right side of || when the left is false`, () => {
    expect(valueOf(withMark(`false || mark(true)`)).toNative()).toEqual(1)
  })

  it(`rejects a non-boolean left operand`, () => {
    expect(() => valueOf(`1 && true`)).toThrow(/boolean operands/)
    expect(() => valueOf(`"s" || true`)).toThrow(/boolean operands/)
  })

  it(`rejects a non-boolean right operand once it is reached`, () => {
    expect(() => valueOf(`true && 1`)).toThrow(/boolean operands/)
    expect(() => valueOf(`false || "s"`)).toThrow(/boolean operands/)
  })

  it(`rejects ! on a non-boolean`, () => {
    expect(() => valueOf(`!3`)).toThrow()
  })
})

describe(`boolean equality`, () => {
  it(`compares booleans with ==`, () => {
    t(`true == true`, true)
    t(`true == false`, false)
  })

  it(`compares booleans with !=`, () => {
    t(`true != false`, true)
    t(`false != false`, false)
  })
})
