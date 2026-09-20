import { renderToStringAsync } from "../../src/render-to-string.js"

// docs/picjs-reference.md "Font Specification" documents
//   font [style] [variant] [weight] [stretch] <size>[/<line-height>] <family>
// The `font <spec>` form sets font-size correctly on the <text> element, but
// the server-side bounding-box estimate ignores it and measures the label at
// the default 0.14, so the text overflows its computed box and any shape laid
// out relative to it is misplaced. The bare-size form (`Label "x" 24pt`) is
// measured correctly.

async function render(src: string) {
  const r = await renderToStringAsync(src, { includeSource: false })
  expect(r.error).toBeUndefined()
  return r
}

async function fontAttrs(src: string) {
  const r = await render(src)
  const text = r.svg.match(/<text[^>]*>/)?.[0] ?? ""
  return {
    size: text.match(/font-size="([^"]*)"/)?.[1],
    weight: text.match(/font-weight="([^"]*)"/)?.[1],
    style: text.match(/font-style="([^"]*)"/)?.[1],
    family: text.match(/font-family="([^"]*)"/)?.[1],
  }
}

describe(`font specification`, () => {
  it(`applies the size from a font spec`, async () => {
    const spec = await fontAttrs(`Label "x" font bold 24pt Georgia`)
    const bare = await fontAttrs(`Label "x" 24pt`)
    expect(spec.size).toEqual(bare.size)
  })

  it(`measures a font-spec label at its specified size`, async () => {
    const spec = await render(`Label "x" font 24pt Georgia`)
    const bare = await render(`Label "x" 24pt`)
    expect(spec.height).toBeCloseTo(bare.height, 5)
  })

  it(`measures a font-spec label as taller than the default size`, async () => {
    const spec = await render(`Label "x" font 24pt Georgia`)
    const dflt = await render(`Label "x"`)
    expect(spec.height).toBeGreaterThan(dflt.height)
  })

  it(`applies the weight from a font spec`, async () => {
    const { weight } = await fontAttrs(`Label "x" font bold 24pt Georgia`)
    expect(weight).toEqual(`bold`)
  })

  it(`applies the family from a font spec`, async () => {
    const { family } = await fontAttrs(`Label "x" font bold 24pt Georgia`)
    expect(family).toContain(`Georgia`)
  })

  it(`applies the style from a font spec`, async () => {
    const { style } = await fontAttrs(`Label "x" font italic 24pt Georgia`)
    expect(style).toEqual(`italic`)
  })
})

describe(`font spec and measurement`, () => {
  it(`lets the font spec win over a separate font_size, as the renderer does`, async () => {
    const both = await render(`Label "x" font_size 12pt font 24pt Georgia`)
    const specOnly = await render(`Label "x" font 24pt Georgia`)
    expect(both.height).toBeCloseTo(specOnly.height, 5)
  })

  it(`uses the line height from a font spec`, async () => {
    const tall = await render(`Label """a\n\nb""" font 12pt/2 Georgia`)
    const short = await render(`Label """a\n\nb""" font 12pt Georgia`)
    expect(tall.height).toBeGreaterThan(short.height)
  })

  it(`still measures a plain font_size label correctly`, async () => {
    const big = await render(`Label "x" font_size 24pt`)
    const small = await render(`Label "x" font_size 12pt`)
    expect(big.height).toBeGreaterThan(small.height)
  })
})
