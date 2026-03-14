---
layout: base.njk
title: Reference
---

# picjs Language Reference

Complete specification of the picjs diagram language.

## Lexical Elements

### Comments

```
# Hash comment (to end of line)
// Double-slash comment (to end of line)
/* Block comment
   spanning multiple lines */
```

### Strings

Double-quoted strings with optional escape sequences:

```
"Hello, World!"
"Line with \"quotes\""
"Line with \\ backslash"
```

String interpolation with `${expr}`:

```
$x = 42
box "Value is ${$x}"
box "Width: ${last box.wid}"
```

### Numbers

```
42          # Integer
3.14159     # Float
0xff        # Hexadecimal
```

With units:

```
1in         # Inches (default unit)
2.54cm      # Centimeters
25.4mm      # Millimeters
72pt        # Points (1/72 inch)
144px       # Pixels (1/144 inch at default scale)
6pc         # Picas (1/6 inch)
```

### Identifiers

**Labels** (start with uppercase): `Start`, `NodeA`, `My_Label`

**Variables** (start with lowercase, `$`, or `@`): `width`, `$gap`, `@count`

### Ordinals

```
1st         # or "first"
2nd
3rd
4th, 5th, 6th...
```

---

## Grammar

### Statement List

A picjs script is a list of statements separated by newlines or semicolons:

```
statement
statement-list NEWLINE statement
statement-list ; statement
```

Line continuation with backslash:

```
box "This is a very long label" \
    color blue \
    fill lightblue
```

### Statement Types

```
object-definition           # Create a shape
LABEL: object-definition    # Create and name a shape
LABEL: place                # Name a position
direction                   # Set current direction
VARIABLE = expr             # Assignment
VARIABLE += expr            # Compound assignment (also -=, *=, /=)
define NAME { body }        # Macro definition
print expr                  # Debug output
assert ( expr == expr )     # Assertion
for VAR in [...] do { }     # List iteration
for VAR from N to M do { }  # Numeric iteration
```

### Object Definition

```
object-class attribute*
STRING text-attribute* attribute*
[ statement-list ] attribute*
```

---

## Object Classes

### Block Shapes

| Class | Description | Key Properties |
|-------|-------------|----------------|
| `box` | Rectangle | width, height, radius |
| `circle` | Circle | radius |
| `ellipse` | Ellipse | width, height |
| `oval` | Pill/stadium | width, height |
| `cylinder` | Database symbol | width, height, radius |
| `diamond` | Decision diamond | width, height |
| `file` | Document with fold | width, height, radius |
| `dot` | Small filled circle | radius |
| `text` | Text without border | (none) |

### Line Shapes

| Class | Description | Key Properties |
|-------|-------------|----------------|
| `line` | Straight line | (path attributes) |
| `arrow` | Line with arrowhead | (path attributes) |
| `spline` | Curved line | (path attributes) |
| `arc` | Circular arc | radius, cw/ccw |
| `move` | Invisible movement | (path attributes) |

---

## Attributes

### Path Attributes

Control line routing:

```
from position          # Starting point
to position            # Ending point
then to position       # Additional waypoint
go direction           # Continue in direction
go direction until even with position
heading compass-angle  # Absolute heading
close                  # Close path back to start
```

### Location Attributes

Control object placement:

```
at position                    # Place center at position
with edgename at position      # Place named point at position
with .edgename at position     # Same, dot notation
```

### Numeric Properties

```
width expr    / wid expr      # Width
height expr   / ht expr       # Height
radius expr   / rad expr      # Corner radius or circle radius
diameter expr                 # Diameter (= 2 * radius)
thickness expr                # Line thickness
```

Use `%` for relative values:

```
box width 150%    # 150% of default width
arrow right 200%  # 200% of default arrow length
```

### Style Attributes

```
dashed              # Dashed line (default dash)
dashed expr         # Dashed with specific length
dotted              # Dotted line
dotted expr         # Dotted with specific spacing
color color-expr    # Outline/text color
fill color-expr     # Fill color
thick               # Thicker line
thin                # Thinner line
solid               # Solid line (remove dashing)
invis / invisible   # Don't render
```

### Text Attributes

Position:
```
above       # Place text above center
below       # Place text below center
center      # Place text at center (default)
```

Alignment:
```
ljust       # Left-justify
rjust       # Right-justify
aligned     # Align with line direction
```

Style:
```
bold        # Bold text
italic      # Italic text
mono        # Monospace font
monospace   # Same as mono
big         # Larger text
small       # Smaller text
```

### Other Attributes

```
same                # Copy attributes from previous same-class object
same as object      # Copy attributes from specific object
fit                 # Size to fit text content
behind object       # Render behind specified object
chop                # Shorten line to not overlap endpoints
cw                  # Clockwise arc
ccw                 # Counter-clockwise arc
<-                  # Arrow at start
->                  # Arrow at end (default for arrow)
<->                 # Arrows at both ends
```

---

## Positions

### Absolute

```
expr , expr                    # X, Y coordinates
( expr , expr )                # Parenthesized
```

### Relative to Object

```
object                         # Center of object
object.edgename                # Named point on object
edgename of object             # Same, keyword form
ORDINAL vertex of object       # Vertex of polygon/path
```

### Computed

```
place + expr , expr            # Offset from place
place - expr , expr            # Offset from place
place + ( expr , expr )        # Offset (parenthesized)
( position , position )        # Point between two positions

expr of the way between position and position
expr way between position and position
expr between position and position
expr < position , position >   # Same, angle bracket form

distance direction of position
distance direction from position
```

---

## Edge Names (Compass Points)

```
     .n  .north  .t  .top
            |
.nw ---+----+----+--- .ne
       |    |    |
.w ----+---.c----+---- .e
.west  | .center |  .east
.left  |    |    | .right
.sw ---+----+----+--- .se
            |
    .s  .south  .bot  .bottom
```

Lines also have `.start` and `.end`.

---

## Directions

```
n / north           # Up
ne                  # Up and right
e / east            # Right
se                  # Down and right
s / south           # Down
sw                  # Down and left
w / west            # Left
nw                  # Up and left
```

For layout direction:
```
right               # Flow right (default)
down                # Flow down
left                # Flow left
up                  # Flow up
```

---

## Expressions

### Arithmetic

```
expr + expr         # Addition
expr - expr         # Subtraction
expr * expr         # Multiplication
expr / expr         # Division
- expr              # Negation
+ expr              # Identity
( expr )            # Grouping
```

### Functions

```
abs( expr )                    # Absolute value
cos( expr )                    # Cosine (degrees)
sin( expr )                    # Sine (degrees)
sqrt( expr )                   # Square root
int( expr )                    # Integer part
max( expr , expr )             # Maximum
min( expr , expr )             # Minimum
dist( position , position )    # Distance between points
```

### Object Properties

```
object.x            # X coordinate of center
object.y            # Y coordinate of center
object.wid          # Width
object.width        # Width
object.ht           # Height
object.height       # Height
object.rad          # Radius
object.radius       # Radius
object.diameter     # Diameter
object.thickness    # Line thickness
object.dashed       # Dash length (0 if solid)
object.dotted       # Dot spacing (0 if solid)
object.color        # Outline color
object.fill         # Fill color
```

---

## Object References

```
LABEL                          # By label name
object.LABEL                   # Nested label
last                           # Most recent object
last object-class              # Most recent of class
previous                       # Same as last
ORDINAL object-class           # Nth object of class
ORDINAL last object-class      # Nth from last
last []                        # Most recent sublist
ORDINAL []                     # Nth sublist
```

---

## Control Structures

### Macros

```
define macroname { body }
```

Use `$1`, `$2`, etc. for parameters:

```
define labeled_box { box $1 $2 fit }
labeled_box("Hello", color blue)
```

### For Loops

List iteration:
```
for VAR in [ item1, item2, item3 ] do {
  statements
}
```

Numeric range:
```
for VAR from start to end do {
  statements
}

for VAR from start to end step increment do {
  statements
}
```

---

## Built-in Variables

### Shape Defaults

| Variable | Default | Description |
|----------|---------|-------------|
| `arcrad` | 0.25 | Arc radius |
| `arrowhead` | 2.0 | Arrowhead scale |
| `arrowht` | 0.08 | Arrowhead height |
| `arrowwid` | 0.035 | Arrowhead width |
| `boxht` | 0.5 | Box height |
| `boxrad` | 0 | Box corner radius |
| `boxwid` | 0.75 | Box width |
| `charht` | 0.14 | Character height |
| `charwid` | 0.08 | Character width |
| `circlerad` | 0.25 | Circle radius |
| `color` | 0 (black) | Default outline color |
| `cylht` | 0.5 | Cylinder height |
| `cylrad` | 0.075 | Cylinder cap radius |
| `cylwid` | 0.75 | Cylinder width |
| `dashwid` | 0.05 | Dash length |
| `diamondht` | 0.5 | Diamond height |
| `diamondwid` | 0.75 | Diamond width |
| `dotrad` | 0.015 | Dot radius |
| `ellipseht` | 0.5 | Ellipse height |
| `ellipsewid` | 0.75 | Ellipse width |
| `fileht` | 0.75 | File height |
| `filerad` | 0.15 | File corner fold |
| `filewid` | 0.5 | File width |
| `fill` | -1 (none) | Default fill color |
| `lineht` | 0.5 | Line height (vertical) |
| `linewid` | 0.5 | Line width (horizontal) |
| `movewid` | 0.5 | Move distance |
| `ovalht` | 0.5 | Oval height |
| `ovalwid` | 1.0 | Oval width |
| `scale` | 1.0 | Global scale factor |
| `textht` | 0.5 | Text block height |
| `textwid` | 0.75 | Text block width |
| `thickness` | 0.015 | Default line thickness |

---

## Color Names

picjs supports all 148 standard HTML/CSS color names. Examples:

**Basic colors**: `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, `black`, `white`, `gray`/`grey`

**Extended colors**: `coral`, `crimson`, `darkblue`, `darkgreen`, `gold`, `indigo`, `ivory`, `khaki`, `lavender`, `lime`, `maroon`, `navy`, `olive`, `orange`, `orchid`, `peru`, `pink`, `plum`, `purple`, `salmon`, `sienna`, `silver`, `tan`, `teal`, `tomato`, `turquoise`, `violet`, `wheat`

**Special values**: `None`, `Off` (no color / transparent)

Color names are case-insensitive.

---

## Units

| Unit | Meaning | Conversion |
|------|---------|------------|
| `in` | Inches | 1in = 1 (base unit) |
| `cm` | Centimeters | 1cm = 0.3937in |
| `mm` | Millimeters | 1mm = 0.03937in |
| `pt` | Points | 72pt = 1in |
| `px` | Pixels | 144px = 1in (at default scale) |
| `pc` | Picas | 6pc = 1in |

---

## SVG Output

picjs renders to SVG at 144 pixels per inch by default (controlled by internal `rScale`).

Coordinate transformation:
- X increases to the right
- Y increases upward (flipped for SVG output)
- Origin is bottom-left of the bounding box

The output SVG includes:
- `width` and `height` attributes
- `viewBox` for scaling
- Inline styles (no external CSS required)
