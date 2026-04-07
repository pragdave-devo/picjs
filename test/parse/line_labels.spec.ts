import { testParse, arc, line, string, number } from "../helpers/ast.js"

const n = (val: number) => number(val)
const s = (val: string) => string(val)

// Helper to build expected _labels array entry
function lineLabel(text: string, pathPercent: number, side: string | null) {
  return { text: s(text), pathPercent, side }
}

// Line labels with default positioning (50%, no side)
testParse(
  `line -> "centered"`,
  line({
    line_path: s(`straight`),
    line_end: s(`>`),
    _labels: [lineLabel(`centered`, 0.5, null)]
  })
)

// Line label with explicit percentage
testParse(
  `line -> "quarter" at 25% above`,
  line({
    line_path: s(`straight`),
    line_end: s(`>`),
    _labels: [lineLabel(`quarter`, 0.25, `above`)]
  })
)

// Line label with just side (no percentage)
testParse(
  `line -> "top" above`,
  line({
    line_path: s(`straight`),
    line_end: s(`>`),
    _labels: [lineLabel(`top`, 0.5, `above`)]
  })
)

// Multiple labels on one line
testParse(
  `line -> "start" at 0% above "end" at 100% below`,
  line({
    line_path: s(`straight`),
    line_end: s(`>`),
    _labels: [
      lineLabel(`start`, 0.0, `above`),
      lineLabel(`end`, 1.0, `below`)
    ]
  })
)

// Arc labels with inside/outside (no turn means default, which is not included in args)
testParse(
  `Arc "outside" outside`,
  arc({
    _labels: [lineLabel(`outside`, 0.5, `outside`)]
  })
)

testParse(
  `Arc "inside" at 25% inside`,
  arc({
    _labels: [lineLabel(`inside`, 0.25, `inside`)]
  })
)

// Arc with explicit turn direction
testParse(
  `Arc cw "mid" at 50% outside`,
  arc({
    turn: s(`cw`),
    _labels: [lineLabel(`mid`, 0.5, `outside`)]
  })
)

// Side before percentage (both orderings should work)
testParse(
  `line -> "label" below at 60%`,
  line({
    line_path: s(`straight`),
    line_end: s(`>`),
    _labels: [lineLabel(`label`, 0.6, `below`)]
  })
)

testParse(
  `line -> "label" at 60% below`,
  line({
    line_path: s(`straight`),
    line_end: s(`>`),
    _labels: [lineLabel(`label`, 0.6, `below`)]
  })
)

// Side-first with multiple labels
testParse(
  `line -> "start" above at 10% "end" below at 90%`,
  line({
    line_path: s(`straight`),
    line_end: s(`>`),
    _labels: [
      lineLabel(`start`, 0.1, `above`),
      lineLabel(`end`, 0.9, `below`)
    ]
  })
)
