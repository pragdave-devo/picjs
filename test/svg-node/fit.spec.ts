import { renderToStringAsync } from "../../src/render-to-string.js"

// `fit` is documented as "Auto-size to fit content" (docs/picjs-reference.md
// "Other Options", quick-reference lists it for every shape). The grammar's
// SEFit returns a raw `true` rather than an AST node, so any use of it crashes
// with "No visitor defined for node type undefined".

async function render(src: string) {
  return await renderToStringAsync(src, { includeSource: false })
}

async function widthOf(src: string) {
  const r = await render(src)
  expect(r.error).toBeUndefined()
  return r.width
}

describe(`fit`, () => {
  it(`renders a bare fit shape`, async () => {
    const r = await render(`Box fit`)
    expect(r.error).toBeUndefined()
  })

  it(`renders a fit shape with a label`, async () => {
    const r = await render(`Box fit "hello"`)
    expect(r.error).toBeUndefined()
  })

  it(`grows a shape to fit a long label`, async () => {
    const short = await widthOf(`Box fit "x"`)
    const long = await widthOf(`Box fit "a considerably longer piece of text"`)
    expect(long).toBeGreaterThan(short)
  })

  it(`shrinks a shape below its default width for a short label`, async () => {
    const fitted = await widthOf(`Box fit "x"`)
    const unfitted = await widthOf(`Box "x"`)
    expect(fitted).toBeLessThan(unfitted)
  })
})

describe(`fit with several labels`, () => {
  it(`sizes to the widest label regardless of order`, async () => {
    const longFirst = await widthOf(`Box fit "a considerably longer first label" "b"`)
    const longLast  = await widthOf(`Box fit "b" "a considerably longer first label"`)
    expect(longFirst).toBeCloseTo(longLast, 5)
  })

  it(`is wider than the same shape with only the short label`, async () => {
    const both = await widthOf(`Box fit "b" "a considerably longer second label"`)
    const shortOnly = await widthOf(`Box fit "b"`)
    expect(both).toBeGreaterThan(shortOnly)
  })
})
