import { valueOf } from "../helpers/eval.js"

describe(`Polyline pointAtPercent`, () => {
  const poly = valueOf(`line from (0, 0) then (100, 0) then (100, 100)`)

  it(`at 0% returns start point`, () => {
    const pt = poly.pointAtPercent(0)
    expect(pt.x).toBeCloseTo(0)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`at 100% returns last waypoint`, () => {
    const pt = poly.pointAtPercent(1)
    expect(pt.x).toBeCloseTo(100)
    expect(pt.y).toBeCloseTo(100)
  })

  it(`at 50% returns corner (equal segment lengths)`, () => {
    const pt = poly.pointAtPercent(0.5)
    expect(pt.x).toBeCloseTo(100)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`at 25% returns midpoint of first segment`, () => {
    const pt = poly.pointAtPercent(0.25)
    expect(pt.x).toBeCloseTo(50)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`at 75% returns midpoint of second segment`, () => {
    const pt = poly.pointAtPercent(0.75)
    expect(pt.x).toBeCloseTo(100)
    expect(pt.y).toBeCloseTo(50)
  })
})

describe(`Polyline properties`, () => {
  const poly = valueOf(`line from (0, 0) then (100, 0) then (100, 100)`)

  it(`has correct end point`, () => {
    expect(poly.end.x).toBeCloseTo(100)
    expect(poly.end.y).toBeCloseTo(100)
  })

  it(`has correct total length`, () => {
    expect(poly.length).toBeCloseTo(200)
  })

  it(`is not closed by default`, () => {
    expect(poly.closed).toBe(false)
  })
})

describe(`Closed polyline`, () => {
  const poly = valueOf(`line from (0, 0) then (100, 0) then (100, 100) close`)

  it(`is closed`, () => {
    expect(poly.closed).toBe(true)
  })

  it(`length includes closing segment`, () => {
    // 100 + 100 + ~141.4 (diagonal back to start)
    expect(poly.length).toBeCloseTo(100 + 100 + Math.hypot(100, 100))
  })
})
