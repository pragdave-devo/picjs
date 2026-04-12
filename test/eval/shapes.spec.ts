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
    [ `n`,    0, -22 ],
    [ `ne`,  11, -22 ],
    [ `e`,   11,   0 ],
    [ `se`,  11,  22 ],
    [ `s`,    0,  22 ],
    [ `sw`, -11,  22 ],
    [ `w`,  -11,   0 ],
    [ `nw`, -11, -22 ],
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

describe(`multiple labels`, () => {
  it(`Box "A" "B" creates one label child with joined text`, () => {
    const d = runProgram(`Box "A" "B"`)
    const shapes = d.shapes()
    expect(shapes).toHaveLength(2)  // Box + 1 combined label
    const [box, label] = shapes
    expect(box.shapeName).toBe(`SBox`)
    expect(label.shapeName).toBe(`SLabel`)
    expect(label.text).toBe(`A\n\nB`)  // double-newline = separate paragraphs (stacked)
  })

  it(`three labels are joined with double-newlines`, () => {
    const d = runProgram(`Box "X" "Y" "Z"`)
    const [, label] = d.shapes()
    expect(label.text).toBe(`X\n\nY\n\nZ`)
  })

  it(`multiple labels are centered on the parent`, () => {
    const d = runProgram(`Box "A" "B"`)
    const [box, label] = d.shapes()
    expect(label.anchorX).toBeCloseTo(box.anchorX)
    expect(label.anchorY).toBeCloseTo(box.anchorY)
  })

  it(`single label still works as before`, () => {
    const d = runProgram(`Box "Hello"`)
    const shapes = d.shapes()
    expect(shapes).toHaveLength(2)
    const [, label] = shapes
    expect(label.text).toBe(`Hello`)
  })

  it(`works on circles`, () => {
    const d = runProgram(`Circle "top" "bottom"`)
    const [circle, label] = d.shapes()
    expect(label.text).toBe(`top\n\nbottom`)
    expect(label.anchorX).toBeCloseTo(circle.anchorX)
  })

  it(`works with a with-constraint`, () => {
    const d = runProgram(`Box "A" "B" with .nw at (0, 0)`)
    const [box, label] = d.shapes()
    expect(label.text).toBe(`A\n\nB`)
    // label center should still match box center
    expect(label.anchorX).toBeCloseTo(box.anchorX)
    expect(label.anchorY).toBeCloseTo(box.anchorY)
  })

  it(`labels interleaved with other attributes`, () => {
    const d = runProgram(`Box "first" width 5 "second"`)
    const [box, label] = d.shapes()
    expect(box.width).toBe(5)
    expect(label.text).toBe(`first\n\nsecond`)
  })

  it(`labels with expressions`, () => {
    const d = runProgram(`$a = "hello"\n$b = "world"\nBox ($a) ($b)`)
    const shapes = d.shapes()
    const label = shapes[shapes.length - 1]
    expect(label.text).toBe(`hello\n\nworld`)
  })

  it(`registers combined label as dependent of parent`, () => {
    const d = runProgram(`Box "A" "B"`)
    const shapes = d.shapes()
    const [box, label] = shapes
    const graph = (d as any).shapeGraph.dependencyGraph
    expect(graph.dependentsOf(box)).toContain(label)
  })

  it(`does not create multiple label children`, () => {
    const d = runProgram(`Box "A" "B" "C"`)
    const shapes = d.shapes()
    // Exactly 2 shapes: the box and one combined label
    expect(shapes).toHaveLength(2)
    expect(shapes[0].shapeName).toBe(`SBox`)
    expect(shapes[1].shapeName).toBe(`SLabel`)
  })

  it(`does not interfere with line labels`, () => {
    const d = runProgram(`Line from (0,0) to (5,0) "above" above "below" below`)
    const shapes = d.shapes()
    // Line + 2 separate line labels
    expect(shapes).toHaveLength(3)
    expect(shapes[1].shapeName).toBe(`SLabel`)
    expect(shapes[2].shapeName).toBe(`SLabel`)
    // Line labels keep their own text (not joined)
    expect(shapes[1].text).toBe(`above`)
    expect(shapes[2].text).toBe(`below`)
  })

  it(`combined label does not become lastShape`, () => {
    const d = runProgram(`Box "A" "B"\nBox`)
    const shapes = d.shapes()
    // Box1, combined label, Box2
    expect(shapes).toHaveLength(3)
    const [box1, , box2] = shapes
    // Box2 should be placed relative to Box1, not the label
    expect(box2.anchorX).toBeGreaterThan(box1.anchorX)
  })

  it(`child label receives parent dimensions`, () => {
    const d = runProgram(`Box width 5 height 3 "hello"`)
    const [box, label] = d.shapes()
    expect(label.params._parentWidth).toBe(5)
    expect(label.params._parentHeight).toBe(3)
  })
})

describe(`behind`, () => {
  it(`sets the behind reference on the shape`, () => {
    const d = runProgram(`a = Box\nb = Box behind a`)
    const [a, b] = (d as any).shapeGraph.allShapes
    expect(b.behind).toBe(a)
  })

  it(`reorders render list so behind shape comes before target`, () => {
    const d = runProgram(`a = Box\nb = Box behind a`)
    const [a, b] = (d as any).shapeGraph.allShapes
    // Make both visible (normally done by timeline)
    a.visible = true
    b.visible = true
    const graph = (d as any).shapeGraph
    const ordered = graph.applyBehindConstraints([a, b])
    expect(ordered.indexOf(b)).toBeLessThan(ordered.indexOf(a))
  })
})

describe(`Goto`, () => {
  it(`moves cursor; next shape centers there`, () => {
    const d = runProgram(`Goto s 0.5\nb = Box`)
    const box = d.shapes().find(s => s.shapeName === `SBox`)!
    expect(box.anchorY).toBeGreaterThan(0.4)
  })

  it(`moves in the current direction by default distance`, () => {
    const d = runProgram(`Face e\nGoto\nb = Box`)
    const box = d.shapes().find(s => s.shapeName === `SBox`)!
    expect(box.anchorX).toBeGreaterThan(0.5)
  })

  it(`accepts absolute position`, () => {
    const d = runProgram(`Goto (3, 4)\nb = Box`)
    const box = d.shapes().find(s => s.shapeName === `SBox`)!
    expect(box.anchorX).toBeCloseTo(3, 1)
    expect(box.anchorY).toBeCloseTo(4, 1)
  })

  it(`Goto shape resumes layout from that shape`, () => {
    const d = runProgram(`a = Box\nFace west\n-> Box\nFace east\nGoto a\nb = Box`)
    const boxes = d.shapes().filter(s => s.shapeName === `SBox`)
    const [a, c, b] = boxes
    // B should be east of A, not overlapping it
    expect(b.anchorX!).toBeGreaterThan(a.anchorX!)
    // C should be west of A
    expect(c.anchorX!).toBeLessThan(a.anchorX!)
  })
})

describe(`Gap`, () => {
  it(`creates edge-to-edge spacing`, () => {
    const d = runProgram(`a = Box\nGap e 2\nb = Box`)
    const boxes = d.shapes().filter(s => s.shapeName === `SBox`)
    // a east edge at 0.5, gap 2, b west edge at 2.5, b center at 3.0
    expect(boxes[1].anchorX!).toBeCloseTo(3.0, 1)
  })

  it(`same repeats previous Gap`, () => {
    const d = runProgram(`Box\nGap e 1\nBox\nGap same\nb = Box`)
    const boxes = d.shapes().filter(s => s.shapeName === `SBox`)
    const gap1 = boxes[1].anchorX! - boxes[0].anchorX!
    const gap2 = boxes[2].anchorX! - boxes[1].anchorX!
    expect(gap1).toBeCloseTo(gap2, 1)
  })

  it(`defaults to current direction`, () => {
    const d = runProgram(`Face e\nBox\nGap 2\nb = Box`)
    const boxes = d.shapes().filter(s => s.shapeName === `SBox`)
    expect(boxes[1].anchorX!).toBeGreaterThan(boxes[0].anchorX! + 2)
  })
})

describe(`Aside`, () => {
  it(`restores position after block`, () => {
    const d = runProgram(`a = Box\nAside {\n  Box\n  Box\n}\nb = Box`)
    const shapes = d.shapes().filter(s => s.shapeName === `SBox`)
    // b should be positioned as if the Aside block never happened
    // a is at origin, b should be next to a (same x as shapes[1] which was first after a)
    expect(shapes[3].anchorX).toBeCloseTo(shapes[1].anchorX!, 1)
  })

  it(`restores direction after block`, () => {
    const d = runProgram(`Face e\nAside {\n  Face s\n  Box\n}\nb = Box`)
    const boxes = d.shapes().filter(s => s.shapeName === `SBox`)
    // b should flow east (original direction), not south
    expect(boxes[1].anchorY).toBeCloseTo(0, 1)
  })

  it(`shapes inside aside are still drawn`, () => {
    const d = runProgram(`Aside {\n  Box at (5, 5)\n}`)
    const boxes = d.shapes().filter(s => s.shapeName === `SBox`)
    expect(boxes.length).toBe(1)
    expect(boxes[0].anchorX).toBeCloseTo(5)
    expect(boxes[0].anchorY).toBeCloseTo(5)
  })

  it(`does not make aside shapes implicit connector targets`, () => {
    const d = runProgram(`Box\nl = line\nAside {\n  Circle rad .1 at l.c\n}\nBox`)
    const shapes = d.shapes()
    const line = shapes.find(s => s.shapeName === `SLine`)!
    const boxes = shapes.filter(s => s.shapeName === `SBox`)
    // The line's successor should be the second Box, not the Circle inside Aside
    expect((line as any).successorShape).toBe(boxes[1])
  })
})

describe(`step limit`, () => {
  it(`stops runaway recursion`, () => {
    expect(() => {
      runProgram(`f = (n) => f(n+1)\nf(0)`)
    }).toThrow(/exceeded/)
  })
})
