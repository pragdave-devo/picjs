import { renderToStringAsync } from "../../src/render-to-string.js"

// A label's reserved size must match what the renderer actually draws. These
// drifted because the size estimate and the renderer each implemented their own
// reflow/wrap/line-spacing rules; the estimate wrapped the raw source text
// while the renderer wraps the markdown-stripped runs.

async function measure(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false })
  expect(r.error).toBeUndefined()
  return r
}

describe(`label measurement matches rendering`, () => {
  it(`measures markdown-styled text by its rendered length`, async () => {
    const styled = await measure(`Label "**a** **b** **c** **d** **e**" maxwidth 10`)
    const plain = await measure(`Label "a b c d e" maxwidth 10`)
    expect(styled.height).toBeCloseTo(plain.height, 5)
    expect(styled.width).toBeCloseTo(plain.width, 5)
  })

  it(`measures a link by its visible text, not its target`, async () => {
    const link = await measure(`Label "[go](https://example.com/very/long/path)" maxwidth 10`)
    const plain = await measure(`Label "go" maxwidth 10`)
    expect(link.height).toBeCloseTo(plain.height, 5)
  })

  it(`measures emphasis without its markers`, async () => {
    const em = await measure(`Label "*abcd*"`)
    const plain = await measure(`Label "abcd"`)
    expect(em.width).toBeCloseTo(plain.width, 5)
  })

  it(`still wraps genuinely long styled text`, async () => {
    const long = await measure(`Label "**alpha beta gamma delta epsilon**" maxwidth 10`)
    const short = await measure(`Label "**alpha**" maxwidth 10`)
    expect(long.height).toBeGreaterThan(short.height)
  })
})
