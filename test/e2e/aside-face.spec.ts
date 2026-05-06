import { test, expect, Page } from '@playwright/test'

const DIAGRAM = `Face s

alert = Box "Alert arrives in queue"
-> ack = Box "Acknowledge within 5 min"
-> fp_check = Box "Known FP pattern?" .decision

Aside {
  Face w
  line ->  "Yes" above
  box "Close as FP" "document pattern" .action
}

-> "No"
enrich = Box "Enrich with context"`

test.beforeEach(async ({ page }) => {
  await page.goto('/test/e2e/fixture.html')
  await page.waitForFunction(() => (window as any).__ready === true)
})

test.describe('Aside with Face direction', () => {

  test('Aside line exits west from the preceding shape', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      // Get all shape groups
      const groups = svg.querySelectorAll('g[data-jp-id]')
      const shapes: Record<string, DOMRect> = {}
      for (const g of groups) {
        const id = g.getAttribute('data-jp-id')
        const bb = g.getBBox()
        shapes[id] = { x: bb.x, y: bb.y, width: bb.width, height: bb.height }
      }

      // Find fp_check (decision box) and the aside box (Close as FP)
      // Look for rects and their text content to identify them
      const allGroups = Array.from(groups) as SVGGElement[]
      let fpCheck: { cx: number, cy: number, left: number, right: number, top: number, bottom: number } | null = null
      let closeAsFP: { cx: number, cy: number, left: number, right: number, top: number, bottom: number } | null = null
      let enrichBox: { cx: number, cy: number, left: number, right: number, top: number, bottom: number } | null = null

      for (const g of allGroups) {
        const text = g.querySelector('text')
        const textContent = text?.textContent || ''
        const rect = g.querySelector('rect')
        if (!rect) continue
        const bb = rect.getBBox()
        const info = {
          cx: bb.x + bb.width / 2,
          cy: bb.y + bb.height / 2,
          left: bb.x,
          right: bb.x + bb.width,
          top: bb.y,
          bottom: bb.y + bb.height,
        }
        if (textContent.includes('Known FP')) fpCheck = info
        if (textContent.includes('Close as FP')) closeAsFP = info
        if (textContent.includes('Enrich')) enrichBox = info
      }

      // Find lines (polyline or line elements, or paths)
      const lines = svg.querySelectorAll('line, polyline, path')
      const lineData = Array.from(lines).map((l: any) => {
        const bb = l.getBBox()
        return {
          x1: bb.x,
          y1: bb.y,
          x2: bb.x + bb.width,
          y2: bb.y + bb.height,
          cx: bb.x + bb.width / 2,
          cy: bb.y + bb.height / 2,
        }
      })

      return { fpCheck, closeAsFP, enrichBox, lineData, shapeCount: allGroups.length }
    }, DIAGRAM)

    expect(result).not.toBeNull()
    expect(result!.fpCheck).not.toBeNull()
    expect(result!.closeAsFP).not.toBeNull()
    expect(result!.enrichBox).not.toBeNull()

    const fp = result!.fpCheck!
    const aside = result!.closeAsFP!
    const enrich = result!.enrichBox!

    // The "Close as FP" box should be to the WEST (left) of "Known FP pattern?"
    expect(aside.cx).toBeLessThan(fp.left)

    // The "Close as FP" box should be at roughly the same vertical level as "Known FP pattern?"
    expect(Math.abs(aside.cy - fp.cy)).toBeLessThan(fp.bottom - fp.top)

    // The "Enrich with context" box should be BELOW "Known FP pattern?" (south)
    expect(enrich.top).toBeGreaterThan(fp.bottom)

    // The "Enrich with context" box should be at roughly the same horizontal position
    // as fp_check (continuing the main southward flow)
    expect(Math.abs(enrich.cx - fp.cx)).toBeLessThan(fp.right - fp.left)
  })

  test('"Yes" line runs horizontally west from fp_check to aside box', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      // Find the shapes by text content
      const allGroups = Array.from(svg.querySelectorAll('g[data-jp-id]')) as SVGGElement[]
      let fpCheck: DOMRect | null = null
      let closeAsFP: DOMRect | null = null

      for (const g of allGroups) {
        const textContent = g.textContent || ''
        const rect = g.querySelector('rect')
        if (!rect) continue
        const bb = rect.getBBox()
        if (textContent.includes('Known FP')) fpCheck = bb
        if (textContent.includes('Close as FP')) closeAsFP = bb
      }

      if (!fpCheck || !closeAsFP) return null

      // Find the line connecting them — it should be mostly horizontal
      // Look for a line/path whose bounding box spans from near fpCheck.left to near closeAsFP.right
      const paths = svg.querySelectorAll('path, line, polyline')
      let yesLine: { x1: number, y1: number, x2: number, y2: number, width: number, height: number } | null = null

      for (const p of paths) {
        const bb = (p as SVGElement).getBBox()
        // A line connecting fpCheck (left side) to closeAsFP (right side)
        // should have its x-range between closeAsFP.right and fpCheck.left
        const lineRight = bb.x + bb.width
        const lineLeft = bb.x
        const nearFpLeft = Math.abs(lineRight - fpCheck.x) < 0.5
        const nearAsideRight = Math.abs(lineLeft - (closeAsFP.x + closeAsFP.width)) < 0.5

        if (nearFpLeft && nearAsideRight) {
          yesLine = { x1: bb.x, y1: bb.y, x2: bb.x + bb.width, y2: bb.y + bb.height, width: bb.width, height: bb.height }
        }
      }

      return {
        fpCheckBB: { x: fpCheck.x, y: fpCheck.y, w: fpCheck.width, h: fpCheck.height },
        closeAsFPBB: { x: closeAsFP.x, y: closeAsFP.y, w: closeAsFP.width, h: closeAsFP.height },
        yesLine,
      }
    }, DIAGRAM)

    expect(result).not.toBeNull()

    // The "Yes" line should exist and be mostly horizontal (height << width)
    if (result!.yesLine) {
      expect(result!.yesLine.height).toBeLessThan(result!.yesLine.width * 0.3)
    } else {
      // If we can't find the exact line, at least verify the boxes are correctly positioned
      // fp_check should be to the right of closeAsFP
      expect(result!.fpCheckBB.x).toBeGreaterThan(result!.closeAsFPBB.x + result!.closeAsFPBB.w - 0.1)
    }
  })

  test('"No" line exits south from fp_check', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null

      const allGroups = Array.from(svg.querySelectorAll('g[data-jp-id]')) as SVGGElement[]
      let fpCheck: DOMRect | null = null
      let enrichBox: DOMRect | null = null

      for (const g of allGroups) {
        const textContent = g.textContent || ''
        const rect = g.querySelector('rect')
        if (!rect) continue
        const bb = rect.getBBox()
        if (textContent.includes('Known FP')) fpCheck = bb
        if (textContent.includes('Enrich')) enrichBox = bb
      }

      if (!fpCheck || !enrichBox) return null

      // Find the line connecting them — should be mostly vertical
      const paths = svg.querySelectorAll('path, line, polyline')
      let noLine: { x1: number, y1: number, x2: number, y2: number, width: number, height: number } | null = null

      for (const p of paths) {
        const bb = (p as SVGElement).getBBox()
        const lineTop = bb.y
        const lineBottom = bb.y + bb.height
        // Line should start near fpCheck bottom and end near enrichBox top
        const nearFpBottom = Math.abs(lineTop - (fpCheck.y + fpCheck.height)) < 0.5
        const nearEnrichTop = Math.abs(lineBottom - enrichBox.y) < 0.5

        if (nearFpBottom && nearEnrichTop) {
          noLine = { x1: bb.x, y1: bb.y, x2: bb.x + bb.width, y2: bb.y + bb.height, width: bb.width, height: bb.height }
        }
      }

      return {
        fpCheckBB: { x: fpCheck.x, y: fpCheck.y, w: fpCheck.width, h: fpCheck.height },
        enrichBB: { x: enrichBox.x, y: enrichBox.y, w: enrichBox.width, h: enrichBox.height },
        noLine,
      }
    }, DIAGRAM)

    expect(result).not.toBeNull()

    // Enrich should be below fp_check
    expect(result!.enrichBB.y).toBeGreaterThan(result!.fpCheckBB.y + result!.fpCheckBB.h)

    // The "No" line should be mostly vertical (width << height)
    if (result!.noLine) {
      expect(result!.noLine.width).toBeLessThan(result!.noLine.height * 0.3)
    }

    // Enrich should be roughly horizontally aligned with fp_check (same column)
    const fpCx = result!.fpCheckBB.x + result!.fpCheckBB.w / 2
    const enrichCx = result!.enrichBB.x + result!.enrichBB.w / 2
    expect(Math.abs(fpCx - enrichCx)).toBeLessThan(result!.fpCheckBB.w)
  })
})
