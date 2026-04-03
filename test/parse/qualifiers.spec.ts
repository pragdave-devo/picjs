import {
  testParse,
  binop,
  identifier,
  leftQualifier,
  number,
  variableValue,
} from "../helpers/ast.js"

const A = variableValue(`a`)
const a = identifier(`a`)
const B = variableValue(`b`)
const b = identifier(`b`)
const C = variableValue(`c`)
const c = identifier(`c`)

// single qualifier smoke test
testParse(`a`, A)
testParse(`a.b`, leftQualifier(A, `attr`, b))
testParse(`a[b]`, leftQualifier(A, `index`, B))
testParse(`a()`, leftQualifier(A, `call`, [])) 

// chain qualifiers
testParse(`a.b.c`, leftQualifier(leftQualifier(A, `attr`, b), `attr`, c))
testParse(`a.b.c.a`, leftQualifier(leftQualifier(leftQualifier(A, `attr`, b), `attr`, c), `attr`, a))

testParse(`a.b[c]`, leftQualifier(leftQualifier(A, `attr`, b), `index`, C))
testParse(`a.b[c](a)`, leftQualifier(leftQualifier(leftQualifier(A, `attr`, b), `index`, C), `call`, [A]))

testParse(`a[b*2+1]`, leftQualifier(A, `index`, binop(`+`, binop(`*`, B, number(2)), number(1))))



