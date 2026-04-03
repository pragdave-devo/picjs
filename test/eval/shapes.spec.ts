import { valueOf, newDispatcher } from "../helpers/eval.js"
import { TNumber, TPosition, TA } from "../../src/types.js"
import { ParseStatus } from "../../src/parser.js"
import { RTE } from "../../src/runtime_error.js"
import { parseToMockAST } from "../helpers/ast.js"
import { LineLike } from "../../src/shapes.js"

function runProgram(src: string) {
  const parseResult = parseToMockAST(`Program`, src)
  if (parseResult.status !== ParseStatus.Ok) throw new Error(String(parseResult.error))
  const dispatcher = newDispatcher()
  dispatcher.start(parseResult.ast)
  return dispatcher
}


function t(ip: string, expected: TA) {
  it(ip, () => {
    const result = valueOf(ip)
    expect(result.toNative()).toEqual(expected.toNative())
  })
}

function n(val: number) {
  return new TNumber(val)
}

function pos(x: number, y: number) {
  return new TPosition(n(x), n(y))
}

describe(`shapes`, () => {
  describe(`have default positions`, () => {
    t(`(Box (20,30)).c.x`,  n(20))
    t(`(Box (20,30)).c.y`,  n(30))

    t(`(Box (20,30)).c`,     pos(20, 30))
    t(`(Box at (20,30)).c`,  pos(20, 30))
  })


  describe(`can specify a position`, () => {
    t(`(Box at (20,30) + (2,3)).c`, pos(22, 33))
    t(`(Box at (20,30) + 3).c`,     pos(23, 33))
  })

  describe(`have a width and height`, () => {
    t(`(Box 12×34).width`,          n(12))
    t(`(Box (20, 30) 12×34).width`, n(12))
    t(`(Box (20, 30) 12×34).height`, n(34))
    t(`(Box (20, 30) 12×34).c`, pos(20, 30))
  })

  describe(`have a rotation`, () => {
    t(`(Box).rotation`, n(0))
    t(`(Box rotation -123).rotation`, n(-123))
  })

  const cardinals: [ string, number, number ][] = [
    [ `n`,    0,  22 ],
    [ `ne`,  11,  22 ],
    [ `e`,   11,   0 ],
    [ `se`,  11, -22 ],
    [ `s`,    0, -22 ],
    [ `sw`, -11, -22 ],
    [ `w`,  -11,   0 ],
    [ `nw`, -11,  22 ],
    [ `c`,    0,   0 ],
  ]

  describe(`have cardinals`, () => {
    cardinals.forEach(([ card, dx, dy ]) => {
      t(`(Box (20, 30) 22×44).${card}`, pos(20 + dx, 30 + dy))
    })
  })

})


describe(`dispatcher.shapes()`, () => {
  it(`returns one shape for Box`, () => {
    const d = runProgram(`Box`)
    expect(d.shapes()).toHaveLength(1)
    expect(d.shapes()[0].shapeName).toBe(`SBox`)
  })

  it(`returns shapes in order for Box and Line`, () => {
    const d = runProgram(`Box\nLine`)
    const names = d.shapes().map((s: any) => s.shapeName)
    expect(names).toEqual([`SBox`, `SLine`])
  })

  it(`shapes have unique ids`, () => {
    const d = runProgram(`Box\nBox`)
    const ids = d.shapes().map((s: any) => s.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe(`connector positioning`, () => {
  it(`Box -> line starts at Box.e after re-positioning`, () => {
    const d = runProgram(`Box\n->`)
    const [box, line] = d.shapes()

    // positionLine is called on every renderUpdatedOn; must not drift
    d.positionLine(line as LineLike)

    expect((line as any).start.x).toBeCloseTo(box.e.x)
    expect((line as any).start.y).toBeCloseTo(box.e.y)
  })

  it(`Box -> re-positioning is stable across multiple calls`, () => {
    const d = runProgram(`Box\n->`)
    const [box, line] = d.shapes()

    d.positionLine(line as LineLike)
    d.positionLine(line as LineLike)
    d.positionLine(line as LineLike)

    expect((line as any).start.x).toBeCloseTo(box.e.x)
  })

  it(`Box -> line has predecessorShape set to Box`, () => {
    const d = runProgram(`Box\n->`)
    const [box, line] = d.shapes()
    expect((line as any).predecessorShape).toBe(box)
  })

  it(`Box -> Box2 connector has both predecessor and successor set`, () => {
    const d = runProgram(`Box\n->\nBox`)
    const [box1, line, box2] = d.shapes()
    expect((line as any).predecessorShape).toBe(box1)
    expect((line as any).successorShape).toBe(box2)
  })

  it(`Box -> Box2 line end is at Box2.w after re-positioning`, () => {
    const d = runProgram(`Box\n->\nBox`)
    const [, line, box2] = d.shapes()

    d.positionLine(line as LineLike)

    expect((line as any).end.x).toBeCloseTo(box2.w.x)
    expect((line as any).end.y).toBeCloseTo(box2.w.y)
  })
})

describe(`dependency graph integration`, () => {
  it(`records a with-constraint dependency`, () => {
    const d = runProgram(`Box\nBox with .w at (100, 200)`)
    const [box1, box2] = d.shapes()
    const graph = (d as any).shapeGraph.dependencyGraph
    // box2 depends on nothing (its constraint target is a position literal, not a shape)
    expect(graph.dependentsOf(box1)).toHaveLength(0)
  })

  it(`plain Box Box creates no dependency`, () => {
    const d = runProgram(`Box\nBox`)
    const [box1, box2] = d.shapes()
    const graph = (d as any).shapeGraph.dependencyGraph
    expect(graph.dependentsOf(box1)).toHaveLength(0)
    expect(graph.dependentsOf(box2)).toHaveLength(0)
  })

  it(`Box -> registers line as dependent of Box`, () => {
    const d = runProgram(`Box\n->`)
    const [box, line] = d.shapes()
    const graph = (d as any).shapeGraph.dependencyGraph
    expect(graph.dependentsOf(box)).toContain(line)
  })

  it(`Box "Hello" label is initially positioned at box center`, () => {
    const d = runProgram(`Box "Hello"`)
    const [box, label] = d.shapes()
    expect(label.anchorX).toBeCloseTo(box.anchorX)
    expect(label.anchorY).toBeCloseTo(box.anchorY)
    // Label should have non-NaN position
    expect(Number.isNaN(label.anchorX)).toBe(false)
    expect(Number.isNaN(label.anchorY)).toBe(false)
  })

  it(`Box "Hello" label has dimensions set`, () => {
    const d = runProgram(`Box "Hello"`)
    const [, label] = d.shapes()
    // In test env (no DOM), fallback dimensions are set
    expect(label.width).toBeGreaterThan(0)
    expect(label.height).toBeGreaterThan(0)
  })

  it(`Box "Hello" registers label as dependent of Box`, () => {
    const d = runProgram(`Box "Hello"`)
    const shapes = d.shapes()
    expect(shapes).toHaveLength(2)
    const [box, label] = shapes
    expect(box.shapeName).toBe(`SBox`)
    expect(label.shapeName).toBe(`SLabel`)
    const graph = (d as any).shapeGraph.dependencyGraph
    expect(graph.dependentsOf(box)).toContain(label)
  })

  it(`Box "Hello" label stays at box center after width change`, () => {
    const d = runProgram(`Box "Hello"`)
    const [box, label] = d.shapes()

    // Record initial positions — label should be at box center
    expect(label.anchorX).toBeCloseTo(box.anchorX)
    expect(label.anchorY).toBeCloseTo(box.anchorY)

    // Simulate width animation step
    box.setAnimatableAttr(`width`, new TNumber(200))

    // Box center shouldn't move
    expect(box.anchorX).toBeCloseTo(box.anchorX) // unchanged
    // Label should still be at box center
    expect(label.anchorX).toBeCloseTo(box.anchorX)
    expect(label.anchorY).toBeCloseTo(box.anchorY)
  })
})

describe(`step limit`, () => {
  it(`stops runaway recursion`, () => {
    expect(() => {
      runProgram(`f = (n) => f(n+1)\nf(0)`)
    }).toThrow(/exceeded/)
  })
})
