import { renderToString } from "../../src/render-to-string.js"
import { IdGenerator } from "../../src/svg-node.js"

describe("Element ID generation", () => {
  it("does not add IDs by default", async () => {
    const result = await renderToString("Box")
    // Should have data-jp-id but not id attribute (regex must check for space or quote before 'id=')
    expect(result.svg).toMatch(/data-jp-id="/)
    expect(result.svg).not.toMatch(/[\s"]id="/)
  })

  it("adds IDs when prefix option is provided", async () => {
    const result = await renderToString("Box", { ids: { prefix: "p0" } })
    expect(result.svg).toMatch(/id="p0a"/)
  })

  it("generates unique IDs for multiple shapes", async () => {
    const result = await renderToString("Box\nCircle", { ids: { prefix: "p0" } })
    expect(result.svg).toMatch(/id="p0a"/)
    expect(result.svg).toMatch(/id="p0b"/)
  })

  it("uses sub-IDs for composite shapes", async () => {
    const result = await renderToString('Box "hello"', { ids: { prefix: "p0" } })
    // The composite shape wraps in a <g> with the main ID
    // Inner shape gets -s suffix, label gets -t suffix
    expect(result.svg).toMatch(/id="p0a"/)
    expect(result.svg).toMatch(/id="p0a-s"/)
    expect(result.svg).toMatch(/id="p0a-t"/)
  })

  it("different prefixes produce different IDs", async () => {
    const r1 = await renderToString("Box", { ids: { prefix: "p0" } })
    const r2 = await renderToString("Box", { ids: { prefix: "p1" } })
    expect(r1.svg).toMatch(/id="p0a"/)
    expect(r2.svg).toMatch(/id="p1a"/)
  })
})
