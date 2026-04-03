import { 
  testParse,
  binop,
  boolean,
  colorModel,
  colorString,
  list,
  number,
  position,
  range,
  string,
  variableValue,
} from "../helpers/ast.js"

const n1 = number(1),
  n2 = number(2),
  n3 = number(3),
  nhalf = number(0.5)

const tests: [string, any ][] = [
    [ `129`,     number(129) ],
    [ `123.25`,  number(123.25) ],
    [ `125e2`,   number(12500) ],
    [ `125e-2`,  number(1.25) ],
    [ `125%`,    number(1.25) ],
    [ `1.25e2%`, number(1.25) ],
 
    // // primaryExpression

    [ `( 123 )`,          number(123) ],

    // boolean

    [ `true`,     boolean(true) ],
    [ `false`,    boolean(false) ],

    // color
    
    [ `rgb(1,2,3)`,     colorModel(`rgb`, n1, n2, n3) ],
    [ `rgb(1,2,3,0.5)`, colorModel(`rgb`, n1, n2, n3, nhalf) ],
    [ `hsl(1,2,3)`,     colorModel(`hsl`, n1, n2, n3) ],
    [ `hsl(1,2,3,0.5)`, colorModel(`hsl`, n1, n2, n3, nhalf) ],
    [ `hsv(1,2,3)`,     colorModel(`hsv`, n1, n2, n3) ],
    [ `hsv(1,2,3,0.5)`, colorModel(`hsv`, n1, n2, n3, nhalf) ],
    [ `#112233`,        colorString(`#112233`) ],
    [ `#11223380`,      colorString(`#11223380`) ],
    [ `#123`,           colorString(`#123`) ],
    [ `#1238`,          colorString(`#1238`) ],

    // position 
    
    [ `(1,2)`,          position(number(1), number(2)) ],
    [ `((1,2))`,        position(number(1), number(2)) ],

    // strings
    
    [ `'Hello'`,          string(`Hello`) ],
    [ `"Hello"`,          string(`Hello`) ],
    [ `"He'llo"`,         string(`He'llo`) ],
    [ `'He"llo'`,         string(`He"llo`) ],
    [ `'He\\'llo'`,       string(`He'llo`) ],
    [ `"He\\"llo"`,       string(`He"llo`) ],
    [ `"Hello\\n"`,       string(`Hello\n`) ],
    [ `"H\\x65llo"`,      string(`Hello`) ],
    [ `"H\\u65llo"`,      string(`Hello`) ],
    [ `"H\\u2022llo"`,    string(`H•llo`) ],

    // variable value
    
    [ `a`,                variableValue(`a`) ],
    [ `a_b`,              variableValue(`a_b`) ],
    [ `a1$b`,             variableValue(`a1$b`) ],
    [ `NowIs`,            variableValue(`NowIs`) ],
    [ `éÉç`,              variableValue(`éÉç`) ],
  
    // array or range
    
    [ `[]`,               list([]) ],
    [ `[ 1 ]`,            list([ number(1) ])],
    [ `[ 1, 2 ]`,         list([ number(1), number(2) ])],
    [ `[ 1, 2, 3 ]`,      list([ number(1), number(2), number(3) ])],
    [ `[1, [ 3, 4 ], 2]`, 
                          list([ number(1), list([number(3), number(4)]), number(2) ])],
    [ `[ 1..2 ]`,         range(number(1), number(2))],
    
    // list with no commas
    [ `[ 1 2 ]`,          list([ number(1), number(2) ])],
    [ `[ 1 2 3 ]`,        list([ number(1), number(2), number(3) ])],
    [ `[1 [ 3 4 + 5 ] 2]`, 
                          list([ number(1), list([number(3), binop(`+`, number(4), number(5))]), number(2) ])],
]

tests.forEach(([given, expected]) => {
  testParse(given, expected)
})


