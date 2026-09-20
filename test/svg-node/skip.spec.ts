import { renderToStringAsync } from "../../src/render-to-string.js"

// Skip moves the layout cursor without drawing. The grammar accepts four forms;
// the `x N y N` and `y N x N` forms build a bare Position as the whole argument
// object instead of `{ at: Position }`, so they crash.

async function render(src: string) {
  return await renderToStringAsync(src, { includeSource: false })
}

describe(`Skip`, () => {
  it(`accepts "Skip to <position>"`, async () => {
    const r = await render(`Box\nSkip to (3,1)\nBox`)
    expect(r.error).toBeUndefined()
  })

  it(`accepts a bare position`, async () => {
    const r = await render(`Box\nSkip (3,1)\nBox`)
    expect(r.error).toBeUndefined()
  })

  it(`accepts "Skip x <n> y <n>"`, async () => {
    const r = await render(`Box\nSkip x 3 y 1\nBox`)
    expect(r.error).toBeUndefined()
  })

  it(`accepts "Skip y <n> x <n>"`, async () => {
    const r = await render(`Box\nSkip y 1 x 3\nBox`)
    expect(r.error).toBeUndefined()
  })

  it(`places the cursor identically for the x/y and positional forms`, async () => {
    const xy = await render(`Box\nSkip x 3 y 1\nBox`)
    const pos = await render(`Box\nSkip (3,1)\nBox`)
    expect(xy.error).toBeUndefined()
    expect(pos.error).toBeUndefined()
    expect({ w: xy.width, h: xy.height }).toEqual({ w: pos.width, h: pos.height })
  })
})
