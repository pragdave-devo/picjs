import { test, expect, Page } from '@playwright/test'
import { renderToStringAsync } from '../../src/render-to-string.js'

// A label's reserved box has to hold the text it draws. Aligned text is inset
// by half the font size to keep it off the edge of a containing shape — but a
// standalone label's "container" is itself, so the inset pushed the text out
// of its own box and into whatever came next.

async function inkVsBox(page: Page, source: string) {
  const { svg } = await renderToStringAsync(source, { includeSource: false, padding: 0 })
  await page.setContent(`<body style="margin:0">${svg}</body>`)
  return await page.evaluate(() => {
    const s = document.querySelector('svg') as SVGSVGElement
    const [vx, vy, vw, vh] = s.getAttribute('viewBox')!.split(/\s+/).map(Number)
    const t = s.querySelector('text') as SVGTextElement
    const b = t.getBBox()
    return { overLeft: vx - b.x, overRight: (b.x + b.width) - (vx + vw) }
  })
}

for (const src of [`Label "Title" .h1`, `Label "Title"`, `Label "Wider text here" .h2`]) {
  test(`text stays inside its box: ${src}`, async ({ page }) => {
    const { overLeft, overRight } = await inkVsBox(page, src)
    expect(overLeft).toBeLessThanOrEqual(0.001)
    expect(overRight).toBeLessThanOrEqual(0.001)
  })
}

test('a label does not collide with what follows it', async ({ page }) => {
  const { svg } = await renderToStringAsync(`Label "Title" .h1\nLabel "after"`,
                                            { includeSource: false, padding: 0 })
  await page.setContent(`<body style="margin:0">${svg}</body>`)
  const gap = await page.evaluate(() => {
    const t = [...document.querySelectorAll('text')] as SVGTextElement[]
    const a = t[0].getBBox(), b = t[1].getBBox()
    return b.x - (a.x + a.width)
  })
  expect(gap).toBeGreaterThanOrEqual(-0.001)
})
