---
layout: base.njk
title: Guide
---


# picjs Guide

This guide takes you from first diagram to advanced features. Each section builds on the previous.

## Getting Started

### Browser Setup

Add picjs to your HTML page. Once published to npm:

```html
<script src="https://cdn.jsdelivr.net/npm/picjs@0.1.1/dist/picjs.umd.js"></script>
```

Or self-host by copying `picjs.umd.js` from the dist folder.

### Automatic Code Block Processing

picjs can automatically find and render diagram code blocks, similar to Mermaid:

```html
<pre><code class="language-picjs">
box "Hello"
arrow
box "World"
</code></pre>

<script>
  // Process all picjs code blocks on page load
  picjs.processCodeBlocks();
</script>
```

The selector defaults to `code.picjs, pre > code.language-picjs`. Pass a custom selector if needed:

```javascript
picjs.processCodeBlocks('pre.diagram > code');
```

### Direct API

For programmatic use:

```javascript
const result = picjs.picjs('box "Hello"; arrow; box "World"');

console.log(result.svg);      // SVG markup string
console.log(result.width);    // Width in pixels
console.log(result.height);   // Height in pixels
console.log(result.isError);  // true if parsing failed
```

Options:

```javascript
picjs.picjs(source, {
  cssClass: 'my-diagram',    // Add CSS class to SVG element
  darkMode: true,            // Invert colors for dark backgrounds
  plaintextErrors: true      // Return errors as plain text, not HTML
});
```

---

## Tutorial

### 1. Hello World

The simplest diagram:

```picjs example
box "Hello, World!"
```

This creates a single box with text centered inside.

### 2. Multiple Objects

Chain objects with semicolons or newlines:

```picjs example
box "Hello,"
box "World!"
```

By default, objects flow to the right. Each new object appears to the right of the previous one.

### 3. Shapes

picjs provides these shape primitives:

**Block shapes** (have width, height, can contain text):
- `box` — Rectangle
- `circle` — Circle
- `ellipse` — Ellipse (wider than tall by default)
- `oval` — Pill shape (rounded ends)
- `cylinder` — Database symbol
- `diamond` — Decision diamond
- `file` — Document with folded corner

```picjs
define show { [ down; $1 $2; $3 ]; move right 50% }
show(box, "a box", "box \"a box\"")
show(circle, "a circle", "circle \"a circle\"")
show(ellipse, "a ellipse", "ellipse \"a ellipse\"")
show(oval, "a oval", "oval \"a oval\"")
show(cylinder, "a cylinder", "cylinder \"a cylinder\"")
show(diamond, "a diamond", "diamond \"a diamond\"")
show(file, "a file", "file \"a file\"")
```

**Line shapes** (connect points):
- `line` — Plain line
- `arrow` — Line with arrowhead
- `spline` — Curved line through points
- `arc` — Circular arc

``` picjs example
S: box wid 2 ht 2 invis
line from S.nw to S.ne
spline color red from S.ne to \
       S.ne+(.5,-.5) to \
       S.se - (.5,-.5) to \
       S.se
arrow color green from S.se to S.sw
arc color blue from S.sw to S.nw
line dotted from S.n to S.s color pink
line thin dashed from S.sw to S.ne
```
**Other**:
- `dot` — Small filled circle (for marking points)
- `move` — Invisible spacer
- `text` — Text without a surrounding shape


### 4. Connecting with Lines

Use `arrow` and `line` to connect shapes:

```picjs
box "A"
arrow
box "B"
arrow
box "C"
```

Arrow variants:
- `arrow` or `->` — Arrow pointing in travel direction
- `<-` — Arrow pointing backward
- `<->` — Arrows on both ends
- `line` — No arrowheads

### 5. Direction

The default direction is `right`. Change it with direction statements:

```picjs example
right
box "A"
arrow
box "B"
down
arrow
box "C"
left
arrow
box "D"
up
arrow
```

Directions: `right`, `down`, `left`, `up`

### 6. Positioning

#### Relative positioning with compass points

Every object has named points:

``` picjs example
S: box wid 1.4 ht 1.4 fill 0xf0f0f0 color lightgrey thin

dot at S.s color green
text ".s  .south"  ".bot  .bottom" with .n at last dot.s

dot at S.c  same
text ".c  .center"  with .t at last dot.s

dot at S.n same
text ".n  .north" ".t  .top" with .s at last dot.n

dot at S.ne same
text ".ne" with .sw at last dot.ne

dot at S.e same
text ".e" ".east" ".right" with .w at last dot.e

dot at S.se same
text ".se" with .nw at last dot.se

dot at S.sw same
text ".sw" with .ne at last dot.sw

dot at S.w same
text ".w" ".west" ".left" with .e at last dot.w

dot at S.nw same
text ".nw" with .se at last dot.nw
```

Lines also have `.start` and `.end`.

Reference these points to connect objects precisely:

```picjs example
A: box "A"
B: box "B" at 1 right of A
arrow from A.e to B.w
```

#### Absolute positioning

Use `at` with coordinates:

```picjs example
box "Origin" at 0,0
box "Right" at 1,0
box "Up" at 0,1
```

#### Relative to other objects

```picjs example
A: box "A"
box "B" at 1 right of A
box "C" at 0.5 below A
box "D" at 1 ne of A
```

### 7. Labels

Give objects names (labels) for later reference:

```picjs example
Start: box "Start"
arrow
Process: box "Process"
arrow from Process.s down
End: box "End"
arrow from Start.s to End.w
```

Labels must start with an uppercase letter.

### 8. Sizing

Set dimensions with `width`/`wid`, `height`/`ht`, `radius`/`rad`:

```picjs example
box "Wide" width 2
box "Tall" height 1.5
box "Rounded" rad 0.2
circle "Big" radius 0.5
```

Use percentages to scale relative to defaults:

```picjs example
box "150% wide" width 150%
arrow right 200%
box "Normal"
```

The `fit` keyword sizes a shape to fit its text:

```picjs example
box "Short" fit
box "A much longer label" fit
```

### 9. Colors and Styling

#### Colors

```picjs example
box "Red outline" color red
box "Blue fill" fill blue
box "Both" color white fill darkgreen
```

148 named colors are supported (HTML/CSS color names).

#### Line styles

```picjs example
line "solid" right
line "dashed" dashed right
line "dotted" dotted right
box dashed
box dotted
```

#### Thickness

```picjs example
line thick right 1
line thin right 1
line thickness 0.05 right 1
```

### 10. Text Formatting

#### Position

```picjs example
box "above" above "center" "below" below
```

#### Alignment

```picjs example
box "left" ljust "center" "right" rjust fit
```

#### Style

```picjs example
box "bold" bold
box "italic" italic
box "mono" mono
box "big" big
box "small" small
```

Combine them:

```picjs example
box "Bold Italic" bold italic fit
```

---

## Advanced Topics

### How picjs Works

picjs is a single-pass layout engine:

1. **Parse** statements left to right
2. **Build** objects with default positions
3. **Resolve** constraints (at, from, to, with)
4. **Render** to SVG

The key insight: each object's position is determined by constraints relative to previous objects. This is why order matters.

### The Position Model

**Current position**: picjs tracks a "current position" that advances as objects are created.

**Default placement**: New objects appear at the current position, offset in the current direction.

**Explicit placement**: Use `at` to override default placement.

**Connection points**: `from` and `to` connect lines to specific points on objects.

### Sublists (Grouping)

Group objects with `[ ... ]`:

```picjs example
[
  box "A"
  arrow
  box "B"
]
arrow
[
  down
  box "C"
  box "D"
]
```

A sublist acts as a single object with its own bounding box. Use it to:
- Create composite shapes
- Position groups relative to each other
- Isolate local coordinate systems

### Variables

Store values in variables (lowercase names or starting with `$` or `@`):

```picjs example
$gap = 0.5
box "A"
move right $gap
box "B"
move right $gap
box "C"
```

Assignment operators: `=`, `+=`, `-=`, `*=`, `/=`

Built-in variables control defaults:

```picjs example
boxwid = 1.5
boxht = 0.75
box "Wider and shorter"
```

### String Interpolation

Embed expressions in strings with `${...}`:

```picjs example
$n = 42
box "Value: ${$n}"

A: box "A"
box "Width: ${A.wid}"
```

### Macros

Define reusable patterns:

```picjs example
define roundbox { box rad 0.15 $1 }

roundbox("First")
arrow
roundbox("Second")
arrow
roundbox("Third")
```

The `$1`, `$2`, etc. are positional parameters.

### For Loops


```picjs example
for i from 1 to 3 do {
  box "Box ${i}"
  arrow
}
```

With step:

```picjs example
for i from 5 to 10 step 2 do {
  box "${i}"
  move
}
```

### Chop

The `chop` keyword shortens lines so they don't overlap shapes:

```picjs example
A: circle "A"
B: circle "B" at 2 right of A
arrow from A to B chop
```

Without `chop`, the arrow would extend into the circles.

### The `same` Keyword

Copy attributes from a previous object:

```picjs example
box "Template" color blue fill lightblue rad 0.1 fit
box "Copy 1" same
box "Copy 2" same
```

Or reference a specific object:

```picjs example
A: box "A" color red
B: box "B" color blue
box "Like A" same as A
```

### Invisible Objects

Use `invis` or `invisible` to create spacing without visible output:

```picjs example
box "Visible"
box invis
box "Also visible"
```

Useful for alignment and layout control.

---

## Tips

1. **Start simple**: Get basic layout working before adding styling
2. **Use labels**: Name important objects for easier reference
3. **Use fit**: Let picjs size boxes to fit text
4. **Use variables**: Store repeated values
5. **Use sublists**: Group related objects
6. **Test incrementally**: Add one thing at a time

---

## Next Steps

- **[Reference](/Reference/)**: Complete language specification
- **[Playground](/)**: Experiment interactively
