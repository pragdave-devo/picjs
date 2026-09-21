import { renderToStringAsync } from "../../src/render-to-string.js"

// The diagram's extent used to be taken from each shape's nw and se cardinal
// points. Those are not the corners of a bounding box: a circle's diagonal
// cardinals sit on its circumference, and a rotated shape's corners turn with
// it, so neither is an extreme. Circles were clipped and rotated shapes were
// measured as a sliver.

async function size(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false, padding: 0 })
  expect(r.error).toBeUndefined()
  return { w: r.width, h: r.height }
}

const HALF_DIAGONAL = (1 + 0.75) / Math.SQRT2   // a 1 x 0.75 box turned 45 degrees

describe(`circles are measured to their radius`, () => {
  it(`measures a default circle`, async () => {
    expect(await size(`Circle`)).toEqual({ w: 1, h: 1 })
  })

  it(`measures a large circle, which padding used to hide`, async () => {
    const { w, h } = await size(`circle radius 0.8`)
    expect(w).toBeCloseTo(1.6, 6)
    expect(h).toBeCloseTo(1.6, 6)
  })

  it(`covers every circle in the diagram`, async () => {
    const { h } = await size(`Circle "Node"\ncircle radius 0.8`)
    expect(h).toBeCloseTo(1.6, 6)
  })
})

describe(`rotated shapes are measured where they end up`, () => {
  it(`measures a box turned 45 degrees`, async () => {
    const { w, h } = await size(`Box rotation 45`)
    expect(w).toBeCloseTo(HALF_DIAGONAL, 6)
    expect(h).toBeCloseTo(HALF_DIAGONAL, 6)
  })

  it(`swaps the sides at 90 degrees`, async () => {
    const { w, h } = await size(`Box rotation 90`)
    expect(w).toBeCloseTo(0.75, 6)
    expect(h).toBeCloseTo(1, 6)
  })

  it(`leaves an unrotated box alone`, async () => {
    expect(await size(`Box`)).toEqual({ w: 1, h: 0.75 })
  })
})

describe(`other shapes are unchanged`, () => {
  const cases: [string, number, number][] = [
    [`Ellipse rx 1 ry 0.5`, 2, 1],
    [`Line from (0,0) to (3,1)`, 3, 1],
    [`Line from (0,0) then to (1,2) then to (2,0)`, 2, 2],
    [`Arc from (0,0) to (2,2)`, 2, 2],
    [`Oval 2 x 1`, 2, 1],
  ]
  for (const [src, w, h] of cases) {
    it(`measures ${src}`, async () => {
      const got = await size(src)
      expect(got.w).toBeCloseTo(w, 6)
      expect(got.h).toBeCloseTo(h, 6)
    })
  }
})
