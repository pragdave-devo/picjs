import { test, expect } from '@playwright/test'

const DIAGRAM = `Box "Start"
-> "next" Box "End"`

test.beforeEach(async ({ page }) => {
  await page.goto('/test/e2e/fixture.html')
  await page.waitForFunction(() => (window as any).__ready === true)
})

test.describe('line label color - renderAll', () => {
  test('label fill is not white on a page without theme selector', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      const texts = Array.from(svg.querySelectorAll('text')) as SVGTextElement[]
      const issues: string[] = []

      for (const t of texts) {
        const content = t.textContent || ''
        // Skip the build stamp
        if (content.length <= 4 && /^[A-Z0-9]+$/.test(content)) continue

        const computed = window.getComputedStyle(t)
        const fill = computed.fill || t.getAttribute('fill') || ''

        // White (#fff, #ffffff, rgb(255,255,255), white) would be invisible on white background
        const normalized = fill.replace(/\s/g, '').toLowerCase()
        const isWhite = normalized === '#fff' ||
          normalized === '#ffffff' ||
          normalized === 'white' ||
          normalized === 'rgb(255,255,255)'

        if (isWhite) {
          issues.push(`"${content}" has white fill (${fill}) — invisible on white background`)
        }
      }

      return { issues }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.issues).toEqual([])
  })

  test('label inherits page foreground color via currentColor', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      // Find the line label text (not box labels, not build stamp)
      const texts = Array.from(svg.querySelectorAll('text')) as SVGTextElement[]
      const labelTexts = texts.filter(t => {
        const content = t.textContent || ''
        if (content.length <= 4 && /^[A-Z0-9]+$/.test(content)) return false
        // Line labels are not inside a g[data-jp-id] with a rect (those are box labels)
        const parent = t.closest('g[data-jp-id]')
        if (parent && parent.querySelector('rect')) return false
        return true
      })

      // Check that the label's fill resolves to the page's text color
      const bodyColor = window.getComputedStyle(document.body).color
      const issues: string[] = []

      for (const t of labelTexts) {
        const computed = window.getComputedStyle(t)
        const fill = computed.fill
        // Should either be currentColor (which resolves to body color) or explicitly dark
        if (fill !== bodyColor) {
          const normalized = fill.replace(/\s/g, '').toLowerCase()
          const isWhite = normalized === '#fff' ||
            normalized === '#ffffff' ||
            normalized === 'white' ||
            normalized === 'rgb(255,255,255)'
          if (isWhite) {
            issues.push(`"${t.textContent}" fill is ${fill}, expected page foreground (${bodyColor})`)
          }
        }
      }

      return { issues, labelCount: labelTexts.length }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.labelCount).toBeGreaterThan(0)
    expect(result!.issues).toEqual([])
  })
})

test.describe('line label color - renderToString', () => {
  test('label fill is not hardcoded white', async ({ page }) => {
    const result = await page.evaluate(async (src) => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')
      const strResult = await renderToStringAsync(src, { includeSource: false })
      if (strResult.error) return { issues: [strResult.error] }

      const parser = new DOMParser()
      const doc = parser.parseFromString(strResult.svg, 'image/svg+xml')
      const svgEl = doc.querySelector('svg')!
      document.body.appendChild(svgEl)

      const texts = Array.from(svgEl.querySelectorAll('text')) as SVGTextElement[]
      const issues: string[] = []

      for (const t of texts) {
        const content = t.textContent || ''
        if (content.length <= 4 && /^[A-Z0-9]+$/.test(content)) continue

        const parent = t.closest('g[data-jp-id]')
        if (parent && parent.querySelector('rect')) continue

        const computed = window.getComputedStyle(t)
        const fill = computed.fill || t.getAttribute('fill') || ''
        const normalized = fill.replace(/\s/g, '').toLowerCase()
        const isWhite = normalized === '#fff' ||
          normalized === '#ffffff' ||
          normalized === 'white' ||
          normalized === 'rgb(255,255,255)'

        if (isWhite) {
          issues.push(`"${content}" has white fill (${fill}) — invisible on white background`)
        }
      }

      document.body.removeChild(svgEl)
      return { issues }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.issues).toEqual([])
  })
})
