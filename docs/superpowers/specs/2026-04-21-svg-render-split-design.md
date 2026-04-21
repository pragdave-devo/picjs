# SVG Render Pipeline Split: Build-time / Runtime

## Problem

picjs currently depends on a DOM (real or virtual via linkedom) to generate SVG. This couples SVG generation to a DOM environment, makes server-side rendering heavier than necessary, and prevents shipping animated diagrams as self-contained HTML files.

## Goals

1. Remove DOM dependency from SVG generation. Build an internal SVG node model, serialize to string.
2. Enable animated picjs diagrams to be exported as static HTML files that play back in a browser without a server.

## Design

### Two Output Modes

**Static (no animation):** Server parses source, evaluates AST, renders shapes into an SvgNode tree, serializes to SVG string. No browser JS required.

**Animated:** Server parses source, serializes AST as JSON. Browser receives an HTML fragment containing the pre-rendered SVG (with element IDs), the AST as a JSON blob, and a `<script>` tag loading the runtime. The runtime evaluates the AST, runs the animation, and mutates the pre-rendered SVG elements by ID.

### Package Structure

One npm package (`picjs`) with two entry points:

**`picjs` (full — server/playground):**
- Parser + tokenizer
- Evaluator
- Shapes + geometry + dependency graph
- Animators + timeline
- Renderer (SvgNode tree → string)
- AST serialization

**`picjs/runtime` (browser — animated playback only):**
- Evaluator + interpreter (constraint re-evaluation, AST execution)
- Shapes + geometry + dependency graph
- Animators + timeline runner + animation runner
- Attribute converters (shape properties → SVG attribute values, e.g., `convertToSVG` logic from each renderer)
- DOM patcher (shape IDs → getElementById → setAttribute with converted values)
- No parser, no tokenizer, no SvgNode serializer

The runtime bundle is only needed on pages that contain animated diagrams. Static diagrams require no JS.

Build tooling: Vite library mode with two entry points. The runtime gets a pre-built `picjs.runtime.min.js` for `<script>` tag use.

### Module Decoupling

The current Dispatcher is a god object coupling the interpreter, shape graph, geometry, timeline, and renderer. The runtime needs most of these but not the parser or SVG serializer. Required refactoring:

- **Decouple parser types from AST:** `ast.ts` currently imports `Location` from the parser. Extract `Location` to a shared types module so the AST can be used without pulling in the parser.
- **Decouple Dispatcher from renderer:** The Dispatcher currently calls redom's `setAttr`/`setChildren` directly. Extract DOM manipulation into a pluggable "output target" — the build-time target produces SvgNodes, the runtime target patches DOM elements by ID.
- **Decouple redom from non-renderer code:** The Dispatcher and top-level Renderer class also use redom for `<g>` wrapper creation and SVG holder manipulation. These must be converted alongside the per-shape renderers.

A module dependency analysis (`madge` or similar) should be run before implementation to verify the actual import graph supports the intended split.

### SVG Node Model

Replace redom's DOM creation with a plain value type:

```typescript
interface SvgNode {
  tag: string
  attrs: Record<string, string | number>
  children: (SvgNode | string)[]
}

function serialize(node: SvgNode): string
```

Per-shape renderers (Rect, Circle, Line, Label, etc.) are refactored to return `SvgNode` instead of calling redom's `el()`, `setAttr()`, `setChildren()`. The converter pipeline (`convertToSVG`) stays the same — only the output target changes.

### Element IDs

Every rendered SVG element gets a stable ID for the animation runtime to reference.

**Format:** Short prefix per drawing instance + sequential suffix per element. Example: `p0a`, `p0b`, `p1a`, `p1b`.

**Uniqueness:** IDs must be unique across all drawings in a single HTML document. The drawing prefix is either passed in as an option or auto-incremented by a counter that the caller manages.

**Determinism:** Same input always produces the same IDs (important for testing).

**Opt-in:** IDs are only added when the caller requests them (e.g., `{ ids: true }` render option or when generating animated export). Static-only SVG output is clean — no ID attributes. This avoids breaking regression test baselines during migration.

**Composite shapes:** A shape with children (e.g., a box with a label) renders as `<g id="p0a"><rect id="p0a-s" .../><text id="p0a-t" .../></g>`. The logical shape ID goes on the `<g>` wrapper. Inner elements get suffixed sub-IDs. The DOM patcher uses the appropriate sub-element depending on which property is being animated (fill → the `-s` element, text → the `-t` element).

### Animation Runtime in Browser

The animation flow for exported HTML:

1. Build-time renders full SVG with element IDs, serializes to string.
2. AST is serialized to JSON and embedded in `<script type="application/json">`.
3. Browser loads HTML, parses SVG via innerHTML.
4. Runtime script parses AST JSON with `JSON.parse`.
5. Runtime evaluates AST (same evaluator as server), constructing shape objects with geometry + dependency graph.
6. Runtime maps shape objects to DOM elements by ID.
7. Timeline runner + animation runner drive animations. On each frame:
   - Animators compute new property values.
   - `propagateDirty()` cascades to dependent shapes.
   - Dependent constraints are re-evaluated.
   - DOM patcher applies attribute changes to elements by ID.

The runtime does NOT re-render SVG from scratch. It mutates the pre-rendered SVG in place.

**Shape-property-to-SVG-attribute mapping:** The runtime needs the `convertToSVG` logic from each shape renderer to translate internal properties (anchorX/Y, width, height, rotation) into SVG attributes (cx/cy/r, x/y/width/height, transform, d). This converter logic is shared between build-time and runtime — it's the same code that runs during initial rendering.

### AST Serialization

The AST is a tree of plain objects with `type` discriminators — mostly JSON-serializable already. The exceptions:

- **Shape references in constraints:** `WithConstraint` nodes can hold live `SBase` references after evaluation. Serialization strips these — they are re-created when the runtime evaluates the AST.
- **Location information:** `Location` objects (line/column/offset) are included for error reporting. They serialize as plain objects.
- **Functions/closures:** `fn()` definitions in the AST are serializable (they're AST subtrees). Closure environments are re-created at runtime evaluation.

The serialized AST is the **parser output** (before evaluation), not the evaluated state. The runtime re-evaluates from scratch, so live references, resolved constraints, and runtime state are never serialized.

### Edge Cases in Animated Export

- **`Pause` nodes:** Supported. The runtime stops advancing the timeline and resumes on user interaction (click/tap on the SVG or a play control). Same behavior as current browser playback.
- **Parse errors:** If the source has errors, no animated export is produced — the build-time step returns an error SVG (same as current behavior).

### Animated HTML Output Format

```html
<div id="picjs-p0">
  <svg viewBox="..." xmlns="http://www.w3.org/2000/svg">
    <rect id="p0a" x="10" y="20" width="100" height="50" fill="#fff" stroke="#000"/>
    <circle id="p0b" cx="200" cy="45" r="25" fill="blue"/>
    <!-- ... -->
  </svg>
  <script type="application/json" data-picjs="p0">
    { "type": "program", "statements": [ ... ] }
  </script>
</div>
<script src="picjs.runtime.min.js"></script>
```

The runtime auto-discovers drawings by finding `<script type="application/json" data-picjs="...">` tags.

### Security

**SVG serialization escapes all dynamic values:**
- Attribute values: escape `"`, `&`, `<`, `>`
- Text content: escape `&`, `<`, `>`
- Tag names: whitelist of known SVG elements only. Reject anything not on the list.
- Attribute names: whitelist of known SVG attributes only. No user strings in name positions.

**AST serialization:**
- JSON blob in `<script type="application/json">` — browser does not execute it.
- Runtime parses with `JSON.parse`, never `eval`.
- Runtime validates AST structure before evaluating (reject unexpected node types).

**User-supplied text** (labels, `containing` content) always goes through the escaping path in `serialize()`. Never inserted as raw markup.

**Security tests:** Inputs containing `<script>`, event handler attributes (`onload`, `onclick`), entity injections, and SVG-specific vectors (e.g., `<foreignObject>`, `<use xlink:href>`).

### Testing Strategy

**SVG node model:**
- Unit tests: build SvgNode trees, serialize, compare against expected strings.
- Round-trip regression: run all existing picjs sources through old (DOM) and new (SvgNode) renderers, diff output. These must match (modulo new ID attributes).

**ID generation:**
- Multiple drawings → unique IDs across all.
- Deterministic: same input → same IDs.

**Renderer refactor:**
- All 179 existing tests + 12 examples must pass with identical SVG output after refactor. This is the primary regression gate at each step.

**Animation runtime:**
- Serialize drawing, load in browser, verify animation plays.
- Dependency tests: animate B, verify A follows (with-constraints).
- Frame comparison: current in-browser rendering vs. new ID-patching approach.

**Bundle split:**
- Verify `picjs/runtime` does not include parser/tokenizer.
- Verify static SVG output works with zero JS.

**Security:**
- Malicious label text: `<script>alert(1)</script>`
- Attribute injection: `" onload="alert(1)`
- SVG event handlers in user content.
- Verify serialized SVG is parseable but inert.

**Integration:**
- Generate HTML with multiple static + animated diagrams, serve, verify in real browser.

### Migration Path

The refactor is incremental. At each step, existing tests must pass:

1. Build SvgNode model + serializer (with security escaping). Unit test it.
2. Refactor one shape renderer (e.g., Rect) to produce SvgNode. Run regression tests.
3. Refactor remaining shape renderers. Regression tests at each one.
4. Remove redom dependency from render pipeline.
5. Add ID generation to SvgNode output.
6. Build AST serialization/deserialization. Test round-trips.
7. Build DOM patcher (runtime side: ID → setAttribute).
8. Build animation HTML export.
9. Configure Vite for two entry points. Verify bundle contents.
10. Integration test: multi-diagram HTML page with mixed static/animated.
