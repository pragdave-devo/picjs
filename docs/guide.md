---
title: picjs Guide
description: An introduction to picjs
date: 2026-04-21
layout: layouts/doc.njk
eleventyNavigation:
  key: picjs Guide
  order: 1
---
# picjs: Constraint-Base Drawing and Animation Language

> For reference material, have a look at [The picjs Reference](./picjs-reference.md) and
> the [Quick Reference Card](./quick-reference.md).

Before we start, a few notes:

* Play along with the examples in the guide using the [online editor](https://picjs.dev/editor) or install picjs locally using npm:

  ```console
  $ npm install -g picjs
  $ picjs --playground
  ```


*  Integrating picjs

  If you have control over the Markdown to HTML conversion used by your site, you can add picjs as a
  plugin, and <code>\`\`\` picjs</code> code blocks will be replaced by SVG in the output.

  You'll need to include the picjs library if your images use animation.

  ```
  MISSING
  ```

* Converting In Place

  You might want to use picjs to add diagrams to something like a Github README.md. In this case,
  you'll need to preprocess the file before you push it.

  The `picjs` command will convert each diagram in a file into SVG. It will then insert the SVG, and
  also include the original picjs as an HTML comment, along with a checksum. The resulting file will
  display the SVG in place of the diagram. If you want to alter a diagram, edit the picjs source in
  the comment and rerun the comand. It will compare the checksum with that of the source, and
  regenerate the SVG if the source has changed.

Enough boring stuff. Let's draw some pictures.


## Hello World: default positioning

~~~ picjs example
box  "Hello"
line ->
box  "World"
~~~

`box` and `line` are shapes. By default, picjs draws shapes from west to east.

picjs is written using expressions, not statements, and each expression ends when picjs comes across
something that doesn't belong. Whitespace (including newlines) are irrelevant, unless they are
separating two tokens. That means the previous example can be written:

~~~ picjs example
box "Hello" line -> box "World"
~~~

And because `->` is both an attribute and a shortcut, you can write:

~~~ picjs example
box "Hello" -> box "World"
~~~

The current direction is set using the `Face` command.

~~~ picjs example scale=5
Face s
box "Hello" -> box "World"
~~~

The connections between shapes are centered on the direction we're drawing.

~~~ picjs example
box "Hello"
       -> circle "你好"
Face s -> Oval "Hola"
Face w -> ellipse "привіт"
Face n ->
~~~

## Constraints

Every 2D shape has a bounding box with nine associated positions:

``` picjs scale=10
bounds = box rad 0 fill ~MediumAquamarine stroke ~MediumTurquoise
[ "nw", "n", "ne",
  "w",  "c", "e",
  "sw", "s", "se"
].each(pos => Label pos at bounds[pos] fill ~black)
box at bounds wid bounds.width*140% height bounds.height*140% fill ~Gainsboro behind bounds
```

So far we've used the default layout method. If we're facing east, then the next shape's `.w` is
located at the previous shape's `.e`. If we're facing south, then `.n` is placed at the previous
`.s`, and so on.

You can override that positioning using _constraints_. A constraint is a relationship between a shape and some
other _position_.

### Positions

Drawings are made on an X/Y plane, where the X coordinate increases to the east and the Y coordinate
increases to the south. A position is a point on that plane.

Absolute positions are simply two expressions between parentheses. The comma is optional as long as
there's a space between them.

``` picjs example scale=8
box wid 3 ht 3 with .nw at (-.5, -.5) fill ~gray
[0..2].each(n => {
  h = line from (-.1, n) to (2,n) thick 0.01 stroke ~skyblue
  v = line from (n, 0) to (n,2.1)  same
  Label "#{n}" with .e at h.w - (.1,0)
  Label "#{n}" with .n at v.s + (0,.1)
})

box "A" at (1, 1)
box "B" at (1.5 1.5) fill ~b2
```

Each of the coordinates can be an expression:

``` picjs example scale=3
[0..359].steps(10, theta => {
  circle at (2*sin(theta), 2*cos(theta))
})
```
(The `[0..359].steps(20, theta => {...})` syntax iterates of the range from zero to 359, taking 20
steps, and passing the current interpolated value to the function as `theta`.)

Positions are also values, so you can perform arithmetic on them:

``` picjs example scale=3
[0..359].steps(10, theta => {
  circle at 2*(sin(theta), cos(theta))
})
```

You can also interpolate between them:

~~~picjs example
[(0,0)..(2,1)].steps(7, pos =>
  circle fill ~b4 stroke ~f4 at pos
)
~~~

### Relative Positions

It's fairly unusual to use absolute positions, since they don't adapt to changes in the layout.
Instead, we locate shapes relative to each other.

Each of the cardinal points of a shape is a position value. We can use `at` just as we did above,
but using a shape's position instead of an absolute one:

``` picjs example scale="8"
a = box "A" fill ~b2
box "B" at a.se opacity 0.5
```

Using a shape value as a position selects the center of that shape, so the previous example
positioned the center of the second box at the southeast corner of the first.

Use the `with` clause to change the starting point of the position:

``` picjs example
a = box "A" fill ~b2
box "B" with .nw at a.se opacity .7
```

We can use arithmetic:

~~~ picjs example
a = box "A" fill ~b2
box "B" with .nw  at a.se - (.2,.2) opacity .7
~~~

Algebra works as expected on positions:

~~~ picjs example
a = box "A"
b = box "B" at a.c + (2,1)
circle radius .1 at a.se + (b.nw-a.se) * 25%
circle radius .1 at a.se + (b.nw-a.se) * 50%
circle radius .1 at a.se + (b.nw-a.se) * 75%
~~~

## Colors

Most shapes have fill colors and stroke colors (lines only have stroke colors, and labels only
have fill). These are set using the `fill` and `stroke` attributes.

~~~ picjs example
box fill ~Salmon stroke ~FireBrick
line stroke ~green
circle fill ~pink stroke ~purple
~~~

These examples used the `~` notation for named colors. All the CSS named colors are supported.
In addition you can use the color functions `rgb`, `hsl`, and `oklch`. They each take three
parameters, along with a fourth optional opacity.

However, if you want consistency, use a color palette. Picjs ships with a number of palettes,
and each has eight foreground colours (`~f1`–`f8`) and eight background colors (`~b1`–`~b8`).

As a general guide, the `~b1` is darker than `~b2` and so on, but that depends on the palette.

The colors are chosen so that using a given foreground color on a background of the same number
background color will ensure WCAG accessibility.

~~~ picjs example
Palette.current = "sunset"

b1 = box fill ~b1
b2 = box fill ~b2 with .nw at b1
b3 = box fill ~b3 with .sw at b2
b4 = box fill ~b4 with .nw at b3
~~~

The `Palette` object lets you switch the palette used for all subsequent objects. You can also
define your own palettes by assigning to `Palette.b1`, `Palette.b2` and so on.

There's a table showing the available palettes at the [end of this document](#palette).

### Color Interpolation

You can interpolate between two colors.

~~~ picjs example
Palette.current = "ocean"
[~b1..~b8].steps(7, color =>
  box fill color stroke ~black thickness .03
)
~~~

### Color Manipulation

~~~ picjs example
Face s
{
  Face e
  ["", "Lighten", "Darken", "Desaturate", "Saturate"].each(head => {
    box (head) ht .3 rad 0 fill ~grey
  })
}

{
  [60..360].steps(8, rotation => {
    {
      base_color = ~b3.spin(rotation)
      Face e
      box fill base_color ("#{base_color}" fill ~black)
      box fill base_color.lighten(.2)
      box fill base_color.darken(.2)
      box fill base_color.desaturate(.3)
      box fill base_color.saturate(.3)

    }
  })
}

Gap .1

Face s
box ht .3 wid 5*Box.width rad 0  "Grayscale" fill ~gray

{
  [~cyan, ~red, ~green, ~blue, ~purple].each(base_color => {
    Face e
    {
      Face s
      box ht Box.height/2 fill base_color rad 0
      box same fill base_color.grayscale()
    }
  })
}
~~~

## Other Shape Attributes

`fill` and `stroke` are two of the dozens of attributes that `picjs` supports. They let you
change the width, height, corner radius and fonts used. Down towards the of this document you'll
find the details.

## Basic Programming

picjs is a mini programming language. It has variables:

~~~ picjs example
b1 = box "one"
Gap
b2 = box "two"
arc from b1.n to b2.n
~~~

picjs has lists, ranges, strings, booleans, and positions. It comes with the usual set of operators
(`+`, `-`) and so on, and it tries to apply them polymorhpically:

``` js
1 + 2         // 3
[ 1, 2 ] + 3  // [4, 5, 6]
"cow" + 99    // "cow99"
3 * (2, 3)    // (6, 9)   (x,y) is a position
```

It has `if` statements:

``` js
if (condition)
  expression_or_block
else
  expression_or_block
```

_condition_ is an expression evaluating to a boolean.

_expression_or_block_ is either a single expression of a set of expressions enclosed in braces.

``` js
if (name == "Dave")
  box "Hello"
else {
  circle "Sorry"
  oval   "Don't know you"
}
```
The `else` is optional.

### Functions

A function is created using the `=>` operator. It may be preceded by a list of parameters, and
it must be followed by an _expression_or_block_.

The _parameters_ are a list of names between parentheses, separated by commas. The parentheses
can be omitted if there is only one parameter.

``` js

// a function that applies `* 2` to its parameter
n => n * 2

// return the (x,y) coordinates given polar coordinates
(r, theta) => r*(sin(theta), cos(theta))

// draw a circle inside a box
=> {
  b = box
  circle rad .3 fill ~f2 at b
}
```

You'll typically assign function values to variables or pass them to other functions.

~~~ picjs example
short_box = label =>
   box ht 0.3 "--#{label}--"

[1,2,3].each(short_box)
~~~

### Blocks and Groups

Blocks and groups have identical syntax: a set of expressions enclosed in braces.

A _block_ is used when you want to provide multiple expressions as the body of a function, or in
the arms of an `if` expression.

``` js
if (Box.width < 2) {
  Box wid 1 "Hello"
  Box wid 2 "World"
}
```

A _group_ is used when you want to associate a set of drawing objects and treat them as a single
entity.

``` js
{
  Box wid 1 "Hello"
  Box wid 2 "World"
}
```

The value of a block is the value of the last expression executed. The value of a group is a
shape object (an instance of `Group`).

The shapes inside a group are positioned relative to the group as a whole, and so when you
position the greoup, you position the shapes it contains. Also, if you set the `Face` direction
in a group, it is restored when the group exits.

This is a common pattern for centering variable height lists.

``` picjs example
{
  Face s
  box "A"
  box "B"
  box "C"
}
Gap .2
{
  Face s
  box "D"
  box "E"
}
Gap .2
box "F"
```

Because they're shapes, groups can be positioned.

``` picjs example
c = circle "Circle"
{
  box "A"
  box "B"
  box "C"
} with .s at c.n
```

This is often used to draw a background around a group of shapes.

``` picjs example
details = {
  box "Pat"
  Gap .2
  box "Joey"
  Gap .2
  box "Syd"
}

box fill ~b7 :
    wid details.width * 120%
    ht details.height * 120%
    at details
    behind details
```

If you do this multiple times in a drawing, use a function:

``` picjs example
Palette.current = "sunset"

Face s

surround = (shape, label) => {
  {
    b = box fill ~b3
        width shape.width * 120%
        height shape.height * 120% + .4
        at shape.c - (0,.1)
    Label label with .n at b.n + (0,.05)
  } behind shape
}

details = {
  Face s
  box "Pat"
  Gap .2
  box "Joey"
  Gap .2
  box "Syd"
}

surround(details, "Team One")

Gap

surround({
  Face e
  box "Pat"
  Gap .2
  box "Joey"
  Gap .2
  box "Syd"

}, "Team Two")
```

There are two subtlties here. First, inside the `surround` function we put the box and label
inside their own group, which lets up put them both behind the shape.

Second, we don't have to store the group we're wrapping in a variable. The second team is passed
as a literal group to `surround`.

### Functions Are Closures

~~~ picjs example scale=15
multiplier = a => {
  b => Label "#{a} x #{b} = #{a*b}"
}

times_2 = multiplier(2)
times_3 = multiplier(3)

Face s
Label.fill = ~black
times_2(5)
times_2(6)
times_3(7)
times_3(8)
~~~

In this example, `multiplier` is a function that returns another function. That second function
draws a label, using the `b`, its parameter and `a`, which is the enclosed value passed to the
function that created it.

### Attributes Are Dynamic

### Functions Can Be Mixins

# Part 2: Language Guide

picjs is a simple expression-oriented language with a prototype-based object system.

## Overall Syntax

Comments start `//` and run to the end of the line.

A program is a list of _expressions_. There are no terminators; expressions end when the parser
comes across something that doesn't below in that expression. Whitespace (including newlines) serves
only to separate tokens that would othereise run together.

In the code

``` js
box wid 2 -> circle "end"
```

The word `box` starts a shape expression. `wid 2` ae valid parameters to `box`, but the `->` is not,
so it starts a new expression. `circle "end"` is the third expression.

The previous code is parsed identially to

``` js
box  wid
2
--> circle
"end"
```

In general, I write simple compound expressions in one line, but split each onto its own line when
it starts to get complicated.

### Everything has a value

Because everything is an expression, everything has a value. The value of a `box` expression is the
bo shape it creates. The value of an assignment is the value that was assigned. This is powerful.
It's also potentially ugly:

~~~ picjs example
box "A" with .nw at (box "B").e
~~~


## Data Types

Number
: `1   1.23   .5   50%`

Boolean
: `true    false`

Color
:  * `rgb(r,g,b)   hsb(h,s,b)   oklch(l,c,h)` (may have additional `a` parameter)
   * `0xrrggbb    0xrrggbbaa`
   * `~namedcolor`

String
:  * `'characters'`
     The literal string containing characters. `\'` can be used to include a single quote.

   * `"characters"`

     A string with potential substitutions:

     * `\xdd` the character with the given hex code
     * `\n` a newline
     * `\\` a backslash
     * `\"' a double quote
     * `#{expression}` the value of _expression_, converted to a string.

   * `"""`

     Start of a multiline string. Terminated by a line containing just `"""`. Acts like a
     double-quoted string.

Position
: `( expr, expr )` or `(expr expr)`

Array
: `[ expr, ... ]`

Range
: `[expr..expr]`

   Both expressions should be he same type, and that type should support
   interpolation.

Function
:  `(params) => { body }`

    _params_ is a comma separated list of parameter names. If there is only one name, the
    parentheses may be omitted. If there are no parameters, then either use `()` or put nothing
    before the `=>`.

    The _body_ is one or more expressions. If there's only one expression, the braces may be
    omitted. The value of a function is the value of the last expression evaluated.

    ``` js
    double = n => n * 2

    pos = (r, theta) => r*(sin(theta), cos(theta))

    circle_box = => {
      b = box
      circle rad .3 fill ~f2 at b
    }
    ```


### Attributes

Every value can have attributes. Some of those attributes are inherent to the type of th value; an
arrey has a `length` attribute, for example. You can access the attributes using either dot notation
or as a lookup.

``` js
list = [1, 2, 3]
list.length     // = 3
list["length"]  // = 3
attr = "length"
list[attr]      // = 3
```

Attributes can be of any type, including functions:

``` js
list = [1, 2, 3]
list.push(4)
list   // = [1,2,3,4]
```

#### Custom Attributes

You can add your own attributes to any value: they pop into existence when they are assigned to.

#### Group Attributes

Inside a group, the variable `self` is a reference to the group object, and assigning to
`self.attr_name` creates an attribute on that group. This is useful for refencing individual shapes
in a group.

``` picjs example
g = {
  box ->
  self.middle = box
  -> box
}

circle with .n at g.middle.s
```

### Expression Types

#### Assignment

```js
name = expression
name.attrname = expression
name[attrname] = expression
```
The value of an assignment is the value that was assigned. This means you can chain assignments:

```
a = b = c = 1
```

#### Conditionals

``` js
if (expr) body else body
if (expr) body
```

`body` can be a single expression or multiple expressions between braces.

The value of an `if` is the value of the last expression evaluated.

#### Debug Print

```
?? expression
```

Displays the expression and it's value. If you're running the playground, it's shown below the
drawing area. Otherwise it is displayed on the console.


# Build-In Shapes, Attributes, and Functions


## Attribute List

Every attribute, what type of value it takes, and what it does.

| Attribute | Value | Description |
|-----------|-------|-------------|
| `align` | cardinal (`.n`, `.w`, `.c`, etc.) | Text alignment within a label |
| `at` | position | Place shape at a specific position |
| `behind` | shape reference | Render this shape behind the referenced shape |
| `close` | — (flag) | Close a polyline into a polygon |
| `dashed` | — (flag) | Dashed stroke line style |
| `dotted` | — (flag) | Dotted stroke line style |
| `ease` | string | Easing function for an animation |
| `fill` | color | Fill color |
| `fit` | — (flag) | Auto-size shape to fit its label content |
| `font` | font-spec | CSS font specification (style, weight, size, family) |
| `font_family` | string | Font family name(s) |
| `font_size` | size | Font size (CSS units or keywords) |
| `font_stretch` | keyword/percentage | Font stretch |
| `font_style` | keyword | Font style (`italic`, `oblique`) |
| `font_variant` | keyword | Font variant (`small-caps`) |
| `font_weight` | keyword/number | Font weight (`bold`, `lighter`, `100`–`900`) |
| `from` | position | Line/arc start point |
| `height` / `ht` | number | Shape height |
| `length` / `len` | number | Line length |
| `line_height` | number | Line spacing for multi-line labels |
| `line_end` | `>` / `o` / `\|` | End marker on a line |
| `line_path` | `straight` / `smooth` / `stepped` | Line interpolation style |
| `line_start` | `<` / `o` / `\|` | Start marker on a line |
| `maxwidth` | number | Maximum text width before wrapping |
| `nodraw` | — (flag) | Create shape with draw_progress=0 (invisible until animated) |
| `opacity` | number (0–1) | Shape opacity |
| `radius` / `rad` / `r` | number | Circle/ellipse radius, or polyline corner radius |
| `rotation` / `rot` | number (degrees) | Rotation angle |
| `rx` | number | Horizontal corner radius |
| `ry` | number | Vertical corner radius |
| `same` | — (flag) | Copy attributes from previous shape of same type |
| `smooth` / `curve` / `curved` | — (flag) | Smooth (bezier) line path |
| `solid` | — (flag) | Solid stroke line style |
| `stepped` / `step` | — (flag) | Stepped (right-angle) line path |
| `straight` | — (flag) | Straight line path (default) |
| `stroke` | color | Stroke color |
| `stroke_width` | number | Stroke width (see also `thickness`) |
| `take` | number | Animation duration |
| `thickness` / `thick` | number | Stroke width (alias for `stroke_width`) |
| `to` | position | Line/arc end point |
| `turn` | `cw` / `ccw` / angle | Arc turn direction |
| `width` / `wid` | number | Shape width |
| `with` | constraint | Position constraint (see [Constraint](#constraint)) |
| `x` | number | X position |
| `y` | number | Y position |
| `.<class>` | — | CSS class applied to the SVG element |

### Labels (special attribute syntax)

| Syntax | Context | Description |
|--------|---------|-------------|
| `"text"` | shape attribute | Simple label |
| `("text" fill ~red .cls 14pt)` | shape attribute | Rich label with styling |
| `"text" above` | line attribute | Line label positioned above path |
| `"text" at 25% below` | line attribute | Line label at 25% along path, below |
| `"text" inside` / `outside` | line/arc attribute | Label on inside/outside of curve |

### Constraint

| Syntax | Description |
|--------|-------------|
| `with .<cardinal> at <place>` | Pin cardinal point to a position |
| `with at <place>` | Pin center to a position |
| `with self.<name>.<cardinal> at <place>` | Pin a named sub-element's cardinal point |

---

## Attribute–Shape Matrix

Columns are the built-in shapes and objects. Rows are attributes.

- ✓ = attribute is accepted. If the shape has a default value, it follows the checkmark.
- ✗ = attribute cannot be used with this shape.

Default values shown are for the `.normal` class using the Dark theme.
Theme-variable names (like `BoxFill0`) resolve to specific colors at runtime.

| Attribute | Box | Circle | Ellipse | Oval | Line | Polyline | Arc | Label | Group | Skip | Point |
|-----------|:---:|:------:|:-------:|:----:|:----:|:--------:|:---:|:-----:|:-----:|:----:|:-----:|
| **Labels** | | | | | | | | | | | |
| `"text"` (label) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ ¹ | ✓ | ✗ | ✗ |
| rich label `(...)` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ ¹ | ✓ | ✗ | ✗ |
| line label positioning (`above`/`below`/`at %`) | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| **Position** | | | | | | | | | | | |
| `at` / `(x,y)` | ✓ | ✓ | ✓ | ✓ | ✗ ² | ✗ ² | ✗ ² | ✓ | ✓ | ✓ | ✗ |
| `x` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| `y` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ |
| `from` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `to` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| `with` (constraint) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ |
| **Size** | | | | | | | | | | | |
| `width` / `wid` | ✓ (1) | ✗ | ✗ | ✓ (1) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `height` / `ht` | ✓ (0.75) | ✗ | ✗ | ✓ (0.75) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `W x H` | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `radius` / `rad` / `r` | ✗ | ✓ (0.5) | ✗ | ✗ | ✗ | ✓ ³ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `rx` | ✓ (0.06) | ✗ | ✓ (0.5) | ✓ ⁴ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `ry` | ✓ (0.06) | ✗ | ✓ (0.5) | ✓ ⁴ | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `length` / `len` | ✗ | ✗ | ✗ | ✗ | ✓ (1) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **Appearance** | | | | | | | | | | | |
| `fill` | ✓ (#1a7a9a) | ✓ (#1a7a9a) | ✓ (#1a7a9a) | ✓ (#1a7a9a) | ✓ | ✓ (none) | ✓ | ✓ (#ffffff) | ✓ | ✗ | ✗ |
| `stroke` | ✓ (none) | ✓ (none) | ✓ (none) | ✓ (none) | ✓ (#5aacff) | ✓ (#5aacff) | ✓ (#5aacff) | ✓ | ✓ | ✗ | ✗ |
| `thickness` / `stroke_width` | ✓ (0.015) | ✓ (0.015) | ✓ (0.015) | ✓ (0.015) | ✓ (0.04) | ✓ (0.04) | ✓ (0.04) | ✓ | ✓ | ✗ | ✗ |
| `solid` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `dotted` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `dashed` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `opacity` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `rotation` / `rot` | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✓ (0) | ✗ | ✓ (0) |
| `rotation ... about` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| **Line-specific** | | | | | | | | | | | |
| line endings (`->`, `<~>`, etc.) | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `straight` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `stepped` / `step` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `smooth` / `curve` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `nodraw` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `turn` (`cw`/`ccw`/angle) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (cw) | ✗ | ✗ | ✗ | ✗ |
| **Text** | | | | | | | | | | | |
| `align` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (c) | ✗ | ✗ | ✗ |
| `font` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `font_size` (as keyword: `14pt`, `large`, etc.) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (0.14) | ✗ | ✗ | ✗ |
| `maxwidth` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| `line_height` | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ (0) | ✗ | ✗ | ✗ |
| **Other** | | | | | | | | | | | |
| `fit` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `same` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `behind` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `.<class>` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |

**Notes:**

1. Label takes its text as a required first argument (`Label "text"`), not via a label attribute.
2. Lines use `from`/`to` for positioning, not `at`.
3. On polylines, `radius` sets corner rounding at waypoints (sets both `rx` and `ry`).
4. Oval auto-rounds: `rx`/`ry` default to half the smaller dimension (pill shape). Can be overridden.

### Label style classes

Labels have built-in style classes that set alignment, color, and font size:

| Class | Align | Font Size | Color (Dark theme) |
|-------|:-----:|:---------:|:------------------:|
| `.normal` | center | 0.14 | #ffffff |
| `.h1` | west | 0.63 | #ffc233 |
| `.h2` | west | 0.42 | #e8713a |
| `.h3` | west | 0.28 | #d4a020 |
| `.h4` | west | 0.21 | #6ab040 |
| `.p` | west | (inherited) | (inherited) |

### Box/Circle/Polyline color variants

Shapes have color variant classes that change the fill:

| Class | Fill (Dark theme) | Fill (Light theme) |
|-------|:-----------------:|:------------------:|
| `.normal` | #1a7a9a (cerulean) | #7cc8e0 (soft blue) |
| `.v1` | #7b2d8e (purple) | #c49ed8 (soft purple) |
| `.v2` | #2d6e2d (green) | #8ac08a (soft green) |
| `.v3` | #a84800 (orange) | #e8a070 (soft orange) |
| `.v4` | #0a6e68 (teal) | #7ac8c0 (soft teal) |



## Built-In Functions



# Part 3: Examples

Missing
