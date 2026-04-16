import { valueOf } from "../helpers/eval.js"

function t(ip: string, expected: any) {
  const result = valueOf(ip)
  it(ip, () => {
    expect(result.value).toBe(expected)
  })
}

describe(`string interpolation`, () => {

  describe(`basic #{expr}`, () => {
    t(`$name = "World" "Hello #{$name}"`, "Hello World")
    t(`$x = 3 "#{$x} items"`, "3 items")
    t(`$x = 3 "#{$x + 1} items"`, "4 items")
    t(`"#{1 + 2}"`, "3")
  })

  describe(`## produces literal #`, () => {
    t(`"Color: ##FF0000"`, "Color: #FF0000")
    t(`"##"`, "#")
    t(`"a ## b"`, "a # b")
  })

  describe(`mixed interpolation and literal #`, () => {
    t(`$n = 5 "###{$n}"`, "#5")
    t(`$n = "x" "#{$n}##"`, "x#")
  })

  describe(`multiple interpolations`, () => {
    t(`$a = "hello" $b = "world" "#{$a} #{$b}"`, "hello world")
    t(`$x = 1 $y = 2 "#{$x}+#{$y}=#{$x+$y}"`, "1+2=3")
  })

  describe(`no interpolation in single-quoted strings`, () => {
    t(`'hello #{world}'`, "hello #{world}")
    t(`'##'`, "##")
  })

  describe(`plain double-quoted strings still work`, () => {
    t(`"hello"`, "hello")
    t(`"no interp"`, "no interp")
  })

  describe(`triple-double-quoted strings support interpolation`, () => {
    t(`$x = "yes" """#{$x}"""`, "yes")
    t(`"""## literal"""`, "# literal")
  })
})
