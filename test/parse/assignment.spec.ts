import {
  testParse,
  assign,
  binop,
  identifier,
  leftQualifier,
  number,
  rightQualifier,
  variableValue,
} from "../helpers/ast.js"

const A = variableValue(`a`)
const a = identifier(`a`)
const b = identifier(`b`)
const n1 = number(1)

const addOneToA = assign( a, binop(`+`, A, n1))

const tests: [ string, any][] = [
  [ `a = 1`,     assign(a, n1) ],
  [ `a = 1 + 1`, assign(a, binop(`+`, n1, n1)) ],
  [ `a = b = 1`, assign(a, assign(b, n1)) ],
  [ `a.b = 1`,   assign(leftQualifier(A, `attr`, b), n1) ],
  [ `a = a + 1`, addOneToA ],
  [ `a += 1`,    addOneToA ],
  [ `a.b += 1`,  assign(leftQualifier(A, `attr`, b), binop(`+`, rightQualifier(A, `attr`, b), n1)) ],

]

tests.forEach(([given, expected]) => {
  testParse(given, expected)
})


