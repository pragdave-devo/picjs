import { valueOf, newDispatcher } from "../helpers/eval.js"
import { parseToMockAST } from "../helpers/ast.js"
import { ParseStatus } from "../../src/parser.js"
import { SPolyline } from "../../src/shapes/spolyline.js"

function runProgram(src: string) {
  const parseResult = parseToMockAST(`Program`, src.trim())
  if (parseResult.status !== ParseStatus.Ok) throw new Error(String(parseResult.error))
  const dispatcher = newDispatcher()
  dispatcher.start(parseResult.ast)
  return dispatcher
}

describe(`Directional polyline waypoints`, () => {

  it(`simple L-shape: south then east`, () => {
    const dispatcher = runProgram(`
      p = line from (0, 0) then south 2 then east 3
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.start).toEqual({ x: 0, y: 0 })
    expect(poly.waypoints[0]).toEqual({ x: 0, y: 2 })
    expect(poly.waypoints[1]).toEqual({ x: 3, y: 2 })
  })

  it(`compound direction: south 2 east 3 in one segment`, () => {
    const dispatcher = runProgram(`
      p = line from (0, 0) then south 2 east 3
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.waypoints[0]).toEqual({ x: 3, y: 2 })
  })

  it(`mixed directional and absolute waypoints`, () => {
    const dispatcher = runProgram(`
      p = line from (0, 0) then south 2 then to (5, 5)
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.waypoints[0]).toEqual({ x: 0, y: 2 })
    expect(poly.waypoints[1]).toEqual({ x: 5, y: 5 })
  })

  it(`directional-first polyline (no from)`, () => {
    const dispatcher = runProgram(`
      p = line south 2 then east 3
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    // Start should be at origin (default current position)
    expect(poly.start).toEqual({ x: 0, y: 0 })
    expect(poly.waypoints[0]).toEqual({ x: 0, y: 2 })
    expect(poly.waypoints[1]).toEqual({ x: 3, y: 2 })
  })

  it(`long cardinal names work`, () => {
    const dispatcher = runProgram(`
      p = line from (0, 0) then north 1 then west 2
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.waypoints[0]).toEqual({ x: 0, y: -1 })
    expect(poly.waypoints[1]).toEqual({ x: -2, y: -1 })
  })

  it(`with arrow endings`, () => {
    const dispatcher = runProgram(`
      p = -> south 2 then east 3
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.waypoints.length).toBe(2)
  })

  it(`from + directional waypoint`, () => {
    const dispatcher = runProgram(`
      p = line from (1, 1) south 2 then east 3
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.start).toEqual({ x: 1, y: 1 })
    expect(poly.waypoints[0]).toEqual({ x: 1, y: 3 })
    expect(poly.waypoints[1]).toEqual({ x: 4, y: 3 })
  })
})

describe(`expression distances`, () => {

  it(`variable as distance`, () => {
    const dispatcher = runProgram(`
      $d = 3
      p = line from (0, 0) then south $d then east $d
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.waypoints[0]).toEqual({ x: 0, y: 3 })
    expect(poly.waypoints[1]).toEqual({ x: 3, y: 3 })
  })

  it(`expression with multiplication as distance`, () => {
    const dispatcher = runProgram(`
      $level = 10
      p = line from (0, 0) south $level*.3 then east $level*.5
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.waypoints[0].y).toBeCloseTo(3)
    expect(poly.waypoints[1].x).toBeCloseTo(5)
  })
})

describe(`until even/level with`, () => {

  it(`west until even with target (horizontal alignment)`, () => {
    const dispatcher = runProgram(`
      a = Box at (5, 0)
      p = line from (10, 3) then south 2 then west until even with a
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    // "west until even with a" = go west until x matches a.c.x = 5
    expect(poly.waypoints[1].x).toBeCloseTo(5)
    expect(poly.waypoints[1].y).toBeCloseTo(5) // y unchanged from previous
  })

  it(`south until level with target (vertical alignment)`, () => {
    const dispatcher = runProgram(`
      a = Box at (0, 8)
      p = line from (3, 0) then east 2 then south until level with a
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    // "south until level with a" = go south until y matches a.c.y = 8
    expect(poly.waypoints[1].x).toBeCloseTo(5) // x unchanged from previous
    expect(poly.waypoints[1].y).toBeCloseTo(8)
  })

  it(`short form: west until target (no even/level with)`, () => {
    const dispatcher = runProgram(`
      a = Box at (5, 0)
      p = line from (10, 3) then south 2 then west until a
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.waypoints[1].x).toBeCloseTo(5)
    expect(poly.waypoints[1].y).toBeCloseTo(5)
  })

  it(`short form: south until target`, () => {
    const dispatcher = runProgram(`
      a = Box at (0, 8)
      p = line from (3, 0) then east 2 then south until a
    `)
    const shapes = dispatcher.shapes()
    const poly = shapes.find(s => s instanceof SPolyline) as SPolyline
    expect(poly).toBeDefined()
    expect(poly.waypoints[1].x).toBeCloseTo(5)
    expect(poly.waypoints[1].y).toBeCloseTo(8)
  })
})
