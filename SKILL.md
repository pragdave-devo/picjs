# picjs Diagram Creation Skill

picjs is a text-based diagram language for creating flowcharts, architecture diagrams, and technical illustrations. It uses relative positioning—objects are placed relative to previous objects using directional commands.

## Core Concepts

### 1. Objects Flow in a Direction

The default direction is `right`. Each new object appears next to the previous one:

```picjs
box "A"
box "B"
box "C"
```

Change direction with `right`, `down`, `left`, `up`:

```picjs
down
box "A"
box "B"
box "C"
```

### 2. Connect with Arrows and Lines

```picjs
box "Start"
arrow
box "End"
```

Arrow variants:
- `arrow` or `->` — arrow pointing forward
- `<-` — arrow pointing backward
- `<->` — arrows both ends
- `line` — no arrowheads

### 3. Label Objects for Reference

Labels start with uppercase. Reference objects by label or by text content:

```picjs
Start: box "Start"
arrow
Process: box "Process"
arrow from Process.s down
box "End"
arrow from Start.e to last box.w
```

### 4. Compass Points

Every object has named points:

```
        .n / .top / .north
             |
.nw ----+----+----+---- .ne
        |    |    |
.w -----+---.c----+----- .e
.west   | .center |   .east
        |    |    |
.sw ----+----+----+---- .se
             |
        .s / .bot / .south
```

Lines also have `.start` and `.end`.

## Common Patterns

### Flowchart

```picjs
down
box "Start" rad 10px fit
arrow
box "Process 1" fit
arrow
diamond "Decision?" fit
arrow "Yes" below
box "Process 2" fit
arrow
box "End" rad 10px fit

arrow from 4th last box.e right then down then to last box.s "No" above
```

### Architecture Diagram

```picjs
Client: box "Client" fit
arrow right 150%
LB: box "Load Balancer" fit
arrow right 150%
down
Server1: box "Server 1" fit
move down 50%
Server2: box "Server 2" fit

arrow from LB.e to Server1.w
arrow from LB.e to Server2.w
```

### Sequence-like Flow

```picjs
right
A: box "Service A" fit
move right 100%
B: box "Service B" fit
move right 100%
C: box "Service C" fit

arrow from A.e to B.w "request" above
arrow from B.e to C.w "query" above
arrow from C.w to B.e "response" below
arrow from B.w to A.e "result" below
```

### Grouped Components

Use `[ ]` to group objects:

```picjs
Frontend: [
  box "React App" fit
  arrow
  box "Redux" fit
]

arrow right 100%

Backend: [
  down
  box "API Gateway" fit
  arrow
  box "Auth Service" fit
]
```

Reference sublists with `block` or `[]`:
```picjs
[ box "A"; box "B" ]
arrow from last block.e    # or: last [].e
box at 1st block.ne        # or: 1st [].ne
```

## Shape Reference

**Block shapes**: `box`, `circle`, `ellipse`, `oval`, `cylinder`, `diamond`, `file`, `dot`, `text`

**Line shapes**: `line`, `arrow`, `spline`, `arc`, `move`

## Essential Attributes

### Size
```picjs
box width 2 height 1
box wid 2 ht 1        # short form
box rad 0.2           # rounded corners
circle radius 0.5
box fit               # size to fit text
```

### Position
```picjs
box at 1, 2                    # absolute
box at 1 right of OtherBox     # relative
arrow from A.e to B.w          # connect points
```

### Style
```picjs
box color red                  # outline color
box fill lightblue             # fill color
box color 0xff6600             # hex color
box fill rgb(100, 150, 200)    # rgb function
line dashed
line dotted
line thick
line thin
```

### Text
```picjs
box "Line 1" "Line 2"          # multiple lines
box "Top" above "Bottom" below
box "Bold" bold
box "Italic" italic
box "Code" mono
```

### Dynamic Text
```picjs
$label = "Hello"
box containing $label          # set text from variable
box con $label                 # short form
```

## Variables and Data Types

### Basic Variables
```picjs
$gap = 0.3
boxwid = 1.5
fontscale = 1.2    # scale all text to 120%
```

### Rich Variables ($-prefixed)
```picjs
$name = "Alice"                # string
$count = 42                    # number
$flag = yes                    # boolean (yes/no)
$items = [1, 2, 3]             # list
$double = fn($x) { $result = $x * 2 }  # function
```

### Lists
```picjs
$colors = ["red", "blue", "green"]
$nums = [1, 2, 3, 4, 5]
$first = $colors[0]            # "red" (0-indexed)

# Range syntax
$range = [1..5]                # [1, 2, 3, 4, 5]
$chars = ["A".."E"]            # ["A", "B", "C", "D", "E"]
```

## Control Flow

### For Loops
```picjs
for i from 1 to 5 do {
  box "Item ${i}"
  move right 0.3
}

for $color in ["red", "blue", "green"] do {
  box fill $color
}

for i in [1..5] do {
  box containing i
}
```

### If/Else
```picjs
$show = yes
if $show { box "visible" }

if $count > 3 {
  box "big"
} else {
  box "small"
}
```

### Case/Pattern Matching
```picjs
case $value {
  1 => { box "one" }
  2 => { box "two" }
  _ => { box "other" }   # default
}

case $color {
  "red" => { box fill Red }
  "blue" => { box fill Blue }
  else => { box fill Gray }
}
```

## Functions

### Define and Call
```picjs
$labeled_box = fn($text, $col) {
  box $text fill $col fit
}

$labeled_box("Hello", LightBlue)
$labeled_box("World", LightGreen)
```

### Functions with Shapes
```picjs
$icon = fn($type) {
  case $type {
    "db" => { cylinder }
    "user" => { circle }
    else => { box }
  }
}

$icon("db")
arrow
$icon("user")
```

## List Operations

All list operations return new values (never mutate):

```picjs
len($list)                 # length
head($list)                # first element
last($list)                # last element
push($list, $val)          # append, return new list
pop($list)                 # remove last, return new list
shift($list)               # remove first, return new list
unshift($list, $val)       # prepend, return new list
reverse($list)             # reverse
contains($list, $val)      # membership test (yes/no)
join($list, ", ")          # join with separator
split("a,b,c", ",")        # split string to list
```

### Higher-Order Functions
```picjs
$double = fn($x) { $result = $x * 2 }
$doubled = map([1, 2, 3], $double)     # [2, 4, 6]

$even = fn($x) { $result = ($x / 2) == int($x / 2) }
$evens = filter([1, 2, 3, 4], $even)   # [2, 4]

$sorted = sort([3, 1, 2])              # [1, 2, 3]
```

## Operators

### Arithmetic
```picjs
+ - * /                    # basic math
$a + $b                    # also concatenates lists/strings
```

### Comparison
```picjs
== != > < >= <=            # returns yes/no
```

### Logical
```picjs
and or not                 # boolean logic
$x > 0 and $x < 10
not $flag
```

## Mathematical Constants and Functions

```picjs
$pi          # 3.14159...
$2pi         # 6.28318...
d2r(degrees) # convert degrees to radians
r2d(radians) # convert radians to degrees
sin(x), cos(x), sqrt(x), abs(x), min(a,b), max(a,b), int(x)
```

## Color Functions

```picjs
rgb(255, 128, 0)      # RGB (0-255 each)
hsl(210, 80, 60)      # HSL (h:0-360, s:0-100, l:0-100)
oklch(70, 0.15, 150)  # OKLCH perceptual color
```

## Tips for Good Diagrams

1. **Start with direction**: Set `down` or `right` at the beginning
2. **Use `fit`**: Let boxes size to their content
3. **Label key objects**: Makes connections easier
4. **Use groups `[ ]`**: For logical components
5. **Use functions**: For repeated patterns
6. **Use loops**: For generating series of shapes
7. **Keep it simple**: picjs excels at clean, technical diagrams
