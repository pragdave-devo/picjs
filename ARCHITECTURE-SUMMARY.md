# How picjs Works: A Text-to-Diagram Compiler in TypeScript

picjs compiles plain-text descriptions into SVG diagrams. It's a modern
TypeScript reimplementation of a language that traces back over fifty years
to Brian Kernighan's PIC at Bell Labs — through D. Richard Hipp's pikchr —
and into the browser.

Here's what makes the architecture interesting.


## The Four-Stage Pipeline

A picjs program flows through four stages: tokenize, parse, layout, render.

``` picjs pipeline
down
box "Source Text" bold fit fill AliceBlue rad 0.05
arrow
box "Tokenizer" "macro expansion" italic bold fit fill lightyellow rad 0.05
arrow
box "Parser" "recursive descent" italic bold fit fill lightyellow rad 0.05
arrow
box "Layout Engine" "constraint solver" italic bold fit fill lightyellow rad 0.05
arrow
box "SVG Renderer" "layered output" italic bold fit fill lightyellow rad 0.05
arrow
box "SVG" bold fit fill PaleGreen rad 0.05
```

This is a classic compiler pipeline, but what's unusual is that parsing and
layout are deeply interleaved. Each object is laid out immediately after its
attributes are parsed, because later objects need to know where earlier ones
ended up — "arrow from last box.ne" has to resolve *now*, not in a later pass.


## Macros Live in the Tokenizer

Most languages handle macros as a preprocessing step or in the parser.
picjs does it inside the token stream itself. When the `TokenStream` encounters
an identifier that matches a defined macro, it expands the macro's body
tokens in-place, splicing them into the token array at the current read
position.

This means the parser never sees macros at all — it just sees a stream of
ordinary tokens. Parameter substitution (`$1` through `$9`) happens during
this expansion, and a recursion guard (max depth 10, plus a per-macro `inUse`
flag) prevents infinite loops.

The result is that macros compose naturally. You can define a macro that uses
other macros, pass expressions as arguments, and everything just works because
expansion happens at the token level.


## Recursive Descent Replaces a Parser Generator

The original pikchr uses a Lemon-generated LALR parser (Lemon is the parser
generator behind SQLite). picjs throws that away entirely and replaces it
with a hand-written recursive descent parser.

This is a deliberate trade: LALR parsers are compact and fast, but recursive
descent is dramatically easier to debug, extend, and read. The grammar is
small enough — maybe 20 productions — that the performance difference is
irrelevant, and features like for-loops and assert statements were added
cleanly as new parsing functions.


## Positioning: Compass Points and Constraint Resolution

This is where picjs gets interesting. Every object has nine compass points
(N, NE, E, SE, S, SW, W, NW, C) plus START and END for lines. Positioning
works through constraints rather than absolute coordinates.

``` picjs compass
B: box "box" wid 1.2 ht 0.9 fill LightCyan rad 0.05

dot at B.n;  text "N"  above small at B.n
dot at B.ne; text "NE" above small at B.ne
dot at B.e;  text "E"  small at 0.12 right of B.e
dot at B.se; text "SE" below small at B.se
dot at B.s;  text "S"  below small at B.s
dot at B.sw; text "SW" below small at B.sw
dot at B.w;  text "W"  small at 0.12 left of B.w
dot at B.nw; text "NW" above small at B.nw
```

When you write `box "X" at last circle.ne`, the layout engine:

1. Looks up the circle's northeast offset (computed by the circle's `xOffset`
   method — each shape calculates its own compass geometry)
2. Adds that offset to the circle's center to get an absolute point
3. Determines the box's anchor point (by default, the edge facing the
   incoming direction)
4. Computes the offset from the box's center to its anchor
5. Translates the entire box so its anchor lands on the target

This means you never think about pixel coordinates. You think about
relationships: "this goes to the right of that," "this arrow starts at
that box's east edge." The engine resolves everything to absolute positions
in a single pass.


## The Chop Algorithm

When a line connects two shapes, you usually want it to end at the shape's
boundary, not its center. The `chop` attribute triggers an intersection
calculation, and it's surprisingly geometry-specific.

For **boxes**, picjs uses octant detection. It computes the angle from the
box center to the incoming line, then compares the dx/dy ratio against
tan(22.5°) ≈ 0.414 and tan(67.5°) ≈ 2.414 to determine which of the eight
compass edges the line would cross. The result is the exact point on the
box's edge (accounting for rounded corners).

For **circles**, it's a simple radius projection along the line direction.

For **ellipses**, the x-axis is scaled to make the ellipse circular, the
circle intersection is computed, then the result is scaled back.

``` picjs chop
A: circle "A" rad 0.3 fill LightCyan
B: box "B" at 2.0 right of A fill Wheat rad 0.05
arrow from A to B chop "chop" above italic
```


## Text Sizing Without a Font Renderer

picjs runs in environments without font metrics (plain Node.js, browsers
before DOM access). So it carries its own character-width table: 95 entries
covering ASCII 0x20–0x7E, each storing the character's width as a percentage
of the average character width.

When a box has text but no explicit dimensions, picjs walks the string
character by character, sums the widths, applies scaling factors for bold
(×1.1), big/small, and monospace, then calls the shape's `xFit` method to
expand the object to contain the text. It's approximate, but it's consistent
and deterministic — the same input always produces the same layout regardless
of platform.


## Layered Rendering for Z-Order

SVG has no z-index. Elements are painted in document order. picjs solves this
with a multi-pass renderer: it finds the minimum layer number, renders
everything at that layer, then repeats for the next layer up.

The default layer is 1000. When you write `behind OtherObj`, your object's
layer is set to `OtherObj.layer - 1`. This lets you put a filled background
rectangle behind a group of shapes without worrying about declaration order.


## The Y-Axis Flip

picjs uses a mathematical coordinate system internally — Y increases upward,
which is natural for diagramming ("above" means higher Y). But SVG uses screen
coordinates where Y increases downward.

Every coordinate write goes through `pikAppendY()`, which computes:

```
svg_y = (bbox.ne.y - internal_y) × scale
```

This single transform, applied at the SVG output boundary, means the entire
layout engine can work in intuitive math coordinates while producing correct
SVG.


## Wiring Circular Dependencies Without Import Cycles

The module structure has natural circular dependencies: shapes need the
renderer (to emit SVG), the renderer needs layout (for measurement), and
layout needs shapes (to find classes). TypeScript's module system won't
tolerate circular imports.

picjs solves this with a pattern borrowed from C: function pointers set at
initialization time. Each module exports setter functions like
`setPikAppendStyleFn()`. At startup, `picjs.ts` calls these setters to wire
the modules together:

```typescript
setPikValueFn((p, name) => pikValue(p, name, name.length).val);
setPikAppendStyleFn(pikAppendStyle);
setShapeClasses(aClass, sublistClass, noopClass, arcInit);
```

This happens once, lazily, on the first call to `picjs()`. After that, the
function pointers are hot and the modules can call each other freely. It's
not elegant, but it's explicit and it avoids the fragility of circular
import resolution.


## Shapes as Virtual Method Tables

Each of the 14 built-in shapes (box, circle, ellipse, line, arrow, arc,
spline, oval, cylinder, diamond, dot, file, text, move) is defined as a
`PClass` object with a fixed set of method slots:

``` picjs vtable
define $slot {
  box $1 fit mono small fill $2 rad 0.02 wid 2.5
}

right

[
  down
  $slot("xInit" Linen)
  move 0.04
  $slot("xNumProp" Linen)
  move 0.04
  $slot("xCheck" LightYellow)
  move 0.04
  $slot("xChop" LightYellow)
]

move 0.2

[
  down
  $slot("xOffset" LightGreen)
  move 0.04
  $slot("xFit" LightGreen)
  move 0.04
  $slot("xRender" LightSalmon)
]
```

This is essentially a vtable — the same pattern C++ uses for virtual methods,
but built manually in TypeScript using plain interfaces with function fields.
A null slot means "not applicable" (e.g., lines have no `xChop`; dots have no
`xFit`). The sorted `aClass[]` array makes shape lookup O(log n) by binary
search.

It's a pattern you rarely see in TypeScript, where you'd normally use class
inheritance. But it maps directly from the C original, and it has a practical
advantage: all shape behavior is data, stored in a flat array, easy to
inspect and extend.


## Zero Dependencies, Dual Target

The core library has no runtime dependencies. It ships as both ESM and UMD,
runs in Node.js or the browser, and includes a `processCodeBlocks()` function
for Mermaid-style in-page rendering. The CLI adds only an optional dependency
on `@resvg/resvg-js` for PNG rasterization.

This is possible because the entire pipeline — tokenizer, parser, layout, and
SVG generation — is pure computation over strings and numbers. No DOM, no
canvas, no font loading. The character-width table means it doesn't even need
font metrics from the environment.
