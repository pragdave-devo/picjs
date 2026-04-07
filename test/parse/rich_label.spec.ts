import { testParse, string, number as n, shape, label } from "../helpers/ast.js"

function richLabel(args: any) {
  return {
    type: `Shape`, shape: `SLabel`,
    args, withConstraint: null,
  }
}

describe(`Rich label on shapes`, () => {

  testParse(
    `Circle ("hello" x-small)`,
    shape(`SCircle`, {
      label: richLabel({
        text: string(`hello`),
        "font_size": string(`x-small`),
      }),
    })
  )

  testParse(
    `Box ("title" xx-large)`,
    shape(`SBox`, {
      label: richLabel({
        text: string(`title`),
        "font_size": string(`xx-large`),
      }),
    })
  )
})

describe(`Rich label with full font spec`, () => {

  testParse(
    `Circle ("hello" font bold 12pt Roboto)`,
    shape(`SCircle`, {
      label: richLabel({
        text: string(`hello`),
        font: {
          type: `Font`,
          spec: {
            "font_weight": `bold`,
            "font_size": `12pt`,
            "font_family": `Roboto`,
          },
        },
      }),
    })
  )
})

describe(`Plain labels still work`, () => {

  testParse(
    `Circle "hello"`,
    shape(`SCircle`, {
      label: richLabel({
        text: string(`hello`),
      }),
    })
  )
})
