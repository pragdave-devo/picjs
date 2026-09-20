import { renderToStringAsync } from "../../src/render-to-string.js"
import { layoutText } from "../../src/text-layout.js"

// A newline in a label breaks the line. A blank line starts a new paragraph,
// which gets a wider gap. Leading indentation is stripped, so a triple-quoted
// label can be indented to match the surrounding source.

function layout(text: string, maxwidth?: number) {
  return layoutText(text, { fontSize: 0.14, hasParent: false, maxwidth })
}

const textOf = (l: { runs: { text: string }[] }) => l.runs.map(r => r.text).join(``)

describe(`newlines in labels`, () => {
  it(`breaks a line on \\n`, () => {
    const lines = layout(`Wages, profit,\ninterest`).lines
    expect(lines.map(textOf)).toEqual([`Wages, profit,`, `interest`])
  })

  it(`gives the second line a normal line gap`, () => {
    const { lines, lineSpacing } = layout(`a\nb`)
    expect(lines[1].dy).toBeCloseTo(lineSpacing, 6)
  })

  it(`gives a new paragraph a wider gap than a new line`, () => {
    const broken = layout(`a\nb`)
    const paragraphed = layout(`a\n\nb`)
    expect(paragraphed.lines[1].dy).toBeGreaterThan(broken.lines[1].dy)
  })

  it(`strips indentation so a label can follow the source layout`, () => {
    expect(layout(`one\n    two\n\n    three`).lines.map(textOf))
      .toEqual([`one`, `two`, `three`])
  })

  it(`counts broken lines in the measured height`, () => {
    expect(layout(`a\nb\nc`).height).toBeCloseTo(layout(`a`).height + 2 * layout(`a`).lineSpacing, 6)
  })

  it(`keeps emphasis across a break`, () => {
    const lines = layout(`**bold\nstill bold**`).lines
    expect(lines.map(textOf)).toEqual([`bold`, `still bold`])
    expect(lines.every(l => l.runs.every(r => r.type === `strong`))).toBe(true)
  })

  it(`still wraps a long broken line to maxwidth`, () => {
    expect(layout(`alpha beta gamma\nx`, 8).lines.length).toBeGreaterThan(2)
  })
})

describe(`newlines end to end`, () => {
  it(`renders a two-line label as two tspans`, async () => {
    const r = await renderToStringAsync(`Label "Wages, profit,\\ninterest"`, { includeSource: false })
    expect(r.error).toBeUndefined()
    expect((r.svg.match(/<tspan[^>]*x=/g) || []).length).toBe(2)
  })

  it(`makes a two-line label taller than a one-line one`, async () => {
    const two = await renderToStringAsync(`Label "a\\nb"`, { includeSource: false })
    const one = await renderToStringAsync(`Label "a b"`, { includeSource: false })
    expect(two.height).toBeGreaterThan(one.height)
  })
})
