import { valueOf, newDispatcher } from "../helpers/eval.js"
import { parseToMockAST } from "../helpers/ast.js"
import { ParseStatus } from "../../src/parser.js"
import { SPolyline } from "../../src/shapes/spolyline.js"

const R2 = 1.0 / Math.sqrt(2.0)

function runProgram(src: string) {
  const parseResult = parseToMockAST(`Program`, src.trim())
  if (parseResult.status !== ParseStatus.Ok) throw new Error(String(parseResult.error))
  const dispatcher = newDispatcher()
  dispatcher.start(parseResult.ast)
  return dispatcher
}

describe(`Box cardinal points`, () => {
  const box = valueOf(`Box at (10, 20) 6×4`)

  it(`c is at anchor`, () => {
    expect(box.c).toEqual({ x: 10, y: 20 })
  })

  it(`n is at top center`, () => {
    expect(box.n).toEqual({ x: 10, y: 18 })
  })

  it(`s is at bottom center`, () => {
    expect(box.s).toEqual({ x: 10, y: 22 })
  })

  it(`e is at right middle`, () => {
    expect(box.e).toEqual({ x: 13, y: 20 })
  })

  it(`w is at left middle`, () => {
    expect(box.w).toEqual({ x: 7, y: 20 })
  })

  it(`nw is at top-left corner`, () => {
    expect(box.nw).toEqual({ x: 7, y: 18 })
  })

  it(`se is at bottom-right corner`, () => {
    expect(box.se).toEqual({ x: 13, y: 22 })
  })
})

describe(`Circle cardinal points`, () => {
  const circle = valueOf(`Circle at (10, 20) rad 3`)

  it(`c is at anchor`, () => {
    expect(circle.c).toEqual({ x: 10, y: 20 })
  })

  it(`n is at top`, () => {
    expect(circle.n.x).toBeCloseTo(10)
    expect(circle.n.y).toBeCloseTo(17)
  })

  it(`s is at bottom`, () => {
    expect(circle.s.x).toBeCloseTo(10)
    expect(circle.s.y).toBeCloseTo(23)
  })

  it(`e is at right`, () => {
    expect(circle.e.x).toBeCloseTo(13)
    expect(circle.e.y).toBeCloseTo(20)
  })

  it(`w is at left`, () => {
    expect(circle.w.x).toBeCloseTo(7)
    expect(circle.w.y).toBeCloseTo(20)
  })

  it(`ne is on circumference, not bbox corner`, () => {
    expect(circle.ne.x).toBeCloseTo(10 + 3 * R2)
    expect(circle.ne.y).toBeCloseTo(20 - 3 * R2)
  })
})

describe(`Line cardinal points`, () => {

  describe(`horizontal line`, () => {
    const line = valueOf(`Line from (0, 0) to (4, 0)`)

    it(`c is at midpoint`, () => {
      expect(line.c.x).toBeCloseTo(2)
      expect(line.c.y).toBeCloseTo(0)
    })

    it(`e is at right endpoint`, () => {
      expect(line.e.x).toBeCloseTo(4)
      expect(line.e.y).toBeCloseTo(0)
    })

    it(`w is at left endpoint`, () => {
      expect(line.w.x).toBeCloseTo(0)
      expect(line.w.y).toBeCloseTo(0)
    })

    it(`n and s collapse to midpoint (zero height)`, () => {
      expect(line.n.x).toBeCloseTo(2)
      expect(line.n.y).toBeCloseTo(0)
      expect(line.s.x).toBeCloseTo(2)
      expect(line.s.y).toBeCloseTo(0)
    })
  })

  describe(`vertical line`, () => {
    const line = valueOf(`Line from (0, 0) to (0, 6)`)

    it(`n is at top endpoint`, () => {
      expect(line.n.x).toBeCloseTo(0)
      expect(line.n.y).toBeCloseTo(0)
    })

    it(`s is at bottom endpoint`, () => {
      expect(line.s.x).toBeCloseTo(0)
      expect(line.s.y).toBeCloseTo(6)
    })

    it(`e and w collapse to midpoint (zero width)`, () => {
      expect(line.e.x).toBeCloseTo(0)
      expect(line.e.y).toBeCloseTo(3)
      expect(line.w.x).toBeCloseTo(0)
      expect(line.w.y).toBeCloseTo(3)
    })
  })

  describe(`diagonal line`, () => {
    const line = valueOf(`Line from (0, 0) to (3, 4)`)

    it(`c is at midpoint`, () => {
      expect(line.c.x).toBeCloseTo(1.5)
      expect(line.c.y).toBeCloseTo(2)
    })

    it(`e is at right bbox edge, mid-height`, () => {
      expect(line.e.x).toBeCloseTo(3)
      expect(line.e.y).toBeCloseTo(2)
    })

    it(`w is at left bbox edge, mid-height`, () => {
      expect(line.w.x).toBeCloseTo(0)
      expect(line.w.y).toBeCloseTo(2)
    })

    it(`n is at top bbox edge, mid-width`, () => {
      expect(line.n.x).toBeCloseTo(1.5)
      expect(line.n.y).toBeCloseTo(0)
    })

    it(`s is at bottom bbox edge, mid-width`, () => {
      expect(line.s.x).toBeCloseTo(1.5)
      expect(line.s.y).toBeCloseTo(4)
    })
  })
})

describe(`Polyline cardinal points`, () => {

  describe(`L-shape: south then east`, () => {
    // Points: (0,0), (0,0.2), (1,0.2)
    // BBox: x=[0,1], y=[0,0.2], center=(0.5, 0.1)
    const poly = valueOf(`line from (0, 0) then to (0, 0.2) then to (1, 0.2)`)

    it(`n is at top-center of bbox`, () => {
      expect(poly.n.x).toBeCloseTo(0.5)
      expect(poly.n.y).toBeCloseTo(0)
    })

    it(`s is at bottom-center of bbox`, () => {
      expect(poly.s.x).toBeCloseTo(0.5)
      expect(poly.s.y).toBeCloseTo(0.2)
    })

    it(`e is at right-middle of bbox`, () => {
      expect(poly.e.x).toBeCloseTo(1)
      expect(poly.e.y).toBeCloseTo(0.1)
    })

    it(`w is at left-middle of bbox`, () => {
      expect(poly.w.x).toBeCloseTo(0)
      expect(poly.w.y).toBeCloseTo(0.1)
    })

    it(`c is at bbox center`, () => {
      expect(poly.c.x).toBeCloseTo(0.5)
      expect(poly.c.y).toBeCloseTo(0.1)
    })
  })

  describe(`U-shape`, () => {
    // Points: (0,0), (0,4), (6,4), (6,0)
    // BBox: x=[0,6], y=[0,4], center=(3, 2)
    const poly = valueOf(`line from (0, 0) then to (0, 4) then to (6, 4) then to (6, 0)`)

    it(`n is at top-center of bbox`, () => {
      expect(poly.n.x).toBeCloseTo(3)
      expect(poly.n.y).toBeCloseTo(0)
    })

    it(`s is at bottom-center of bbox`, () => {
      expect(poly.s.x).toBeCloseTo(3)
      expect(poly.s.y).toBeCloseTo(4)
    })

    it(`e is at right-middle of bbox`, () => {
      expect(poly.e.x).toBeCloseTo(6)
      expect(poly.e.y).toBeCloseTo(2)
    })

    it(`w is at left-middle of bbox`, () => {
      expect(poly.w.x).toBeCloseTo(0)
      expect(poly.w.y).toBeCloseTo(2)
    })
  })

  describe(`L-shape with directional syntax`, () => {
    // line south .2 then east 1
    // Should produce same points as from (0,0) then to (0,0.2) then to (1,0.2)
    it(`has correct cardinal points`, () => {
      const d = runProgram(`l = line south .2 then east 1`)
      const poly = d.shapes().find(s => s instanceof SPolyline) as SPolyline

      expect(poly.n.x).toBeCloseTo(0.5)
      expect(poly.n.y).toBeCloseTo(0)

      expect(poly.s.x).toBeCloseTo(0.5)
      expect(poly.s.y).toBeCloseTo(0.2)

      expect(poly.e.x).toBeCloseTo(1)
      expect(poly.e.y).toBeCloseTo(0.1)

      expect(poly.w.x).toBeCloseTo(0)
      expect(poly.w.y).toBeCloseTo(0.1)
    })
  })

  describe(`U-shape with directional syntax`, () => {
    it(`has correct cardinal points`, () => {
      const d = runProgram(`l = line south 4 then east 6 then north 4`)
      const poly = d.shapes().find(s => s instanceof SPolyline) as SPolyline

      expect(poly.n.x).toBeCloseTo(3)
      expect(poly.n.y).toBeCloseTo(0)

      expect(poly.s.x).toBeCloseTo(3)
      expect(poly.s.y).toBeCloseTo(4)

      expect(poly.e.x).toBeCloseTo(6)
      expect(poly.e.y).toBeCloseTo(2)

      expect(poly.w.x).toBeCloseTo(0)
      expect(poly.w.y).toBeCloseTo(2)
    })
  })

  describe(`stability after re-positioning`, () => {
    it(`cardinals survive a second positionPolyline call`, () => {
      // In the playground, renderUpdatedOn calls positionPolyline again.
      // If lastShape has changed since initial layout, the implicit start
      // resolves from the wrong shape, corrupting the polyline.
      const d = runProgram(`
        l = line south .2 then east 1
        Label "n" at l.n
        Label "s" at l.s
      `)
      const poly = d.shapes().find(s => s instanceof SPolyline) as SPolyline

      // Simulate render pass: positionPolyline is called again
      d.positionPolyline(poly)

      expect(poly.n.x).toBeCloseTo(0.5)
      expect(poly.n.y).toBeCloseTo(0)
      expect(poly.s.x).toBeCloseTo(0.5)
      expect(poly.s.y).toBeCloseTo(0.2)
      expect(poly.e.x).toBeCloseTo(1)
      expect(poly.e.y).toBeCloseTo(0.1)
      expect(poly.w.x).toBeCloseTo(0)
      expect(poly.w.y).toBeCloseTo(0.1)
    })

    it(`cardinals survive re-positioning when line is first shape`, () => {
      const d = runProgram(`
        l = line south 2 then east 3
        Box
      `)
      const poly = d.shapes().find(s => s instanceof SPolyline) as SPolyline

      // Simulate render pass
      d.positionPolyline(poly)

      expect(poly.start).toEqual({ x: 0, y: 0 })
      expect(poly.waypoints[0]).toEqual({ x: 0, y: 2 })
      expect(poly.waypoints[1]).toEqual({ x: 3, y: 2 })
    })
  })

  describe(`animation: polyline tracks moving predecessor`, () => {
    it(`polyline start updates when predecessor box moves`, () => {
      const d = runProgram(`
        a = Box
        l = line south 2 then east 3
      `)
      const shapes = d.shapes()
      const box = shapes.find(s => s.shapeName === `SBox`)!
      const poly = shapes.find(s => s instanceof SPolyline) as SPolyline

      // Record initial start — should be at box's south edge
      const initialStartY = poly.start.y

      // Simulate animation: move box down
      box.setAnimatablePosition(box.anchorX!, box.anchorY! + 5)

      // Re-position polyline (as renderUpdatedOn would)
      d.positionPolyline(poly)

      // Polyline start should have moved with the box
      expect(poly.start.y).toBeGreaterThan(initialStartY)
    })
  })
})
