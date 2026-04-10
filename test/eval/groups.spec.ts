import { valueOf, newDispatcher } from "../helpers/eval.js"
import { TNumber, TPosition, TA } from "../../src/types.js"
import { ParseStatus } from "../../src/parser.js"
import { parseToMockAST } from "../helpers/ast.js"
import { SGroup } from "../../src/shapes/sgroup.js"
import { ShapeGraph } from "../../src/shape_graph.js"

function runProgram(src: string) {
  const parseResult = parseToMockAST(`Program`, src.trim())
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

describe(`groups`, () => {

  describe(`basic creation`, () => {
    it(`creates a group with child shapes`, () => {
      const dispatcher = runProgram(`
        g = Group {
          box at (2, 3)
        }
      `)
      const shapes = dispatcher.shapes()
      const group = shapes.find(s => s instanceof SGroup) as SGroup
      expect(group).toBeDefined()
      expect(group.groupChildren.length).toBe(1)
    })

    it(`computes bounding box from children`, () => {
      const dispatcher = runProgram(`
        g = Group {
          box at (0, 0)
          box at (4, 0)
        }
      `)
      const shapes = dispatcher.shapes()
      const group = shapes.find(s => s instanceof SGroup) as SGroup
      expect(group).toBeDefined()
      expect(group.width).toBeGreaterThan(0)
      // center should be between the two boxes
      expect(group.anchorX).toBe(2)
      expect(group.anchorY).toBe(0)
    })

    it(`bare { } creates a group without Group keyword`, () => {
      const dispatcher = runProgram(`
        g = {
          box at (1, 0)
          box at (3, 0)
        }
      `)
      const shapes = dispatcher.shapes()
      const group = shapes.find(s => s instanceof SGroup) as SGroup
      expect(group).toBeDefined()
      expect(group.groupChildren.length).toBe(2)
      expect(group.anchorX).toBe(2)
    })

    it(`bare { } supports with constraint`, () => {
      const dispatcher = runProgram(`
        g = {
          box at (0, 0)
          box at (2, 0)
        } with .nw at (10, 10)
      `)
      const shapes = dispatcher.shapes()
      const group = shapes.find(s => s instanceof SGroup) as SGroup
      expect(group.nw.x).toBeCloseTo(10, 1)
      expect(group.nw.y).toBeCloseTo(10, 1)
    })
  })

  describe(`scoped defaults`, () => {
    it(`does not leak defaults outside the group`, () => {
      const dispatcher = runProgram(`
        box at (0, 0)
        Group {
          Box.fill = ~red
          box at (2, 0)
        }
        box at (4, 0)
      `)
      const shapes = dispatcher.shapes()
      const boxes = shapes.filter(s => s.shapeName === 'SBox')
      // Second box (inside group) should have red fill
      const redFill = boxes[1].params.fill
      expect(redFill.value?.r).toBe(1)
      expect(redFill.value?.g).toBe(0)
      expect(redFill.value?.b).toBe(0)
      // First and third box should have the same (non-red) default fill
      expect(boxes[0].params.fill).toBe(boxes[2].params.fill)
      expect(boxes[0].params.fill).not.toBe(redFill)
    })
  })

  describe(`cardinal points`, () => {
    t(`(Group { box at (2, 3) }).c.x`, n(2))
    t(`(Group { box at (2, 3) }).c.y`, n(3))
  })

  describe(`self exports`, () => {
    t(`(Group { self.a = Box (2, 3) }).a.c.x`, n(2))
    t(`(Group { self.a = Box (2, 3) }).a.c.y`, n(3))

    it(`exports only self-assigned values, not all locals`, () => {
      expect(() => valueOf(`(Group { b = Box (2, 3) }).b`)).toThrow()
    })
  })

  describe(`nested group centering`, () => {
    it(`stacked sub-groups are centered on same axis`, () => {
      const dispatcher = runProgram(`
        Face s
        Group {
          Face e
          box
          box
          box
        }
        Gap .5
        Group {
          Face e
          box
          box
        }
      `)
      const shapes = dispatcher.shapes()
      const groups = shapes.filter(s => s instanceof SGroup) as SGroup[]
      expect(groups).toHaveLength(2)
      // Both groups should be centered on the same x
      expect(groups[1].anchorX).toBeCloseTo(groups[0].anchorX, 1)
      // Second group should be below the first
      expect(groups[1].anchorY).toBeGreaterThan(groups[0].anchorY)
    })
  })

  describe(`scoped direction`, () => {
    it(`restores direction after group`, () => {
      const dispatcher = runProgram(`
        Face 0
        box at (0, 0)
        Group {
          Face 90
          box at (2, 0)
        }
        box
      `)
      const shapes = dispatcher.shapes()
      const boxes = shapes.filter(s => s.shapeName === 'SBox')
      // Third box should have flowed from the group in the original direction (right, angle 0)
      // not in the group's direction (down, angle 90)
      expect(boxes[2].anchorY).toBeCloseTo(0, 1)
    })
  })

  describe(`behind with two groups`, () => {
    it(`behind works for both groups (inline)`, () => {
      const dispatcher = runProgram(`
        g1 = Group {
          Face s
          Label "G1" .h4
          box "A"
          box "B"
        }
        bg1 = box at g1 behind g1 fill ~beige

        g2 = Group {
          Face s
          Label "G2" .h4
          box "C"
          box "D"
        } with .nw at g1.ne + (1, 0)
        bg2 = box at g2 behind g2 fill ~beige
      `)
      const shapes = dispatcher.shapes()
      shapes.forEach(s => { s.visible = true })
      const visible = shapes.filter(s => s.visible)
      const sg = (dispatcher as any).shapeGraph as ShapeGraph
      const reordered = sg.applyBehindConstraints(visible)

      const groups = shapes.filter(s => s instanceof SGroup)
      const behindBoxes = shapes.filter(s => s.behind)
      const g1First = groups[0].groupChildren[0]
      const g2First = groups[1].groupChildren[0]

      expect(reordered.indexOf(behindBoxes[0])).toBeLessThan(reordered.indexOf(g1First))
      expect(reordered.indexOf(behindBoxes[1])).toBeLessThan(reordered.indexOf(g2First))
    })

    it(`behind works via function call`, () => {
      const dispatcher = runProgram(`
        $box_around = grp => {
          box at grp behind grp wid grp.wid*1.1 ht grp.ht*1.1 fill ~beige
        }

        g1 = Group {
          Face s
          Label "G1" .h4
          box "A"
          box "B"
        }
        $box_around(g1)

        g2 = Group {
          Face s
          Label "G2" .h4
          box "C"
          box "D"
        } with .nw at g1.ne + (1, 0)

        Line -> from g1 to g2

        $box_around(g2)
      `)
      const shapes = dispatcher.shapes()
      shapes.forEach(s => { s.visible = true })
      const visible = shapes.filter(s => s.visible)
      const sg = (dispatcher as any).shapeGraph as ShapeGraph
      const reordered = sg.applyBehindConstraints(visible)

      const groups = shapes.filter(s => s instanceof SGroup)
      const behindBoxes = shapes.filter(s => s.behind)

      expect(behindBoxes.length).toBe(2)
      expect(groups.length).toBe(2)

      const g1First = groups[0].groupChildren[0]
      const g2First = groups[1].groupChildren[0]

      // Both behind boxes should be before their group's first child
      expect(reordered.indexOf(behindBoxes[0])).toBeLessThan(reordered.indexOf(g1First))
      expect(reordered.indexOf(behindBoxes[1])).toBeLessThan(reordered.indexOf(g2First))
    })
  })

  describe(`with constraint repositions children`, () => {
    it(`children move when group has with .nw constraint`, () => {
      const dispatcher = runProgram(`
        g = Group {
          box at (0, 0)
          box at (2, 0)
        } with .nw at (10, 10)
      `)
      const shapes = dispatcher.shapes()
      const group = shapes.find(s => s instanceof SGroup) as SGroup
      expect(group).toBeDefined()

      // Group nw should be at (10, 10)
      expect(group.nw.x).toBeCloseTo(10, 1)
      expect(group.nw.y).toBeCloseTo(10, 1)

      // Children should have shifted from their original (0,0) and (2,0)
      // by the same delta as the group
      const boxes = group.groupChildren
      expect(boxes[1].anchorX! - boxes[0].anchorX!).toBeCloseTo(2, 1)
      // Both children should be far from origin
      expect(boxes[0].anchorX!).toBeGreaterThan(5)
      expect(boxes[1].anchorX!).toBeGreaterThan(5)
    })

    it(`nested groups propagate constraint repositioning`, () => {
      const dispatcher = runProgram(`
        g = Group {
          Face s
          Group {
            Face e
            box
            box
          }
          Group {
            Face e
            box
            box
          }
        } with .n at (5, 5)
      `)
      const shapes = dispatcher.shapes()
      const outerGroup = shapes.filter(s => s instanceof SGroup).pop() as SGroup
      expect(outerGroup).toBeDefined()

      // Outer group's north should be at (5, 5)
      expect(outerGroup.n.x).toBeCloseTo(5, 1)
      expect(outerGroup.n.y).toBeCloseTo(5, 1)

      // Inner groups should also have moved
      const innerGroups = outerGroup.groupChildren.filter(s => s instanceof SGroup) as SGroup[]
      expect(innerGroups.length).toBe(2)

      // Inner groups and their children should all be near x=5
      for (const inner of innerGroups) {
        expect(inner.anchorX!).toBeCloseTo(5, 0)
        for (const child of inner.groupChildren) {
          // Children should NOT be at origin
          expect(child.anchorX).not.toBeNull()
        }
      }
    })

    it(`relative offsets are preserved after repositioning`, () => {
      const dispatcher = runProgram(`
        g = Group {
          a = box at (0, 0)
          b = box at (4, 0)
        } with .c at (20, 20)
      `)
      const shapes = dispatcher.shapes()
      const group = shapes.find(s => s instanceof SGroup) as SGroup
      const boxes = group.groupChildren

      // Center should be at (20, 20)
      expect(group.anchorX).toBeCloseTo(20, 1)
      expect(group.anchorY).toBeCloseTo(20, 1)

      // The two boxes were 4 apart originally — should still be 4 apart
      expect(boxes[1].anchorX! - boxes[0].anchorX!).toBeCloseTo(4, 1)

      // And both should be centered around x=20
      expect(boxes[0].anchorX!).toBeCloseTo(18, 1)
      expect(boxes[1].anchorX!).toBeCloseTo(22, 1)
    })
  })
})
