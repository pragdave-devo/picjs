import { renderToStringAsync } from "../../src/render-to-string.js"

// docs/quick-reference.md lists `thickness` / `stroke_width` as one attribute,
// and `stroke_width` appears in the reference's attribute-keyword list, but the
// grammar has no SEStrokeAttr production for it — `Box stroke_width 0.1`
// mis-parses into a bare Box plus a stray variable reference.

async function strokeWidthOf(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false })
  expect(r.error).toBeUndefined()
  return r.svg.match(/stroke-width="([^"]*)"/)?.[1]
}

describe(`stroke_width as a shape option`, () => {
  it(`is accepted on a Box`, async () => {
    const r = await renderToStringAsync(`Box stroke_width 0.1`, { includeSource: false })
    expect(r.error).toBeUndefined()
  })

  it(`is a synonym for thickness`, async () => {
    expect(await strokeWidthOf(`Box stroke_width 0.1`))
      .toEqual(await strokeWidthOf(`Box thickness 0.1`))
  })

  it(`is accepted on a Line`, async () => {
    const r = await renderToStringAsync(`Line from (0,0) to (1,1) stroke_width 0.1`,
                                        { includeSource: false })
    expect(r.error).toBeUndefined()
  })
})
