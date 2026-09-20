---
title: picjs Language Reference
description: Complete reference for the picjs language
layout: layouts/doc.njk
eleventyNavigation:
  key: Language Reference
  order: 2
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

Every shape takes the [common options](#common-options), any number of
[labels](#labels), and an optional [constraint](#constraint). The tables below
list what each shape adds to those.

Shape names may be written in lower case: `box`, `circle`, `ellipse`, `oval`,
`arc`, `line`.

### Box

```
Box [options] [with …]
```

A rectangle.

| Option | Value | Default |
|--------|-------|---------|
| `width` `wid` | number | 1 |
| `height` `ht` | number | 0.75 |
| `<w> x <h>` | two numbers | — |
| `rx` `ry` | number | 0.06 |
| `radius` `rad` | number | sets `rx` and `ry` together |

```picjs example
Box "Hello"
Box 2 x 1 "Wide"
Box wid 3 ht 2 radius 0.2 fill ~b3
```

### Circle

```
Circle [options] [with …]
```

| Option | Value | Default |
|--------|-------|---------|
| `radius` `rad` `r` | number | 0.5 |

```picjs example
Circle "Node"
circle radius 0.8 fill ~b3
```

### Ellipse

```
Ellipse [options] [with …]
```

| Option | Value | Default |
|--------|-------|---------|
| `rx` | number | 0.5 |
| `ry` | number | 0.375 |
| `radius` `rad` | number | sets `rx` and `ry` together |

```picjs example
Ellipse "Wide" rx 1.2 ry 0.4
```

### Oval

```
Oval [options] [with …]
```

A rectangle with fully rounded ends.

| Option | Value | Default |
|--------|-------|---------|
| `width` `wid` | number | 1 |
| `height` `ht` | number | 0.75 |
| `<w> x <h>` | two numbers | — |
| `rx` `ry` | number | half the shorter side |

```picjs example
Oval "Button"
oval 2 x 0.6 fill ~b2
```

### Line

```
Line [endings] [from <position>] [to <position>] [options]
```

Either endpoint may be left out: the line then starts at the current position,
or runs one unit in the current direction.

| Option | Value | Default |
|--------|-------|---------|
| endings | see below | plain line |
| `straight` `stepped` `smooth` | — | `straight` |
| `length` `len` | number | 1 |
| `nodraw` | — | draw the line |

Endings are written `[start][path][end]`, where the path is `-` for a straight
line or `~` for a curved one:

| | `<` | `o` | `\|` | nothing |
|---|---|---|---|---|
| **start** | arrow | dot | bar | plain |

| | `>` | `o` | `\|` | nothing |
|---|---|---|---|---|
| **end** | arrow | dot | bar | plain |

So `->` is a straight line with an arrow at the end, `<~>` a curve with arrows
at both, and `--` and `~~` are plain straight and curved lines. An arrow on its
own is a whole line: `box "A" -> box "B"` joins the two boxes.

```picjs example
box "A"
-> "sends"
box "B"
```

### Polyline

```
Line from <position> then <position> [then …] [close] [options]
```

A line through several points. Takes everything `Line` takes, plus:

| Option | Value | Default |
|--------|-------|---------|
| `rx` `ry` `radius` | number | square corners |
| `close` | — | leave open |

Each waypoint is a position, a direction and distance, or a direction and a
shape to stop level with.

```picjs example
a = box "A"
line -> from a.s
     then south 1
     then east until even with (3, 0)
     radius 0.2
```

### Arc

```
Arc [endings] from <position> to <position> [options]
```

| Option | Value | Default |
|--------|-------|---------|
| `cw` `ccw` | — | `cw` |

`turn cw` and `turn ccw` may be written in full.

```picjs example
Arc from (0,0) to (2,2)
Arc from (0,0) to (2,2) ccw stroke ~b3
```

### Label

```
Label <text> [options] [with …]
```

Standalone text. The text may be a string, or a parenthesised expression.
Labels attached to a shape are covered under [Labels](#labels).

| Option | Value | Default |
|--------|-------|---------|
| `align` | cardinal | `.c` |
| `maxwidth` | number | no wrapping |
| `line_height` | number | 1.2 × the font size |

Plus the [text options](#text-options).

Labels also have built-in classes that set size and alignment:

| Class | `.h1` | `.h2` | `.h3` | `.h4` | `.p` |
|-------|-------|-------|-------|-------|------|
| Size  | 0.63 | 0.42 | 0.28 | 0.21 | inherited |

```picjs example
Label "Title" .h1
Label ("Total: #{1 + 2}") fill ~b3
```

### Skip

```
Skip to <position>
Skip x <n> y <n>
```

Moves the current position without drawing anything.

## Groups

### Group

```
Group [options] { … } [with …]
```

Collects shapes so they can be positioned, styled and animated as one. Styling
options may be written before the body or after it; a constraint goes after.

| Option | Value | Default |
|--------|-------|---------|
| `padding` `pad` | number or `(x, y)` | 0 |
| `rx` `ry` `radius` | number | square corners |

A group draws a background behind its children when given a `fill` or a
`stroke`. Padding holds the children away from its edges and grows the group,
so shapes around it keep their distance.

Name a shape inside a group with `self.` to reach it from outside.

```picjs example
g = Group fill ~b3 radius 0.1 pad 0.3 {
  Face s
  self.top = box "one"
  Gap
  box "two"
}
Label "beside" with .w at g.e + (0.3, 0)
```

### Aside

```
Aside { … }
```

Draws its contents without moving the current position, so the shapes that
follow carry on as though the aside were not there.

## Layout

Shapes are placed one after another in the current direction, starting from the
current position.

### Face

```
Face <cardinal>
Face <angle>
```

Sets the direction for what follows. `Face s`, `Face ne`, `Face east`, `Face 45`.

### Gap

```
Gap [<cardinal>] [<distance>]
Gap same
```

Leaves space. `Gap same` repeats the previous gap.

### Goto

```
Goto <position>
Goto <cardinal> [<distance>]
Goto <distance>
```

Moves the current position without drawing.

## Common options

Accepted by every shape.

| Option | Value | Notes |
|--------|-------|-------|
| `at <position>` | position | also written as a bare `(x, y)` |
| `x` `y` | number | set one coordinate |
| `fill` | colour | `~b1` for shapes, none for lines |
| `stroke` | colour | none for shapes, `~b1` for lines |
| `thickness` `stroke_width` | number | 0.015 for shapes, 0.04 for lines |
| `solid` `dotted` `dashed` | — | solid by default |
| `opacity` | 0 to 1 | 1 |
| `rotation` `rot` | angle, optionally `about <position>` | 0 |
| `behind <shape>` | shape | draw underneath another shape |
| `same` | — | reuse the previous shape's options |
| `fit` | — | size the shape to its label |
| `.<class>` | — | see [Classes](#classes) |

## Labels

A string after a shape becomes a label on it. Several strings stack.

```picjs example
Box "Hello"
Gap
Box "Line one" "Line two"
```

Within a label, a newline starts a new line and a blank line starts a new
paragraph. `**bold**`, `*italic*` and `[links](https://example.com)` work.

Parentheses give a label its own options, and let it hold any expression
rather than only a literal string:

```picjs example
n = 3
Box ("count: #{n}" fill ~b7 14pt)
```

### Line labels

Labels on a line or arc may be placed along it and to either side.

```
"text" [above | below | inside | outside] [at <percent>]
```

```picjs example
box "A"
-> "sends" above at 30%
box "B"
```

## Constraint

```
with [.<cardinal>] at <place>
with self.<name>[.<cardinal>] at <place>
```

Pins a point on the shape to a place. Without a cardinal, the centre is used.
A constraint holds: if the target moves, the shape follows.

```picjs example
a = Box "A"
Box "B" with .w at a.e + (0.5, 0)
```

## Text options

Accepted by labels, and inside a parenthesised label on any shape.

| Option | Value |
|--------|-------|
| `align` | cardinal — `.w`, `.c`, `.e` … |
| `maxwidth` | number — wrap at this width |
| `line_height` | number |
| `font` | a CSS font specification |
| `font_size` | size, or written bare: `14pt`, `large` |
| `font_family` `font_weight` `font_style` `font_variant` `font_stretch` | as CSS |

```picjs example
Label "Heading" font italic bold 24pt Georgia
Label "Wrapped text here" maxwidth 10 align .w
```

## Classes

A class is written `.name` and may be stacked. Classes carry defaults set with
[shape defaults](#shape-defaults).

```picjs example
Box.hot.fill = ~b4
Box "urgent" .hot
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

`Shape` (capitalized) refers to the base shape class.

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

Targets can be simple identifiers, qualified paths
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

Named colors can be one of the standard [web color names](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/named-color), a foreground or background palette color (`~f1`..`~f8`, `~b1`..`~b8`), or `~none` (for transparent).


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
"Hello #{name}"
"Total: #{a + b}"
"Price: ###{price}"     // outputs: Price: #42
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
["hello", "world", 42]
[~red, ~blue, ~green]
[]
```

Elements of an array can have different types.

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
| `@@` | Set `@` to the end of the last animation |

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

Move a shape to an absolute position or by a relative offset.

```
move <shape> [to] <position> [take <duration>] [ease <name>]
move <shape> <direction> [<distance>] [take <duration>] [ease <name>]
```

Directions: `up`, `down`, `left`, `right`, `north`, `south`, `east`, `west`, `n`, `s`, `e`, `w`, `ne`, `nw`, `se`, `sw`, `northeast`, `northwest`, `southeast`, `southwest`. Distance defaults to 1 if omitted.

```
move box1 to (3, 4) take 2 ease cubic
move circle1.ne (5, 5)
move box1 down 2
move box1 right 3 take 1.5
move box1 ne 1 take 2 ease quad
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
`Group`, `Line`, `Label`, `Oval`

Animations: `draw`, `move`, `pause`, `rotate`, `set`, `then`

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
