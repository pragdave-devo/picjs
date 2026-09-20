import { renderToStringAsync } from "../../src/render-to-string.js"

// A group can paint a background behind its children and hold them away from
// its edges. Before this, every diagram that wanted one drew a box by hand and
// sized it from the group's own dimensions.

async function render(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false })
  expect(r.error).toBeUndefined()
  return r
}

async function rectsOf(src: string) {
  return [...(await render(src)).svg.matchAll(/<rect[^>]*>/g)].map(m => m[0])
}

const numAttr = (el: string, name: string) =>
  Number(el.match(new RegExp(`${name}="([^"]*)"`))?.[1])

describe(`group background`, () => {
  it(`paints a rect when a fill is given`, async () => {
    const rects = await rectsOf(`Group fill ~red { Box }`)
    expect(rects.length).toBe(2)             // background + the box
    expect(rects[0]).toMatch(/fill="#ff0000"/)
  })

  it(`paints nothing when the group is unstyled`, async () => {
    expect((await rectsOf(`Group { Box }`)).length).toBe(1)
  })

  it(`draws the background behind the children`, async () => {
    const svg = (await render(`Group fill ~red { Box }`)).svg
    expect(svg.indexOf(`#ff0000`)).toBeLessThan(svg.indexOf(`data-jp-id="SBox`))
  })

  it(`uses a palette fill through its slot class`, async () => {
    expect((await rectsOf(`Group fill ~b3 { Box }`))[0]).toMatch(/class="pj-fill-[\w-]+"/)
  })

  it(`accepts stroke, thickness and a line style`, async () => {
    const bg = (await rectsOf(`Group stroke ~blue thickness 0.1 dashed { Box }`))[0]
    expect(bg).toMatch(/stroke="#0000ff"/)
    expect(bg).toMatch(/stroke-width="0.1"/)
    expect(bg).toMatch(/stroke-dasharray=/)
  })

  it(`rounds its corners`, async () => {
    const bg = (await rectsOf(`Group fill ~red radius 0.2 { Box }`))[0]
    expect(numAttr(bg, `rx`)).toBeCloseTo(0.2, 6)
    expect(numAttr(bg, `ry`)).toBeCloseTo(0.2, 6)
  })
})

describe(`group padding`, () => {
  it(`grows the group in both directions`, async () => {
    const bare = await render(`Group fill ~red { Box }`)
    const padded = await render(`Group fill ~red pad 0.3 { Box }`)
    expect(padded.width).toBeCloseTo(bare.width + 0.6, 6)
    expect(padded.height).toBeCloseTo(bare.height + 0.6, 6)
  })

  it(`takes a separate horizontal and vertical pad`, async () => {
    const bare = await render(`Group fill ~red { Box }`)
    const padded = await render(`Group fill ~red pad (0.3, 0.2) { Box }`)
    expect(padded.width).toBeCloseTo(bare.width + 0.6, 6)
    expect(padded.height).toBeCloseTo(bare.height + 0.4, 6)
  })

  it(`leaves the children where they were`, async () => {
    const boxOf = async (src: string) => (await rectsOf(src)).find(r => /SBox/.test(r))!
    const bare = await boxOf(`Group fill ~red { Box }`)
    const padded = await boxOf(`Group fill ~red pad 0.3 { Box }`)
    expect(numAttr(padded, `x`)).toBeCloseTo(numAttr(bare, `x`), 6)
    expect(numAttr(padded, `y`)).toBeCloseTo(numAttr(bare, `y`), 6)
  })

  it(`sizes the background to include the padding`, async () => {
    const bg = (await rectsOf(`Group fill ~red pad 0.3 { Box }`))[0]
    const box = (await rectsOf(`Group fill ~red pad 0.3 { Box }`)).find(r => /SBox/.test(r))!
    expect(numAttr(bg, `width`)).toBeCloseTo(numAttr(box, `width`) + 0.6, 6)
  })

  it(`still grows the group when nothing is painted`, async () => {
    const bare = await render(`Group { Box }`)
    const padded = await render(`Group pad 0.3 { Box }`)
    expect(padded.width).toBeCloseTo(bare.width + 0.6, 6)
    expect(await rectsOf(`Group pad 0.3 { Box }`)).toHaveLength(1)
  })

  it(`accepts pad as an abbreviation of padding`, async () => {
    const a = await render(`Group fill ~red padding 0.3 { Box }`)
    const b = await render(`Group fill ~red pad 0.3 { Box }`)
    expect(a.width).toBeCloseTo(b.width, 6)
  })
})

describe(`where group options may appear`, () => {
  it(`accepts options before the block`, async () => {
    expect((await rectsOf(`Group fill ~red { Box }`)).length).toBe(2)
  })

  it(`still accepts options after the block`, async () => {
    expect((await rectsOf(`Group { Box } fill ~red`)).length).toBe(2)
  })

  it(`accepts options after a bare block`, async () => {
    expect((await rectsOf(`{ Box } fill ~red`)).length).toBe(2)
  })

  it(`keeps the with constraint working alongside them`, async () => {
    const r = await render(`Group fill ~red pad 0.2 { Box } with .nw at (0,0)`)
    expect(r.svg).toMatch(/<rect/)
  })

  it(`rotates the background with the group`, async () => {
    expect((await render(`Group fill ~red { Box } rotation 45`)).svg).toMatch(/rotate\(45/)
  })
})
