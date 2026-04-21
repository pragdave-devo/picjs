// test/svg-node/security.spec.ts
import { serialize, svgNode, escapeAttr, escapeText } from "../../src/svg-node.js"

describe("SvgNode security", () => {
  describe("text escaping", () => {
    it("escapes script tags in text content", () => {
      const node = svgNode("text", {}, ['<script>alert(1)</script>'])
      const svg = serialize(node)
      expect(svg).not.toContain("<script>")
      expect(svg).toContain("&lt;script&gt;")
    })

    it("escapes ampersands in text", () => {
      expect(escapeText("A & B")).toBe("A &amp; B")
    })
  })

  describe("attribute escaping", () => {
    it("escapes double quotes in attribute values to prevent attribute injection", () => {
      const node = svgNode("rect", { "data-info": '" onload="alert(1)' } as any)
      const svg = serialize(node)
      // Verify quotes are escaped and the malicious payload is safely contained
      expect(svg).toBe('<rect data-info="&quot; onload=&quot;alert(1)"/>')
      // No actual onload attribute should exist (it's just escaped text in data-info)
      expect(svg.match(/onload=/g)).toHaveLength(1) // Only one, in the data-info value
      expect(svg).not.toMatch(/" onload="/) // No unescaped quote-space-onload pattern
    })

    it("escapes angle brackets in attribute values", () => {
      expect(escapeAttr("<script>")).toBe("&lt;script&gt;")
    })
  })

  describe("tag whitelist", () => {
    it("rejects script tags", () => {
      expect(() => serialize(svgNode("script", {}))).toThrow(/Disallowed SVG tag/)
    })

    it("rejects foreignObject", () => {
      expect(() => serialize(svgNode("foreignObject", {}))).toThrow(/Disallowed SVG tag/)
    })

    it("allows standard SVG tags", () => {
      expect(() => serialize(svgNode("rect", {}))).not.toThrow()
      expect(() => serialize(svgNode("g", {}, [svgNode("path", {})]))).not.toThrow()
    })
  })

  describe("attribute name validation", () => {
    it("rejects event handler attributes", () => {
      expect(() => serialize(svgNode("rect", { onclick: "alert(1)" } as any))).toThrow(/Event handler/)
    })

    it("rejects onload", () => {
      expect(() => serialize(svgNode("rect", { onload: "alert(1)" } as any))).toThrow(/Event handler/)
    })

    it("rejects href (XSS vector)", () => {
      expect(() => serialize(svgNode("rect", { href: "javascript:alert(1)" } as any))).toThrow(/Blocked/)
    })

    it("allows standard SVG attributes", () => {
      expect(() => serialize(svgNode("rect", { fill: "red", stroke: "blue" }))).not.toThrow()
    })
  })
})
