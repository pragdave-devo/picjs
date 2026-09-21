import { renderToStringAsync } from "../../src/render-to-string.js"

// `Goto <distance>` moves that far in the current direction. It shares its
// grammar with `Goto <position>` — both are just expressions — so which one is
// meant can only be told from the value.

async function boxes(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false, padding: 0 })
  expect(r.error).toBeUndefined()
  return [...r.svg.matchAll(/<rect[^>]*>/g)].map(m => {
    const n = (a: string) => Number(m[0].match(new RegExp(`\\b${a}="([^"]*)"`))![1])
    return { x: n(`x`) + n(`width`) / 2, y: n(`y`) + n(`height`) / 2 }
  })
}

describe(`Goto`, () => {
  it(`takes a bare distance in the current direction`, async () => {
    const got = await boxes(`Box\nGoto 3\nBox`)
    expect(got).toHaveLength(2)
    expect(got[1].x).toBeCloseTo(3, 6)
    expect(got[1].y).toBeCloseTo(0, 6)
  })

  it(`matches the explicit cardinal form`, async () => {
    const bare = await boxes(`Box\nGoto 3\nBox`)
    const named = await boxes(`Box\nGoto east 3\nBox`)
    expect(bare[1].x).toBeCloseTo(named[1].x, 6)
  })

  it(`follows the current direction`, async () => {
    const got = await boxes(`Face s\nBox\nGoto 2\nBox`)
    expect(got[1].x).toBeCloseTo(0, 6)
    expect(got[1].y).toBeCloseTo(2, 6)
  })

  it(`still accepts a position`, async () => {
    const got = await boxes(`Box\nGoto (3, 1)\nBox`)
    expect(got[1].x).toBeCloseTo(3, 6)
    expect(got[1].y).toBeCloseTo(1, 6)
  })

  it(`still accepts a cardinal with no distance`, async () => {
    const got = await boxes(`Box\nGoto east\nBox`)
    expect(got[1].x).toBeCloseTo(1, 6)
  })
})
