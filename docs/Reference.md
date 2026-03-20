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

### Booleans

```
yes         # True
no          # False
```

### Identifiers

**Labels** (start with uppercase): `Start`, `NodeA`, `My_Label`

**Variables** (start with lowercase, `$`, or `@`): `width`, `$gap`, `@count`

**Rich variables** (`$`-prefixed): Store strings, lists, functions, booleans, colors
```
$name = "Alice"
$items = [1, 2, 3]
$color = Red                   # color names resolve to integers
$double = fn($x) { $result = $x * 2 }
```

Color names resolve to their integer RGB value, so they can be stored and passed as parameters:
```
$c = LightBlue
box fill $c

$make = fn($col) { box fill $col }
$make(Red)
```

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
case expr { arms }          # Pattern matching
if expr { } [else { }]      # Conditional
$func(args)                 # Function call
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

### Containing Attribute

Set shape text from an expression:

```
$label = "Hello World"
box containing $label
box con $label           # Short form
box con 42               # Numbers converted to string
```

Useful in functions:
```
$make_box = fn($text) {
  box containing $text fill LightYellow
}
$make_box("Dynamic!")
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
expr + expr         # Addition (also list/string concatenation)
expr - expr         # Subtraction
expr * expr         # Multiplication
expr / expr         # Division
- expr              # Negation
+ expr              # Identity
( expr )            # Grouping
```

### Comparison Operators

```
expr == expr        # Equal
expr != expr        # Not equal
expr > expr         # Greater than
expr < expr         # Less than
expr >= expr        # Greater than or equal
expr <= expr        # Less than or equal
```

Returns `yes` (true) or `no` (false).

### Logical Operators

```
expr and expr       # Logical AND
expr or expr        # Logical OR
not expr            # Logical NOT
```

### Operator Precedence

From lowest to highest:
1. `or`
2. `and`
3. `not`
4. `==`, `!=`, `>`, `<`, `>=`, `<=`
5. `+`, `-`
6. `*`, `/`
7. Unary `-`, `+`

### Functions

**Math:**
```
abs( expr )                    # Absolute value
cos( expr )                    # Cosine (radians)
sin( expr )                    # Sine (radians)
sqrt( expr )                   # Square root
int( expr )                    # Integer part
max( expr , expr )             # Maximum
min( expr , expr )             # Minimum
dist( position , position )    # Distance between points
```

**Angle conversion:**
```
d2r( degrees )                 # Degrees to radians
r2d( radians )                 # Radians to degrees
```

**Color:**
```
rgb( r, g, b )                 # RGB color (0-255 per channel)
hsl( h, s, l )                 # HSL color (h: 0-360, s/l: 0-100 or 0-1)
oklch( l, c, h )               # OKLCH color (l: 0-100 or 0-1, c: 0-0.4, h: 0-360)
```

**List operations** (all return new values, never mutate):
```
len( list )                    # Length of list or string
head( list )                   # First element
last( list )                   # Last element
push( list, value )            # Append element, return new list
pop( list )                    # Remove last, return new list
shift( list )                  # Remove first, return new list
unshift( list, value )         # Prepend element, return new list
reverse( list )                # Reverse list or string
contains( list, value )        # Test membership (returns yes/no)
```

**String/list conversion:**
```
join( list, separator )        # Join list elements with separator
split( string, separator )     # Split string into list
```

**Higher-order functions:**
```
map( list, function )          # Apply function to each element
filter( list, function )       # Keep elements where function returns truthy
sort( list )                   # Return sorted list
```

Example:
```
$double = fn($x) { $result = $x * 2 }
$doubled = map([1, 2, 3], $double)  # [2, 4, 6]

$even = fn($x) { $result = ($x / 2) == int($x / 2) }
$evens = filter([1, 2, 3, 4], $even)  # [2, 4]

$sorted = sort([3, 1, 2])  # [1, 2, 3]
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

## Data Types

### Lists

**List literals:**
```
$colors = ["red", "blue", "green"]
$nums = [1, 2, 3, 4, 5]
$mixed = [1, "hello", yes]
$empty = []
```

**List indexing** (0-based):
```
$first = $colors[0]      # "red"
$second = $nums[1]       # 2
```

**Range expressions:**
```
[1..5]              # [1, 2, 3, 4, 5]
[5..1]              # [5, 4, 3, 2, 1] (descending)
["A".."E"]          # ["A", "B", "C", "D", "E"]
["X1".."X5"]        # ["X1", "X2", "X3", "X4", "X5"]
```

**Concatenation:**
```
$a = [1, 2] + [3, 4]        # [1, 2, 3, 4]
$s = "hello" + "_world"     # "hello_world"
```

### Functions

**Definition:**
```
$greet = fn($name) {
  box containing $name
}
```

**Calling:**
```
$greet("Hello")              # Statement level
$result = $double(5)         # Expression level
```

**Functions producing shapes:**
```
$labeled_box = fn($label, $col) {
  box containing $label fill $col
}
$labeled_box("Title", LightBlue)
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

**List iteration:**
```
for VAR in [ item1, item2, item3 ] do {
  statements
}
```

**With range:**
```
for i in [1..5] do {
  box containing i
}

for $ch in ["A".."C"] do {
  box containing $ch
}
```

**Numeric range:**
```
for VAR from start to end do {
  statements
}

for VAR from start to end step increment do {
  statements
}
```

### Case Expressions

**Pattern matching:**
```
case $value {
  1 => { box "one" }
  2 => { box "two" }
  3 => { box "three" }
}
```

**String matching:**
```
case $color {
  "red" => { box fill Red }
  "blue" => { box fill Blue }
  "green" => { box fill Green }
}
```

**Default arm with `_` or `else`:**
```
case $value {
  1 => { box "one" }
  2 => { box "two" }
  _ => { box "other" }
}

case $value {
  1 => { box "one" }
  else => { box "default" }
}
```

### If/Else Statements

**Basic if:**
```
if $x > 3 { box "big" }
```

**If with else:**
```
if $flag {
  box "yes"
} else {
  box "no"
}
```

**With boolean expressions:**
```
$flag = yes
if $flag { box "on" }

$enabled = $count > 0 and $ready
if $enabled { circle fill Green }
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
last block                     # Same (alias)
ORDINAL []                     # Nth sublist
ORDINAL block                  # Same (alias)
```

The `block` keyword is an alias for `[]` when referencing sublists:
```
[ box "A"; box "B" ]
arrow from last block.e        # Same as: last [].e
box at 1st block.ne            # Same as: 1st [].ne
```

---

## Built-in Variables

### Mathematical Constants

| Variable | Value | Description |
|----------|-------|-------------|
| `$pi` | 3.14159... | Pi |
| `$2pi` | 6.28318... | 2 * Pi (full circle in radians) |

Example:
```
for angle from 0 to $2pi step 0.1 do {
    dot at (cos(angle), sin(angle))
}
```

### Shape Defaults

| Variable | Default | Description |
|----------|---------|-------------|
| `arcrad` | 0.25 | Arc radius |
| `arrowhead` | 2.0 | Arrowhead scale |
| `arrowht` | 0.08 | Arrowhead height |
| `arrowwid` | 0.06 | Arrowhead width |
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
| `diamondht` | 0.75 | Diamond height |
| `diamondwid` | 1.0 | Diamond width |
| `dotrad` | 0.015 | Dot radius |
| `ellipseht` | 0.5 | Ellipse height |
| `ellipsewid` | 0.75 | Ellipse width |
| `fileht` | 0.75 | File height |
| `filerad` | 0.15 | File corner fold |
| `filewid` | 0.5 | File width |
| `fill` | -1 (none) | Default fill color |
| `fontscale` | 1.0 | Global font scale (1.5 = 150%) |
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

## Colors

### Color Names

picjs supports all 148 standard HTML/CSS color names. Examples:

**Basic colors**: `red`, `green`, `blue`, `yellow`, `cyan`, `magenta`, `black`, `white`, `gray`/`grey`

**Extended colors**: `coral`, `crimson`, `darkblue`, `darkgreen`, `gold`, `indigo`, `ivory`, `khaki`, `lavender`, `lime`, `maroon`, `navy`, `olive`, `orange`, `orchid`, `peru`, `pink`, `plum`, `purple`, `salmon`, `sienna`, `silver`, `tan`, `teal`, `tomato`, `turquoise`, `violet`, `wheat`

**Special values**: `None`, `Off` (no color / transparent)

Color names are case-insensitive.

### Hex Literals

Use `0xRRGGBB` format for exact colors:

```
box color 0xff0000              # Red
box fill 0x00ff00               # Green
box color 0x336699              # Steel blue
```

### Color Functions

See [Functions](#functions) for `rgb()`, `hsl()`, and `oklch()` color functions.

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

---

## Appendix: EBNF Grammar

### Document Structure

```ebnf
document        = statement_list ;

statement_list  = [ statement ] { NEWLINE statement } ;

statement       = direction_stmt
                | assignment_stmt
                | label_stmt
                | print_stmt
                | assert_stmt
                | define_stmt
                | for_stmt
                | case_stmt
                | if_stmt
                | fncall_stmt
                | shape_stmt
                ;
```

### Statements

```ebnf
direction_stmt  = direction ;

direction       = "right" | "down" | "left" | "up" ;

assignment_stmt = lvalue assign_op rvalue_expr ;

lvalue          = IDENTIFIER
                | "$" IDENTIFIER
                | "fill" | "color" | "thickness"
                ;

assign_op       = "=" | "+=" | "-=" | "*=" | "/=" ;

label_stmt      = PLACENAME ":" ( shape_stmt | position ) ;

print_stmt      = "print" print_item { "," print_item } ;

define_stmt     = "define" IDENTIFIER codeblock ;

for_stmt        = "for" IDENTIFIER for_variant ;

for_variant     = "from" expr "to" expr [ "step" expr ] "do" codeblock
                | "in" expr "do" codeblock
                ;

case_stmt       = "case" expr "{" { case_arm } "}" ;

case_arm        = pattern "=>" codeblock ;

pattern         = expr
                | "_"
                | "else"
                ;

if_stmt         = "if" expr codeblock [ "else" codeblock ] ;

fncall_stmt     = "$" IDENTIFIER "(" [ expr { "," expr } ] ")" ;

shape_stmt      = basetype [ rel_expr ] { attribute } ;

basetype        = CLASSNAME
                | STRING [ text_position ]
                | "[" statement_list "]"
                ;
```

### Expressions

```ebnf
expr            = or_expr ;

or_expr         = and_expr { "or" and_expr } ;

and_expr        = not_expr { "and" not_expr } ;

not_expr        = "not" not_expr
                | compare_expr
                ;

compare_expr    = add_expr [ compare_op add_expr ] ;

compare_op      = "==" | "!=" | ">=" | "<="
                | ">" | "<"
                ;

add_expr        = mul_expr { ( "+" | "-" ) mul_expr } ;

mul_expr        = unary_expr { ( "*" | "/" ) unary_expr } ;

unary_expr      = ( "-" | "+" ) unary_expr
                | primary
                ;

primary         = NUMBER
                | STRING
                | "yes" | "no"
                | IDENTIFIER
                | "$" IDENTIFIER "(" [ expr { "," expr } ] ")"
                | "fn" "(" [ param_list ] ")" codeblock
                | builtin_func "(" expr { "," expr } ")"
                | "[" [ expr { "," expr } ] "]"
                | "[" expr ".." expr "]"
                | "(" expr ")"
                | object "." property_name
                ;

param_list      = IDENTIFIER { "," IDENTIFIER } ;

builtin_func    = "abs" | "cos" | "sin" | "sqrt" | "int" | "d2r" | "r2d"
                | "max" | "min" | "dist"
                | "rgb" | "hsl" | "oklch"
                | "len" | "head" | "last" | "push" | "pop"
                | "shift" | "unshift" | "reverse" | "contains"
                | "join" | "split" | "map" | "filter" | "sort"
                ;
```

### Positions

```ebnf
position        = "(" position "," position ")"
                | "(" position ")"
                | expr "," expr
                | expr dist_direction position
                | expr between_syntax position "and" position
                | expr "<" position "," position ">"
                | place_position
                ;

dist_direction  = "above" | "below"
                | "left" [ "of" ]
                | "right" [ "of" ]
                ;

between_syntax  = "between"
                | "way" "between"
                | "of" [ "the" ] [ "way" ] "between"
                ;

place           = edge "of" object
                | NTH "vertex" [ "of" ] object
                | object [ "." edge ]
                ;

edge            = "center" | "top" | "bottom"
                | "start" | "end"
                | "left" | "right"
                | EDGEPT
                ;

object          = "this"
                | PLACENAME { "." PLACENAME }
                | nth_object
                ;
```

### Attributes

```ebnf
attribute       = numeric_attr
                | dash_attr
                | color_attr
                | direction_attr
                | position_attr
                | with_attr
                | same_attr
                | text_attr
                | containing_attr
                | bool_attr
                | flag_attr
                | fit_attr
                | behind_attr
                ;

numeric_attr    = numeric_prop rel_expr ;

numeric_prop    = "height" | "ht" | "width" | "wid"
                | "radius" | "rad" | "diameter" | "thickness"
                ;

dash_attr       = ( "dashed" | "dotted" ) [ expr ] ;

color_attr      = ( "fill" | "color" ) rvalue_expr ;

containing_attr = ( "containing" | "con" ) expr [ text_position ] ;

bool_attr       = "cw" | "ccw"
                | "<-" | "->" | "<->"
                | "invis" | "thick" | "thin" | "solid"
                ;
```

### Lexical Elements

```ebnf
NEWLINE         = '\n' | ';' ;

IDENTIFIER      = ( letter | '_' ) { letter | digit | '_' } ;

PLACENAME       = upper_letter { letter | digit | '_' } ;

CLASSNAME       = "box" | "circle" | "ellipse" | "oval" | "cylinder"
                | "diamond" | "file" | "dot" | "text"
                | "line" | "arrow" | "spline" | "arc" | "move"
                | "block"                              (* alias for [] *)
                ;

NTH             = integer ( "st" | "nd" | "rd" | "th" )
                | "first"
                ;

NUMBER          = integer | float | hex_number ;

STRING          = '"' { char | "${" expr "}" } '"' ;

EDGEPT          = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw" | "c"
                | "north" | "east" | "south" | "west" | "bot"
                ;
```
