// test/svg-node/animated-export.spec.ts
import { exportAnimatedHTML } from "../../src/export-animated.js"

describe("animated HTML export", () => {
  it("produces HTML with SVG, JSON script, and runtime script", async () => {
    const html = await exportAnimatedHTML(
      'Box',
      { prefix: "p0", runtimeUrl: "picjs.runtime.min.js" }
    )
    expect(html).toContain("<svg")
    expect(html).toContain('type="application/json"')
    expect(html).toContain("data-picjs-ast")
    expect(html).toContain("data-picjs-player")
    expect(html).toContain("picjs.runtime.min.js")
  })

  it("AST JSON is valid and parseable", async () => {
    const html = await exportAnimatedHTML(
      'Box',
      { prefix: "p0", runtimeUrl: "picjs.runtime.min.js" }
    )
    const jsonMatch = html.match(/<script type="application\/json" data-picjs-ast>([\s\S]*?)<\/script>/)
    expect(jsonMatch).not.toBeNull()
    const ast = JSON.parse(jsonMatch![1])
    expect(ast.type).toBe("Program")
  })

  it("SVG elements have IDs", async () => {
    const html = await exportAnimatedHTML('Box', { prefix: "p0", runtimeUrl: "r.js" })
    expect(html).toMatch(/id="p0[a-z]"/)
  })

  it("handles parse errors by throwing", async () => {
    await expect(
      exportAnimatedHTML('!!invalid!!', { prefix: "p0", runtimeUrl: "r.js" })
    ).rejects.toThrow()
  })

  it("different prefixes produce different IDs", async () => {
    const h1 = await exportAnimatedHTML('Box', { prefix: "p0", runtimeUrl: "r.js" })
    const h2 = await exportAnimatedHTML('Box', { prefix: "p1", runtimeUrl: "r.js" })
    expect(h1).toMatch(/id="p0[a-z]"/)
    expect(h2).toMatch(/id="p1[a-z]"/)
    expect(h1).toContain("data-picjs-player")
    expect(h2).toContain("data-picjs-player")
  })
})
