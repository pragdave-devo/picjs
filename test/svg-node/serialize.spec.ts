// test/svg-node/serialize.spec.ts
import { serialize, svgNode } from "../../src/svg-node.js"

describe("SvgNode serialization", () => {
  it("serializes a self-closing element with no children", () => {
    const node = svgNode("rect", { x: 10, y: 20, width: 100, height: 50 })
    // Note: Always use explicit closing tags for linkedom compatibility
    expect(serialize(node)).toBe(`<rect x="10" y="20" width="100" height="50"></rect>`)
  })

  it("serializes an element with children", () => {
    const node = svgNode("g", { transform: "translate(5,5)" }, [
      svgNode("rect", { x: 0, y: 0, width: 10, height: 10 }),
    ])
    expect(serialize(node)).toBe(
      `<g transform="translate(5,5)"><rect x="0" y="0" width="10" height="10"></rect></g>`
    )
  })

  it("serializes text content as children", () => {
    const node = svgNode("text", { x: 5, y: 10 }, ["Hello"])
    expect(serialize(node)).toBe(`<text x="5" y="10">Hello</text>`)
  })

  it("serializes nested tspan inside text", () => {
    const node = svgNode("text", {}, [
      svgNode("tspan", { dy: "1.2em" }, ["Line 1"]),
      svgNode("tspan", { dy: "1.2em" }, ["Line 2"]),
    ])
    expect(serialize(node)).toBe(
      `<text><tspan dy="1.2em">Line 1</tspan><tspan dy="1.2em">Line 2</tspan></text>`
    )
  })

  it("omits undefined and null attribute values", () => {
    const node = svgNode("rect", { x: 10, y: undefined, width: null } as any)
    expect(serialize(node)).toBe(`<rect x="10"></rect>`)
  })

  it("always uses closing tag for text elements (not self-closing)", () => {
    const node = svgNode("text", { x: 5, y: 10 }, [])
    expect(serialize(node)).toBe(`<text x="5" y="10"></text>`)
  })
})
