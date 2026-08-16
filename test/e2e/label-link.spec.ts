import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/test/e2e/fixture.html')
  await page.waitForFunction(() => (window as any).__ready === true)
})

test.describe('markdown label links - renderAll', () => {
  test('[text](url) renders as a clickable <a href>', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null
      const link = svg.querySelector('a')
      return {
        found: !!link,
        href: link?.getAttribute('href') ?? null,
        text: link?.textContent ?? null,
      }
    }, `box "[Click me](https://example.com)"`)

    expect(result).not.toBeNull()
    expect(result!.found).toBe(true)
    expect(result!.href).toBe('https://example.com')
    expect(result!.text).toBe('Click me')
  })

  test('**bold** renders with font-weight bold', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null
      const bold = Array.from(svg.querySelectorAll('tspan')) as SVGTSpanElement[]
      const match = bold.find(t => t.getAttribute('font-weight') === 'bold')
      return { found: !!match, text: match?.textContent ?? null }
    }, `box "**Bold**"`)

    expect(result).not.toBeNull()
    expect(result!.found).toBe(true)
    expect(result!.text).toBe('Bold')
  })

  test('bold link keeps both link and bold styling', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null
      const link = svg.querySelector('a')
      const bold = link?.querySelector('tspan[font-weight="bold"]') ?? null
      return {
        href: link?.getAttribute('href') ?? null,
        boldText: bold?.textContent ?? null,
      }
    }, `box "[**Bold Link**](https://example.com)"`)

    expect(result).not.toBeNull()
    expect(result!.href).toBe('https://example.com')
    expect(result!.boldText).toBe('Bold Link')
  })

  test('unsafe URL scheme is not linked', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null
      return {
        linkCount: svg.querySelectorAll('a').length,
        text: svg.querySelector('text')?.textContent ?? null,
      }
    }, `box "[Click me](javascript:alert(1))"`)

    expect(result).not.toBeNull()
    expect(result!.linkCount).toBe(0)
    expect(result!.text).toContain('Click me')
  })

  test('link text containing "&" stays in one <a> with no dropped space', async ({ page }) => {
    const result = await page.evaluate((src) => {
      const svg = (window as any).renderDiagram(src)
      if (!svg) return null
      const links = Array.from(svg.querySelectorAll('a'))
      return { linkCount: links.length, text: links[0]?.textContent ?? null }
    }, `box "[Foo & Bar](#anchor)"`)

    expect(result).not.toBeNull()
    expect(result!.linkCount).toBe(1)
    expect(result!.text).toBe('Foo & Bar')
  })
})

test.describe('markdown label links - renderToString', () => {
  async function renderToSvgString(page: any, src: string) {
    return page.evaluate(async (source: string) => {
      const { renderToStringAsync } = await import('/src/render-to-string.ts')
      return renderToStringAsync(source, { includeSource: false })
    }, src)
  }

  test('[text](url) renders as a clickable <a href>', async ({ page }) => {
    const result = await renderToSvgString(page, `box "[Click me](https://example.com)"`)
    expect(result.error).toBeUndefined()
    expect(result.svg).toContain('<a href="https://example.com">')
    expect(result.svg).toContain('Click me')
  })

  test('**bold** renders with font-weight bold', async ({ page }) => {
    const result = await renderToSvgString(page, `box "**Bold**"`)
    expect(result.error).toBeUndefined()
    expect(result.svg).toContain('font-weight="bold"')
  })

  test('unsafe URL scheme is not linked', async ({ page }) => {
    const result = await renderToSvgString(page, `box "[Click me](javascript:alert(1))"`)
    expect(result.error).toBeUndefined()
    expect(result.svg).not.toContain('<a ')
    expect(result.svg).toContain('Click me')
  })

  test('link text containing "&" stays in one <a> with no dropped space', async ({ page }) => {
    const result = await renderToSvgString(page, `box "[Foo & Bar](#anchor)"`)
    expect(result.error).toBeUndefined()
    expect(result.svg.match(/<a /g)?.length).toBe(1)
    expect(result.svg).toContain('Foo &amp; Bar</a>')
  })
})
