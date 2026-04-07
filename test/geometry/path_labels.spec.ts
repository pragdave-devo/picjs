import { valueOf } from "../helpers/eval.js"

describe(`Line pointAtPercent`, () => {
  const line = valueOf(`Line from (0, 0) to (100, 0)`)

  it(`at 0% returns start point`, () => {
    const pt = line.pointAtPercent(0)
    expect(pt.x).toBeCloseTo(0)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`at 100% returns end point`, () => {
    const pt = line.pointAtPercent(1)
    expect(pt.x).toBeCloseTo(100)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`at 50% returns midpoint`, () => {
    const pt = line.pointAtPercent(0.5)
    expect(pt.x).toBeCloseTo(50)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`at 25% returns quarter point`, () => {
    const pt = line.pointAtPercent(0.25)
    expect(pt.x).toBeCloseTo(25)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`tangent angle is horizontal for horizontal line`, () => {
    const pt = line.pointAtPercent(0.5)
    expect(pt.tangentAngle).toBeCloseTo(0)
  })
})

describe(`Diagonal line pointAtPercent`, () => {
  const line = valueOf(`Line from (0, 0) to (100, 100)`)

  it(`at 50% returns midpoint`, () => {
    const pt = line.pointAtPercent(0.5)
    expect(pt.x).toBeCloseTo(50)
    expect(pt.y).toBeCloseTo(50)
  })

  it(`tangent angle is 45 degrees`, () => {
    const pt = line.pointAtPercent(0.5)
    expect(pt.tangentAngle).toBeCloseTo(Math.PI / 4)
  })
})

describe(`Arc pointAtPercent`, () => {
  // Horizontal arc from (0,0) to (100,0) clockwise
  const arc = valueOf(`Arc from (0, 0) to (100, 0) cw`)

  it(`at 0% returns start point`, () => {
    const pt = arc.pointAtPercent(0)
    expect(pt.x).toBeCloseTo(0)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`at 100% returns end point`, () => {
    const pt = arc.pointAtPercent(1)
    expect(pt.x).toBeCloseTo(100)
    expect(pt.y).toBeCloseTo(0)
  })

  it(`at 50% returns arc midpoint (not chord midpoint)`, () => {
    const pt = arc.pointAtPercent(0.5)
    // For a 90° arc, the midpoint should be offset from the chord
    expect(pt.x).toBeCloseTo(50)
    // y should be non-zero (above or below chord depending on turn direction)
    expect(Math.abs(pt.y)).toBeGreaterThan(10)
  })

  it(`CW arc bulges upward (negative Y in Y-down model)`, () => {
    const pt = arc.pointAtPercent(0.5)
    // CW (visual clockwise) horizontal left-to-right arc bulges UP (negative Y)
    expect(pt.y).toBeLessThan(0)
  })
})

describe(`CCW Arc pointAtPercent`, () => {
  // Horizontal arc from (0,0) to (100,0) counterclockwise
  const arc = valueOf(`Arc from (0, 0) to (100, 0) ccw`)

  it(`CCW arc bulges downward (positive Y in Y-down model)`, () => {
    const pt = arc.pointAtPercent(0.5)
    // CCW (visual counterclockwise) horizontal left-to-right arc bulges DOWN (positive Y)
    expect(pt.y).toBeGreaterThan(0)
  })
})

describe(`Default Arc turn`, () => {
  // Arc without explicit turn should default to CW
  const arc = valueOf(`Arc from (0, 0) to (100, 0)`)

  it(`defaults to CW (bulges upward)`, () => {
    expect(arc.turn).toBe(`cw`)
  })

  it(`midpoint is above chord (negative Y)`, () => {
    const pt = arc.pointAtPercent(0.5)
    expect(pt.y).toBeLessThan(0)
  })
})

describe(`Arc with arrow syntax`, () => {
  // Arc -> should still default to CW
  const arc = valueOf(`Arc -> from (0, 0) to (100, 0)`)

  it(`defaults to CW even with arrow`, () => {
    expect(arc.turn).toBe(`cw`)
  })

  it(`midpoint is above chord (negative Y)`, () => {
    const pt = arc.pointAtPercent(0.5)
    expect(pt.y).toBeLessThan(0)
  })
})

describe(`Line isInsideDirection`, () => {
  const line = valueOf(`Line from (0, 0) to (100, 0)`)

  it(`above returns -1`, () => {
    expect(line.isInsideDirection(`above`)).toBe(-1)
  })

  it(`below returns 1`, () => {
    expect(line.isInsideDirection(`below`)).toBe(1)
  })

  it(`center returns 0`, () => {
    expect(line.isInsideDirection(`center`)).toBe(0)
  })
})

describe(`Arc isInsideDirection`, () => {
  const arc = valueOf(`Arc from (0, 0) to (100, 0)`)

  it(`outside returns -1`, () => {
    expect(arc.isInsideDirection(`outside`)).toBe(-1)
  })

  it(`inside returns 1`, () => {
    expect(arc.isInsideDirection(`inside`)).toBe(1)
  })

  it(`center returns 0`, () => {
    expect(arc.isInsideDirection(`center`)).toBe(0)
  })
})
