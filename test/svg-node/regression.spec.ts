// test/svg-node/regression.spec.ts
import { renderToStringAsync as renderToString } from "../../src/render-to-string.js"

const SOURCES = [
  { name: "single box", src: "Box" },
  { name: "circle with label", src: 'Circle "Hello"' },
  { name: "box to box with arrow", src: "Box\n->\nBox" },
  { name: "rotated box", src: "Box rotation 45" },
  { name: "group", src: "{\n  Box\n  Circle\n}" },
  { name: "styled", src: 'Box fill ~red stroke ~blue thickness 0.05' },
  { name: "line", src: 'Line from (0,0) then to (1,0) then to (1,1)' },
  { name: "sized box", src: 'Box width 2 height 1' },
  { name: "arc", src: 'Arc from (0,0) to (1,1)' },
  { name: "ellipse", src: 'Ellipse' },
  { name: "dashed line", src: 'Line from (0,0) to (3,0) dashed' },
  { name: "arrow both ends", src: 'Line from (0,0) to (3,0) <->' },
  { name: "line with label", src: 'Box\n-> "yes"\nBox' },
  { name: "nested group", src: '{\n  {\n    Box\n  }\n  Circle\n}' },
  { name: "with constraint", src: 'a = Box\nCircle with .w at a.e + (0.5, 0)' },
]

describe("SVG output regression", () => {
  for (const { name, src } of SOURCES) {
    it(`renders "${name}" to valid SVG`, async () => {
      const result = await renderToString(src, { includeSource: false })
      expect(result.error).toBeUndefined()
      expect(result.svg).toContain("<svg")
      expect(result.svg).toContain("</svg>")
      expect(result.svg).toMatchSnapshot()
    })
  }
})
