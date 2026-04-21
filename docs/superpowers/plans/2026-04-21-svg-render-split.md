# SVG Render Pipeline Split — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove DOM dependency from SVG generation and enable animated picjs diagrams to be exported as self-contained HTML files.

**Architecture:** Replace redom-based SVG element creation with an `SvgNode` plain-object tree that serializes to a string. Renderers produce `SvgNode` instead of `SVGElement`. For animation in the browser, the runtime evaluates the AST, drives the animation engine, and patches pre-rendered SVG elements by ID. One npm package with two entry points: full (`picjs`) and browser runtime (`picjs/runtime`).

**Tech Stack:** TypeScript, Vite (library mode, multiple entry points), Jest (existing test suite — 650 tests baseline)

**Spec:** `docs/superpowers/specs/2026-04-21-svg-render-split-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|----------------|
| `src/svg-node.ts` | `SvgNode` type, `serialize()`, escaping, tag/attr validation, `IdGenerator` |
| `src/location.ts` | Shared `Location` type (extracted from parser) |
| `src/dom-patcher.ts` | Runtime DOM patcher: maps shape IDs → `getElementById` → `setAttribute` |
| `src/export-animated.ts` | Animated HTML export: SVG + AST JSON + runtime script tag |
| `src/runtime.ts` | Entry point for `picjs/runtime` bundle |
| `test/svg-node/serialize.spec.ts` | SvgNode serialization unit tests |
| `test/svg-node/security.spec.ts` | XSS/injection attack vector tests |
| `test/svg-node/regression.spec.ts` | SVG output snapshots (created BEFORE refactor, verified AFTER) |
| `test/svg-node/ids.spec.ts` | ID generation tests |
| `test/svg-node/animated-export.spec.ts` | Animated HTML export tests |

### Modified files

| File | What changes |
|------|-------------|
| `src/renderers/svg/_base.ts` | Remove `RedomComponent`, `svg`, `setAttr`. Property `el` renamed to `node` (type `SvgNode`). `build()` creates `SvgNode`. `rerender()` rebuilds `SvgNode`. |
| `src/renderers/svg/_renderer.ts` | Remove `svg`, `setAttr`. Returns `SvgNode[]`. Group handling creates `SvgNode` trees. |
| `src/renderers/svg/line.ts` | Remove `svg`, `setAttr`. Build `SvgNode` group with path + markers. |
| `src/renderers/svg/arc.ts` | Same pattern as line.ts. |
| `src/renderers/svg/polyline.ts` | Same pattern as line.ts. |
| `src/renderers/svg/group.ts` | Remove `svg`, `setAttr`. `addChild`/`clearChildren` operate on `SvgNode.children`. |
| `src/renderers/svg/label.ts` | Remove `svg`, `setAttr`, `setChildren`, `text`. Build `SvgNode` tree for `<text>`/`<tspan>`. |
| `src/renderers/svg/circle.ts` | Remove dead import comment. |
| `src/dispatcher.ts` | Remove `setAttr`, `setChildren`. Add `renderToSvgNodes()`. |
| `src/render-to-string.ts` | Remove linkedom. Use `serialize()` on `SvgNode` tree. |
| `src/ast.ts` | Import `Location` from `./location.js` instead of `./parser.js`. |
| `package.json` | Add `./runtime` export. Remove `linkedom` from dependencies. |
| `vite.config.ts` | Add runtime bundle build config. |

---

## Important architectural notes

**`el` → `node` rename must be atomic.** Every renderer subclass, the `_renderer.ts` orchestrator, and the Dispatcher all reference `SvgBase.el`. Renaming it to `node` (an `SvgNode` instead of `SVGElement`) requires changing ALL of these files simultaneously. Tasks 3 (SvgNode model), 4 (regression baselines), and 5 (full renderer refactor) are structured to handle this.

**`SLabel.calculateDimensions()` text measurement.** The current code temporarily adds an SVG text element to the DOM to measure dimensions via `getBBox()`. In non-DOM environments, it already falls back to character-count estimation (see `SLabel.calculateDimensions()` fallback). After removing the DOM from the render pipeline, text measurement in server-side rendering uses this fallback exclusively. Browser-side rendering (playground, runtime) still has DOM access for measurement if needed — but through a different path than the renderers.

**`Dispatcher.temporarilyAddSVGElement()`.** This method exists for browser text measurement. After the refactor, it remains for the browser/playground path where `svgHolder` is a real DOM element. The SvgNode render path (server-side) never calls it.

---

## Task 1: SvgNode model + serializer + security

Build the core data type and string serializer with security escaping. This is standalone — no existing code changes.

**Files:**
- Create: `src/svg-node.ts`
- Create: `test/svg-node/serialize.spec.ts`
- Create: `test/svg-node/security.spec.ts`

- [ ] **Step 1.1: Write failing tests for SvgNode serialization**

```typescript
// test/svg-node/serialize.spec.ts
import { serialize, svgNode } from "../../src/svg-node.js"

describe("SvgNode serialization", () => {
  it("serializes a self-closing element with no children", () => {
    const node = svgNode("rect", { x: 10, y: 20, width: 100, height: 50 })
    expect(serialize(node)).toBe(`<rect x="10" y="20" width="100" height="50"/>`)
  })

  it("serializes an element with children", () => {
    const node = svgNode("g", { transform: "translate(5,5)" }, [
      svgNode("rect", { x: 0, y: 0, width: 10, height: 10 }),
    ])
    expect(serialize(node)).toBe(
      `<g transform="translate(5,5)"><rect x="0" y="0" width="10" height="10"/></g>`
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
    expect(serialize(node)).toBe(`<rect x="10"/>`)
  })

  it("always uses closing tag for text elements (not self-closing)", () => {
    const node = svgNode("text", { x: 5, y: 10 }, [])
    expect(serialize(node)).toBe(`<text x="5" y="10"></text>`)
  })
})
```

- [ ] **Step 1.2: Run tests to verify they fail**

Run: `npx jest test/svg-node/serialize.spec.ts --no-coverage 2>&1`
Expected: FAIL — module not found

- [ ] **Step 1.3: Implement SvgNode type and serialize function**

```typescript
// src/svg-node.ts

export interface SvgNode {
  tag: string
  attrs: Record<string, string | number>
  children: (SvgNode | string)[]
}

export function svgNode(
  tag: string,
  attrs: Record<string, string | number> = {},
  children: (SvgNode | string)[] = []
): SvgNode {
  return { tag, attrs, children }
}

// Elements that must always have a closing tag even with no children
// (browsers treat self-closing <text/> differently than <text></text>)
const NEEDS_CLOSING_TAG = new Set(["text", "tspan", "textPath", "g", "svg", "defs", "clipPath", "mask", "pattern", "a"])

export function serialize(node: SvgNode): string {
  const tag = validateTag(node.tag)
  const attrStr = serializeAttrs(node.attrs)
  const prefix = attrStr ? `<${tag} ${attrStr}` : `<${tag}`

  if (node.children.length === 0 && !NEEDS_CLOSING_TAG.has(tag)) {
    return `${prefix}/>`
  }

  const inner = node.children.map(child =>
    typeof child === "string" ? escapeText(child) : serialize(child)
  ).join("")

  return `${prefix}>${inner}</${tag}>`
}

function serializeAttrs(attrs: Record<string, string | number>): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue
    const name = validateAttrName(key)
    parts.push(`${name}="${escapeAttr(String(value))}"`)
  }
  return parts.join(" ")
}

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

// --- Tag whitelist ---

const SVG_TAGS = new Set([
  "svg", "g", "defs", "symbol", "use",
  "rect", "circle", "ellipse", "line", "polyline", "polygon", "path",
  "text", "tspan", "textPath",
  "clipPath", "mask", "pattern",
  "linearGradient", "radialGradient", "stop",
  "filter", "feGaussianBlur", "feOffset", "feBlend", "feComposite",
  "marker", "title", "desc",
  "image", "a",
])

// --- Attribute validation ---

const SVG_ATTR_PATTERN = /^[a-zA-Z][a-zA-Z0-9-]*$/

const BLOCKED_ATTRS = new Set([
  "href", "xlink:href",
])

function validateTag(tag: string): string {
  if (!SVG_TAGS.has(tag)) {
    throw new Error(`Disallowed SVG tag: "${tag}"`)
  }
  return tag
}

function validateAttrName(name: string): string {
  if (!SVG_ATTR_PATTERN.test(name)) {
    throw new Error(`Invalid SVG attribute name: "${name}"`)
  }
  if (name.toLowerCase().startsWith("on")) {
    throw new Error(`Event handler attributes are not allowed: "${name}"`)
  }
  if (BLOCKED_ATTRS.has(name.toLowerCase())) {
    throw new Error(`Blocked attribute: "${name}"`)
  }
  return name
}

// --- ID generation ---

export class IdGenerator {
  private counter = 0
  constructor(private prefix: string) {}

  next(): string {
    const n = this.counter++
    if (n < 26) return `${this.prefix}${String.fromCharCode(97 + n)}`       // a-z
    if (n < 52) return `${this.prefix}${String.fromCharCode(65 + n - 26)}`  // A-Z
    return `${this.prefix}${n.toString(36)}`                                 // base-36 fallback
  }

  sub(parentId: string, suffix: string): string {
    return `${parentId}-${suffix}`
  }
}
```

- [ ] **Step 1.4: Write security tests**

```typescript
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
    it("escapes double quotes in attribute values", () => {
      const node = svgNode("rect", { "data-info": '" onload="alert(1)' } as any)
      const svg = serialize(node)
      expect(svg).not.toContain('onload=')
      expect(svg).toContain("&quot;")
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
```

- [ ] **Step 1.5: Run all new tests**

Run: `npx jest test/svg-node/ --no-coverage 2>&1`
Expected: all PASS

- [ ] **Step 1.6: Run full test suite**

Run: `npm test 2>&1`
Expected: 650 tests + new tests pass

- [ ] **Step 1.7: Commit**

```bash
git add src/svg-node.ts test/svg-node/serialize.spec.ts test/svg-node/security.spec.ts
git commit -m "add SvgNode model, serializer, and security tests"
```

---

## Task 2: SVG regression baselines (BEFORE refactor)

Capture snapshot baselines using the CURRENT renderer (linkedom/redom). These snapshots become the regression safety net for the renderer refactor.

**Files:**
- Create: `test/svg-node/regression.spec.ts`

- [ ] **Step 2.1: Write regression snapshot tests**

```typescript
// test/svg-node/regression.spec.ts
import { renderToString } from "../../src/render-to-string.js"

const SOURCES = [
  { name: "single box", src: "Box" },
  { name: "circle with label", src: 'Circle "Hello"' },
  { name: "box to box with arrow", src: "Box\n->\nBox" },
  { name: "rotated box", src: "Box rotation 45" },
  { name: "group", src: "{\n  Box\n  Circle\n}" },
  { name: "styled", src: 'Box fill red stroke blue thickness 0.05' },
  { name: "polyline", src: 'Polyline from (0,0) to (1,0) to (1,1)' },
  { name: "label alignment", src: 'Box "left aligned" align w' },
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
```

- [ ] **Step 2.2: Create initial snapshots**

Run: `npx jest test/svg-node/regression.spec.ts --no-coverage -u 2>&1`
Expected: PASS — snapshots created. Review them manually.

- [ ] **Step 2.3: Verify snapshots match on re-run**

Run: `npx jest test/svg-node/regression.spec.ts --no-coverage 2>&1`
Expected: all PASS (snapshots stable)

- [ ] **Step 2.4: Commit baselines**

```bash
git add test/svg-node/regression.spec.ts test/svg-node/__snapshots__/
git commit -m "add SVG regression snapshots from current renderer"
```

---

## Task 3: Refactor ALL renderers from redom to SvgNode

This is the big change. Because `SvgBase.el` (SVGElement) is renamed to `SvgBase.node` (SvgNode), ALL renderers and the orchestrator must change simultaneously. There is no intermediate state where only some are converted.

**Files changed (ALL at once):**
- Modify: `src/renderers/svg/_base.ts`
- Modify: `src/renderers/svg/_renderer.ts`
- Modify: `src/renderers/svg/rect.ts` (remove dead import)
- Modify: `src/renderers/svg/circle.ts` (remove dead import)
- Modify: `src/renderers/svg/ellipse.ts` (no change needed)
- Modify: `src/renderers/svg/line.ts`
- Modify: `src/renderers/svg/arc.ts`
- Modify: `src/renderers/svg/polyline.ts`
- Modify: `src/renderers/svg/label.ts`
- Modify: `src/renderers/svg/group.ts`
- Modify: `src/dispatcher.ts`

- [ ] **Step 3.1: Refactor `_base.ts`**

Replace the file. Key changes:
- Remove `import { RedomComponent, setAttr, svg } from "redom"`
- Add `import { SvgNode, svgNode } from "../../svg-node.js"`
- Rename `el!: SVGElement` → `node!: SvgNode`
- `build(tag)`: `this.node = svgNode(tag, this.attrs)`
- `rerender()`: `this.node = svgNode(this.node.tag, this.attrs)`. Note: subclasses with children (Line, Arc, Polyline, Label, Group) override `rerender()` entirely and rebuild the full node tree including children.
- Remove `RedomComponent` interface implementation
- Keep `toSvgAttrNames`, `arrowDimensions`, `applyDrawProgress` unchanged (they're pure functions)

- [ ] **Step 3.2: Refactor `rect.ts`, `circle.ts`, `ellipse.ts`**

These are simple — they only call `super(position, attrs)` and `this.build(tag)`, which now creates an `SvgNode`. Remove the dead `// import { setAttr } from "redom"` comment from circle.ts. No other changes needed in their own code.

- [ ] **Step 3.3: Refactor `line.ts`**

Remove `import { setAttr, svg } from "redom"`. Add `import { SvgNode, svgNode } from "../../svg-node.js"`.

`buildGroup()` becomes:
```typescript
private buildGroup() {
  const strokeColor = this.attrs.stroke || 'currentColor'
  const groupAttrs: Shape.Args = {}
  if (this.attrs.transform) {
    groupAttrs.transform = this.attrs.transform
    delete this.attrs.transform
  }
  if (this.attrs.opacity !== undefined) {
    groupAttrs.opacity = this.attrs.opacity
    delete this.attrs.opacity
  }
  const lineNode = svgNode('path', this.attrs as Record<string, string | number>)
  const markerNodes = this.buildMarkers(strokeColor)
  this.node = svgNode('g', groupAttrs as Record<string, string | number>,
    [lineNode, ...markerNodes])
}
```

`buildMarkers()` returns `SvgNode[]`:
```typescript
private buildMarkers(strokeColor: string): SvgNode[] {
  if (this.hideMarkers) { this.pendingMarkers = []; return [] }
  const nodes = this.pendingMarkers.map(d =>
    svgNode('path', { d, fill: strokeColor, stroke: 'none' })
  )
  this.pendingMarkers = []
  return nodes
}
```

`rerender()` rebuilds the full node tree:
```typescript
rerender(position: RenderParameters, attrs: Shape.Args) {
  this.pendingMarkers = []
  this.attrs = toSvgAttrNames(this.convertToSVG(position, attrs))
  this.buildGroup()
  return this
}
```

No more `setAttr`, `removeAttribute`, `appendChild`, `removeChild`.

- [ ] **Step 3.4: Refactor `arc.ts` and `polyline.ts`**

Same pattern as `line.ts`. Replace `buildGroup()`, `appendMarkers()`, `rerender()` with `SvgNode` construction. Both have the identical DOM manipulation patterns as Line.

- [ ] **Step 3.5: Refactor `label.ts`**

Remove `import { setAttr, setChildren, svg, text } from "redom"`. Add `import { SvgNode, svgNode } from "../../svg-node.js"`.

Key method changes:

`runsToTSpans()` returns children array instead of mutating DOM:
```typescript
private runsToTSpans(runs: StyledRun[]): (SvgNode | string)[] {
  return runs.map(run => {
    if (run.type === "text") return run.text
    if (run.type === "em") return svgNode("tspan", { "font-style": "italic" }, [run.text])
    return run.text
  })
}
```

`renderParagraphs()` builds `SvgNode[]` children and assigns to `this.node.children`:
```typescript
private renderParagraphs(paragraphs: string[]) {
  // ... same anchor/alignment computation ...
  this.node.attrs["text-anchor"] = textAnchor
  const children: SvgNode[] = []
  for (let pi = 0; pi < paragraphs.length; pi++) {
    const parsed = MD.defaultInlineParse(paragraphs[pi])
    const runs = flattenMDToRuns(parsed)
    const wrappedLines = this.maxwidth ? wrapRuns(runs, this.maxwidth) : [runs]
    for (let li = 0; li < wrappedLines.length; li++) {
      const attrs: Record<string, any> = { x: anchorX }
      if (children.length > 0) {
        attrs.dy = (li === 0 && pi > 0) ? paragraphSpacing : lineSpacing
      }
      children.push(svgNode("tspan", attrs, this.runsToTSpans(wrappedLines[li])))
    }
  }
  this.node.children = children
}
```

`renderWrappedLines()` follows the same pattern.

`setText()` single-line path: instead of `this.runsToTSpans(this.el, runs)`, build children and assign:
```typescript
if (wrapped.length <= 1 && this.align === "c") {
  delete this.node.attrs["text-anchor"]
  this.node.children = this.runsToTSpans(wrapped[0] || runs)
}
```

- [ ] **Step 3.6: Refactor `group.ts`**

Remove redom imports. Add SvgNode imports.

```typescript
export class Group extends SvgBase {
  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.build("g")
  }

  // convertToSVG stays the same

  rerender(_position: RenderParameters, attrs: Shape.Args) {
    this.attrs = this.convertToSVG(_position, attrs)
    this.node = svgNode("g", this.attrs as Record<string, string | number>,
      this.node.children)  // preserve existing children
    return this
  }

  addChild(childNode: SvgNode) {
    this.node.children.push(childNode)
  }

  clearChildren() {
    this.node.children = []
  }
}
```

- [ ] **Step 3.7: Refactor `_renderer.ts`**

Remove `import { svg, setAttr } from "redom"`. Add `import { SvgNode, svgNode } from "../../svg-node.js"`.

- Change `parentGroups: { [sid: string]: SVGElement }` → `parentGroups: { [sid: string]: SvgNode }`
- `render()` returns `SvgNode[]`
- `renderSingleShape()` returns `renderer.node` instead of `renderer.el`
- `renderParentWithChildren()`: builds `svgNode("g", groupAttrs, [parentNode, ...childNodes])`
- `renderGroup()` returns `groupRenderer.node`
- `renderChild()` returns `SvgNode | null`
- Replace `element.setAttribute("data-jp-id", sid)` with `node.attrs["data-jp-id"] = sid`
- Replace `svg('g') as SVGElement` with `svgNode("g")`
- Replace `setAttr(groupEl, { transform })` with `groupNode.attrs.transform = transform`
- Replace `groupEl.removeAttribute("transform")` with `delete groupNode.attrs.transform`
- Replace manual `appendChild`/`removeChild` with building children arrays in `svgNode()` constructor

- [ ] **Step 3.8: Refactor Dispatcher**

Remove `import { setAttr, setChildren } from "redom"`. Add `import { SvgNode, svgNode, serialize } from "./svg-node.js"`.

- Constructor: replace `setAttr(this.svgHolder, { class: ... })` with `if (this.svgHolder) this.svgHolder.setAttribute("class", this.interpreter.cssPrefix)`
- `renderUpdatedShapes()`: get `SvgNode[]` from renderer, then if `svgHolder` exists, serialize and inject via `innerHTML`:
  ```typescript
  renderUpdatedShapes() {
    const svgNodes = this.shapeGraph.renderUpdatedOn(this.renderer) as SvgNode[]
    this.lastRenderNodes = svgNodes
    if (this.svgHolder) {
      this.svgHolder.innerHTML = svgNodes.map(n => serialize(n)).join("")
    }
  }
  ```
- Add `renderToSvgNodes(): SvgNode[]`: returns `this.lastRenderNodes` (or runs render and returns)

- [ ] **Step 3.9: TypeScript compilation check**

Run: `npx tsc --noEmit 2>&1`
Expected: no errors. All references to `.el` are now `.node`, all `SVGElement` returns are now `SvgNode`.

- [ ] **Step 3.10: Run full test suite**

Run: `npm test 2>&1`
Expected: 650 tests pass (tests don't test SVG output — they test geometry, positions, shapes)

- [ ] **Step 3.11: Run regression snapshots**

Run: `npx jest test/svg-node/regression.spec.ts --no-coverage 2>&1`
Expected: snapshots match OR snapshots differ in acceptable ways (attribute ordering, minor whitespace). If they differ, review each diff. Update snapshots ONLY for expected differences. Any unexpected structural difference is a bug — fix before proceeding.

- [ ] **Step 3.12: Commit**

```bash
git add src/renderers/ src/dispatcher.ts
git commit -m "refactor all renderers from redom to SvgNode"
```

---

## Task 4: Refactor render-to-string.ts (remove linkedom)

With all renderers producing SvgNode, render-to-string no longer needs a DOM at all.

**Files:**
- Modify: `src/render-to-string.ts`

- [ ] **Step 4.1: Write tests for the new render-to-string**

Add to `test/svg-node/serialize.spec.ts`:

```typescript
import { renderToString } from "../../src/render-to-string.js"

describe("renderToString", () => {
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
  })

  it("returns error for invalid source", async () => {
    const result = await renderToString("!!invalid!!")
    expect(result.error).toBeDefined()
  })
})
```

- [ ] **Step 4.2: Rewrite render-to-string.ts**

Remove `import { parseHTML } from "linkedom"` and `setupLinkedomGlobals()`. Replace with direct SvgNode construction:

```typescript
import { SvgNode, svgNode, serialize } from "./svg-node.js"

export interface RenderResult { svg: string; width: number; height: number; error?: string }
export interface RenderOptions {
  padding?: number
  includeSource?: boolean
  ids?: { prefix: string }
}

export async function renderToString(source: string, options: RenderOptions = {}): Promise<RenderResult> {
  const { padding = 0.2, includeSource = true } = options

  const [
    { parseToAST, ParseStatus },
    { Dispatcher },
    { parse: pegParse },
    { nullLogger, calculateBoundingBox, viewBoxFromBounds }
  ] = await Promise.all([
    import("./parser.js"),
    import("./dispatcher.js"),
    import("./peg_parser/jp.js"),
    import("./render-utils.js")
  ])

  const parsed = parseToAST(pegParse, source, "Start", false)
  if (parsed.status !== ParseStatus.Ok) {
    return { svg: "", width: 0, height: 0, error: parsed.error?.message || "Parse error" }
  }

  try {
    const dispatcher = new Dispatcher(nullLogger, null, 1)
    dispatcher.start(parsed.ast)

    const svgChildren = dispatcher.renderToSvgNodes()
    const bounds = calculateBoundingBox(dispatcher.shapes(), padding)
    const viewBox = viewBoxFromBounds(bounds, padding)

    const root = svgNode("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox }, svgChildren)
    let svg = serialize(root)

    if (includeSource) {
      const comment = `<!-- picjs source:\n${source}\n-->`
      svg = svg.replace("<svg", `${comment}\n<svg`)
    }

    return { svg, width: bounds.width, height: bounds.height }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { svg: "", width: 0, height: 0, error: message }
  }
}

export async function render(source: string, options: RenderOptions = {}): Promise<string> {
  const result = await renderToString(source, options)
  if (result.error) throw new Error(result.error)
  return result.svg
}
```

Note: `applyTimelineUpTo(0)` is removed because with `svgHolder: null`, `renderUpdatedShapes()` called during `start()` now stores nodes in `lastRenderNodes`. If timeline-at-0 processing is needed, call `dispatcher.applyTimelineUpTo(0)` and then `renderToSvgNodes()`.

- [ ] **Step 4.3: Run tests**

Run: `npx jest test/svg-node/ --no-coverage 2>&1`
Expected: all PASS

- [ ] **Step 4.4: Update regression snapshots if needed**

If the removal of linkedom changes SVG output (e.g., attribute ordering, namespace handling), review the diffs and update snapshots.

Run: `npx jest test/svg-node/regression.spec.ts --no-coverage 2>&1`

- [ ] **Step 4.5: Run full test suite**

Run: `npm test 2>&1`
Expected: all pass

- [ ] **Step 4.6: Commit**

```bash
git add src/render-to-string.ts test/svg-node/serialize.spec.ts
git commit -m "remove linkedom from render-to-string, use SvgNode serializer"
```

---

## Task 5: Verify redom removed from render pipeline

Confirm redom is gone from the rendering path. `jp-web.ts` still uses it for UI chrome — that's expected.

**Files:**
- Modify: `package.json` (remove linkedom from dependencies)

- [ ] **Step 5.1: Verify no renderer imports redom**

Run: `grep -rn "from.*redom" src/renderers/ src/dispatcher.ts src/render-to-string.ts`
Expected: no output

- [ ] **Step 5.2: Verify only jp-web.ts uses redom**

Run: `grep -rn "from.*redom" src/`
Expected: only `src/jp-web.ts`

- [ ] **Step 5.3: Remove linkedom from dependencies**

In `package.json`, remove `"linkedom"` from `dependencies`. It's no longer needed by the render pipeline. If the CLI or other code still needs it, move to `devDependencies`.

- [ ] **Step 5.4: Run full test suite**

Run: `npm test 2>&1`
Expected: all pass

- [ ] **Step 5.5: Commit**

```bash
git add package.json
git commit -m "remove linkedom dependency, redom isolated to web UI only"
```

---

## Task 6: Extract Location type from parser

Decouple `ast.ts` from the parser so the runtime bundle can import AST types without pulling in the parser/tokenizer.

**Files:**
- Create: `src/location.ts`
- Modify: `src/ast.ts`
- Modify: `src/parser.ts` (re-export for backward compat)
- Modify: `src/dispatcher.ts`
- Check and update: any other files importing `Location` from `./parser.js`

- [ ] **Step 6.1: Find all files importing Location from parser**

Run: `grep -rn "Location.*from.*parser" src/`

Update ALL of them to import from `./location.js`.

- [ ] **Step 6.2: Create `src/location.ts`**

```typescript
export interface Location {
  start: { offset: number; line: number; column: number }
  end: { offset: number; line: number; column: number }
  source?: string
}
```

- [ ] **Step 6.3: Update imports in all consuming files**

- `src/ast.ts`: `import { Location } from "./location.js"`
- `src/dispatcher.ts`: `import { Location } from "./location.js"`
- `src/parser.ts`: add `export { Location } from "./location.js"` for backward compat
- Any other files found in Step 6.1

- [ ] **Step 6.4: Run full test suite**

Run: `npm test 2>&1`
Expected: all pass

- [ ] **Step 6.5: Commit**

```bash
git add src/location.ts src/ast.ts src/dispatcher.ts src/parser.ts
git commit -m "extract Location type to shared module, decouple AST from parser"
```

---

## Task 7: Add opt-in element IDs

Add ID generation to SvgNode output, controlled by a render option.

**Files:**
- Modify: `src/renderers/svg/_renderer.ts`
- Modify: `src/render-to-string.ts` (pass IdGenerator option)
- Create: `test/svg-node/ids.spec.ts`

- [ ] **Step 7.1: Write ID tests**

```typescript
// test/svg-node/ids.spec.ts
import { IdGenerator } from "../../src/svg-node.js"

describe("ID generation", () => {
  it("generates sequential IDs with prefix", () => {
    const gen = new IdGenerator("p0")
    expect(gen.next()).toBe("p0a")
    expect(gen.next()).toBe("p0b")
  })

  it("handles more than 52 IDs gracefully", () => {
    const gen = new IdGenerator("p0")
    for (let i = 0; i < 52; i++) gen.next()
    const id = gen.next()
    expect(id).toMatch(/^p0/)
    expect(id.length).toBeGreaterThan(3)
  })

  it("different prefixes produce different IDs", () => {
    const g1 = new IdGenerator("p0")
    const g2 = new IdGenerator("p1")
    expect(g1.next()).toBe("p0a")
    expect(g2.next()).toBe("p1a")
  })

  it("generates sub-IDs for composite elements", () => {
    const gen = new IdGenerator("p0")
    const id = gen.next()
    expect(gen.sub(id, "s")).toBe("p0a-s")
    expect(gen.sub(id, "t")).toBe("p0a-t")
  })
})
```

- [ ] **Step 7.2: Run ID tests**

Run: `npx jest test/svg-node/ids.spec.ts --no-coverage 2>&1`
Expected: PASS (IdGenerator already implemented in Task 1)

- [ ] **Step 7.3: Wire IDs into Renderer (opt-in)**

In `_renderer.ts`, accept an optional `IdGenerator` via a setter or constructor parameter. When present:
- Each shape's `SvgNode` gets `id` in its attrs
- Composite shapes (parent+children `<g>`) get the logical ID on the `<g>`, with sub-IDs on inner elements (`-s` for shape, `-t` for text)
- When absent, no IDs added (default — preserves backward compat)

- [ ] **Step 7.4: Run full test suite + regression snapshots**

Run: `npm test 2>&1`
Expected: all pass. Regression snapshots unchanged (IDs off by default).

- [ ] **Step 7.5: Commit**

```bash
git add src/renderers/svg/_renderer.ts src/render-to-string.ts test/svg-node/ids.spec.ts
git commit -m "add opt-in element ID generation for animation runtime"
```

---

## Task 8: Runtime entry point and module dependency verification

Create the `picjs/runtime` entry point. Verify transitive imports don't pull in the parser.

**Files:**
- Create: `src/runtime.ts`
- Modify: `package.json`

- [ ] **Step 8.1: Run module dependency analysis**

Run: `npx madge src/interpreter.ts --json 2>&1` (install madge if needed: `npx madge`)

Check the transitive dependency graph from the runtime's root modules. Verify none of them reach `parser.ts` or `peg_parser/`. If they do, identify and fix the import chain.

- [ ] **Step 8.2: Create runtime entry point**

```typescript
// src/runtime.ts
export { Dispatcher } from "./dispatcher.js"
export { Interpreter } from "./interpreter.js"
export { Timeline } from "./timeline.js"
export { AnimationRunner } from "./animation_runner.js"
export { ShapeGraph } from "./shape_graph.js"
export { Geometry } from "./geometry.js"
export * from "./shapes.js"
export * from "./animators/_base.js"
export { serialize, svgNode, IdGenerator } from "./svg-node.js"
export type { SvgNode } from "./svg-node.js"
```

- [ ] **Step 8.3: Add runtime export to package.json**

```json
"./runtime": {
  "import": "./dist/runtime.js",
  "types": "./dist/runtime.d.ts"
}
```

- [ ] **Step 8.4: Run full test suite**

Run: `npm test 2>&1`
Expected: all pass

- [ ] **Step 8.5: Commit**

```bash
git add src/runtime.ts package.json
git commit -m "add picjs/runtime entry point"
```

---

## Task 9: Vite dual-build configuration

Configure Vite to produce two bundles: the full library and the runtime.

**Files:**
- Modify: `vite.config.ts`
- Modify: `package.json` (build scripts)

- [ ] **Step 9.1: Configure Vite for dual builds**

Vite's library mode doesn't natively support multiple entry points with different externals. Use two sequential builds via a build script:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import { resolve } from 'path'

const target = process.env.BUILD_TARGET || 'main'

const configs = {
  main: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'picjs',
      fileName: (format) => format === 'umd' ? 'picjs.umd.js' : 'picjs.js',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: { exports: 'named', inlineDynamicImports: true },
    },
  },
  runtime: {
    lib: {
      entry: resolve(__dirname, 'src/runtime.ts'),
      name: 'picjsRuntime',
      fileName: (format) => format === 'umd' ? 'picjs.runtime.umd.js' : 'runtime.js',
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: { exports: 'named', inlineDynamicImports: true },
    },
  },
}

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    ...configs[target],
    minify: 'esbuild',
    sourcemap: true,
  },
  // ... keep existing server/plugins config
})
```

Update `package.json` scripts:
```json
"build:lib": "BUILD_TARGET=main vite build",
"build:runtime": "BUILD_TARGET=runtime vite build",
"build": "npm run build:lib && npm run build:runtime && npm run build:cli"
```

- [ ] **Step 9.2: Build and verify**

Run: `npm run build 2>&1`
Expected: produces `dist/picjs.js` and `dist/runtime.js`

- [ ] **Step 9.3: Verify runtime bundle excludes parser**

Run: `grep -c "pegParse\|StartRules\|SyntaxError" dist/runtime.js`
Expected: 0 matches

Check sizes:
Run: `ls -la dist/picjs.js dist/runtime.js`
Expected: runtime is notably smaller

- [ ] **Step 9.4: Commit**

```bash
git add vite.config.ts package.json
git commit -m "configure Vite dual build for main + runtime bundles"
```

---

## Task 10: DOM patcher for animation runtime

Build the component that maps shape property changes to DOM element mutations by ID. This is what the runtime uses to update the pre-rendered SVG during animation.

**Files:**
- Create: `src/dom-patcher.ts`
- Create: `test/svg-node/dom-patcher.spec.ts`

- [ ] **Step 10.1: Write tests for DOM patcher**

```typescript
// test/svg-node/dom-patcher.spec.ts
// (These test the patcher's logic, not actual DOM — uses mock elements)

import { DomPatcher } from "../../src/dom-patcher.js"

describe("DomPatcher", () => {
  it("maps shape IDs to element attribute updates", () => {
    const calls: [string, string, string][] = []
    const mockGetById = (id: string) => ({
      setAttribute: (name: string, value: string) => calls.push([id, name, value]),
      removeAttribute: (_name: string) => {},
    })

    const patcher = new DomPatcher(mockGetById as any)
    patcher.register("p0a", "p0a")
    patcher.setAttr("p0a", { fill: "red", stroke: "blue" })

    expect(calls).toContainEqual(["p0a", "fill", "red"])
    expect(calls).toContainEqual(["p0a", "stroke", "blue"])
  })

  it("handles composite shapes with sub-IDs", () => {
    const calls: [string, string, string][] = []
    const mockGetById = (id: string) => ({
      setAttribute: (name: string, value: string) => calls.push([id, name, value]),
      removeAttribute: (_name: string) => {},
    })

    const patcher = new DomPatcher(mockGetById as any)
    patcher.register("p0a", "p0a", { shape: "p0a-s", text: "p0a-t" })
    patcher.setShapeAttr("p0a", { fill: "green" })
    patcher.setTextAttr("p0a", { "font-size": "14" })

    expect(calls).toContainEqual(["p0a-s", "fill", "green"])
    expect(calls).toContainEqual(["p0a-t", "font-size", "14"])
  })
})
```

- [ ] **Step 10.2: Implement DomPatcher**

```typescript
// src/dom-patcher.ts

type GetElementById = (id: string) => Element | null

interface SubIds {
  shape?: string
  text?: string
}

export class DomPatcher {
  private elements = new Map<string, { el: Element; subs: SubIds }>()
  private getById: GetElementById

  constructor(getById: GetElementById) {
    this.getById = getById
  }

  register(shapeId: string, elementId: string, subs?: SubIds) {
    const el = this.getById(elementId)
    if (el) this.elements.set(shapeId, { el, subs: subs || {} })
  }

  setAttr(shapeId: string, attrs: Record<string, string | number | undefined>) {
    const entry = this.elements.get(shapeId)
    if (!entry) return
    this.applyAttrs(entry.el, attrs)
  }

  setShapeAttr(shapeId: string, attrs: Record<string, string | number | undefined>) {
    const entry = this.elements.get(shapeId)
    if (!entry?.subs.shape) return this.setAttr(shapeId, attrs)
    const el = this.getById(entry.subs.shape)
    if (el) this.applyAttrs(el, attrs)
  }

  setTextAttr(shapeId: string, attrs: Record<string, string | number | undefined>) {
    const entry = this.elements.get(shapeId)
    if (!entry?.subs.text) return
    const el = this.getById(entry.subs.text)
    if (el) this.applyAttrs(el, attrs)
  }

  private applyAttrs(el: Element, attrs: Record<string, string | number | undefined>) {
    for (const [name, value] of Object.entries(attrs)) {
      if (value === undefined) {
        el.removeAttribute(name)
      } else {
        el.setAttribute(name, String(value))
      }
    }
  }
}
```

- [ ] **Step 10.3: Run tests**

Run: `npx jest test/svg-node/dom-patcher.spec.ts --no-coverage 2>&1`
Expected: PASS

- [ ] **Step 10.4: Commit**

```bash
git add src/dom-patcher.ts test/svg-node/dom-patcher.spec.ts
git commit -m "add DomPatcher for animation runtime"
```

---

## Task 11: Animated HTML export

Build the static HTML export that embeds pre-rendered SVG + AST JSON + runtime script tag.

**Files:**
- Create: `src/export-animated.ts`
- Create: `test/svg-node/animated-export.spec.ts`

- [ ] **Step 11.1: Write tests**

```typescript
// test/svg-node/animated-export.spec.ts
import { exportAnimatedHTML } from "../../src/export-animated.js"

describe("animated HTML export", () => {
  it("produces HTML with SVG, JSON script, and runtime script", async () => {
    const html = await exportAnimatedHTML(
      'Box\nmove Box to (5, 0) take 1',
      { prefix: "p0", runtimeUrl: "picjs.runtime.min.js" }
    )
    expect(html).toContain("<svg")
    expect(html).toContain('type="application/json"')
    expect(html).toContain('data-picjs="p0"')
    expect(html).toContain("picjs.runtime.min.js")
  })

  it("AST JSON is valid and parseable", async () => {
    const html = await exportAnimatedHTML(
      'Box\nmove Box to (5, 0) take 1',
      { prefix: "p0", runtimeUrl: "picjs.runtime.min.js" }
    )
    const jsonMatch = html.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/)
    expect(jsonMatch).not.toBeNull()
    const ast = JSON.parse(jsonMatch![1])
    expect(ast.type).toBe("Program")
  })

  it("SVG elements have IDs", async () => {
    const html = await exportAnimatedHTML('Box', { prefix: "p0", runtimeUrl: "r.js" })
    expect(html).toMatch(/id="p0[a-z]"/)
  })

  it("handles Pause in source", async () => {
    const html = await exportAnimatedHTML(
      'Box\npause\nCircle',
      { prefix: "p0", runtimeUrl: "r.js" }
    )
    expect(html).toContain("<svg")
    const ast = JSON.parse(
      html.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/)![1]
    )
    expect(ast.type).toBe("Program")
  })
})
```

- [ ] **Step 11.2: Implement exportAnimatedHTML**

Parse source ONCE, use the AST for both rendering and JSON serialization:

```typescript
// src/export-animated.ts
export interface ExportOptions {
  prefix: string
  runtimeUrl: string
  padding?: number
}

export async function exportAnimatedHTML(
  source: string,
  options: ExportOptions
): Promise<string> {
  const { prefix, runtimeUrl, padding = 0.2 } = options

  const [
    { parseToAST, ParseStatus },
    { Dispatcher },
    { parse: pegParse },
    { nullLogger, calculateBoundingBox, viewBoxFromBounds },
    { svgNode, serialize, IdGenerator },
  ] = await Promise.all([
    import("./parser.js"),
    import("./dispatcher.js"),
    import("./peg_parser/jp.js"),
    import("./render-utils.js"),
    import("./svg-node.js"),
  ])

  const parsed = parseToAST(pegParse, source, "Start", false)
  if (parsed.status !== ParseStatus.Ok) {
    throw new Error(parsed.error?.message || "Parse error")
  }

  // Validate AST structure
  if (!parsed.ast || typeof parsed.ast.type !== "string") {
    throw new Error("Invalid AST structure")
  }

  const dispatcher = new Dispatcher(nullLogger, null, 1)
  // Pass IdGenerator so rendered SVG includes element IDs
  dispatcher.setIdGenerator(new IdGenerator(prefix))
  dispatcher.start(parsed.ast)

  const svgChildren = dispatcher.renderToSvgNodes()
  const bounds = calculateBoundingBox(dispatcher.shapes(), padding)
  const viewBox = viewBoxFromBounds(bounds, padding)

  const root = svgNode("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox }, svgChildren)
  const svgStr = serialize(root)

  const astJson = JSON.stringify(parsed.ast)

  return `<div id="picjs-${prefix}">
${svgStr}
<script type="application/json" data-picjs="${prefix}">
${astJson}
</script>
</div>
<script src="${runtimeUrl}"></script>`
}
```

- [ ] **Step 11.3: Run tests**

Run: `npx jest test/svg-node/animated-export.spec.ts --no-coverage 2>&1`
Expected: PASS

- [ ] **Step 11.4: Run full test suite**

Run: `npm test 2>&1`
Expected: all pass

- [ ] **Step 11.5: Commit**

```bash
git add src/export-animated.ts test/svg-node/animated-export.spec.ts
git commit -m "add animated HTML export with embedded AST and element IDs"
```

---

## Task 12: Browser integration testing

Verify the exported HTML works in a real browser.

**Files:**
- Create: `test/integration/generate-test-page.ts` (script to generate test HTML)

- [ ] **Step 12.1: Create test page generator**

Write a script that generates a test HTML page with:
- 2 static diagrams (no animation)
- 1 animated diagram (move + color change)
- 1 animated diagram with Pause

- [ ] **Step 12.2: Build runtime bundle**

Run: `npm run build 2>&1`

- [ ] **Step 12.3: Generate and serve test page**

Run the generator, copy the runtime bundle, serve, and open in browser:
1. Verify static diagrams render as SVG (no JS needed)
2. Verify animated diagrams show initial state
3. Verify animation plays on interaction
4. Verify Pause stops and resumes
5. Verify no ID collisions between diagrams

- [ ] **Step 12.4: Commit test infrastructure**

```bash
git add test/integration/
git commit -m "add browser integration test generator for animated export"
```

---

## Task 13: Update playground

Update the playground to use the new SvgNode pipeline for rendering while keeping redom for UI.

**Files:**
- Modify: `src/jp-web.ts`

- [ ] **Step 13.1: Update rendering path**

In `jp-web.ts`, the Dispatcher already handles `innerHTML` injection via `renderUpdatedShapes()` (from Task 3.8). Verify the playground works with this new path. The svgHolder is still passed to the Dispatcher as a real DOM element — `renderUpdatedShapes()` serializes the SvgNode tree and sets `innerHTML`.

- [ ] **Step 13.2: Manual test**

Run: `npm run dev`
Open: `http://localhost:5173/docs/`
Verify:
- Editor renders diagrams
- Animations play
- Scrubbing works
- Speed controls work
- Multiple examples work

- [ ] **Step 13.3: Run full test suite**

Run: `npm test 2>&1`
Expected: all pass

- [ ] **Step 13.4: Commit**

```bash
git add src/jp-web.ts
git commit -m "update playground to use SvgNode rendering pipeline"
```
