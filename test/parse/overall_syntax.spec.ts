import {
  testProg,
  assign,
  binop,
  block,
  fndef,
  identifier,
  number,
  program,

  variableValue,
} from "../helpers/ast.js"

const A = variableValue(`a`)
const a = identifier(`a`)

const B = variableValue(`b`)
const b = identifier(`b`)

const X = variableValue(`x`)
const x = identifier(`x`)
const FILL = variableValue(`fill`)
const fill = identifier(`fill`)

const n1 = number(1)
const n2 = number(2)
const n3 = number(3)

const testProgram: [ string, any ][] = [

    // separation of expressions
    [ `a`,     program(A) ],
    [ `a b`,  program(block([ A, B ])) ],
    [ `1+2 a+b`, program(block([binop(`+`, n1, n2), binop(`+`, A, B)])) ],
    [ `a = 1 a`, program(block([assign(a, n1), A])) ],
    [ `a=1+2 a`, program(block([assign(a, binop(`+`, n1, n2)), A])) ],
  ]

testProgram.forEach(([given, expected]) => {
  testProg(given, expected)
})

// there was a problem if the parameter names were also the names of attributes
testProg( `(x, fill) => { x+fill }`, 
  program(fndef([ x, fill ], binop(`+`, X, FILL))))


