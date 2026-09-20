import { renderToStringAsync } from "../../src/render-to-string.js"

// The grammar parses most options for most shapes, so a shape could be handed
// an attribute it does not honour and quietly discard it — a group accepted
// `fill` and threw it away. src/shapes/attributes.ts says what each shape
// actually takes, and both inline attributes and `Shape.attr = …` defaults are
// checked against it.

async function render(src: string) {
  return await renderToStringAsync(src, { includeSource: false })
}

async function errorFrom(src: string) {
  const r = await render(src)
  expect(r.error).toBeDefined()
  return r.error!
}

describe(`rejecting attributes a shape does not have`, () => {
  it(`rejects fill on a group, which paints nothing of its own`, async () => {
    expect(await errorFrom(`Group { Box } fill ~red`)).toMatch(/"Group" has no attribute "fill"/)
  })

  it(`rejects stroke on a group`, async () => {
    expect(await errorFrom(`Group { Box } stroke ~red`)).toMatch(/has no attribute "stroke"/)
  })

  it(`rejects a text attribute set as a Box default`, async () => {
    expect(await errorFrom(`Box.align = "w"\nBox "x"`)).toMatch(/"Box" has no attribute "align"/)
  })

  it(`names the attributes the shape does accept`, async () => {
    const message = await errorFrom(`Group { Box } fill ~red`)
    expect(message).toMatch(/It accepts: .*rotation/)
  })

  it(`still allows what a group does honour`, async () => {
    expect((await render(`Group { Box } rotation 45`)).error).toBeUndefined()
    expect((await render(`Group { Box } opacity 0.5`)).error).toBeUndefined()
  })
})

describe(`attributes shared across aliased shapes`, () => {
  // `Line` names both SLine and SPolyline, and some attributes belong to only
  // one of them.
  it(`accepts Line.rx, which rounds polyline corners`, async () => {
    expect((await render(`Line.rx = 0.2\nLine from (0,0) then to (1,1) then to (2,0)`)).error)
      .toBeUndefined()
  })

  it(`accepts Line.length, which only a two-point line has`, async () => {
    expect((await render(`Line.length = 2\nLine from (0,0)`)).error).toBeUndefined()
  })

  it(`rejects an attribute neither of them has`, async () => {
    expect(await errorFrom(`Line.maxwidth = 3\nLine from (0,0) to (1,1)`))
      .toMatch(/has no attribute "maxwidth"/)
  })
})

describe(`attributes that remain valid`, () => {
  const valid = [
    `Box width 2 height 1 rx 0.1 fill ~red stroke ~blue thickness 0.1 opacity 0.5`,
    `Circle radius 0.8 fill ~red`,
    `Ellipse rx 1 ry 2`,
    `Oval 2 x 1`,
    `Label "x" align .w maxwidth 10 line_height 1.2 font_weight bold`,
    `Line from (0,0) to (2,2) dashed`,
    // `length` applies only to a line with one endpoint; with both it would
    // contradict them, and the grammar accepts it only on the one-ended forms.
    `Line from (0,0) length 3`,
    `Arc from (0,0) to (1,1) turn ccw`,
    `Box.fill = ~red`,
    `Label.font_size = 0.2`,
  ]
  for (const src of valid) {
    it(`accepts: ${src}`, async () => {
      expect((await render(src)).error).toBeUndefined()
    })
  }
})

// A default setter's attribute name comes from the grammar's AttrName rule,
// which yields the text the user typed. Every documented abbreviation was
// therefore stored under a name nothing read, so `Box.wid = 3` silently did
// nothing. Inline `Box wid 3` was always fine.
describe(`abbreviations in shape defaults`, () => {
  async function widthOf(src: string) {
    const r = await render(src)
    expect(r.error).toBeUndefined()
    return r.width
  }

  it(`treats wid as width`, async () => {
    expect(await widthOf(`Box.wid = 3\nBox`)).toBeCloseTo(await widthOf(`Box.width = 3\nBox`), 5)
  })

  it(`treats ht as height`, async () => {
    const r = await render(`Box.ht = 2\nBox`)
    expect(r.error).toBeUndefined()
    expect(r.height).toBeCloseTo(2, 5)
  })

  it(`treats rot as rotation`, async () => {
    expect((await render(`Box.rot = 45\nBox`)).svg).toMatch(/rotate\(45/)
  })

  it(`treats len as length`, async () => {
    expect(await widthOf(`Line.len = 3\nLine from (0,0)`)).toBeCloseTo(3, 5)
  })

  it(`treats thick as stroke_width`, async () => {
    expect((await render(`Box.thick = 0.2\nBox`)).svg).toMatch(/stroke-width="0\.2"/)
  })

  it(`gives a circle a single radius`, async () => {
    const rad = await widthOf(`Circle.rad = 1\nCircle`)
    expect(rad).toBeCloseTo(await widthOf(`Circle.r = 1\nCircle`), 5)
    expect(rad).toBeCloseTo(await widthOf(`Circle.radius = 1\nCircle`), 5)
  })

  it(`gives a box a pair of corner radii`, async () => {
    expect((await render(`Box.radius = 0.3\nBox`)).svg).toMatch(/rx="0\.3"[^>]*ry="0\.3"/)
  })
})
