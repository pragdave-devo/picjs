---
name: picjs
description: Write picjs diagrams — shapes, positioning, colors, labels, lines, groups, functions, and lists
---

# Writing picjs Diagrams

picjs is a language for creating SVG diagrams. Shapes follow each other
automatically (like a turtle); you only specify positions when you need to
override the default flow.

## Shapes

Capitalized names create shapes. Lowercase aliases exist for common ones.

```
Box "Hello"                    // box with label
Circle rad .3 fill ~red        // circle, radius 0.3, named color
Ellipse rx .6 ry .3            // ellipse with explicit radii
Oval 200x80                    // pill-shaped (auto-rounded box)
Arc from a.e to b.w            // circular arc between points
Label "Title" .h1              // standalone text
```

### Shape classes

Append `.className` to set a style class. Classes can set defaults:

```
Box.highlight.fill = ~b3       // set default fill for .highlight boxes
box "A" .highlight             // uses that fill
```

Built-in label classes: `.h1`, `.h2`, `.h3`, `.h4`, `.p` (set size, alignment, color).
Built-in shape color variants: `.normal`, `.v1`, `.v2`, `.v3`, `.v4`.

## Positioning

Shapes flow in the current **Face** direction (default: east).

```
Face s                         // now shapes flow southward
Face 45                        // flow at 45 degrees
```

### Explicit positioning

```
Box at (100, 200)              // absolute position
Box at prev.e + (0.5, 0)      // relative to previous shape
```

### Cardinal points

Every shape has `.n`, `.s`, `.e`, `.w`, `.ne`, `.nw`, `.se`, `.sw`, `.c`:

```
a = Box "A"
b = Box "B" at a.e + (1, 0)   // 1 unit right of A's east edge
```

### Constraints

Pin a shape's cardinal point to a position:

```
Box "X" with .nw at someBox.se
```

### Layout helpers

```
Gap                            // invisible spacer (default length)
Gap 0.5                        // explicit gap
Gap same                       // repeat last gap
Goto (100, 200)                // move cursor without drawing
Goto a.se                      // move cursor to a point
Skip to (x, y)                 // invisible line to position
```

## Lines

Lines connect points. The line ending syntax doubles as a shape constructor:

```
a = Box "A"
b = Box "B"

Line from a.e to b.w                // plain line
Line -> from a.e to b.w             // arrow at end
<-> from a.e to b.w                 // arrows both ends (Line is implied)
a -> b                              // shorthand: box -> creates a line to next box
```

### Line endings

Start markers: `<`, `o`, `|`. End markers: `>`, `o`, `|`.
Path style: `-` (straight), `~` (smooth).

```
<-> from a to b                // arrows both ends, straight
o~> from a to b                // circle start, arrow end, smooth
|-> from a to b                // bar start, arrow end
```

### Polylines (multi-segment)

```
line from a.s then to b.w then to c.n    // waypoints
line from a.s south 1 then east until even with b then to b.n  // directional
line from a to b then to c close          // closed polygon
line from a to b then to c rx 0.1         // rounded corners
```

### Line path styles

```
Line from a to b straight      // default: straight segments
Line from a to b smooth        // bezier curves
Line from a to b stepped       // right-angle steps
```

### Line labels

```
Line -> from a to b "label"              // centered label
Line -> from a to b "label" above        // above the line
Line -> from a to b "label" at 25% below // at 25% along, below
```

## Arcs

```
Arc from a.e to b.w                // clockwise arc (default)
Arc from a.e to b.w ccw           // counter-clockwise
Arc from a.e to b.w turn ccw     // same as above
```

## Size

```
Box wid 2 ht 1.5                  // explicit width and height
Box 200x100                       // WxH shorthand
Circle rad 0.5                    // radius
Box fit "Long text here"          // auto-size to fit content
```

## Colors

```
// Named colors (tilde prefix)
Box fill ~red stroke ~blue

// Hex
Box fill #3a7 stroke #ff8800

// Color models
Box fill rgb(100, 200, 150)
Box fill oklch(70%, 0.15, 200)
Box fill hsl(200, 80%, 50%)

// Palette colors (WCAG contrast-safe pairs)
Palette.current = "ocean"          // switch palette
Box fill ~b1                       // background color 1
Box fill ~f1                       // foreground color 1 (contrasts with b1)

// Color operations
~red.lighten(20%)
~blue.darken(10%)
~red.spin(120)                     // rotate hue by 120 degrees
```

## Labels and text

Shapes accept string labels directly:

```
Box "Hello"                        // simple label
Box "Line 1" "Line 2"             // multi-line
```

Rich labels with inline styling:

```
Box ("Important" fill ~red 18pt)
Box ("Bold text" bold 14pt italic "Helvetica")
```

Label is a standalone text shape:

```
Label "Title" .h1
Label "Body text" .p align .w     // left-aligned
```

## Appearance

```
Box fill ~b1 stroke ~f1 thick 0.03
Box dashed                         // dashed outline
Box dotted                         // dotted outline
Box opacity 0.5                    // semi-transparent
Box rotation 45                    // rotated 45 degrees
Box rotation 45 about (0, 0)      // rotated about a point
```

## Groups

Groups collect shapes into a single positionable unit:

```
g = Group {
  Face s
  self.top = Box "A"
  Box "B"
  Box "C"
} with .nw at (0, 0)
```

`Aside` is like Group but doesn't affect the layout cursor:

```
Aside {
  circle rad .15 at somePoint fill ~green
}
```

Use `self.name = shape` inside a group to name sub-elements, then
reference them via `g.top.n` etc.

## Variables and expressions

```
x = 42
name = "hello"
pos = (100, 200)                   // position literal

// Arithmetic: + - * / % ^
// Comparison: == != < > <= >=
// Logical: && || !
// String interpolation: "value is #{x + 1}"
```

## Functions

```
// Arrow function syntax
double = (x) => x * 2
greet = (name) => "Hello #{name}"

// Multi-line body
drawWidget = (label, pos) => {
  b = Box label at pos fill ~b2
  Circle rad .1 at b.ne
  b   // implicit return (last expression)
}

// No-arg functions
doStuff = => { Box "A"; Box "B" }
```

## Lists and ranges

```
items = [1, 2, 3]                  // list literal
nums = [1..10]                     // integer range
letters = ["A".."Z"]              // string range

// Access
items[0]                           // 1
items[-1]                          // 3 (negative indexing)
items.length                       // 3

// Methods
items.push(4)                      // append
items.pop()                        // remove and return last
items.map(fn)                      // transform each element
items.each(fn)                     // iterate (no return value)
items.filter(fn)                   // keep matching elements
items.sort(fn)                     // sort with comparator

// Iteration
5.times(n => { ... })              // n goes 0..4
[1..5].each(n => { ... })         // n goes 1..5

// Vector operations
[1, 2] + [3, 4]                   // [4, 6]
[1, 2] * 3                        // [3, 6]
```

## Control flow

```
if (x > 0) { Box "positive" }
else { Box "non-positive" }

// Single expression (no braces needed)
if (x > 0) Box "yes"
```

## Shape defaults

Set defaults for all subsequent shapes of a type:

```
Box.fill = ~b2                     // all boxes get this fill
Box.highlight.fill = ~b3           // only .highlight boxes
Circle.radius = 0.3               // default circle radius
Line.stroke = ~f4                  // default line color
Label.font_size = 0.2             // default label size
```

## Inspect (debugging)

```
??x                                // prints value of x
??someBox                          // prints shape details
```

## Common patterns

### Flow chart
```
Palette.current = "ocean"
a = box "Start" -> box "Process" fill ~b2 -> box "End"
```

### Architecture diagram
```
svc = Group {
  Face s
  Label "Service" .h3
  Gap .2
  self.api = Box "API"
  -> Box "Logic" -> Box "DB"
}
```

### Connecting groups
```
Line -> from groupA.api.e to groupB.handler.w
```

### Reusable component
```
drawServer = (name, pos) => {
  Group {
    Face s
    Label name .h4
    Gap .1
    Box "App" -> Box "DB"
  } with .nw at pos
}
```
