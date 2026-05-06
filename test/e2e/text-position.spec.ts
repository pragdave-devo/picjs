import { test, expect } from '@playwright/test'

const DIAGRAM = `Palette.current = "sunset"
Box.width = 2.5
Box.height = 0.7
Box.decision.fill = ~b3

Face s

alert = Box "Alert arrives in queue"
-> ack = Box "Acknowledge within 5 min"
-> fp_check = Box "Known FP pattern?" .decision`

test.beforeEach(async ({ page }) => {
  await page.goto('/test/e2e/fixture.html')
  await page.waitForFunction(() => (window as any).__ready === true)
})

test.describe('text position in shapes - renderAll', () => {
  test('text does not overflow box bounds', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      const groups = Array.from(svg.querySelectorAll('g[data-jp-id]')) as SVGGElement[]
      const issues: string[] = []

      for (const g of groups) {
        const rect = g.querySelector('rect')
        const text = g.querySelector('text')
        if (!rect || !text) continue

        const rectBB = rect.getBBox()
        const textBB = text.getBBox()
        const textContent = text.textContent || ''

        // Text should not extend beyond the rect's right edge (with small tolerance)
        const overflow = (textBB.x + textBB.width) - (rectBB.x + rectBB.width)
        if (overflow > 0.05) {
          issues.push(`"${textContent}" overflows right by ${overflow.toFixed(3)}`)
        }

        // Text should not extend beyond the rect's left edge
        const leftOverflow = rectBB.x - textBB.x
        if (leftOverflow > 0.05) {
          issues.push(`"${textContent}" overflows left by ${leftOverflow.toFixed(3)}`)
        }
      }

      return { issues }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.issues).toEqual([])
  })

  test('text is vertically centered in boxes', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      const groups = Array.from(svg.querySelectorAll('g[data-jp-id]')) as SVGGElement[]
      const issues: string[] = []

      for (const g of groups) {
        const rect = g.querySelector('rect')
        const text = g.querySelector('text')
        if (!rect || !text) continue

        const rectBB = rect.getBBox()
        const textBB = text.getBBox()
        const textContent = text.textContent || ''

        const rectCy = rectBB.y + rectBB.height / 2
        const textCy = textBB.y + textBB.height / 2
        const yDiff = Math.abs(rectCy - textCy)

        // Text center should be within 20% of rect height from rect center
        if (yDiff > rectBB.height * 0.2) {
          issues.push(`"${textContent}" y-center off by ${yDiff.toFixed(3)} (rect height ${rectBB.height.toFixed(3)})`)
        }
      }

      return { issues }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.issues).toEqual([])
  })

  test('text is horizontally centered in boxes', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      const groups = Array.from(svg.querySelectorAll('g[data-jp-id]')) as SVGGElement[]
      const issues: string[] = []

      for (const g of groups) {
        const rect = g.querySelector('rect')
        const text = g.querySelector('text')
        if (!rect || !text) continue

        const rectBB = rect.getBBox()
        const textBB = text.getBBox()
        const textContent = text.textContent || ''

        const rectCx = rectBB.x + rectBB.width / 2
        const textCx = textBB.x + textBB.width / 2
        const xDiff = Math.abs(rectCx - textCx)

        // Text center should be within 20% of rect width from rect center
        if (xDiff > rectBB.width * 0.2) {
          issues.push(`"${textContent}" x-center off by ${xDiff.toFixed(3)} (rect width ${rectBB.width.toFixed(3)})`)
        }
      }

      return { issues }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.issues).toEqual([])
  })
})

test.describe('text position in shapes - renderToString', () => {
  test('text does not overflow box bounds', async ({ page }) => {
    const result = await page.evaluate(async (src) => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')
      const strResult = await renderToStringAsync(src, { includeSource: false })
      if (strResult.error) return { issues: [strResult.error] }

      const parser = new DOMParser()
      const doc = parser.parseFromString(strResult.svg, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')!
      document.body.appendChild(svgEl)

      const groups = Array.from(svgEl.querySelectorAll('g[data-jp-id]')) as SVGGElement[]
      const issues: string[] = []

      for (const g of groups) {
        const rect = g.querySelector('rect')
        const text = g.querySelector('text')
        if (!rect || !text) continue

        const rectBB = rect.getBBox()
        const textBB = text.getBBox()
        const textContent = text.textContent || ''

        const overflow = (textBB.x + textBB.width) - (rectBB.x + rectBB.width)
        if (overflow > 0.05) {
          issues.push(`"${textContent}" overflows right by ${overflow.toFixed(3)}`)
        }

        const leftOverflow = rectBB.x - textBB.x
        if (leftOverflow > 0.05) {
          issues.push(`"${textContent}" overflows left by ${leftOverflow.toFixed(3)}`)
        }
      }

      document.body.removeChild(svgEl)
      return { issues }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.issues).toEqual([])
  })

  test('text is vertically centered in boxes', async ({ page }) => {
    const result = await page.evaluate(async (src) => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')
      const strResult = await renderToStringAsync(src, { includeSource: false })
      if (strResult.error) return { issues: [strResult.error] }

      const parser = new DOMParser()
      const doc = parser.parseFromString(strResult.svg, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')!
      document.body.appendChild(svgEl)

      const groups = Array.from(svgEl.querySelectorAll('g[data-jp-id]')) as SVGGElement[]
      const issues: string[] = []

      for (const g of groups) {
        const rect = g.querySelector('rect')
        const text = g.querySelector('text')
        if (!rect || !text) continue

        const rectBB = rect.getBBox()
        const textBB = text.getBBox()
        const textContent = text.textContent || ''

        const rectCy = rectBB.y + rectBB.height / 2
        const textCy = textBB.y + textBB.height / 2
        const yDiff = Math.abs(rectCy - textCy)

        if (yDiff > rectBB.height * 0.2) {
          issues.push(`"${textContent}" y-center off by ${yDiff.toFixed(3)} (rect height ${rectBB.height.toFixed(3)})`)
        }
      }

      document.body.removeChild(svgEl)
      return { issues }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.issues).toEqual([])
  })

  test('text is horizontally centered in boxes', async ({ page }) => {
    const result = await page.evaluate(async (src) => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')
      const strResult = await renderToStringAsync(src, { includeSource: false })
      if (strResult.error) return { issues: [strResult.error] }

      const parser = new DOMParser()
      const doc = parser.parseFromString(strResult.svg, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')!
      document.body.appendChild(svgEl)

      const groups = Array.from(svgEl.querySelectorAll('g[data-jp-id]')) as SVGGElement[]
      const issues: string[] = []

      for (const g of groups) {
        const rect = g.querySelector('rect')
        const text = g.querySelector('text')
        if (!rect || !text) continue

        const rectBB = rect.getBBox()
        const textBB = text.getBBox()
        const textContent = text.textContent || ''

        const rectCx = rectBB.x + rectBB.width / 2
        const textCx = textBB.x + textBB.width / 2
        const xDiff = Math.abs(rectCx - textCx)

        if (xDiff > rectBB.width * 0.2) {
          issues.push(`"${textContent}" x-center off by ${xDiff.toFixed(3)} (rect width ${rectBB.width.toFixed(3)})`)
        }
      }

      document.body.removeChild(svgEl)
      return { issues }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.issues).toEqual([])
  })
})
