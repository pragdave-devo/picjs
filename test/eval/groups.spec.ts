import { valueOf, newDispatcher } from "../helpers/eval.js"
import { TNumber, TPosition, TA } from "../../src/types.js"
import { ParseStatus } from "../../src/parser.js"
import { parseToMockAST } from "../helpers/ast.js"
import { SGroup } from "../../src/shapes/sgroup.js"

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
})
