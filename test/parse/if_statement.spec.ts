import {
  testParse, 
  block,
  boolean,
  ifAst,
  number,
} from "../helpers/ast.js"

const n1 = number(1)
const n2 = number(2)
const n3 = number(3)

const tests: [ string, any][] = [
    [ `if (1) 2`, ifAst(n1, n2, boolean(false)) ], 
    [ `if (1) 2 else 3`, ifAst(n1, n2, n3) ],  
    [ `if (1) { 2 } else 3`, ifAst(n1, n2, n3) ],
    [ `if (1) 2 else { 3 }`, ifAst(n1, n2, n3) ],
    [ `if (1) { 2 } else { 3 }`, ifAst(n1, n2, n3) ],
    [ `if (1) { 2 22 } else { 3 33 }`, 
      ifAst(n1, 
        block([n2, number(22)]), 
        block([n3, number(33)])
      ) ],
  ]

tests.forEach(([given, expected]) => {
  testParse(given, expected)
})
