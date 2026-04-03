import { 
  testParse,
  number,
  colorModel,
  colorString,
} from "../helpers/ast.js"


const n1 = number(1),
  n2 = number(2),
  n3 = number(3),
  nhalf = number(0.5)

testParse(`rgb(1,2,3)`,     colorModel(`rgb`, n1, n2, n3))
testParse(`rgb(1,2,3,0.5)`, colorModel(`rgb`, n1, n2, n3, nhalf))

testParse(`hsl(1,2,3)`,     colorModel(`hsl`, n1, n2, n3))
testParse(`hsl(1,2,3,0.5)`, colorModel(`hsl`, n1, n2, n3, nhalf))

testParse(`hsv(1,2,3)`,     colorModel(`hsv`, n1, n2, n3))
testParse(`hsv(1,2,3,0.5)`, colorModel(`hsv`, n1, n2, n3, nhalf))

testParse(`#112233`,   colorString(`#112233`))
testParse(`#11223380`, colorString(`#11223380`))

testParse(`oklch(70,0.15,180)`,     colorModel(`oklch`, number(70), number(0.15), number(180)))
testParse(`oklch(70,0.15,180,0.5)`, colorModel(`oklch`, number(70), number(0.15), number(180), nhalf))

testParse(`#123`,      colorString(`#123`))
testParse(`#1238`,     colorString(`#1238`))

