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

const at = variableValue(`@`)

const rv = `Expression`



testParse(`@ =  123`,     
          assign(
            leftQualifier(at, `attr`, identifier(`now`)),
            number(123)
))


// yes, this is a LValue on the right...
testParse(`@ += 123`, 
          assign(
            leftQualifier(at, `attr`, identifier(`now`)),
            binop(`+`, rightQualifier(at, `attr`, identifier(`now`)), number(123))
))


testParse(`@.now = 123`, 
          assign(
            leftQualifier(at, `attr`, identifier(`now`)),
            number(123)
)) 
