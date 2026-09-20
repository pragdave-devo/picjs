import { renderToStringAsync } from "../../src/render-to-string.js"

// A program that draws nothing is valid and should produce an empty SVG rather
// than an internal crash.

async function render(src: string) {
  return await renderToStringAsync(src, { includeSource: false })
}

describe(`programs that produce no shapes`, () => {
  it(`renders an empty source`, async () => {
    const r = await render(``)
    expect(r.error).toBeUndefined()
    expect(r.svg).toContain(`<svg`)
  })

  it(`renders whitespace and comments only`, async () => {
    const r = await render(`// nothing to see here\n\n`)
    expect(r.error).toBeUndefined()
    expect(r.svg).toContain(`<svg`)
  })

  it(`renders a program that only sets a shape default`, async () => {
    const r = await render(`Box.fill = ~red`)
    expect(r.error).toBeUndefined()
    expect(r.svg).toContain(`<svg`)
  })

  it(`renders a program that only inspects a value`, async () => {
    const r = await render(`?? 1 + 2`)
    expect(r.error).toBeUndefined()
    expect(r.svg).toContain(`<svg`)
  })

  it(`renders a program that only assigns`, async () => {
    const r = await render(`x = 10`)
    expect(r.error).toBeUndefined()
    expect(r.svg).toContain(`<svg`)
  })
})
