import { testParse, shape, string, number } from "../helpers/ast.js"

const n = (val: number) => number(val)
const s = (val: string) => string(val)

// Label with maxwidth
testParse(
  `Label "hello" maxwidth 20`,
  shape(`SLabel`, { text: s(`hello`), maxwidth: n(20) })
)

// Label with align
testParse(
  `Label "hello" align .w`,
  shape(`SLabel`, { text: s(`hello`), align: s(`w`) })
)

testParse(
  `Label "hello" align .e`,
  shape(`SLabel`, { text: s(`hello`), align: s(`e`) })
)

testParse(
  `Label "hello" align .c`,
  shape(`SLabel`, { text: s(`hello`), align: s(`c`) })
)

// Label with both maxwidth and align
testParse(
  `Label "hello" maxwidth 30 align .w`,
  shape(`SLabel`, { text: s(`hello`), maxwidth: n(30), align: s(`w`) })
)

// Box with rich label containing maxwidth
testParse(
  `Box ("long text" maxwidth 10)`,
  shape(`SBox`, {
    label: {
      type: `Shape`,
      shape: `SLabel`,
      args: { text: s(`long text`), maxwidth: n(10) },
      withConstraint: null,
    }
  })
)

// Label with font size (number + unit)
testParse(
  `Label "hello" 14pt`,
  shape(`SLabel`, { text: s(`hello`), "font_size": s(`14pt`) })
)

// Label with named font size
testParse(
  `Label "hello" x-large`,
  shape(`SLabel`, { text: s(`hello`), "font_size": s(`x-large`) })
)

// Label.maxwidth as a default setter
testParse(
  `Label.maxwidth = 25`,
  {
    type: `ShapeDefaultSetter`,
    shape: `SLabel`,
    klass: `.normal`,
    attr: `maxwidth`,
    value: n(25),
  }
)
