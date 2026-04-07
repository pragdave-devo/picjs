import { testParse, string, shape } from "../helpers/ast.js"

describe(`Triple-quoted strings`, () => {

  testParse(
    `Label """hello"""`,
    shape(`SLabel`, { text: string(`hello`) })
  )

  testParse(
    `Label """line one\nline two"""`,
    shape(`SLabel`, { text: string(`line one\nline two`) })
  )

  testParse(
    `Label """has "quotes" inside"""`,
    shape(`SLabel`, { text: string(`has "quotes" inside`) })
  )

  testParse(
    `Label '''single triple'''`,
    shape(`SLabel`, { text: string(`single triple`) })
  )

  testParse(
    `Label '''line one\nline two'''`,
    shape(`SLabel`, { text: string(`line one\nline two`) })
  )

  testParse(
    `Label '''has 'quotes' inside'''`,
    shape(`SLabel`, { text: string(`has 'quotes' inside`) })
  )
})

describe(`Regular strings still work`, () => {

  testParse(
    `Label "hello"`,
    shape(`SLabel`, { text: string(`hello`) })
  )

  testParse(
    `Label 'hello'`,
    shape(`SLabel`, { text: string(`hello`) })
  )
})
