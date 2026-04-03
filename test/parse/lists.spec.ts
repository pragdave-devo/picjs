import { 
  testParse,
  list,
  number,
} from "../helpers/ast.js"


const rv = `Expression`

testParse(`[]`, list([]))
testParse(`[1]`, list([ number(1) ]))
testParse(`[1, 2]`, list([ number(1), number(2) ]))

testParse(
  `[1, [ 3, 4 ], 2]`, 
  list([ number(1), list([number(3), number(4)]), number(2) ]))


