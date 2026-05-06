import { parseToMockAST } from "../helpers/ast.js"
import { newDispatcher } from "../helpers/eval.js"
import { ParseStatus } from "../../src/parser.js"
import { SPolyline } from "../../src/shapes/spolyline.js"
import { SBase } from "../../src/shapes/_base.js"

function runProgram(src: string) {
  const parseResult = parseToMockAST(`Program`, src.trim())
  if (parseResult.status !== ParseStatus.Ok) throw new Error(String(parseResult.error))
  const dispatcher = newDispatcher()
  dispatcher.start(parseResult.ast)
  return dispatcher
}

function polylineAndLabels(src: string) {
  const d = runProgram(src)
  const shapes = d.shapes()
  const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
  // Only get labels that are children of the polyline
  const labels = shapes.filter(s =>
    s.shapeName === `SLabel` && (s as any).parentShape === poly
  )
  return { d, poly, labels, shapes }
}

// Helper: check a point is within `tolerance` of a line segment from A to B
function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// Helper: minimum distance from a point to any segment of a polyline
function distanceToPath(px: number, py: number, points: { x: number, y: number }[]) {
  let minDist = Infinity
  for (let i = 1; i < points.length; i++) {
    const d = distanceToSegment(px, py, points[i - 1].x, points[i - 1].y, points[i].x, points[i].y)
    if (d < minDist) minDist = d
  }
  return minDist
}


describe(`Polyline label positioning — simple L-shape`, () => {
  // L-shaped polyline: right then down
  // Points: (0,0) → (10,0) → (10,10)
  const src = `
    line from (0, 0) then (10, 0) then (10, 10) "mid" at 50%
  `

  it(`label at 50% is at the corner`, () => {
    const { poly, labels } = polylineAndLabels(src)
    expect(labels).toHaveLength(1)
    const label = labels[0]
    // 50% of an L-shaped path with equal segments is exactly at the corner (10, 0)
    expect(label.anchorX).toBeCloseTo(10, 0)
    expect(label.anchorY).toBeCloseTo(0, 0)
  })

  it(`label at 25% is midpoint of first segment`, () => {
    const { labels } = polylineAndLabels(
      `line from (0, 0) then (10, 0) then (10, 10) "quarter" at 25%`
    )
    expect(labels[0].anchorX).toBeCloseTo(5, 0)
    expect(labels[0].anchorY).toBeCloseTo(0, 0)
  })

  it(`label at 75% is midpoint of second segment`, () => {
    const { labels } = polylineAndLabels(
      `line from (0, 0) then (10, 0) then (10, 10) "three-quarter" at 75%`
    )
    expect(labels[0].anchorX).toBeCloseTo(10, 0)
    expect(labels[0].anchorY).toBeCloseTo(5, 0)
  })
})


describe(`Polyline label positioning — horizontal`, () => {
  // Straight horizontal polyline (two segments of equal length)
  // Points: (0,0) → (5,0) → (10,0)
  const src = `
    line from (0, 0) then (5, 0) then (10, 0) "center" at 50%
  `

  it(`label at 50% is at the midpoint of the path`, () => {
    const { labels } = polylineAndLabels(src)
    expect(labels[0].anchorX).toBeCloseTo(5, 0)
    expect(labels[0].anchorY).toBeCloseTo(0, 0)
  })
})


describe(`Polyline label positioning — above/below`, () => {
  // Horizontal polyline, label above and below
  const src = `
    line from (0, 0) then (10, 0) then (20, 0) "top" above "bot" below
  `

  it(`creates two labels`, () => {
    const { labels } = polylineAndLabels(src)
    expect(labels).toHaveLength(2)
  })

  it(`above label is offset from path in negative Y`, () => {
    const { labels } = polylineAndLabels(src)
    const above = labels[0]
    // For a horizontal line, "above" means lower Y value (y-up after conversion)
    // Both labels should be near x=10 (midpoint of path)
    expect(above.anchorX).toBeCloseTo(10, 0)
    // above should be offset from y=0
    expect(above.anchorY).not.toBeCloseTo(0, 1)
  })

  it(`below label is on opposite side from above label`, () => {
    const { labels } = polylineAndLabels(src)
    const above = labels[0]
    const below = labels[1]
    // Both at same x
    expect(above.anchorX).toBeCloseTo(below.anchorX, 0)
    // But on opposite sides of the path (y=0)
    expect(above.anchorY * below.anchorY).toBeLessThanOrEqual(0)
  })
})


describe(`Polyline label positioning — label is near the path`, () => {
  it(`single label defaults to above (offset from path)`, () => {
    const { poly, labels } = polylineAndLabels(
      `line from (0, 0) then (10, 0) then (10, 10) "on path"`
    )
    const label = labels[0]
    const dist = distanceToPath(label.anchorX, label.anchorY, poly.allPoints)
    expect(dist).toBeLessThan(0.5)
    expect(dist).toBeGreaterThan(0.01)
  })

  it(`above/below labels are within a small offset of the path`, () => {
    const { poly, labels } = polylineAndLabels(
      `line from (0, 0) then (10, 0) then (10, 10) "above" above "below" below`
    )
    for (const label of labels) {
      const dist = distanceToPath(label.anchorX, label.anchorY, poly.allPoints)
      // Should be within a reasonable offset (stroke_width + font_size)
      expect(dist).toBeLessThan(1)
    }
  })
})


describe(`Polyline label positioning — L-shape with directional construction`, () => {
  // This mirrors the user's failing case: a polyline built with
  // directional waypoints ("then east ... then to ...")
  // The label should end up on the actual path, not "in the weeds"

  it(`label on directional polyline is near the resolved path`, () => {
    const src = `
      a = Box at (0, 0)
      b = Box at (10, 5)
      line from a.e then east until even with b then to b "label" at 60%
    `
    const { poly, labels } = polylineAndLabels(src)
    expect(labels).toHaveLength(1)
    const label = labels[0]

    // Single label defaults to "above" — offset from path but not far
    const dist = distanceToPath(label.anchorX, label.anchorY, poly.allPoints)
    expect(dist).toBeLessThan(0.5)
  })

  it(`label below on directional polyline stays close to path`, () => {
    const src = `
      a = Box at (0, 0)
      b = Box at (10, 5)
      line from a.e then east until even with b then to b "label" below at 60%
    `
    const { poly, labels } = polylineAndLabels(src)
    const label = labels[0]
    const dist = distanceToPath(label.anchorX, label.anchorY, poly.allPoints)
    expect(dist).toBeLessThan(1) // offset by stroke + font, not "way off"
  })
})


describe(`Polyline label at specific percentages`, () => {
  // U-shape: (0,0) → (0,10) → (10,10) → (10,0)
  // Three equal segments of length 10, total = 30

  it(`at 0% is at start`, () => {
    const { labels } = polylineAndLabels(
      `line from (0, 0) then (0, 10) then (10, 10) then (10, 0) "start" at 0%`
    )
    expect(labels[0].anchorX).toBeCloseTo(0, 0)
    expect(labels[0].anchorY).toBeCloseTo(0, 0)
  })

  it(`at 100% is at end`, () => {
    const { labels } = polylineAndLabels(
      `line from (0, 0) then (0, 10) then (10, 10) then (10, 0) "end" at 100%`
    )
    expect(labels[0].anchorX).toBeCloseTo(10, 0)
    expect(labels[0].anchorY).toBeCloseTo(0, 0)
  })

  it(`at 33% is at first corner`, () => {
    const { labels } = polylineAndLabels(
      `line from (0, 0) then (0, 10) then (10, 10) then (10, 0) "corner1" at 33.33%`
    )
    expect(labels[0].anchorX).toBeCloseTo(0, 0)
    expect(labels[0].anchorY).toBeCloseTo(10, 0)
  })

  it(`at 67% is at second corner`, () => {
    const { labels } = polylineAndLabels(
      `line from (0, 0) then (0, 10) then (10, 10) then (10, 0) "corner2" at 66.67%`
    )
    expect(labels[0].anchorX).toBeCloseTo(10, 0)
    expect(labels[0].anchorY).toBeCloseTo(10, 0)
  })

  it(`at 60% is between first and second corners`, () => {
    const { labels } = polylineAndLabels(
      `line from (0, 0) then (0, 10) then (10, 10) then (10, 0) "mid" at 60%`
    )
    const label = labels[0]
    // 60% of 30 = 18 units along path
    // First segment: 0–10, second: 10–20, third: 20–30
    // 18 units = 8 units into second segment → (8, 10)
    expect(label.anchorX).toBeCloseTo(8, 0)
    expect(label.anchorY).toBeCloseTo(10, 0)
  })
})


describe(`Polyline label — directional "until even with" construction`, () => {
  // Reproduces the real-world bug: label position is NaN when polyline
  // is built with "then east until even with" and Group member references.
  it(`label is not NaN on "east until even with" polyline`, () => {
    const src = `
      a = Box at (0, 0)
      b = Box at (5, 3)
      Line <- from a.e
              then east until even with b
              then to b
              "label" below at 60%
    `
    const { labels } = polylineAndLabels(src)
    expect(labels).toHaveLength(1)
    const label = labels[0]
    expect(Number.isNaN(label.anchorX)).toBe(false)
    expect(Number.isNaN(label.anchorY)).toBe(false)
  })

  it(`label x/y are finite numbers`, () => {
    const src = `
      a = Box at (0, 0)
      b = Box at (5, 3)
      Line <- from a.e
              then east until even with b
              then to b
              "label" at 50%
    `
    const { labels } = polylineAndLabels(src)
    expect(Number.isFinite(labels[0].anchorX)).toBe(true)
    expect(Number.isFinite(labels[0].anchorY)).toBe(true)
  })

  it(`label is near the resolved path`, () => {
    const src = `
      a = Box at (0, 0)
      b = Box at (5, 3)
      Line <- from a.e
              then east until even with b
              then to b
              "label" at 60%
    `
    const { poly, labels } = polylineAndLabels(src)
    const label = labels[0]
    const dist = distanceToPath(label.anchorX, label.anchorY, poly.allPoints)
    expect(dist).toBeLessThan(0.5)
  })

  it(`centered label on "until even with" is not NaN with offset start`, () => {
    const src = `
      a = Box at (0, 0)
      b = Box at (8, 4)
      Line from a.e + (0, 0.2)
           then east until even with b
           then to b
           "label"
    `
    const { labels } = polylineAndLabels(src)
    expect(Number.isNaN(labels[0].anchorX)).toBe(false)
    expect(Number.isNaN(labels[0].anchorY)).toBe(false)
  })
})


describe(`Polyline label — Group member references`, () => {
  const groupSrc = `
    actors = Group {
      Face south
      self.top = Box "Top"
                 Gap
      self.mid = Box "Mid"
    }

    targets = Group {
      center = Box fill ~transparent at actors.mid
               Face east
               Goto center
               Gap
      self.right = Box "Right"
    }
  `

  it(`label is not NaN with Group member references`, () => {
    const src = groupSrc + `
      Line <- from actors.top.e
              then east until even with targets.right
              then to targets.right
              "my label" below at 60%
    `
    const { labels } = polylineAndLabels(src)
    expect(labels).toHaveLength(1)
    const label = labels[0]
    expect(Number.isNaN(label.anchorX)).toBe(false)
    expect(Number.isNaN(label.anchorY)).toBe(false)
    expect(Number.isFinite(label.anchorX)).toBe(true)
    expect(Number.isFinite(label.anchorY)).toBe(true)
  })

  it(`label is near the path with Group members`, () => {
    const src = groupSrc + `
      Line <- from actors.top.e
              then east until even with targets.right
              then to targets.right
              "my label" at 60%
    `
    const { poly, labels } = polylineAndLabels(src)
    const label = labels[0]
    const dist = distanceToPath(label.anchorX, label.anchorY, poly.allPoints)
    expect(dist).toBeLessThan(0.5)
  })

  it(`label stays valid after second positionPolyline call (render pass)`, () => {
    const src = groupSrc + `
      Line <- from actors.top.e
              then east until even with targets.right
              then to targets.right
              "my label" below at 60%
    `
    const { d, poly, labels } = polylineAndLabels(src)
    const label = labels[0]

    // Record positions after initial layout
    expect(Number.isFinite(label.anchorX)).toBe(true)
    expect(Number.isFinite(label.anchorY)).toBe(true)

    // Simulate the render pass: reposition the polyline then the label
    d.positionPolyline(poly)
    d.constrainedLayout(label)

    // Label should still be finite
    expect(Number.isFinite(label.anchorX)).toBe(true)
    expect(Number.isFinite(label.anchorY)).toBe(true)

    // And near the path
    const dist = distanceToPath(label.anchorX, label.anchorY, poly.allPoints)
    expect(dist).toBeLessThan(1)
  })

  it(`polyline allPoints are finite after second positionPolyline`, () => {
    const src = groupSrc + `
      Line <- from actors.top.e
              then east until even with targets.right
              then to targets.right
              "my label" at 50%
    `
    const { d, poly } = polylineAndLabels(src)

    // Simulate render pass
    d.positionPolyline(poly)

    for (const pt of poly.allPoints) {
      expect(Number.isFinite(pt.x)).toBe(true)
      expect(Number.isFinite(pt.y)).toBe(true)
    }
  })
})


describe(`Polyline label — complex multi-segment`, () => {
  // A realistic scenario: implicit start, directional waypoints, label
  it(`label on multi-segment polyline from explicit points`, () => {
    const src = `
      line from (0, 0) then (5, 0) then (5, 5) then (10, 5) "label" at 50% below
    `
    const { poly, labels } = polylineAndLabels(src)
    const label = labels[0]
    // Label should be near the actual path, not at some garbage coordinate
    const dist = distanceToPath(label.anchorX, label.anchorY, poly.allPoints)
    expect(dist).toBeLessThan(1)
  })

  it(`multiple labels at different positions on polyline`, () => {
    const src = `
      line from (0, 0) then (10, 0) then (10, 10) "start" at 10% above "end" at 90% below
    `
    const { labels } = polylineAndLabels(src)
    expect(labels).toHaveLength(2)

    // First label near start of path
    expect(labels[0].anchorX).toBeLessThan(5)

    // Second label near end of path
    expect(labels[1].anchorY).toBeGreaterThan(5)

    // Labels should be at different positions
    const dx = labels[0].anchorX - labels[1].anchorX
    const dy = labels[0].anchorY - labels[1].anchorY
    expect(Math.hypot(dx, dy)).toBeGreaterThan(1)
  })
})
