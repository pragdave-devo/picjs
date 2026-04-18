# jp Language Reference

<details open><summary><strong>Contents</strong></summary>

- [Program Structure](#program-structure)
- [Comments](#comments)
- [Shapes](#shapes)
  - [Box](#box)
  - [Circle, Ellipse, Oval](#circle-ellipse-oval)
  - [Line](#line)
  - [Polyline](#polyline)
  - [Arc](#arc)
  - [Label](#label)
  - [Skip](#skip)
- [Layout](#layout)
  - [Face](#face)
  - [Gap](#gap)
  - [Goto](#goto)
- [Groups](#groups)
  - [Group](#group)
  - [Aside](#aside)
- [Shape Options](#shape-options)
  - [Common Options](#common-options)
  - [Labels](#labels)
  - [Rich Labels](#rich-labels)
  - [Line Labels](#line-labels)
  - [Positioning](#positioning)
  - [Size](#size)
  - [Radius](#radius)
  - [Corner Radii](#corner-radii)
  - [Fill and Stroke](#fill-and-stroke)
  - [Rotation](#rotation)
  - [Line Endings](#line-endings)
  - [Line Shape](#line-shape)
  - [Line Length](#line-length)
  - [Turn Direction](#turn-direction)
  - [Text Options](#text-options)
  - [Other Options](#other-options)
  - [Constraint](#constraint)
  - [CSS Class](#css-class)
- [Shape Defaults](#shape-defaults)
- [Assignments](#assignments)
- [Expressions](#expressions)
  - [Operator Precedence](#operator-precedence)
  - [Access and Calls](#access-and-calls)
  - [Conditionals](#conditionals)
  - [Functions](#functions)
- [Value Types](#value-types)
  - [Number](#number)
  - [Boolean](#boolean)
  - [Color](#color)
  - [String](#string)
  - [Position](#position)
  - [Array](#array)
  - [Range](#range)
  - [Timeline](#timeline)
  - [Palette](#palette)
  - [Function](#function)
- [Built-in Functions](#built-in-functions)
- [Type Methods](#type-methods)
- [Animations](#animations)
  - [move](#move)
  - [rotate](#rotate)
  - [set](#set)
  - [draw](#draw)
  - [pause](#pause)
  - [Animation Parameters](#animation-parameters)
  - [Chaining](#chaining)
- [Cardinals and Directions](#cardinals-and-directions)
- [Identifiers and Reserved Words](#identifiers-and-reserved-words)
- [Font Specification](#font-specification)

</details>

---

## Program Structure

A program is a sequence of statements separated by whitespace (including newlines). There are no statement terminators.

```
Statement Statement ...
```

Statements include: shapes, assignments, shape default setters, animations,
if/else, ternary conditionals, group expressions, and inspect (`??`).

## Comments

Line comments start with `//` and extend to the end of the line.

```
// This is a comment
Box "hello"  // inline comment
```

## Shapes

Every shape accepts [common options](#common-options) and an optional [constraint](#constraint).

### Box

```
Box [options...] [with ...]
```

Draws a rectangle. Accepts [size](#size) and [corner radii](#corner-radii) options.

```
Box "Hello"
Box "Rounded" rx 0.1 ry 0.1
Box 2 x 1 "Wide"
Box wid 3 ht 2 "Sized"
```

### Circle

```
Circle [options...] [with ...]
```

A circle. Accepts a single [radius](#radius) option.

```
Circle "Node" radius 0.8
circle fill ~red
```

### Ellipse

```
Ellipse [options...] [with ...]
```

An ellipse with independent horizontal and vertical radii.
Accepts [corner radii](#corner-radii) options (`rx`, `ry`).

```
Ellipse "Wide" rx 1.2 ry 0.4
ellipse rx 0.7 ry 0.3 fill ~blue
```

### Oval

```
Oval [options...] [with ...]
```

A rectangle with fully rounded ends (pill shape). The corner radii
default to half the smaller dimension. Accepts [size](#size) and
[corner radii](#corner-radii) options.

```
Oval "Button"
oval wid 2 ht 0.5 fill ~green
```

Abbreviated forms: `box`, `circle`, `ellipse`, `oval`, `arc`, `line`
(lowercase) are accepted for all shape keywords.

### Line

Lines connect two points. They can be specified with `from`/`to` positions,
or with just one endpoint (the other defaults to the current layout position).

```
Line from <position> to <position> [options...]
Line from <position> [options...]
Line to <position> [options...]
Line [options...]
```

Lines can also be written using arrow abbreviations instead of `Line`:

| Abbreviation | Meaning |
|:---:|---------|
| `->` | straight line with end arrow |
| `<-` | straight line with start arrow |
| `<->` | straight line with both arrows |
| `--` | straight line, no arrows |
| `~>` | smooth (curved) line with end arrow |
| `<~>` | smooth line with both arrows |
| `~~` | smooth line, no arrows |
| `o->` | dot start, arrow end |
| `\|->` | bar start, arrow end |

The general pattern is `[start][path][end]` where:
- start: `<` `o` `|` or nothing
- path: `-` (straight) or `~` (smooth)
- end: `>` `o` `|` or nothing

Accepts [line endings](#line-endings), [line shape](#line-shape),
[line length](#line-length), and [line label](#line-labels) options.

```
-> "sends"
Line from a.s to b.n
<~> from (0,0) to (3,3) "curved"
line -> from db to server "query" below
```

### Polyline

A polyline is a multi-segment line. Created by adding `then` waypoints to a line.

```
Line from <pos> then <pos> [then <pos>...] [close] [options...]
Line from <pos> to <pos> then <pos> [then ...] [close] [options...]
```

Waypoints can be absolute positions or directional:

```
line -> from a.s then south 2 then east 3 then to b.w
line -> from a.e then east 2 then south until level with b then to b.w
```

Directional waypoints use cardinal directions (`north`, `south`, `east`, `west`, `n`, `s`, `e`, `w`, and combinations) followed by a distance.

The `then ... until [even/level with] <target>` form extends in a direction until aligned with a target position.

Add `close` to close the polyline into a polygon.

Polylines accept [corner radii](#corner-radii) for rounded corners at waypoints.

### Arc

```
Arc from <position> to <position> [options...]
Arc [options...]
```

Draws a circular arc between two points. Accepts [turn direction](#turn-direction) and [line endings](#line-endings).

```
Arc from (0,0) to (2,2) cw
Arc from a.n to b.s "label" turn ccw
```

### Label

```
Label <expr> [options...] [with ...]
```

A standalone text label. The expression is the text content.
Accepts [text options](#text-options).

```
Label "Title" .h1
Label "Subtitle" fill ~blue
```

### Skip

Moves the layout cursor to a specific position without drawing anything.

```
Skip to <position>
Skip (<x>, <y>)
Skip x <expr> y <expr>
```

## Layout

Shapes are placed automatically based on the current layout direction and cursor position.

### Face

Changes the layout direction. Subsequent shapes will be placed in the new direction.

```
Face <cardinal>      // Face n, Face se, Face east, ...
Face <angle>         // Face 45
```

### Gap

Inserts spacing between shapes in the layout direction.

```
Gap                  // default gap
Gap <distance>       // specific distance
Gap <cardinal>       // gap in a specific direction
Gap <cardinal> <distance>
Gap same             // same gap as last time
```

### Goto

Jumps the layout cursor to a new position.

```
Goto                 // reset to default
Goto <position>      // absolute position: (x, y) or shape reference
Goto <cardinal>      // direction from current position
Goto <cardinal> <distance>
Goto <distance>      // distance in current direction
```

## Groups

### Group

Groups collect shapes and apply a shared coordinate space. The group can be
positioned, rotated, and styled as a unit.

```
{ body } [options...] [with ...]
Group { body } [options...] [with ...]
```

Inside a group, use `self.<name>` to name shapes for external reference.

```
g = {
  Face s
  self.top = Box "A"
  -> "connects"
  self.bottom = Box "B"
} with .nw at (0, 0)

Line from g.top.e to other.w
```

Groups accept common options (fill, stroke, rotation, etc.) and constraints.
Options can appear before or after the `with` clause.

### Aside

Like a group, but shapes inside do not affect the layout cursor or become
implicit line endpoints.

```
Aside { body }
```

## Shape Options

### Common Options

These options are available on most shapes:

| Option | Description |
|--------|-------------|
| `"text"` | Add a label (see [Labels](#labels)) |
| `rotation <angle>` | Rotate in degrees |
| `rotation <angle> about <position>` | Rotate around a point |
| `at <position>` | Place at a specific position |
| `(<x>, <y>)` | Place at coordinates |
| `x <expr>` | Set x position |
| `y <expr>` | Set y position |
| `fill <color>` | Fill color |
| `stroke <color>` | Stroke color |
| `thickness <n>` | Stroke width |
| `solid` / `dotted` / `dashed` | Line style |
| `opacity <n>` | Opacity (0–1) |
| `fit` | Auto-size to fit content |
| `same` | Copy attributes from previous shape of same type |
| `behind <shape>` | Render behind another shape |
| `.<class>` | Apply a CSS class |

Abbreviations: `rot` for `rotation`, `ht` for `height`, `wid` for `width`,
`thick` for `thickness`, `len` for `length`, `rad`/`r` for `radius`,
`step` for `stepped`, `curve`/`curved` for `smooth`.

### Labels

Most shapes accept one or more string labels. A bare string after a shape
keyword becomes a label:

```
Box "Hello"
Box "Line 1" "Line 2"
```

### Rich Labels

A rich label is a parenthesized expression with optional styling:

```
Box ("dynamic: #{count}" fill ~red .highlight 14pt)
-> ("label" fill ~green) ("other" fill ~blue)
```

Rich label options: `fill`, `stroke`, `.<class>`, font size.

### Line Labels

Labels on lines can be positioned along the path and placed above or below:

```
-> "centered"                          // default: 50%, centered
-> "start" at 0% "end" at 100%        // at specific percentages
-> "top" above "bottom" below         // above/below the line
-> "25%" at 25% outside               // at 25%, outside curve
```

Position keywords: `above`, `below`, `inside`, `outside`.

### Positioning

```
at <position>        // at a named position or expression
(<x>, <y>)           // at explicit coordinates
x <expr>             // set x only
y <expr>             // set y only
```

### Size

Box-specific size options:

```
<width> x <height>   // e.g., 2 x 1
width <expr>         // or wid <expr>
height <expr>        // or ht <expr>
```

### Radius

Circle/Ellipse/Oval radius:

```
radius <expr>        // or rad <expr> or r <expr>
```

### Corner Radii

Box corner rounding and polyline corner rounding:

```
rx <expr>            // horizontal corner radius
ry <expr>            // vertical corner radius
radius <expr>        // set both rx and ry (on polylines)
```

### Fill and Stroke

```
fill <color>
stroke <color>
thickness <expr>     // or thick <expr>
solid
dotted
dashed
```

### Rotation

```
rotation <angle>                    // or rot <angle>
rotation <angle> about <position>   // rotate around a point
```

### Line Endings

Lines and arcs accept endpoint markers:

```
[start][path][end]
```

Start markers: `<` (arrow), `o` (dot), `|` (bar)
End markers: `>` (arrow), `o` (dot), `|` (bar)
Path style: `-` (straight), `~` (smooth)

Special: `--` is a straight line with no markers, `~~` is a smooth line with no markers.

### Line Shape

Override the path interpolation:

```
straight             // straight line segments (default)
stepped              // or step — axis-aligned right-angle segments
smooth               // or curve/curved — bezier curve
```

### Line Length

```
length <expr>        // or len <expr>
```

### Turn Direction

Arc turn direction:

```
cw                   // clockwise
ccw                  // counter-clockwise
turn cw              // same, with keyword
turn ccw
turn <angle>         // explicit angle
```

### Text Options

Label and text formatting:

```
align .<cardinal>    // text alignment: .n, .nw, .ne, .w, .e, .c, etc.
maxwidth <n>         // maximum text width before wrapping
line_height <n>      // line spacing
font <font-spec>     // CSS font specification (see Font Specification)
<font-size>          // e.g., 14pt, 2em, large
```

### Other Options

```
nodraw               // create line but don't draw it (draw_progress = 0)
```

### Constraint

Position a shape by pinning one of its cardinal points to a location:

```
with .<cardinal> at <place>
with at <place>                       // defaults to center
with self.<name>.<cardinal> at <place> // pin a named sub-element
```

```
Box "A" with .nw at (0, 0)
Box "B" with .e at other.w
```

### CSS Class

```
.<class-name>
```

Applies a CSS class to the shape's SVG element. Multiple classes can be stacked.

```
Box "styled" .highlight .large
```

Class-qualified shape defaults use the same dot syntax:

```
Box.highlight.fill = ~yellow
```

## Shape Defaults

Set default attribute values for a shape type:

```
<Shape>.<attr> = <expr>
<Shape>.<class>.<attr> = <expr>
```

Read a shape default:

```
<Shape>.<attr>
<Shape>.<class>.<attr>
```

`Shape` (capitalized, without a prefix S) refers to the base shape class.

```
Box.fill = ~lightblue
Box.highlight.fill = ~yellow
Circle.radius = 0.5
```

## Assignments

```
<target> = <expr>
<target> += <expr>
<target> -= <expr>
<target> *= <expr>
<target> /= <expr>
<target> %= <expr>
```

Targets can be simple identifiers, `$`-prefixed variables, qualified paths
(`obj.attr`, `list[index]`), or the timeline shorthand `@` (equivalent to `@.now`).

```
x = 10
$name = "hello"
@ = 5                // sets @.now = 5
shape.fill = ~red
$list[0] = "first"
```

## Expressions

### Operator Precedence

Lowest precedence first (loosest binding at top):

| Precedence | Category | Operators |
|:---:|------|-----------|
| 1 | Logical OR | `\|\|` |
| 2 | Logical AND | `&&` |
| 3 | Equality | `==`  `!=` |
| 4 | Relational | `<`  `>`  `<=`  `>=` |
| 5 | Additive | `+`  `-` |
| 6 | Multiplicative | `*`  `/`  `%` |
| 7 | Power | `^` |
| 8 | Unary | `+`  `-`  `!` |

### Access and Calls

```
<expr>(<args>)       // function call
<expr>[<index>]      // index access
<expr>.<attr>        // attribute/property access
```

These can be chained: `$list.map(fn)[0].x`

### Conditionals

```
if (<expr>) <body> else <body>
if (<expr>) <body>
<expr> ? <expr> : <expr>
```

The body can be a single expression or a block `{ ... }`.

### Functions

Arrow function syntax:

```
(<params>) => <body>
<name> => <body>
=> <body>                // no parameters
() => <body>             // explicit empty params
```

The body can be a single expression or a block `{ ... }`.
Functions return the value of their last expression (implicit return).

```
$double = n => n * 2
$add = (a, b) => a + b
$greet = => Box "Hello"
$complex = (x) => {
  y = x * 2
  y + 1
}
```

## Value Types

### Number

Integer, decimal, or scientific notation. Append `%` to divide by 100.

```
42       3.14      .5       1e3      50%      1.5e-2
```

### Boolean

```
true     false
```

### Color

Colors in various formats:

| Format | Example |
|--------|---------|
| Named color | `~red`, `~darkolivegreen` |
| Hex (3/4 digit) | `#f00`, `#f008` |
| Hex (6/8 digit) | `#ff0000`, `#ff000080` |
| Color model | `rgb(255, 0, 0)`, `hsl(0, 100, 50)` |
| Dynamic color | `~#{expr}` |

**Color models:** `rgb`, `hsl`, `hsv`, `oklch` (case-insensitive, optional `a` suffix for alpha variant).

| Model | Parameters |
|-------|------------|
| `rgb` / `rgba` | r (0–255), g (0–255), b (0–255) [, alpha (0–1)] |
| `hsl` / `hsla` | h (0–360), s (0–100), l (0–100) [, alpha (0–1)] |
| `hsv` / `hsva` | h (0–360), s (0–100), v (0–100) [, alpha (0–1)] |
| `oklch` / `oklcha` | L (0–100), C (0–0.4), h (0–360) [, alpha (0–1)] |

**Dynamic colors** evaluate an expression to produce a color name at runtime:

```
$name = "red"
fill ~#{$name}           // equivalent to fill ~red
```

### String

Single-quoted and double-quoted strings. Double-quoted strings support interpolation.

| Syntax | Interpolation | Escape sequences |
|--------|:---:|:---:|
| `'...'` | No | Yes |
| `"..."` | Yes | Yes |
| `'''...'''` | No | No |
| `"""..."""` | Yes | No |

**Interpolation** (double-quoted only): `#{expr}` embeds an expression. Use `##` for a literal `#`.

```
"Hello #{$name}"
"Total: #{a + b}"
"Price: ###{$price}"     // outputs: Price: #42
```

**Escape sequences:** `\\`, `\'`, `\"`, `\n`, `\t`, `\r`, `\b`, `\f`, `\v`,
`\0`, `\xHH`, `\uHHHH`.

**Triple-quoted strings** can span multiple lines and don't process escape sequences (except interpolation in `"""`).

### Position

An (x, y) coordinate pair:

```
(100, 200)
(x + 10, y)
(0, 0)
```

The comma between x and y is optional.

### Array

```
[1, 2, 3]
["hello", "world"]
[~red, ~blue, ~green]
[]
```

Commas between elements are optional.

### Range

An inclusive range between two values:

```
[1..10]
[0..n-1]
["A".."Z"]
[~red..~blue]
```

Ranges support interpolation (see Range methods) and can be used with
`.each()`, `.map()`, `.steps()`.

### Timeline

The `@` symbol accesses the animation timeline object.

| Expression | Description |
|-----------|-------------|
| `@` | Read current time (shorthand for `@.now`) |
| `@.now` | Current time |
| `@.max_time` | Maximum time in the timeline |
| `@.last_animation_start` | Start time of most recent animation |
| `@.last_animation_end` | End time of most recent animation |
| `@.start_from` | Time offset for next animation |
| `@@` | Advance timeline (SetTime) |

Assignment: `@ = <expr>` sets `@.now`. `@.start_from = <expr>` is also settable.

### Palette

The built-in `Palette` object manages themed color sets.

| Property | Description |
|----------|-------------|
| `Palette.current` | Current palette name (read/write) |
| `Palette.names` | List of available palette names |
| `Palette.b1`–`Palette.b8` | Background colors (read/write) |
| `Palette.f1`–`Palette.f8` | Foreground colors (read/write) |

```
Palette.current = "ocean"
Box fill ~b3                 // use palette background color 3
Palette.f1 = ~red            // override foreground color 1
```

### Function

Arrow functions (see [Functions](#functions) under Expressions).

```
n => n * 2
(x, y) => x + y
=> Box "hello"
(n) => { result = n * 2; result + 1 }
```

## Built-in Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `sin` | angle (degrees) | Sine (−1 to +1) |
| `cos` | angle (degrees) | Cosine (−1 to +1) |
| `tan` | angle (degrees) | Tangent |
| `asin` | ratio | Arc sine (returns degrees) |
| `acos` | ratio | Arc cosine (returns degrees) |
| `atan2` | dy, dx | Arc tangent of dy/dx (returns degrees). Note: y before x. |
| `polar` | radius, theta | Position at (radius, theta°) from origin |
| `ln` | number | Natural logarithm |
| `log10` | number | Base-10 logarithm |
| `d2r` | degrees | Convert degrees to radians |
| `r2d` | radians | Convert radians to degrees |
| `PI` | — | Constant: π |

## Type Methods

Methods and properties available on each value type.

### Number

**Operators:** `+` `-` `*` `/` `^` `==` `!=` `<` `<=` `>` `>=`

| Method | Description |
|--------|-------------|
| `.abs()` | Absolute value |
| `.interpolate(other, ratio)` | Interpolate between this and other (ratio 0–1) |
| `.times(callback)` | Invoke callback n times, passing 0 to n−1 |

### List

**Properties:** `.length`

**Operators:** `+` `-` `*` `/` `^` (element-wise)

| Method | Description |
|--------|-------------|
| `.push(item)` | Append item |
| `.pop()` | Remove and return last item |
| `.first()` | First item |
| `.last()` | Last item |
| `.each([step], callback)` | Iterate items. Optional step selects every nth; if 0 < step < 1, interpolates. |
| `.map([step], callback)` | Like `.each()` but collects results into a list |

### Color

**Operators:** `==` `!=`

| Method | Description |
|--------|-------------|
| `.lighten(ratio)` | Lighter version (ratio 0–1) |
| `.darken(ratio)` | Darker version (ratio 0–1) |
| `.brighten(ratio)` | Add white (ratio 0–1) |
| `.desaturate(amount)` | Reduce chroma (0–1, where 1 = grayscale) |
| `.saturate(amount)` | Increase chroma (0–1) |
| `.grayscale()` | Convert to grayscale |
| `.spin(angle)` | Rotate hue in oklch space (−360 to 360) |

### Range

**Operators:** `*`

| Method | Description |
|--------|-------------|
| `.start()` | First value |
| `.end()` | Last value |
| `.interpolate(ratio)` | Value at ratio (0–1) between start and end |
| `.ease(style)` | Apply easing to interpolation |
| `.steps(count, callback)` | Invoke callback with equally-spaced interpolated values |
| `.each(callback)` | Iterate integer ranges: callback(value, index) |
| `.map(callback)` | Like `.each()` but collects results |

**Easing styles:** `linear`, `cubicIn`, `cubicOut`, `cubic`, `cubicInOut`,
`quadIn`, `quadOut`, `quad`, `quadInOut`, `bounce`

### String

**Properties:** `.length`

**Operators:** `+` (concatenate) `*` (repeat) `/` (split) `==` `!=` `<` `<=` `>` `>=`

### Position

**Properties:** `.x`, `.y`, `.length`

**Operators:** `+` `-` `*` `/`

**Indexing:** `[0]` = x, `[1]` = y

### Timeline

**Properties:** `.now`, `.max_time`, `.last_animation_start`, `.last_animation_end`, `.start_from`

**Settable:** `.now`, `.start_from`

**Operators:** `+` `*` `/` `==` `!=` `<` `<=` `>` `>=`

### Palette

**Properties:** `.current`, `.names`, `.b1`–`.b8`, `.f1`–`.f8`

**Settable:** `.current`, `.b1`–`.b8`, `.f1`–`.f8`

### Font

**Properties:** `.family`, `.size`, `.style`, `.weight`, `.stretch`, `.variant`, `.height`

## Animations

Animations modify shapes over time.

### move

Move a shape to a new position.

```
move <shape> [to] <position> [take <duration>] [ease <name>]
```

```
move box1 to (3, 4) take 2 ease cubic
move circle1.ne (5, 5)
```

### rotate

Rotate a shape by an angle, optionally around a pivot point.

```
rotate <shape> by <angle> [about <position>] [take <duration>] [ease <name>]
```

```
rotate gear by 360 take 4 ease linear
rotate arm by 45 about pivot take 1
```

### set

Animate a property to a new value.

```
set <target> [, | to] <value> [take <duration>] [ease <name>]
```

```
set box1.fill to ~red take 1
set @.now, 5
```

### draw

Animate the drawing of a line or shape (stroke reveal).

```
draw <shape> [take <duration>] [ease <name>]
```

```
draw line1 take 2 ease cubicOut
```

### pause

Pause the animation timeline. Optionally display a message.

```
pause
pause "Click to continue"
```

### Animation Parameters

| Parameter | Description |
|-----------|-------------|
| `take <duration>` | Animation duration (in timeline units) |
| `ease <name>` | Easing function name |

**Easing functions:** `linear`, `cubicIn`, `cubicOut`, `cubic`, `cubicInOut`,
`quadIn`, `quadOut`, `quad`, `quadInOut`, `bounce`

### Chaining

Chain animations with `then` to run sequentially:

```
move a to (3, 0) take 1 then move b to (3, 0) take 1
move a to (3, 0) take 1 then set a.fill to ~red take 0.5
```

Each animation after `then` automatically starts when the previous one finishes.

## Cardinals and Directions

Cardinal points reference positions on shapes (`.n`, `.ne`, `.e`, `.se`, `.s`, `.sw`, `.w`, `.nw`, `.c`).

Cardinal direction vectors are used in `Face`, `Gap`, `Goto`, and directional waypoints:

| Short | Long |
|:---:|------|
| `n` | `north` |
| `ne` | `northeast` |
| `e` | `east` |
| `se` | `southeast` |
| `s` | `south` |
| `sw` | `southwest` |
| `w` | `west` |
| `nw` | `northwest` |

## Identifiers and Reserved Words

Identifiers start with a letter, `_`, or `$`, followed by letters, digits, `_`, or `$`.

The `@` symbol is a special identifier for the timeline.

**Reserved words** (cannot be used as identifiers):

Shapes: `Arc`, `Aside`, `Box`, `Circle`, `Ellipse`, `Face`, `Gap`, `Goto`,
`Group`, `Line`, `Label`, `Oval`, `Skip`

Animations: `draw`, `move`, `pause`, `rotate`, `set`, `then`, `wait`

Keywords: `if`, `else`

Constants: `true`, `false`

**Attribute keywords** (reserved when used as attribute names):
`align`, `at`, `ccw`, `cw`, `dashed`, `dotted`, `ease`, `fill`, `font`,
`font_family`, `font_size`, `font_stretch`, `font_style`, `font_variant`,
`font_weight`, `from`, `height` (`ht`), `length` (`len`), `line_height`,
`maxwidth`, `opacity`, `radius` (`rad`, `r`), `rotation` (`rot`), `rx`, `ry`,
`same`, `smooth` (`curve`, `curved`), `solid`, `stepped` (`step`),
`straight`, `stroke`, `stroke_width`, `take`, `thickness` (`thick`),
`to`, `turn`, `width` (`wid`), `with`, `x`, `y`

## Font Specification

The `font` attribute accepts a subset of CSS font syntax:

```
font [style] [variant] [weight] [stretch] <size>[/<line-height>] <family>
```

```
Box "Hello" font bold 16px "Helvetica"
Label "Title" font italic small-caps 24pt/1.2 "Georgia", serif
```

**Sizes:** `xx-small`, `x-small`, `small`, `medium`, `large`, `x-large`,
`xx-large`, `xxx-large`, `smaller`, `larger`, percentages, or numeric with
unit (`px`, `pt`, `em`, `rem`, `cm`, `mm`, `in`, `pc`, `ex`, `ch`, `lh`,
`vh`, `vw`, `vmin`, `vmax`, `Q`).

**Styles:** `italic`, `oblique [angle]`

**Variants:** `small-caps`

**Weights:** `bold`, `lighter`, `darker`, `100`–`900`

**Stretches:** `ultra-condensed`, `extra-condensed`, `condensed`,
`semi-condensed`, `semi-expanded`, `expanded`, `extra-expanded`,
`ultra-expanded`, percentages.

---

*Reference for jp.pegjs grammar*
