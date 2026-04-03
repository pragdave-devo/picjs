# jp Language Reference

<details open><summary><strong>Contents</strong></summary>

- [Statements](#statements)
- [Shapes](#shapes)
  - [Arc](#arc)
  - [Box](#box)
  - [Circle](#circle)
  - [Ellipse](#ellipse)
  - [Oval](#oval)
  - [Line](#line)
  - [Label](#label)
  - [Face](#face)
  - [Skip](#skip)
- [Animations](#animations)
  - [move](#move)
  - [rotate](#rotate)
  - [set](#set)
- [Shape Options](#shape-options)
- [Expressions](#expressions)
- [Value Types](#value-types)
  - [Number](#number)
  - [Boolean](#boolean)
  - [Color](#color)
  - [String](#string)
  - [Position](#position)
  - [Array](#array)
  - [Range](#range)
  - [Timeline](#timeline)
  - [Function](#function)
- [Built-in Functions](#built-in-functions)
- [Type Methods](#type-methods)
  - [Number](#number-methods)
  - [List](#list-methods)
  - [Color](#color-methods)
  - [Range](#range-methods)
  - [String](#string-methods)
  - [Position](#position-methods)
  - [Timeline](#timeline-methods)
  - [Font](#font-methods)

</details>

---

## Statements

| Statement | Description |
|-----------|-------------|
| Inspect | Debug: print the value of an expression |
| ShapeDefaultSetter | Set a default attribute for a shape type |
| [Shape](#shapes) | Draw a shape |
| SetTime | Set the animation timeline position |
| [Animation](#animations) | One or more animations, optionally chained with "then" |
| Assignment | Assign a value to a variable or attribute |
| IfExpression | Conditional expression (if/else) |
| ConditionalExpression | Ternary conditional (test ? then : else) |

**Inspect**

- `?? <expr>`

**ShapeDefaultSetter**

- `<Shape>.<attr> = <expr>`
- `<Shape>.<class>.<attr> = <expr>`

**SetTime**

- `@@ <expr>`

**Assignment**

- `<target> = <expr>`
- `<target> += <expr>`
- `<target> -= <expr>`
- `<target> *= <expr>`
- `<target> /= <expr>`
- `<target> %= <expr>`

**IfExpression**

- `if ( <expr> ) <body> else <body>`
- `if ( <expr> ) <body>`

**ConditionalExpression**

- `<expr> ? <expr> : <expr>`

## Shapes

Every shape accepts [common options](#common-options) 
(label, position, fill, stroke, rotation, CSS class) 
plus the shape-specific options listed below.

### Arc

- `Arc from <position> to <position> [<options>...]`
- `Arc [<options>...]`

**Options:** [Line Endings](#opt-line-endings), [Turn Direction](#opt-turn-direction)

### Box

- `Box [<options>...] [with [.<cardinal>] at <place>]`

**Options:** [Size](#opt-size), [Corner Radii](#opt-corner-radii), [Constraint](#opt-constraint)

### Circle

- `Circle [<options>...] [with [.<cardinal>] at <place>]`

**Options:** [Radius](#opt-radius), [Constraint](#opt-constraint)

### Ellipse

- `Ellipse [<options>...] [with [.<cardinal>] at <place>]`

**Options:** [Radius](#opt-radius), [Constraint](#opt-constraint)

### Oval

- `Oval [<options>...] [with [.<cardinal>] at <place>]`

**Options:** [Radius](#opt-radius), [Constraint](#opt-constraint)

### Line

- `Line from <position> to <position> [<options>...]`
- `Line from <position> [<options>...]`
- `Line to <position> [<options>...]`
- `Line [<options>...]`

**Options:** [Line Endings](#opt-line-endings), [Line Shape](#opt-line-shape), [Line Length](#opt-line-length)

### Label

- `Label <expr> [<options>...] [with [.<cardinal>] at <place>]`

**Options:** [Text Options](#opt-text-options), [Constraint](#opt-constraint)

### Face

- `Face <cardinal>`
- `Face <expr>`

### Skip

- `Skip [<distance>]`

## Animations

Animations can be chained with `then` to run sequentially.
Each animation accepts optional `take <duration>` 
and `ease <name>` parameters.

**Easing functions:** `linear`, `cubicIn`, `cubicOut`, 
`cubic`, `quadIn`, `quadOut`, `quad`, `bounce`

### move

- `move <expr> [to] <expr> [take <duration>] [ease <name>]`

### rotate

- `rotate <expr> by <expr> about <position> [take <duration>] [ease <name>]`
- `rotate <expr> by <expr> [take <duration>] [ease <name>]`

### set

- `set <target> [to] <expr> [take <duration>] [ease <name>]`

## Shape Options

<a id="common-options"></a>

### Common Options

Options available on most shapes.

- `"<text>"           — label`
- `rotation <angle> [about <position>]`
- `at <position> | (<x>, <y>) | x <n> | y <n>`
- `fill <color>`
- `stroke <color>`
- `thickness <n> | solid | dotted | dashed`
- `.<class-name>`

<a id="opt-size"></a>

### Size

Set width and/or height (Box).

- `<width> x <height>`
- `width <expr>`
- `height <expr>`

<a id="opt-radius"></a>

### Radius

Set the radius (Circle, Ellipse, Oval).

- `radius <expr>`

<a id="opt-corner-radii"></a>

### Corner Radii

Set corner radii (Box).

- `rx <expr>`
- `ry <expr>`

<a id="opt-line-endings"></a>

### Line Endings

Line path style and arrow markers.

- `<start><path><end>`
- `start/end markers: < (arrow) | > (arrow) | | (bar) | o (dot)`
- `path style: -- (straight) | ~~ (smooth)`

<a id="opt-line-shape"></a>

### Line Shape

Line interpolation: straight, stepped, or smooth.

- `straight`
- `stepped`
- `smooth`

<a id="opt-line-length"></a>

### Line Length

Set the length of a line.

- `length <expr>`

<a id="opt-text-options"></a>

### Text Options

Label text options: alignment and font.

- `align .<cardinal>`
- `font <font-spec>`

<a id="opt-turn-direction"></a>

### Turn Direction

Arc turn direction: cw, ccw, or angle.

- `[turn] cw | ccw`
- `turn <angle>`

<a id="opt-constraint"></a>

### Constraint

Position a shape by constraining a cardinal point to a place.

- `with [.<cardinal>] [at] <place>`

## Expressions

### Operator Precedence

Lowest precedence first (loosest binding at top):

| Precedence | Name | Operators |
|:---:|------|-----------|
| 1 | Logical OR | `||` |
| 2 | Logical AND | `&&` |
| 3 | Equality | `==`  `!=` |
| 4 | Relational | `<`  `>`  `<=`  `>=` |
| 5 | Additive | `+`  `-` |
| 6 | Multiplicative | `*`  `/`  `%` |
| 7 | Power | `^` |
| 8 | Unary | `+`  `-`  `!` |

### Access & Calls

- `<expr>(<args>)` — function call
- `<expr>[<index>]` — index access
- `<expr>.<attr>` — attribute access

### Conditionals

- `if ( <expr> ) <body> else <body>`
- `if ( <expr> ) <body>`
- `<expr> ? <expr> : <expr>`

### Assignment

`<target> <op> <expr>` where `<op>` is one of: `=`, `+=`, `-=`, `*=`, `/=`, `%=`

### Functions

Arrow function syntax (see also [Function type](#function)):

- `( <params> ) => <body>`
- `<name> => <body>`
- `[( )] => <body>`

## Value Types

### Number

Integer, decimal, scientific notation; append % to divide by 100.

- `<digits> %`
- `<digits>`

**Examples:** `42`, `3.14`, `50%`, `1e3`, `.5`

### Boolean

Boolean true or false.

- `true | false`

### Color

Colors in various formats.

- `<model>(<r>, <g>, <b>[, <a>])`
- `#rrggbb[aa]`
- `#rgb[a]`
- `~<name>`

**Examples:** `#f00`, `#ff0000`, `#ff000080`, `~red`, `rgb(255, 0, 0)`, `hsl(0, 100, 50)`, `oklch(63, 0.26, 29)`

**Color models:**

| Model | Parameters |
|-------|------------|
| `rgb` | r (0-255), g (0-255), b (0-255), [alpha (0-1)] |
| `hsl` | h (0-360), s (0-100), l (0-100), [alpha (0-1)] |
| `hsv` | h (0-360), s (0-100), v (0-100), [alpha (0-1)] |
| `oklch` | L (0-100), C (0-0.4), h (0-360), [alpha (0-1)] |

### String

Single or double quoted, with standard escape sequences (\n, \t, \\, etc.).

- `"..." | '...'`

### Position

An (x, y) coordinate pair.

- `( <expr> [,] <expr> )`

**Examples:** `(100, 200)`, `(x + 10, y)`

### Array

A list of values.

- `[<expr>, ...]`
- `[]`

**Examples:** `[1, 2, 3]`, `[]`, `[~red, ~blue]`

### Range

An inclusive range between two values.

- `[<start> .. <end>]`

**Examples:** `[1..10]`, `[0..n-1]`, `[~red .. ~blue]`

### Timeline

Access the animation timeline.

- `@ (read current time)`
- `@@ (advance timeline)`

### Function

Lambda/arrow function expressions.

- `( <params> ) => <body>`
- `<name> => <body>`
- `[( )] => <body>`

**Examples:** `n => n * 2`, `(x, y) => x + y`, `=> Box`

## Built-in Functions

| Function | Parameters | Description |
|----------|------------|-------------|
| `sin` | angle-in-degrees | return the sine (-1...+1) of the given angle (in degrees) |
| `cos` | angle-in-degrees | return the cosine (-1...+1) of the given angle (in degrees) |
| `tan` | angle-in-degrees | return the tangent (-1...+1) of the given angle (in degrees) |
| `asin` | ratio | return the angle (in degrees) whose sine is _ratio_ |
| `acos` | ratio | return the angle (in degrees) whose sine is _ratio_ |
| `atan2` | dy, dx | return the angle (in degrees) between the x-axis and the point (dx,dy). (note the parameter order: y, x, not x, y) |
| `polar` | radius, theta | return the posiio of the point "radius" away from the origin along a line at angle "theta" (degrees) |
| `ln` | number | return the natural logarithm of number |
| `log10` | number | return the logarithm (base 10) of number |

## Type Methods

Methods and properties available on each [value type](#value-types).

<a id="number-methods"></a>

### Number

**Operators:** `+` `-` `*` `/` `^` `==` `!=` `<` `<=` `>` `>=`

| Method | Parameters | Description |
|--------|------------|-------------|
| `.abs()` | — | return the absolute value of number |
| `.interpolate()` | other, ratio | return the number that is *ratio* of the way between this number and other (where ratio == 0 returns this number and ratio == 1 the other) |
| `.times()` | callback | Invoke the callback «number» times, passing it from 0 to n-1 |

<a id="list-methods"></a>

### List

**Properties:** `.length`

**Operators:** `+` `-` `*` `/` `^`

| Method | Parameters | Description |
|--------|------------|-------------|
| `.push()` | item | add a new item to the end of a list |
| `.pop()` | — | remove the last item from a list and return that item |
| `.first()` | — | return the first item in this collection or range |
| `.last()` | — | return the last item in host collection or range |
| `.each()` | [step], callback | invoke 'callback' with each item in turn. The optional step allows you to select each nth item. It 0.0 < step < 1.0, then we do interpolation |
| `.map()` | [step], callback | invoke 'callback' with each item in turn, and collect the results into a list, which we return. The optional step allows you to select each nth item. It 0.0 < step < 1.0, then we do interpolation |

<a id="color-methods"></a>

### Color

**Operators:** `==` `!=`

| Method | Parameters | Description |
|--------|------------|-------------|
| `.lighten()` | ratio | return a lighter version of this color (ratio is 0 to 1) |
| `.darken()` | ratio | return a darker version of this color (ratio is 0 to 1) |
| `.brighten()` | ratio | add white to this color (ratio is 0 to 1) |
| `.desaturate()` | amount | reduce chroma (amount is 0 to 1, with 1 producing grayscale) |
| `.saturate()` | amount | increase chroma (amount is 0 to 1) |
| `.grayscale()` | — | convert this color to grayscale |
| `.spin()` | angle | rotate the hue by the given angle in oklch space (−360 to 360) |

<a id="range-methods"></a>

### Range

**Operators:** `*`

| Method | Parameters | Description |
|--------|------------|-------------|
| `.start()` | — | return the first value in the range |
| `.end()` | — | return the last value in the range |
| `.ease()` | style | Apply easing to the interpolation. Style is one of: linear, cubicIn, cubicOut, cubic, quadIn, quadOut, quad, bounce |
| `.interpolate()` | ratio | return the value that is *ratio* of the way between start and end (where ratio is between 0 and 1 inclusive) |
| `.steps()` | number_of_steps, callback | Invoke the callback *steps* times, passing equally spaced interpolations from the range |
| `.each()` | callback | If (and only if) start and end are integers, invokes the callback "end - start + 1" times, passing it the current value and the index. |
| `.map()` | callback | If (and only if) start and end are integers, invokes the callback "end - start + 1" times, passing it the current value. Collects and returns a list of the values returned by each invocation. |

<a id="string-methods"></a>

### String

**Properties:** `.length`

**Operators:** `+` `*` `/` `==` `!=` `<` `<=` `>` `>=`

<a id="position-methods"></a>

### Position

**Properties:** `.length`, `.x`, `.y`

**Operators:** `+` `-`

<a id="timeline-methods"></a>

### Timeline

**Properties:** `.now`, `.max_time`, `.last_animation_start`, `.last_animation_end`

**Operators:** `+` `*` `/` `==` `!=` `<` `<=` `>` `>=`

<a id="font-methods"></a>

### Font

**Properties:** `.family`, `.height`, `.size`, `.stretch`, `.style`, `.variant`, `.weight`

---

*Generated from src/peg_parser/jp.pegjs (193 rules) on 2026-03-30*
