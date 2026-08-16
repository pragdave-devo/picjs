import { test, expect } from '@playwright/test'

// Regression test for GitHub issue #6: a Label positioned with `align .e with
// .e at <point>` gets an outer <text> x/text-anchor that doesn't match where
// its <tspan> children actually render (each tspan carries its own explicit
// x, overriding the parent for display). The browser path measures the real,
// in-DOM extent via getBBox() and is unaffected; the renderToString/SSR path
// has no DOM and falls back to picjs's own (phantom) geometry, inflating the
// viewBox with dead space that corresponds to nothing visible.

const DIAGRAM = `
a = box "A"
Gap 1
b = box "B"
Label "This is a fairly long piece of description text that will wrap across several lines" maxwidth 22 align .e with .e at a.e
`

test.beforeEach(async ({ page }) => {
  await page.goto('/test/e2e/fixture.html')
  await page.waitForFunction(() => (window as any).__ready === true)
})

test.describe('label viewBox with align + with/at positioning - renderAll', () => {
  test('viewBox is not inflated by the label\'s phantom outer <text> x', async ({ page }) => {
    const minX = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null
      const vb = svg.getAttribute('viewBox').split(' ').map(Number)
      return vb[0]
    }, DIAGRAM)

    expect(minX).not.toBeNull()
    // Baseline (same diagram without the label) is minX = -0.7; the bug
    // pulled this out to roughly -5.
    expect(minX).toBeGreaterThan(-1.5)
  })
})

test.describe('label viewBox with align + with/at positioning - renderToString', () => {
  test('viewBox is not inflated by the label\'s phantom outer <text> x', async ({ page }) => {
    const result = await page.evaluate(async (src) => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')
      return renderToStringAsync(src, { includeSource: false })
    }, DIAGRAM)

    expect(result.error).toBeUndefined()
    const m = result.svg.match(/<svg[^>]*viewBox="([^"]*)"/)
    expect(m).not.toBeNull()
    const minX = Number(m![1].split(' ')[0])
    expect(minX).toBeGreaterThan(-1.5)
  })
})

// Related: the SSR height estimate (no real DOM/getBBox available) must
// account for custom line_height and the extra gap between paragraphs, the
// same way renderParagraphs()/renderWrappedLines() do — otherwise a wrapped
// or multi-paragraph label's viewBox height doesn't match what actually
// renders (mirrors the width bug above, on the vertical axis).

async function viewBoxHeight(page: any, src: string, useSsr: boolean) {
  return page.evaluate(async ({ src, useSsr }: { src: string, useSsr: boolean }) => {
    let vb: string
    if (useSsr) {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')
      const result = await renderToStringAsync(src, { includeSource: false })
      vb = result.svg.match(/<svg[^>]*viewBox="([^"]*)"/)![1]
    } else {
      const svg = (window as any).renderDiagram(src)
      vb = svg.getAttribute('viewBox')
    }
    return Number(vb.split(' ')[3])
  }, { src, useSsr })
}

test.describe('label height with custom line_height and multi-paragraph text', () => {
  test('wrapped label with custom line_height: renderToString height matches renderAll', async ({ page }) => {
    const src = `Label "This is a fairly long piece of description text that will wrap across several lines" maxwidth 22 line_height 0.4`
    const browserHeight = await viewBoxHeight(page, src, false)
    const ssrHeight = await viewBoxHeight(page, src, true)
    expect(ssrHeight).toBeCloseTo(browserHeight, 0)
  })

  test('multi-paragraph label: renderToString height matches renderAll', async ({ page }) => {
    const src = `Label "Paragraph one line.\\n\\nParagraph two line."`
    const browserHeight = await viewBoxHeight(page, src, false)
    const ssrHeight = await viewBoxHeight(page, src, true)
    expect(ssrHeight).toBeCloseTo(browserHeight, 0)
  })
})
