import { renderToStringAsync } from "../../src/render-to-string.js"

// `Group` names a real shape — SGroup has a class, a constructor and a row in
// defaults.ts — so it can carry defaults like any other. `Aside` cannot: it
// creates no shape at all, so a default set on it would be stored and never
// read.

async function render(src: string) {
  return await renderToStringAsync(src, { includeSource: false })
}

async function ok(src: string) {
  const r = await render(src)
  expect(r.error).toBeUndefined()
  return r
}

const firstRect = (svg: string) => svg.match(/<rect[^>]*>/)?.[0] ?? ``

describe(`Group defaults`, () => {
  it(`sets a default background fill`, async () => {
    const r = await ok(`Group.fill = ~red\nGroup { Box }`)
    expect(firstRect(r.svg)).toMatch(/fill="#ff0000"/)
  })

  it(`is overridden by the group's own fill`, async () => {
    const r = await ok(`Group.fill = ~red\nGroup fill ~blue { Box }`)
    expect(firstRect(r.svg)).toMatch(/fill="#0000ff"/)
  })

  it(`sets a default padding`, async () => {
    const padded = await ok(`Group.padding = 0.3\nGroup fill ~red { Box }`)
    const bare = await ok(`Group fill ~red { Box }`)
    expect(padded.width).toBeCloseTo(bare.width + 0.6, 6)
  })

  it(`can be read back`, async () => {
    const r = await ok(`Group.fill = ~red\nLabel ("#{Group.fill}")`)
    expect(r.svg).toContain(`#ff0000`)
  })

  it(`rejects an attribute a group does not have`, async () => {
    const r = await render(`Group.width = 2\nGroup { Box }`)
    expect(r.error).toMatch(/"Group" has no attribute "width"/)
  })

  it(`leaves ordinary group syntax alone`, async () => {
    await ok(`Group { Box }`)
    await ok(`Group fill ~red pad 0.2 { Box } with .nw at (0,0)`)
    await ok(`{ Box }`)
  })

  it(`does not affect other shapes`, async () => {
    const r = await ok(`Group.fill = ~red\nBox`)
    expect(firstRect(r.svg)).not.toMatch(/fill="#ff0000"/)
  })
})

describe(`Aside defaults`, () => {
  // Aside creates no shape, so there is nothing for a default to reach. It is
  // left out of ShapeName so this fails loudly rather than doing nothing.
  it(`are refused`, async () => {
    expect((await render(`Aside.fill = ~red\nAside { Box }`)).error).toBeDefined()
  })
})
