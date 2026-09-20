import { renderToStringAsync } from "../../src/render-to-string.js"

// `straight`, `stepped` and `smooth` are documented line shapes
// (docs/picjs-reference.md "Line Shape"). Only `straight` has any effect:
// Line.pathForLine() implements smoothLine()/steppedLine() but never reaches
// them, and Polyline.pathForPolyline() has no branch for either.

async function pathOf(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false })
  expect(r.error).toBeUndefined()
  return r.svg.match(/ d="([^"]*)"/)?.[1] ?? ""
}

describe(`line shape: two-point lines`, () => {
  it(`draws a stepped line with axis-aligned segments`, async () => {
    const stepped = await pathOf(`Line from (0,0) to (2,2) stepped`)
    const straight = await pathOf(`Line from (0,0) to (2,2) straight`)
    expect(stepped).not.toEqual(straight)
  })

  it(`draws a smooth line as a curve`, async () => {
    const smooth = await pathOf(`Line from (0,0) to (2,2) smooth`)
    expect(smooth).toMatch(/[CQS]/)
  })
})

describe(`line shape: polylines`, () => {
  it(`draws a stepped polyline with axis-aligned segments`, async () => {
    const stepped = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) stepped`)
    const straight = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) straight`)
    expect(stepped).not.toEqual(straight)
  })

  it(`draws a smooth polyline as curves`, async () => {
    const smooth = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) smooth`)
    expect(smooth).toMatch(/[CQS]/)
  })

  it(`treats curved as a synonym for smooth`, async () => {
    const curved = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) curved`)
    const smooth = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) smooth`)
    expect(curved).toEqual(smooth)
  })

  it(`rounds polyline corners with radius`, async () => {
    const rounded = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) radius 0.2`)
    expect(rounded).toContain(`A `)
  })
})

// Helper: pull the point list out of a path made only of M/L commands.
function pointsOf(d: string): [number, number][] {
  return [...d.matchAll(/[ML] (-?[\d.]+) (-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])])
}

describe(`stepped polylines`, () => {
  it(`emits only axis-aligned segments`, async () => {
    const d = await pathOf(`Line from (0,0) then to (2,2) then to (4,0) stepped`)
    const pts = pointsOf(d)
    expect(pts.length).toBeGreaterThan(3)
    for (let i = 1; i < pts.length; i++) {
      const dx = Math.abs(pts[i][0] - pts[i - 1][0])
      const dy = Math.abs(pts[i][1] - pts[i - 1][1])
      expect(Math.min(dx, dy)).toBeCloseTo(0, 6)
    }
  })

  it(`leaves already axis-aligned segments alone`, async () => {
    const stepped = await pathOf(`Line from (0,0) then to (0,2) then to (3,2) stepped`)
    const straight = await pathOf(`Line from (0,0) then to (0,2) then to (3,2) straight`)
    expect(stepped).toEqual(straight)
  })

  it(`never doubles back on itself`, async () => {
    const pts = pointsOf(await pathOf(`Line from (0,0) then to (2,2) then to (4,0) stepped`))
    const legs = pts.slice(1).map((p, i) => [Math.sign(p[0] - pts[i][0]), Math.sign(p[1] - pts[i][1])])
    for (let i = 1; i < legs.length; i++) {
      const reversed = legs[i][0] === -legs[i - 1][0] && legs[i][1] === -legs[i - 1][1]
      expect(reversed).toBe(false)
    }
  })

  it(`still passes through the final waypoint`, async () => {
    const pts = pointsOf(await pathOf(`Line from (0,0) then to (2,2) then to (4,0) stepped`))
    expect(pts[0]).toEqual([0, 0])
    expect(pts[pts.length - 1]).toEqual([4, 0])
  })
})

describe(`smooth polylines`, () => {
  it(`passes through every waypoint`, async () => {
    const d = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) smooth`)
    expect(d).toMatch(/^M 0 0/)
    expect(d).toContain(`1 2`)
    expect(d).toContain(`2 0`)
  })

  it(`differs from the straight path`, async () => {
    const smooth = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) smooth`)
    const straight = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) straight`)
    expect(smooth).not.toEqual(straight)
  })

  it(`closes a closed smooth polyline`, async () => {
    const d = await pathOf(`Line from (0,0) then to (1,2) then to (2,0) close smooth`)
    expect(d.trim()).toMatch(/Z$/)
  })
})
