import {
  testParse,
  binop,
  negate,
  number,
  position,
  variableValue,
} from "../helpers/ast.js"

const A = variableValue(`a`)
const B = variableValue(`b`)
const C = variableValue(`c`)

const tests: [ string, any ][] = [
  [ `1`, number(1) ],
  [ `123`, number(123) ],

  [ `1.25`, number(1.25) ],
  [ `1.25e2`, number(125) ],
  [ `1.25e-2`, number(0.0125) ],

  [ `12.5%`, number(0.125) ],

// signed constant expressions

  [ `-1`, negate(number(1)) ],
  [ `-123`, negate(number(123)) ],
  [ `-1.25e-2`, negate(number(0.0125)) ],

// signed other expressions

  [ `-a`, negate(A) ],

// other factors

  [ `(100, 200)`, position(number(100), number(200)) ],
  [ `(a, b)`, position(A, B) ],

// basic binops

  [ `a+b`, binop(`+`, A, B) ],
  [ `a +b`, binop(`+`, A, B) ],
  [ `a+ b`, binop(`+`, A, B) ],
  [ `a + b`, binop(`+`, A, B) ],

  [ `a-b`, binop(`-`, A, B) ],
  [ `a*b`, binop(`*`, A, B) ],
  [ `a/b`, binop(`/`, A, B) ],
  [ `a%b`, binop(`%`, A, B) ],
  [ `a^b`, binop(`^`, A, B) ],

// precedence

  [ `a+b*c`, binop(`+`, A, binop(`*`, B, C)) ],
  [ `a*b+c`, binop(`+`, binop(`*`, A, B), C) ],
  [ `a*b+c^2`, binop(`+`, binop(`*`, A, B), binop(`^`, C, number(2))) ],
  [ `a^2*b+c`, binop(`+`, binop(`*`, binop(`^`, A, number(2)), B), C) ],

  [ `(a+b)*c`, binop(`*`, binop(`+`, A, B), C) ],

]

tests.forEach(([given, expected]) =>
  testParse(given, expected)
)
