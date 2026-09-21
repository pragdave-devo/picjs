import { test, expect } from '@playwright/test'
import * as fs from 'fs'

// A diagram's viewBox must contain everything it draws. Circles measured to
// their inscribed square, rotated shapes measured as a sliver, and labels
// overflowing their own box were three separate bugs that all broke this one
// rule, and none of them had a test. This checks the rule itself.

const CASES: [string, string][] = [
  [`box`,            `Box`],
  [`box rotated`,    `Box rotation 45`],
  [`box rotated 30`, `Box rotation 30 "text"`],
  [`box rotated 90`, `Box rotation 90`],
  [`circle`,         `Circle`],
  [`big circle`,     `circle radius 0.8`],
  [`two circles`,    `Circle "Node"\ncircle radius 0.8`],
  [`ellipse`,        `Ellipse rx 1.2 ry 0.4`],
  [`oval`,           `Oval 2 x 1 "pill"`],
  [`h1 label`,       `Label "Title" .h1`],
  [`h1 then label`,  `Label "Title" .h1\nLabel "after"`],
  [`align west`,     `Label "left" align .w`],
  [`align east`,     `Label "right" align .e`],
  [`arrow`,          `Box "a" -> Box "b"`],
  [`rounded poly`,   `Line from (0,0) then to (1,2) then to (2,0) radius 0.2`],
  [`arc`,            `Arc from (0,0) to (2,2)`],
  [`arc ccw`,        `Arc from (0,0) to (2,2) ccw`],
  [`group bg`,       `Group fill ~b3 pad 0.3 { Box "one"\nBox "two" }`],
  [`fit`,            `Box fit "a considerably longer piece of text"`],
  [`multi label`,    `Box "multi" "line" "label"`],
  ...fs.readdirSync('examples')
       .filter(f => f.endsWith('.picjs') && !['fib.picjs', 'closure.picjs'].includes(f))
       .map(f => [f, fs.readFileSync(`examples/${f}`, 'utf8')] as [string, string]),
]

// Two cases still clip. Both predate this test and are recorded as bugs; they
// are allowed here at no worse than their present margin, so the rule is
// enforced everywhere else and these cannot quietly get worse.
const KNOWN: Record<string, number> = {
  // A label's box is measured from glyph ink, but the line box it draws is taller.
  'h1 label': 0.07,
  'h1 then label': 0.07,
  // A shape sits outside the computed bounds; not yet diagnosed.
  'economy.picjs': 1.2,
  'palette.picjs': 0.3,
}

const SLACK = 0.05   // half a stroke width: a stroke straddles the line it follows

test('nothing a diagram draws falls outside its viewBox', async ({ page }) => {
  await page.goto('/test/e2e/fixture.html')
  const offenders: string[] = []

  for (const [name, src] of CASES) {
    const worst = await page.evaluate((source) => {
      const svg = (window as any).renderDiagram(source) as SVGSVGElement
      const [vx, vy, vw, vh] = svg.getAttribute('viewBox')!.split(/\s+/).map(Number)
      let over = 0
      for (const el of svg.querySelectorAll('rect,circle,ellipse,path,text')) {
        const b = (el as SVGGraphicsElement).getBBox()
        if (!b.width && !b.height) continue
        over = Math.max(over, vx - b.x, vy - b.y,
                              (b.x + b.width) - (vx + vw), (b.y + b.height) - (vy + vh))
      }
      return over
    }, src)

    const allowed = KNOWN[name] ?? SLACK
    if (worst > allowed) offenders.push(`${name}: over by ${worst.toFixed(3)}, allowed ${allowed}`)
  }

  expect(offenders).toEqual([])
})
