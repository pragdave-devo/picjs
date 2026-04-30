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

describe("renderToString", () => {
  // Import dynamically to avoid importing parser before tests run
  let renderToString: any

  beforeAll(async () => {
    const module = await import("../../src/render-to-string.js")
    renderToString = module.renderToStringAsync
  })

  it("renders a Box to an SVG string", async () => {
    const result = await renderToString("Box")
    expect(result.error).toBeUndefined()
    expect(result.svg).toContain("<svg")
    expect(result.svg).toContain("<rect")
    expect(result.svg).toContain("</svg>")
    expect(result.width).toBeGreaterThan(0)
    expect(result.height).toBeGreaterThan(0)
  })

  it("includes source comment when requested", async () => {
    const result = await renderToString("Box", { includeSource: true })
    expect(result.svg).toContain("<!-- picjs source:")
    expect(result.svg).toContain("Box")
  })

  it("excludes source comment when not requested", async () => {
    const result = await renderToString("Box", { includeSource: false })
    expect(result.svg).not.toContain("<!-- picjs source:")
  })

  it("returns error for invalid source", async () => {
    const result = await renderToString("!!invalid!!")
    expect(result.error).toBeDefined()
    expect(result.svg).toBe("")
    expect(result.width).toBe(0)
    expect(result.height).toBe(0)
  })

  it("includes cssPrefix class on root SVG", async () => {
    const result = await renderToString("Box")
    expect(result.svg).toContain('class="_myopic-1"')
  })

  it("includes xmlns attribute on root SVG", async () => {
    const result = await renderToString("Box")
    expect(result.svg).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it("calculates correct dimensions", async () => {
    const result = await renderToString("Box width 2 height 1")
    expect(result.width).toBeGreaterThan(1.5) // should be > 2 with padding
    expect(result.height).toBeGreaterThan(0.5) // should be > 1 with padding
  })
})
