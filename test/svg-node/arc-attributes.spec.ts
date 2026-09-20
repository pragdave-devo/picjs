import { renderToStringAsync } from "../../src/render-to-string.js"

// Arc was a third copy of the line-renderer scaffolding, and had drifted the
// same way Polyline did: no Convert.rotation, so `rotation` was ignored, and
// `turn`/`rotation` were never stripped so they leaked onto the <path> as
// attributes that mean nothing in SVG.

async function render(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false })
  expect(r.error).toBeUndefined()
  return r
}

async function pathAttrs(src: string) {
  return (await render(src)).svg.match(/<path[^>]*>/)?.[0] ?? ""
}

describe(`Arc attributes`, () => {
  it(`applies rotation`, async () => {
    const r = await render(`Arc from (0,0) to (1,1) rotation 45`)
    expect(r.svg).toMatch(/transform="[^"]*rotate\(45/)
  })

  it(`does not leak turn onto the path`, async () => {
    expect(await pathAttrs(`Arc from (0,0) to (1,1) cw`)).not.toMatch(/\bturn=/)
  })

  it(`does not leak rotation onto the path`, async () => {
    expect(await pathAttrs(`Arc from (0,0) to (1,1) cw`)).not.toMatch(/\brotation=/)
  })

  it(`still distinguishes cw from ccw`, async () => {
    const cw  = await pathAttrs(`Arc from (0,0) to (2,2) cw`)
    const ccw = await pathAttrs(`Arc from (0,0) to (2,2) ccw`)
    expect(cw).not.toEqual(ccw)
  })

  it(`still draws end markers`, async () => {
    const r = await render(`Arc -> from (0,0) to (2,2)`)
    expect((r.svg.match(/<path/g) || []).length).toBeGreaterThan(1)
  })
})
