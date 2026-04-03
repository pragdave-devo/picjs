import { newDispatcher } from "../helpers/eval.js"
import { ParseStatus } from "../../src/parser.js"
import { parseToMockAST } from "../helpers/ast.js"

function runProgram(src: string) {
  const parseResult = parseToMockAST(`Program`, src)
  if (parseResult.status !== ParseStatus.Ok) throw new Error(String(parseResult.error))
  const dispatcher = newDispatcher()
  dispatcher.start(parseResult.ast)
  return dispatcher
}

describe(`timeline`, () => {
  describe(`applyTimelineUpTo`, () => {
    it(`shapes are at initial position before applying timeline`, () => {
      const dispatcher = runProgram(`b = Box (100,100)\nmove b to (200,100) take 2`)
      const shapes = dispatcher.shapes()
      expect(shapes[0].x).toBeCloseTo(100)
    })

    it(`applies completed animations to end state`, () => {
      const dispatcher = runProgram(`b = Box (100,100)\nmove b to (200,100) take 2`)
      dispatcher.applyTimelineUpTo(3)  // past animation end (ends at t=2)
      const shapes = dispatcher.shapes()
      expect(shapes[0].x).toBeCloseTo(200)
    })

    it(`interpolates mid-flight animation`, () => {
      const dispatcher = runProgram(`b = Box (100,100)\nmove b to (200,100) take 2`)
      dispatcher.applyTimelineUpTo(1)  // halfway through 2s animation
      const shapes = dispatcher.shapes()
      expect(shapes[0].x).toBeGreaterThan(100)
      expect(shapes[0].x).toBeLessThan(200)
    })

    it(`does not apply entries after targetTime`, () => {
      // b animates 0→4s; @@ advances to t=4; c animation starts at t=4
      // apply up to t=2: c's animation (start=4) is after targetTime and skipped
      const dispatcher = runProgram(
        `b = Box (100,100)\nc = Box (200,100)\nmove b to (0,100) take 4\n@@\nmove c to (400,100) take 1`
      )
      dispatcher.applyTimelineUpTo(2)
      const shapes = dispatcher.shapes()
      expect(shapes[1].x).toBeCloseTo(200)  // c was not moved
    })
  })

  describe(`totalDuration`, () => {
    it(`returns 0 when there are no animations`, () => {
      const dispatcher = runProgram(`Box`)
      expect(dispatcher.totalDuration()).toBe(0)
    })

    it(`returns the end time of the animation`, () => {
      const dispatcher = runProgram(`b = Box (100,100)\nmove b to (200,100) take 3`)
      expect(dispatcher.totalDuration()).toBe(3)
    })

    it(`returns the max end across chained animations`, () => {
      // Chained with `then`: first ends at t=2, second starts at t=2 ends at t=3
      const dispatcher = runProgram(`b = Box (100,100)\nmove b to (200,100) take 2 then move b to (50,100) take 1`)
      expect(dispatcher.totalDuration()).toBe(3)
    })
  })
})
