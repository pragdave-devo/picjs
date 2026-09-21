import { test, expect } from '@playwright/test'
import { renderToStringAsync } from '../../src/render-to-string.js'
import { parseToAST } from '../../src/parser.js'
import { parse as pegParse } from '../../src/peg_parser/jp.js'

// Palette colours are applied by CSS class, and the defining CSS is generated
// into the server-rendered <svg>. The runtime renders into that same <svg>, so
// its first render wipes the <style>; anything relying on it then falls back to
// SVG's default fill, which is black. A page whose diagrams are all animated
// has nothing left to define the classes.
//
// This mirrors what the Eleventy plugin emits: a pre-rendered diagram plus its
// AST, handed to initAnimations().

async function playerPage(source: string) {
  const { svg } = await renderToStringAsync(source, { includeSource: false })
  const parsed: any = parseToAST(pegParse, source, 'Start', false)
  return `<!doctype html><body style="margin:0">
    <div class="picjs-player" data-picjs-player>
      ${svg}
      <script type="application/json" data-picjs-ast>${JSON.stringify(parsed.ast)}</script>
    </div>
    <script type="module">
      import { initAnimations } from "/src/runtime.ts"
      initAnimations()
      window.__ready = true
    </script>
  </body>`
}

const SOURCE = `a = Box fill ~b3\nb = Box fill ~b7\nmove a east 1 take 1`

// A shape that only exists later in the timeline brings its own slot with it.
const LATE = `a = Box fill ~b3\n@ = 1\nb = Box fill ~b7`

test('an animated diagram keeps its palette colours', async ({ page }) => {
  await page.goto('/')                       // so the module URL resolves
  await page.setContent(await playerPage(SOURCE))
  await page.waitForFunction(() => (window as any).__ready === true)
  await page.waitForTimeout(500)

  const fills = await page.evaluate(() =>
    [...document.querySelectorAll('rect')].map(r => getComputedStyle(r).fill))

  expect(fills.length).toBeGreaterThan(0)
  for (const f of fills) expect(f).not.toBe('rgb(0, 0, 0)')
})

test('the palette classes survive the runtime taking over', async ({ page }) => {
  await page.goto('/')
  await page.setContent(await playerPage(SOURCE))
  await page.waitForFunction(() => (window as any).__ready === true)
  await page.waitForTimeout(500)

  const defined = await page.evaluate(() => {
    const used = [...document.querySelectorAll('[class*="pj-fill-"]')]
      .flatMap(e => (e.getAttribute('class') || '').split(/\s+/))
      .filter(c => c.startsWith('pj-'))
    const css = [...document.querySelectorAll('style')].map(s => s.textContent || '').join('\n')
    return used.filter(c => !new RegExp(`\\.${c}\\s*\\{`).test(css))
  })
  expect(defined).toEqual([])
})

test('a slot introduced later in the timeline is defined too', async ({ page }) => {
  await page.goto('/')
  await page.setContent(await playerPage(LATE))
  await page.waitForFunction(() => (window as any).__ready === true)
  await page.waitForTimeout(500)

  const defined = await page.evaluate(() => {
    const css = [...document.querySelectorAll('style')].map(s => s.textContent || '').join('\n')
    return /\.pj-fill-[\w-]+-b7\s*\{/.test(css)
  })
  expect(defined).toBe(true)
})
