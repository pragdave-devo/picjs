import { test, expect } from '@playwright/test'

const DIAGRAM = `Box "Start"
-> "Yes" Box "Middle"
-> "No" Box "End"`

test.beforeEach(async ({ page }) => {
  await page.goto('/test/e2e/fixture.html')
  await page.waitForFunction(() => (window as any).__ready === true)
})

test.describe('line label gap - renderAll', () => {
  test('labels on lines do not overlap the line path', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      // Find line path elements (connectors render as <path>)
      const paths = Array.from(svg.querySelectorAll('path[stroke-width]')) as SVGPathElement[]
      const texts = Array.from(svg.querySelectorAll('text')) as SVGTextElement[]
      const issues: string[] = []

      // Find labels that are line labels (not inside boxes, not build stamp)
      const lineLabels = texts.filter(t => {
        const content = t.textContent || ''
        if (content.length <= 4 && /^[A-Z0-9]+$/.test(content)) return false
        const parent = t.closest('g[data-jp-id]')
        if (parent && parent.querySelector('rect')) return false
        return true
      })

      for (const label of lineLabels) {
        const labelBB = label.getBBox()
        const content = label.textContent || ''

        for (const path of paths) {
          const pathBB = path.getBBox()

          // Check bounding box overlap
          const overlapX = labelBB.x < pathBB.x + pathBB.width && labelBB.x + labelBB.width > pathBB.x
          const overlapY = labelBB.y < pathBB.y + pathBB.height && labelBB.y + labelBB.height > pathBB.y

          if (overlapX && overlapY) {
            issues.push(`"${content}" overlaps its line path`)
            break
          }
        }
      }

      return { issues, labelCount: lineLabels.length }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.labelCount).toBeGreaterThan(0)
    expect(result!.issues).toEqual([])
  })
})

test.describe('line label gap - renderToString', () => {
  test('labels on lines do not overlap the line path', async ({ page }) => {
    const result = await page.evaluate(async (src) => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')
      const strResult = await renderToStringAsync(src, { includeSource: false })
      if (strResult.error) return { issues: [strResult.error] }

      const parser = new DOMParser()
      const doc = parser.parseFromString(strResult.svg, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')!
      document.body.appendChild(svgEl)

      const paths = Array.from(svgEl.querySelectorAll('path[stroke-width]')) as SVGPathElement[]
      const texts = Array.from(svgEl.querySelectorAll('text')) as SVGTextElement[]
      const issues: string[] = []

      const lineLabels = texts.filter(t => {
        const content = t.textContent || ''
        if (content.length <= 4 && /^[A-Z0-9]+$/.test(content)) return false
        const parent = t.closest('g[data-jp-id]')
        if (parent && parent.querySelector('rect')) return false
        return true
      })

      for (const label of lineLabels) {
        const labelBB = label.getBBox()
        const content = label.textContent || ''

        for (const path of paths) {
          const pathBB = path.getBBox()
          const overlapX = labelBB.x < pathBB.x + pathBB.width && labelBB.x + labelBB.width > pathBB.x
          const overlapY = labelBB.y < pathBB.y + pathBB.height && labelBB.y + labelBB.height > pathBB.y

          if (overlapX && overlapY) {
            issues.push(`"${content}" overlaps its line path`)
            break
          }
        }
      }

      document.body.removeChild(svgEl)
      return { issues, labelCount: lineLabels.length }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.labelCount).toBeGreaterThan(0)
    expect(result!.issues).toEqual([])
  })
})
