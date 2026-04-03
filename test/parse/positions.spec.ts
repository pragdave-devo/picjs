import { 
  testParse,
  number,
  position,
} from "../helpers/ast.js"


testParse(`(1, 2)`, position(number(1), number(2)))
testParse(`((1, 2))`, position(number(1), number(2)))


