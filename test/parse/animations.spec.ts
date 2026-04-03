import { 
  testParse,
  identifier,
  leftQualifier,
  variableValue,
  number,
  moveto,
  rotate,
  position,
  set,
} from "../helpers/ast.js"


testParse(`move s to (1,2)`, 
  moveto(variableValue(`s`), position(number(1), number(2)), {}))
testParse(`move s to (1,2) take 1.5`, 
  moveto(variableValue(`s`), position(number(1), number(2)), { take: number(1.5) }))

testParse(`move shape.n to (1,2)`, 
  moveto(
    leftQualifier(variableValue(`shape`), `attr`, identifier(`n`)), 
    position(number(1), number(2)), 
    {}
  )
)

testParse(`move shape.n (1,2) take 2.25`, 
  moveto(
    leftQualifier(variableValue(`shape`), `attr`, identifier(`n`)), 
    position(number(1), number(2)), 
    { take: number(2.25) }
  )
)

testParse(`rotate shape by 30`, 
  rotate(
    variableValue(`shape`),
    number(30),
    variableValue(`shape`), 
    {}
))

testParse(`rotate shape by 30 take 4`, 
  rotate(
    variableValue(`shape`),
    number(30),
    variableValue(`shape`), 
    { take: number(4) }
))


testParse(`rotate shape by 30 about (100,200)`, 
  rotate(
    variableValue(`shape`),
    number(30),
    position(number(100), number(200)),
    {}
))

testParse(`rotate shape by 30 about (100,200) take 1.25`, 
  rotate(
    variableValue(`shape`),
    number(30),
    position(number(100), number(200)),
    { take: number(1.25) }
))

testParse(`set a.width 100`,
  set(leftQualifier(variableValue(`a`), `attr`, identifier(`width`)), number(100)))
testParse(`set a.width 100 take 1.5`,
  set(leftQualifier(variableValue(`a`), `attr`, identifier(`width`)), number(100), { take: number(1.5) }))

testParse(`set r, 50`,
  set(identifier(`r`), number(50)))

