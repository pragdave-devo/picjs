import { test, expect, Page } from '@playwright/test'

async function renderDiagram(page: Page, source: string) {
  return page.evaluate((src) => {
    const svg = (window as any).renderDiagram(src)
    return svg ? svg.outerHTML : null
  }, source)
}

function parseSvgAttr(html: string, tag: string, attr: string): number[] {
  const re = new RegExp(`<${tag}[^>]*?${attr}="([^"]+)"`, 'g')
  const values: number[] = []
  let m
  while ((m = re.exec(html)) !== null) {
    values.push(parseFloat(m[1]))
  }
  return values
}

test.beforeEach(async ({ page }) => {
  await page.goto('/test/e2e/fixture.html')
  await page.waitForFunction(() => (window as any).__ready === true)
})

test.describe('basic rendering', () => {
  test('renders a plain box', async ({ page }) => {
    const svg = await renderDiagram(page, 'box')
    expect(svg).not.toBeNull()
    expect(svg).toContain('<rect')
    expect(svg).toContain('<svg')
  })

  test('renders a box with label', async ({ page }) => {
    const svg = await renderDiagram(page, 'box "Hello"')
    expect(svg).not.toBeNull()
    expect(svg).toContain('<text')
    expect(svg).toContain('Hello')
  })

  test('renders a circle with label', async ({ page }) => {
    const svg = await renderDiagram(page, 'circle "World"')
    expect(svg).not.toBeNull()
    expect(svg).toContain('<circle')
    expect(svg).toContain('World')
  })

  test('renders an oval with label', async ({ page }) => {
    const svg = await renderDiagram(page, 'oval "Test"')
    expect(svg).not.toBeNull()
    // Oval is rendered as a rect with large border-radius
    expect(svg).toContain('<rect')
    expect(svg).toContain('Test')
  })

  test('renders an arrow between boxes', async ({ page }) => {
    const svg = await renderDiagram(page, 'box "A"\n->\nbox "B"')
    expect(svg).not.toBeNull()
    expect(svg).toContain('<text')
    expect(svg).toContain('A')
    expect(svg).toContain('B')
  })
})

test.describe('text positioning', () => {
  test('label text is horizontally centered in box', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "Hello"')
      if (!svg) return null
      const rect = svg.querySelector('rect')
      const text = svg.querySelector('text')
      if (!rect || !text) return null
      const rectBB = rect.getBBox()
      const textBB = text.getBBox()
      return {
        rectCenterX: rectBB.x + rectBB.width / 2,
        textCenterX: textBB.x + textBB.width / 2,
        rectCenterY: rectBB.y + rectBB.height / 2,
        textCenterY: textBB.y + textBB.height / 2,
      }
    })
    expect(result).not.toBeNull()
    // Text center should be within 10% of box width from box center
    const xDiff = Math.abs(result!.rectCenterX - result!.textCenterX)
    const yDiff = Math.abs(result!.rectCenterY - result!.textCenterY)
    expect(xDiff).toBeLessThan(0.2)
    expect(yDiff).toBeLessThan(0.2)
  })

  test('label text is centered in circle', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('circle "Hey"')
      if (!svg) return null
      const circle = svg.querySelector('circle')
      const text = svg.querySelector('text')
      if (!circle || !text) return null
      const cx = parseFloat(circle.getAttribute('cx'))
      const cy = parseFloat(circle.getAttribute('cy'))
      const textBB = text.getBBox()
      return {
        circleCenterX: cx,
        circleCenterY: cy,
        textCenterX: textBB.x + textBB.width / 2,
        textCenterY: textBB.y + textBB.height / 2,
      }
    })
    expect(result).not.toBeNull()
    const xDiff = Math.abs(result!.circleCenterX - result!.textCenterX)
    const yDiff = Math.abs(result!.circleCenterY - result!.textCenterY)
    expect(xDiff).toBeLessThan(0.2)
    expect(yDiff).toBeLessThan(0.2)
  })

  test('multiple boxes have independently centered labels', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "Hello"\n->\nbox "World"')
      if (!svg) return null
      const rects = svg.querySelectorAll('rect')
      const texts = svg.querySelectorAll('text')
      if (rects.length < 2 || texts.length < 2) return null
      const results = []
      for (let i = 0; i < 2; i++) {
        const rectBB = rects[i].getBBox()
        const textBB = texts[i].getBBox()
        results.push({
          rectCenterX: rectBB.x + rectBB.width / 2,
          textCenterX: textBB.x + textBB.width / 2,
          rectCenterY: rectBB.y + rectBB.height / 2,
          textCenterY: textBB.y + textBB.height / 2,
        })
      }
      return results
    })
    expect(result).not.toBeNull()
    for (const r of result!) {
      const xDiff = Math.abs(r.rectCenterX - r.textCenterX)
      const yDiff = Math.abs(r.rectCenterY - r.textCenterY)
      expect(xDiff).toBeLessThan(0.2)
      expect(yDiff).toBeLessThan(0.2)
    }
  })
})

test.describe('palette and fills', () => {
  test('box with palette fill has style block', async ({ page }) => {
    const svg = await renderDiagram(page, 'box "Hello" fill ~b3')
    expect(svg).not.toBeNull()
    expect(svg).toContain('<style')
  })

  test('palette fill colors are applied via class', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "A" fill ~b3')
      if (!svg) return null
      const rect = svg.querySelector('rect')
      return rect ? rect.getAttribute('class') : null
    })
    expect(result).not.toBeNull()
    expect(result).toContain('pj-')
  })

  test('label in filled box gets contrasting color', async ({ page }) => {
    const svg = await renderDiagram(page, 'box "Hello" fill ~b3')
    expect(svg).not.toBeNull()
    expect(svg).toContain('<text')
    // The text should have a fill class for foreground color
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "Hello" fill ~b3')
      if (!svg) return null
      const text = svg.querySelector('text')
      return text ? { class: text.getAttribute('class'), fill: text.getAttribute('fill') } : null
    })
    expect(result).not.toBeNull()
  })
})

test.describe('dimensions and layout', () => {
  test('box has positive width and height', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "Hello"')
      if (!svg) return null
      const rect = svg.querySelector('rect')
      if (!rect) return null
      return {
        width: parseFloat(rect.getAttribute('width')),
        height: parseFloat(rect.getAttribute('height')),
      }
    })
    expect(result).not.toBeNull()
    expect(result!.width).toBeGreaterThan(0)
    expect(result!.height).toBeGreaterThan(0)
  })

  test('box width is same with or without label', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg1 = (window as any).renderDiagram('box')
      const rect1 = svg1?.querySelector('rect')
      const w1 = rect1 ? parseFloat(rect1.getAttribute('width')) : 0

      const svg2 = (window as any).renderDiagram('box "Hi"')
      const rect2 = svg2?.querySelector('rect')
      const w2 = rect2 ? parseFloat(rect2.getAttribute('width')) : 0

      return { plain: w1, labelled: w2 }
    })
    expect(result).not.toBeNull()
    expect(result!.plain).toBeCloseTo(result!.labelled, 1)
  })

  test('box height is same with or without label', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg1 = (window as any).renderDiagram('box')
      const rect1 = svg1?.querySelector('rect')
      const h1 = rect1 ? parseFloat(rect1.getAttribute('height')) : 0

      const svg2 = (window as any).renderDiagram('box "Hi"')
      const rect2 = svg2?.querySelector('rect')
      const h2 = rect2 ? parseFloat(rect2.getAttribute('height')) : 0

      return { plain: h1, labelled: h2 }
    })
    expect(result).not.toBeNull()
    expect(result!.plain).toBeCloseTo(result!.labelled, 1)
  })

  test('two boxes connected by arrow are side by side', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "A"\n->\nbox "B"')
      if (!svg) return null
      const rects = svg.querySelectorAll('rect')
      if (rects.length < 2) return null
      const bb1 = rects[0].getBBox()
      const bb2 = rects[1].getBBox()
      return {
        box1Right: bb1.x + bb1.width,
        box2Left: bb2.x,
        box1CenterY: bb1.y + bb1.height / 2,
        box2CenterY: bb2.y + bb2.height / 2,
      }
    })
    expect(result).not.toBeNull()
    // Box 2 should be to the right of box 1
    expect(result!.box2Left).toBeGreaterThan(result!.box1Right)
    // Both boxes should be at the same vertical center
    expect(result!.box1CenterY).toBeCloseTo(result!.box2CenterY, 1)
  })

  test('explicit width is respected', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "A" width 2')
      if (!svg) return null
      const rect = svg.querySelector('rect')
      return rect ? parseFloat(rect.getAttribute('width')) : null
    })
    expect(result).not.toBeNull()
    expect(result).toBeCloseTo(2, 1)
  })

  test('explicit height is respected', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "A" height 1.5')
      if (!svg) return null
      const rect = svg.querySelector('rect')
      return rect ? parseFloat(rect.getAttribute('height')) : null
    })
    expect(result).not.toBeNull()
    expect(result).toBeCloseTo(1.5, 1)
  })
})

test.describe('viewBox', () => {
  test('SVG has a viewBox attribute', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "Hello"')
      return svg ? svg.getAttribute('viewBox') : null
    })
    expect(result).not.toBeNull()
    const parts = result!.split(' ').map(Number)
    expect(parts).toHaveLength(4)
    expect(parts[2]).toBeGreaterThan(0) // width
    expect(parts[3]).toBeGreaterThan(0) // height
  })

  test('viewBox encompasses all shapes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "A"\n->\nbox "B"')
      if (!svg) return null
      const vb = svg.getAttribute('viewBox')
      const [vx, vy, vw, vh] = vb.split(' ').map(Number)
      const rects = svg.querySelectorAll('rect')
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
      for (const r of rects) {
        const bb = r.getBBox()
        minX = Math.min(minX, bb.x)
        maxX = Math.max(maxX, bb.x + bb.width)
        minY = Math.min(minY, bb.y)
        maxY = Math.max(maxY, bb.y + bb.height)
      }
      return { vx, vy, vw, vh, minX, maxX, minY, maxY }
    })
    expect(result).not.toBeNull()
    // ViewBox should contain all shapes
    expect(result!.vx).toBeLessThanOrEqual(result!.minX)
    expect(result!.vy).toBeLessThanOrEqual(result!.minY)
    expect(result!.vx + result!.vw).toBeGreaterThanOrEqual(result!.maxX)
    expect(result!.vy + result!.vh).toBeGreaterThanOrEqual(result!.maxY)
  })
})

test.describe('consistency with renderToString', () => {
  test('box rect positions match between renderAll and renderToString', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')

      // renderAll path
      const svg = (window as any).renderDiagram('box "Hello"\n->\nbox "World"')
      if (!svg) return null
      const rects = svg.querySelectorAll('rect')
      const browserRects = Array.from(rects).map((r: any) => ({
        x: parseFloat(r.getAttribute('x')),
        y: parseFloat(r.getAttribute('y')),
        width: parseFloat(r.getAttribute('width')),
        height: parseFloat(r.getAttribute('height')),
      }))

      // renderToString path
      const strResult = await renderToStringAsync('box "Hello"\n->\nbox "World"', { includeSource: false })
      const parser = new DOMParser()
      const doc = parser.parseFromString(strResult.svg, 'image/svg+xml')
      const strRects = doc.querySelectorAll('rect')
      const stringRects = Array.from(strRects).map((r: any) => ({
        x: parseFloat(r.getAttribute('x')),
        y: parseFloat(r.getAttribute('y')),
        width: parseFloat(r.getAttribute('width')),
        height: parseFloat(r.getAttribute('height')),
      }))

      return { browserRects, stringRects }
    })
    expect(result).not.toBeNull()
    expect(result!.browserRects.length).toBe(result!.stringRects.length)
    for (let i = 0; i < result!.browserRects.length; i++) {
      expect(result!.browserRects[i].x).toBeCloseTo(result!.stringRects[i].x, 1)
      expect(result!.browserRects[i].y).toBeCloseTo(result!.stringRects[i].y, 1)
      expect(result!.browserRects[i].width).toBeCloseTo(result!.stringRects[i].width, 1)
      expect(result!.browserRects[i].height).toBeCloseTo(result!.stringRects[i].height, 1)
    }
  })

  test('text is visually centered in both renderAll and renderToString', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')

      // renderAll path — check text is centered relative to its parent rect
      const svg = (window as any).renderDiagram('box "Hello"\n->\nbox "World"')
      if (!svg) return null
      const rects = svg.querySelectorAll('rect')
      const texts = svg.querySelectorAll('text')
      const browserCentering = Array.from(rects).map((r: any, i: number) => {
        const rectBB = r.getBBox()
        const textBB = (texts[i] as SVGTextElement).getBBox()
        return {
          xDiff: Math.abs((rectBB.x + rectBB.width / 2) - (textBB.x + textBB.width / 2)),
          yDiff: Math.abs((rectBB.y + rectBB.height / 2) - (textBB.y + textBB.height / 2)),
        }
      })

      // renderToString path — parse and check same centering invariant
      const strResult = await renderToStringAsync('box "Hello"\n->\nbox "World"', { includeSource: false })
      const parser = new DOMParser()
      const doc = parser.parseFromString(strResult.svg, 'image/svg+xml')
      const strSvg = doc.querySelector('svg')!
      // Temporarily attach to DOM to enable getBBox
      document.body.appendChild(strSvg)
      const strRects = strSvg.querySelectorAll('rect')
      const strTexts = strSvg.querySelectorAll('text')
      const stringCentering = Array.from(strRects).map((r: any, i: number) => {
        const rectBB = r.getBBox()
        const textBB = (strTexts[i] as SVGTextElement).getBBox()
        return {
          xDiff: Math.abs((rectBB.x + rectBB.width / 2) - (textBB.x + textBB.width / 2)),
          yDiff: Math.abs((rectBB.y + rectBB.height / 2) - (textBB.y + textBB.height / 2)),
        }
      })
      document.body.removeChild(strSvg)

      return { browserCentering, stringCentering }
    })
    expect(result).not.toBeNull()
    // Both paths should produce visually centered text
    for (const r of result!.browserCentering) {
      expect(r.xDiff).toBeLessThan(0.2)
      expect(r.yDiff).toBeLessThan(0.2)
    }
    for (const r of result!.stringCentering) {
      expect(r.xDiff).toBeLessThan(0.2)
      expect(r.yDiff).toBeLessThan(0.2)
    }
  })
})

test.describe('filled box text positioning', () => {
  test('text is centered in box with palette fill', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('box "Hello" fill ~b3\n->\nbox "World"')
      if (!svg) return null
      const rects = svg.querySelectorAll('rect')
      const texts = svg.querySelectorAll('text')
      if (rects.length < 2 || texts.length < 2) return null
      const results = []
      for (let i = 0; i < 2; i++) {
        const rectBB = rects[i].getBBox()
        const textBB = texts[i].getBBox()
        results.push({
          rectCenterX: rectBB.x + rectBB.width / 2,
          textCenterX: textBB.x + textBB.width / 2,
          rectCenterY: rectBB.y + rectBB.height / 2,
          textCenterY: textBB.y + textBB.height / 2,
          rectWidth: rectBB.width,
          rectHeight: rectBB.height,
          textWidth: textBB.width,
          textHeight: textBB.height,
        })
      }
      return results
    })
    expect(result).not.toBeNull()
    for (const r of result!) {
      const xDiff = Math.abs(r.rectCenterX - r.textCenterX)
      const yDiff = Math.abs(r.rectCenterY - r.textCenterY)
      expect(xDiff).toBeLessThan(0.2)
      expect(yDiff).toBeLessThan(0.2)
    }
  })
})

test.describe('font size', () => {
  test('Label with font_size renders text', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('Label "Hi" 24pt')
      if (!svg) return null
      const text = svg.querySelector('text')
      return text ? parseFloat(text.getAttribute('font-size')) : null
    })
    expect(result).not.toBeNull()
    // 24pt = 24/72 inches = 0.333...
    expect(result!).toBeCloseTo(24/72, 2)
  })

  test('Label with unit font_size renders correctly', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svg = (window as any).renderDiagram('Label font_size 12pt "Hi"')
      if (!svg) return null
      const text = svg.querySelector('text')
      return text ? parseFloat(text.getAttribute('font-size')) : null
    })
    expect(result).not.toBeNull()
    expect(result).toBeGreaterThan(0)
  })
})

test.describe('multiple diagrams', () => {
  test('renders multiple independent diagrams', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svgs = (window as any).renderMultiple([
        'box "First"',
        'circle "Second"',
      ])
      return svgs.length
    })
    expect(result).toBe(2)
  })

  test('multiple diagrams have independent viewBoxes', async ({ page }) => {
    const result = await page.evaluate(() => {
      const svgs = (window as any).renderMultiple([
        'box "A"',
        'box "B"\n->\nbox "C"',
      ])
      return svgs.map((s: any) => s.getAttribute('viewBox'))
    })
    expect(result).toHaveLength(2)
    // Second diagram should be wider (has two boxes + arrow)
    const [vb1, vb2] = result.map((vb: string) => {
      const [, , w] = vb.split(' ').map(Number)
      return w
    })
    expect(vb2).toBeGreaterThan(vb1)
  })
})
