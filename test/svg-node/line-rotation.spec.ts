import { renderToStringAsync } from "../../src/render-to-string.js"

// `rotation` is in SPolyline's defaults row and documented for polylines, but
// Polyline.convertToSVG omitted Convert.rotation while Line applied it — the
// two renderers had drifted because their shared scaffolding was copy-pasted.

async function transformOf(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false })
  expect(r.error).toBeUndefined()
  return r.svg.match(/transform="([^"]*)"/)?.[1]
}

describe(`rotation on line-like shapes`, () => {
  it(`rotates a two-point line`, async () => {
    expect(await transformOf(`Line from (0,0) to (2,0) rotation 45`)).toMatch(/rotate\(45/)
  })

  it(`rotates a polyline`, async () => {
    expect(await transformOf(`Line from (0,0) then to (1,2) then to (2,0) rotation 45`))
      .toMatch(/rotate\(45/)
  })

  it(`rotates a closed polyline`, async () => {
    expect(await transformOf(`Line from (0,0) then to (1,2) then to (2,0) close rotation 90`))
      .toMatch(/rotate\(90/)
  })

  it(`leaves an unrotated polyline untransformed`, async () => {
    expect(await transformOf(`Line from (0,0) then to (1,2) then to (2,0)`)).toBeUndefined()
  })
})
