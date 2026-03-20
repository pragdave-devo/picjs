# picjs: Architecture and Algorithms

picjs is a native TypeScript implementation of a PIC-like diagram language that
compiles plain-text descriptions into SVG. It descends from Brian Kernighan's
PIC language (part of the Bell Labs Designers Workbench) via D. Richard Hipp's
pikchr, but reimplemented from scratch in TypeScript rather than transpiled from C.

## High-Level Pipeline

Source text flows through four sequential stages: tokenization, parsing, layout,
and rendering. The `picjs()` function in `picjs.ts` orchestrates this pipeline.

``` picjs pipeline
down
box "Source Text" bold fit fill AliceBlue rad 0.05
arrow
box "Tokenizer" "(tokenizer.ts)" bold italic fit fill lightyellow rad 0.05
arrow
box "Parser" "(parser.ts)" bold italic fit fill lightyellow rad 0.05
arrow
box "Layout Engine" "(layout.ts)" bold italic fit fill lightyellow rad 0.05
arrow
box "SVG Renderer" "(renderer.ts)" bold italic fit fill lightyellow rad 0.05
arrow
box "SVG Output" bold fit fill PaleGreen rad 0.05
```

## Module Structure

The codebase is organized into eight core modules plus the CLI and processor.
Circular dependencies between modules are resolved through a lazy-init wiring
pattern in `picjs.ts`, which sets function pointers at startup.

``` picjs modules
define $mod {
  box $1 bold fit fill $2 rad 0.05
}
define $arr {
  arrow from $1.$2 to $3.$4 $5
}

Types: $mod("types.ts" LightCyan)
move right 0.2
Const: $mod("constants.ts" LightCyan)
move right 0.2
Tok: $mod("tokenizer.ts" Wheat)
move right 0.2
Parse: $mod("parser.ts" Wheat)

move to Types; down; move 0.8

Layout: $mod("layout.ts" LightGreen) with .n at (Types.s.x + Const.s.x)/2, here.y
move right 0.2
Shapes: $mod("shapes.ts" LightGreen)
move right 0.2
Rend: $mod("renderer.ts" LightSalmon)

move to Layout; down; move 0.8

Picjs: $mod("picjs.ts" Lavender) with .n at (Shapes.s.x), here.y

move to Picjs; down; move 0.5

CLI: $mod("cli.ts" LightGray) with .n at (Layout.s.x), here.y
move right 0.2
Proc: $mod("processor.ts" LightGray)

# Downward flow: tokenizer → parser → layout → shapes → renderer
$arr(Tok s Layout n ->)
$arr(Parse s Layout n ->)
$arr(Layout s Rend n ->)
$arr(Shapes s Rend n ->)

# Lateral: types/constants feed everything
$arr(Types s Layout nw ->)
$arr(Const s Layout n ->)
$arr(Const s Shapes nw ->)

# picjs.ts wires modules together
arrow dashed from Picjs.nw to Layout.s ->
arrow dashed from Picjs.n to Shapes.s ->
arrow dashed from Picjs.ne to Rend.s ->

# CLI uses picjs + processor
$arr(CLI n Picjs sw ->)
$arr(Proc n Picjs s ->)

text "wires modules" "at init" small italic at 0.5 between Picjs.nw and Layout.s
```


## The Pik State Object

All pipeline stages share a single `Pik` state object (defined in `types.ts`).
It accumulates tokens, errors, variables, macros, the current object list, the
temporary path buffer (`aTPath`), and the output SVG string (`zOut`). This is a
direct port of the monolithic state struct from pikchr's C implementation.

Key fields:

| Field | Purpose |
|---|---|
| `sIn` | The original source text (for error reporting) |
| `eDir` | Current default drawing direction (right/down/left/up) |
| `list` | The top-level `PList` of parsed objects |
| `pMacros` | Linked list of user-defined macros |
| `pVar` | Linked list of user-defined variables |
| `aTPath[]` | Temporary path buffer for line objects (up to 1000 points) |
| `bbox` | Global bounding box, computed after all layout |
| `rScale` | Pixels per inch (fixed at 144) |
| `zOut` | The accumulated SVG output string |


## Stage 1: Tokenizer (`tokenizer.ts`)

The tokenizer is a hand-written lexer, not a regex-based scanner. The core
function `pikTokenLength()` is a large switch statement that classifies the
next token by examining the first character, then consuming as many characters
as the token type requires.

### Token Types

Tokens fall into several categories:

- **Literals**: `T_NUMBER` (with unit suffixes: in, cm, mm, px, pt, pc),
  `T_STRING` (double-quoted), hex numbers (`0xFF`)
- **Identifiers**: `T_ID` (lowercase), `T_PLACENAME` (uppercase), `T_CLASSNAME`
  (matches a known shape)
- **Keywords**: ~90 reserved words looked up by binary search in the
  `keywords[]` table in `constants.ts`
- **Ordinals**: `T_NTH` — `1st`, `2nd`, `3rd`, `4th`, ... `1000th`, plus `first`
- **Operators**: arithmetic, arrows (`->`, `<-`, `<->`), dot-accessors
  (`.n`, `.se`, `.x`)
- **Structural**: `T_EOL` (newline or `;`), `T_CODEBLOCK` (`{...}` with
  balanced-brace counting)

### Macro Expansion

Macros are expanded during tokenization. The `TokenStream` class wraps the
raw token array and handles:

1. **Definition**: `define name { body }` stores a `PMacro` with name and body
2. **Invocation**: When the stream encounters a `T_ID` matching a macro name,
   it expands the body tokens in-place at the current position
3. **Parameters**: Macros accept up to 9 positional parameters (`$1`..`$9`),
   parsed from parenthesized comma-separated argument lists
4. **Recursion guard**: A `nCtx` depth counter (max 10) and per-macro `inUse`
   flag prevent infinite recursion


## Stage 2: Parser (`parser.ts`)

The parser is a hand-written recursive descent parser, replacing pikchr's
Lemon-generated LALR parser. The grammar is documented in `doc/grammar.md`.

### Grammar Structure

```
document       ::= statement_list
statement_list ::= statement? (EOL statement?)*
statement      ::= direction | assignment | label:stmt
                 | object-definition | print | assert | define | for-loop
object-def     ::= basetype attribute*
basetype       ::= CLASSNAME | STRING | '[' statement_list ']'
attribute      ::= position | property | text | styling
```

### Key Parsing Decisions

1. **Label detection**: If the token is `T_PLACENAME` followed by `T_COLON`,
   it's a label. The parser peeks ahead one token to decide.

2. **Expression parsing**: Standard recursive descent with precedence:
   `parseExpr` → `parseExprAdd` → `parseExprMul` → `parseExprUnary` → `parseAtom`.
   Atoms can be numeric literals, variable lookups, function calls, color
   names, or property access on objects.

3. **Position parsing**: Positions can be:
   - Absolute: `(expr, expr)`
   - Object reference: `last box.ne` or `3rd circle`
   - Fractional: `1/3 between A and B`
   - Relative: `expr north of position`

4. **For loops**: Two forms are supported:
   - Range: `for v from expr to expr step expr do { body }`
   - List: `for v in [expr, expr, ...] do { body }`

   The body is re-tokenized and re-parsed on each iteration with the loop
   variable set.


## Stage 3: Layout Engine (`layout.ts`)

The layout engine resolves object positions after parsing. The central function
is `pikAfterAddingAttributes()`, called once per object after all its attributes
have been parsed.

### Object Positioning Algorithm

``` picjs positioning
define $step {
  box $1 fit bold fill $2 rad 0.05 wid 3
}

down

$step("1. Create object at prior exit point" Linen)
arrow
$step("2. Apply shape defaults (xInit)" Linen)
arrow
$step("3. Parse attributes (from/to/at/with...)" Linen)
arrow
$step("4. Auto-fit text if dimensions unset" LightYellow)
arrow
$step("5. Resolve WITH anchor offset" LightYellow)
arrow
$step("6. Translate object to final position" LightGreen)
arrow
$step("7. Compute bounding box + entry/exit" LightGreen)
```

For **block objects** (box, circle, ellipse, etc.):

1. The object is initially placed at the exit point of the previous object
2. Its "with" point (default: the edge facing the incoming direction) is
   aligned to the target position
3. The offset from center to the "with" compass point is computed by the
   shape's `xOffset` method, then the entire object is translated

For **line objects** (line, arrow, arc, spline):

1. Path points are accumulated in `p.aTPath[]` via `pikAddDirection()`,
   `pikAddTo()`, heading-based movement, etc.
2. After attributes are parsed, the path is copied to `pObj.aPath[]`
3. The "chop" algorithm trims line endpoints to the boundary of connected shapes
4. The center, bounding box, and entry/exit points are derived from the path

### Compass Point System

Every object has 9 standard reference points: N, NE, E, SE, S, SW, W, NW,
and C (center), plus START and END for line objects. Each shape class defines
an `xOffset` method that returns the offset from center to each compass point.

``` picjs compass
B: box wid 1 ht 0.8 fill LightCyan

dot at B.n;  text "N"  above small at B.n
dot at B.ne; text "NE" above small at B.ne
dot at B.e;  text "E"  small at 0.1 right of B.e
dot at B.se; text "SE" below small at B.se
dot at B.s;  text "S"  below small at B.s
dot at B.sw; text "SW" below small at B.sw
dot at B.w;  text "W"  small at 0.1 left of B.w
dot at B.nw; text "NW" above small at B.nw
dot at B.c;  text "C"  small at 0.12 below of B.c
```

### Auto-Fit Text Sizing

When a block object has text but no explicit dimensions, picjs estimates the
required size:

1. Each character's display width is looked up in `awChar[]`
   (`constants.ts`) — a table of 95 width values for ASCII 0x20–0x7E,
   measured in 1/100ths of the average character width
2. Font scaling (big/small/xtra), bold weight (×1.1), and monospace mode
   are applied
3. The text bounding box is computed by `pikAppendTxt()` in measurement mode
   (passing a `pBox` parameter)
4. The shape's `xFit` method adjusts its dimensions to contain the text


### Chop Algorithm

When a line has `chop` set, its endpoints are pulled back to the boundary
of any shape they connect to:

1. `pikFindChopper()` searches the object list for a shape whose center
   matches the endpoint and whose bounding box doesn't contain the other
   endpoint
2. The shape's `xChop` method computes the intersection point
3. For boxes, this uses angle-based octant detection (comparing dx/dy ratios
   to tan(22.5°) ≈ 0.414 and tan(67.5°) ≈ 2.414)
4. For circles, it's a simple radius projection
5. For ellipses, the x-coordinate is scaled to make it circular, then the
   circle chop is applied


## Stage 4: SVG Renderer (`renderer.ts`)

### Coordinate System

picjs uses a mathematical coordinate system internally (Y increases upward),
but SVG uses a screen coordinate system (Y increases downward). The conversion
is handled by `pikAppendY()` in `types.ts`:

```
SVG_y = (bbox.ne.y - internal_y) × rScale
```

All coordinates are scaled by `rScale` (144 pixels/inch) when written to SVG.

### Layered Rendering

Objects are rendered in layer order via `pikElistRender()`:

1. Find the minimum layer number among unrendered objects
2. Render all objects at that layer
3. Repeat until all layers are rendered

This allows `behind` to control z-ordering. The default layer is 1000;
`behind OtherObj` sets an object's layer to `OtherObj.iLayer - 1`.

### Shape Rendering

Each shape class has an `xRender` method that emits SVG elements:

| Shape | SVG Element | Notable Feature |
|---|---|---|
| box | `<path>` with M/L/Z | Rounded corners via arc segments |
| circle | `<circle>` | |
| ellipse | `<ellipse>` | |
| line/arrow | `<path>` with M/L | Smoothed corners via `linerad` |
| spline | `<path>` with Q | Quadratic Bézier at corners |
| arc | `<path>` with Q | Quadratic Bézier control point |
| cylinder | `<path>` with A | Elliptical arcs for top/bottom |
| diamond | `<path>` | Four-point polygon |
| file | `<path>` (×2) | Dog-ear corner as separate path |
| dot | `<circle>` | Zero width/height; radius only |
| text | _(none)_ | Text labels only |

### Arrowhead Rendering

Arrowheads are drawn as filled `<polygon>` triangles. The algorithm:

1. Compute the unit direction vector of the line segment
2. Scale by arrow height (`arrowht`) and half-width (`arrowwid`)
3. Compute the triangle's three vertices
4. Shorten the line shaft by half the arrow height so it doesn't poke through

### Style Generation

`pikAppendStyle()` builds the SVG `style` attribute:
- Fill color (or `fill:none`)
- Stroke color and width
- Dash patterns (`stroke-dasharray` for dotted/dashed)
- Stroke linejoin for polylines with tight corners

### Dark Mode

When `PIKCHR_DARK_MODE` is set, `pikColorToDarkMode()` transforms colors:

1. Invert (`0xFFFFFF - color`)
2. Rotate the hue (swap min/max channel contributions)
3. For backgrounds: clamp brightness to ≤ 50%
4. For foregrounds: ensure brightness ≥ 50%


## Shape Class System

Shapes use a virtual method table pattern via the `PClass` interface. Each
shape class defines up to 8 methods:

``` picjs shapes
define $m {
  box $1 fit mono small fill $2 rad 0.02
}

down

$m("xInit      — set default dimensions" Linen)
arrow
$m("xNumProp   — handle property coupling" Linen)
arrow
$m("xCheck     — validate geometry" LightYellow)
arrow
$m("xChop      — line intersection point" LightYellow)
arrow
$m("xOffset    — compass point offset" LightGreen)
arrow
$m("xFit       — resize to fit text" LightGreen)
arrow
$m("xRender    — emit SVG elements" LightSalmon)
```

The 14 built-in shape classes are stored in a sorted array (`aClass[]` in
`shapes.ts`) and located by binary search. Shape names also serve as keywords
in the tokenizer — the `findClassFn` callback lets the tokenizer classify
a lowercase word as `T_CLASSNAME` if it matches a shape.


## Variable and Lookup System

### Variable Resolution (`pikValue`)

Variable lookup follows a two-level search:

1. **User variables** (`p.pVar`): a linked list of name/value pairs,
   searched linearly. Set by `x = expr` assignment statements.
2. **Built-in variables** (`aBuiltin[]`): a sorted array of 35 defaults
   (e.g., `boxwid=0.75`, `lineht=0.5`, `thickness=0.015`), searched by
   binary search.

### Color Resolution (`pikLookupColor`)

The color table contains 140+ CSS named colors in a sorted array, searched
by case-insensitive binary search. Colors can also be specified as:
- Hex literals: `0xFF8800`
- `rgb(r, g, b)` — values 0–255
- `hsl(h, s, l)` — h: 0–360, s/l: 0–100 or 0–1
- `oklch(l, c, h)` — perceptual color space


## CLI and Markdown Processing

The CLI (`cli.ts`) handles two modes:

1. **`.picjs` files**: reads source, calls `picjs()`, writes SVG to stdout
2. **Markdown files**: uses `processor.ts` to find diagram blocks, render them
   to SVG files in an output directory (`_diagrams/` by default), and update
   the markdown

Markdown diagrams can appear as fenced code blocks (` ```picjs `) or HTML
comments (`<!-- picjs: name -->`). The processor converts code blocks to
comment form on first run, preserving the source for re-rendering.


## Heritage and Design Decisions

picjs is a TypeScript reimplementation of pikchr, which itself is a modern
reimplementation of PIC. Key design decisions in the port:

- **No parser generator**: The Lemon LALR grammar was rewritten as recursive
  descent, making the code more readable and debuggable
- **Module dependency wiring**: Circular dependencies between layout, shapes,
  and renderer are resolved via function pointer injection at init time,
  avoiding import cycles
- **Coordinate system**: All internal math uses inches with Y-up; SVG output
  flips Y and scales by 144 px/inch
- **Zero runtime dependencies**: The core library has no npm dependencies;
  only the CLI optionally uses `@resvg/resvg-js` for PNG output
- **Browser-compatible**: Ships as both ESM and UMD; includes
  `processCodeBlocks()` for Mermaid-style in-page rendering
