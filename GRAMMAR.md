# PicJS EBNF Grammar

This is the complete grammar for the PicJS diagram language, a PIC-like language
that compiles to SVG. The grammar is expressed in EBNF notation.

## Notation

```
=           definition
|           alternation
[ ... ]     optional (0 or 1)
{ ... }     repetition (0 or more)
( ... )     grouping
"..."       terminal (keyword/symbol)
'...'       terminal (literal character)
UPPER_CASE  token class (see Lexical Grammar)
```

---

## Document Structure

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
                | animation_stmt
                | shape_stmt
                ;
```

---

## Statements

### Direction

```ebnf
direction_stmt  = direction ;

direction       = "right" | "down" | "left" | "up" ;
```

### Assignment

```ebnf
assignment_stmt = lvalue assign_op rvalue_expr
                | lvalue "=" animation_stmt       (* animation assigned to $-var *)
                ;

lvalue          = IDENTIFIER
                | "fill" | "color" | "thickness"
                ;

assign_op       = "=" | "+=" | "-=" | "*=" | "/=" ;

rvalue_expr     = color_name
                | expr
                ;

color_name      = PLACENAME ;          (* uppercase name resolved as color *)
```

### Label

```ebnf
label_stmt      = PLACENAME ":" ( shape_stmt | position ) ;
```

### Print

```ebnf
print_stmt      = "print" print_item { "," print_item } ;

print_item      = STRING
                | "fill" | "color" | "thickness"
                | rvalue_expr
                ;
```

### Assert

```ebnf
assert_stmt     = "assert" "(" assert_body ")" ;

assert_body     = expr                              (* boolean/truthy check *)
                | expr "==" expr                    (* numeric equality *)
                | position "==" position            (* position equality *)
                ;
```

### Define (Macro)

```ebnf
define_stmt     = "define" IDENTIFIER codeblock ;
```

### For Loop

```ebnf
for_stmt        = "for" IDENTIFIER for_variant ;

for_variant     = "from" expr "to" expr [ "step" expr ] "do" codeblock
                | "in" expr "do" codeblock
                ;
```

### Case

```ebnf
case_stmt       = "case" expr "{" { case_arm } "}" ;

case_arm        = pattern "=>" codeblock ;

pattern         = expr                            (* match specific value *)
                | "_"                             (* wildcard/default *)
                | "else"                          (* alternative default syntax *)
                ;
```

### If

```ebnf
if_stmt         = "if" expr codeblock [ "else" codeblock ] ;
```

### Function Call (statement)

```ebnf
fncall_stmt     = "$" IDENTIFIER "(" [ expr { "," expr } ] ")" ;
```

### Animation

```ebnf
animation_stmt  = animation_header "{" { alter_stmt NEWLINE } "}" ;

animation_header = { animation_clause } ;

animation_clause = "starting" expr
                 | "ending" expr
                 | "take" expr
                 | "ease" [ "in" | "out" ] easing_name
                 | "bounce" [ "in" | "out" ] expr
                 ;

easing_name     = IDENTIFIER ;   (* linear, quad, cubic, exponential *)

alter_stmt      = "alter" alter_target "to" expr ;

alter_target    = object "." ( property_name | "x" | "y"
                             | edge [ "." ( "x" | "y" ) ] ) ;
```

Animations are first-class values. They can be assigned to `$`-prefixed
variables and their attributes accessed via dot notation:

```
$scene1 = starting 3.4 take 1 ease cubic {
  alter last box.c to last circle.n
}
$scene2 = starting $scene1.end + 2 take 4 {
  alter Background.opacity to 1
}
```

Accessible properties: `.start`, `.end`, `.duration`.

### Shape

```ebnf
shape_stmt      = basetype [ rel_expr ] { attribute } ;

basetype        = CLASSNAME                         (* box, circle, etc. *)
                | STRING [ text_position ]          (* bare text object *)
                | "[" statement_list "]"            (* sublist *)
                ;
```

---

## Shape Classes

The following are recognized as `CLASSNAME`:

```
arc    arrow    box      circle    cylinder
diamond   dot   ellipse  file      line
move   oval     spline   text
```

---

## Attributes

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
                | even_with_attr
                | then_attr
                ;
```

### Numeric Attributes

```ebnf
numeric_attr    = numeric_prop rel_expr ;

numeric_prop    = "height" | "ht"
                | "width" | "wid"
                | "radius" | "rad"
                | "diameter"
                | "thickness"
                | "opacity"
                ;
```

### Dash Attributes

```ebnf
dash_attr       = ( "dashed" | "dotted" ) [ expr ] ;
```

### Color Attributes

```ebnf
color_attr      = ( "fill" | "color" ) rvalue_expr ;
```

### Direction Attributes (path movement)

```ebnf
direction_attr  = [ "go" ] direction [ rel_expr ]
                | "go" [ rel_expr ] "heading" expr
                | "go" [ rel_expr ] EDGEPT
                ;
```

### Even-With Attribute

```ebnf
even_with_attr  = [ "go" ] direction [ "until" ] "even" "with" position ;
```

### Position Attributes

```ebnf
position_attr   = "from" position
                | "to" position
                | "at" position
                | "close"
                ;
```

### With Attribute

```ebnf
with_attr       = "with" [ "." ] edge "at" position ;
```

### Same Attribute

```ebnf
same_attr       = "same" [ "as" object ] ;
```

### Text Attributes

```ebnf
text_attr       = STRING text_position ;
```

### Containing Attribute

```ebnf
containing_attr = ( "containing" | "con" ) expr text_position ;
```

`containing` sets a shape's text from an expression. `box "hello"` is
syntactic sugar for `box containing "hello"`. The expression is evaluated
as a rich value and converted to a string. This allows variables and
function parameters to provide text content:

```
$label = "Hello"
box containing $label
box con $label            # short form
```

### Boolean Attributes

```ebnf
bool_attr       = "cw" | "ccw"
                | "<-" | "->" | "<->"
                | "invis"
                | "thick" | "thin" | "solid"
                ;
```

### Flag Attributes

```ebnf
flag_attr       = "chop" ;
```

### Fit Attribute

```ebnf
fit_attr        = "fit" ;
```

### Behind Attribute

```ebnf
behind_attr     = "behind" object ;
```

### Then Attribute

```ebnf
then_attr       = "then" [ "to" position ]
                | "then" direction_attr
                | "then" [ rel_expr ] "heading" expr
                | "then" [ rel_expr ] EDGEPT
                | "then"
                ;
```

---

## Text Position

```ebnf
text_position   = { text_modifier } ;

text_modifier   = "above" | "below" | "center"
                | "ljust" | "rjust"
                | "bold" | "italic" | "mono" | "aligned"
                | "big" | "small"
                ;
```

---

## Relative Expressions

```ebnf
rel_expr        = expr [ "%" ] ;

opt_rel_expr    = [ rel_expr ] ;        (* absence means "use default" *)
```

---

## Expressions

Precedence from lowest to highest:

```ebnf
expr            = or_expr ;

or_expr         = and_expr { "or" and_expr } ;

and_expr        = not_expr { "and" not_expr } ;

not_expr        = "not" not_expr
                | compare_expr
                ;

compare_expr    = add_expr [ compare_op add_expr ] ;

compare_op      = "==" | "!=" | ">=" | "<="
                | ">" | "<"                     (* only outside position context *)
                ;

add_expr        = mul_expr { ( "+" | "-" ) mul_expr } ;

mul_expr        = unary_expr { ( "*" | "/" ) unary_expr } ;

unary_expr      = ( "-" | "+" ) unary_expr
                | primary
                ;
```

### Primary Expressions

```ebnf
primary         = NUMBER
                | STRING
                | "yes" | "no"
                | IDENTIFIER
                | PLACENAME                                (* color name if known color *)
                | "$" IDENTIFIER "(" [ expr { "," expr } ] ")"
                | "$" IDENTIFIER "." IDENTIFIER            (* $-var property: $anim.start *)
                | "fn" "(" [ param_list ] ")" codeblock
                | builtin_func "(" expr { "," expr } ")"
                | "dist" "(" position "," position ")"
                | "[" [ expr { "," expr } [ "," ] ] "]"   (* list literal *)
                | "[" expr ".." expr "]"                   (* range: [1..5], ["A".."Z"] *)
                | "(" expr ")"
                | "(" ( "fill" | "color" | "thickness" ) ")"
                | object "." ( "x" | "y" )
                | object "." edge "." ( "x" | "y" )
                | object "." property_name
                | NTH "vertex" [ "of" ] object "." ( "x" | "y" )
                ;

param_list      = IDENTIFIER { "," IDENTIFIER } ;

builtin_func    = func1 | func2 | func3 | list_func ;

func1           = "abs" | "cos" | "d2r" | "int" | "r2d" | "sin" | "sqrt" ;

func2           = "max" | "min" ;

func3           = "hsl" | "oklch" | "rgb" ;

list_func       = "len" | "head" | "last" | "reverse" | "sort" (* 1 arg *)
                | "pop" | "shift"                               (* 1 arg, mutating *)
                | "push" | "unshift"                            (* 2 args, mutating *)
                | "contains" | "join" | "split"                 (* 2 args *)
                | "map" | "filter"                              (* list, fn *)
                ;

property_name   = "height" | "ht" | "width" | "wid"
                | "radius" | "rad" | "diameter" | "thickness"
                | "opacity"
                | "dashed" | "dotted"
                | "fill" | "color"
                ;
```

---

## Positions

```ebnf
position        = "(" position "," position ")"     (* composite x,y from *)
                | "(" position ")"                   (* parenthesized *)
                | expr "," expr                      (* absolute x,y *)
                | expr dist_direction position       (* distance + direction *)
                | expr "heading" expr [ "from" ] position
                | expr "heading" EDGEPT [ "of" ] position
                | expr EDGEPT [ "of" ] position
                | expr between_syntax position "and" position
                | expr "<" position "," position ">" (* angle-bracket between *)
                | place_position
                ;

dist_direction  = "above"
                | "below"
                | "left" [ "of" ]
                | "right" [ "of" ]
                ;

between_syntax  = "between"
                | "way" "between"
                | "of" [ "the" ] [ "way" ] "between"
                ;

place_position  = place [ ( "+" | "-" ) offset ] ;

offset          = "(" expr "," expr ")"             (* parenthesized dx,dy *)
                | expr "," expr                     (* bare dx,dy *)
                ;
```

---

## Places and Objects

```ebnf
place           = edge "of" object                  (* edge of object *)
                | NTH "vertex" [ "of" ] object      (* vertex reference *)
                | object [ "." edge ]               (* object with optional edge *)
                ;

edge            = "center" | "top" | "bottom"
                | "start" | "end"
                | "left" | "right"
                | EDGEPT
                ;

object          = "this"
                | PLACENAME { "." PLACENAME }       (* named, possibly dotted *)
                | nth_object
                ;

nth_object      = NTH [ "last" ] CLASSNAME [ in_of object ]
                | NTH [ "last" ] "[" "]" [ in_of object ]
                | NTH [ "last" ] "block" [ in_of object ]    (* alias for [] *)
                | "last" CLASSNAME [ in_of object ]
                | "last" "[" "]" [ in_of object ]
                | "last" "block" [ in_of object ]            (* alias for [] *)
                | "last" [ in_of object ]                    (* last object of any type *)
                | "first" CLASSNAME [ in_of object ]
                ;

in_of           = "of" | "in" ;
```

### Compass Points (EDGEPT)

The following are recognized as compass edge points:

```
n   ne   e   se   s   sw   w   nw   c
north  east  south  west  bot
```

---

## Code Blocks

```ebnf
codeblock       = "{" ... "}" ;
```

Code blocks are tokenized as balanced-brace strings. The contents are
parsed as a `statement_list` when evaluated (for loop bodies, function
bodies, case arm bodies, macro definitions).

---

## Lexical Grammar

### Tokens

```ebnf
NEWLINE         = '\n' | ';' ;

IDENTIFIER      = ( letter | '_' ) { letter | digit | '_' } ;
                  (* may start with '$' for user variables/functions *)

PLACENAME       = upper_letter { letter | digit | '_' } ;
                  (* starts with uppercase — used for labels and color names *)

CLASSNAME       = (* one of the shape class keywords: box, circle, etc. *)

NTH             = integer ( "st" | "nd" | "rd" | "th" )
                | "first"
                ;

NUMBER          = integer
                | float
                | hex_number
                ;

integer         = digit { digit } ;

float           = digit { digit } "." { digit } [ exponent ]
                | "." digit { digit } [ exponent ]
                ;

exponent        = ( "e" | "E" ) [ "+" | "-" ] digit { digit } ;

hex_number      = "0" ( "x" | "X" ) hex_digit { hex_digit } ;

STRING          = '"' { char | "${" expr "}" } '"' ;
                  (* supports string interpolation with ${...} *)

COMMENT         = "#" { any } NEWLINE
                | "//" { any } NEWLINE
                | "/*" { any } "*/"                (* block comment *)
                ;
```

### Units (on numbers)

Numbers may have optional unit suffixes that scale the value:

```
in    (inches, ×1)
cm    (centimeters, ÷2.54)
mm    (millimeters, ÷25.4)
pt    (points, ÷72)
px    (pixels, ÷96)
pc    (picas, ÷6)
```

### Operators

```
=    +=   -=   *=   /=          assignment operators
+    -    *    /                arithmetic operators
%                               percent suffix (in rel_expr)
==   !=   >    <    >=   <=    comparison operators
and  or   not                   logical operators
->   <-   <->                   arrow markers
..                              range operator (in list literals)
=>                              fat arrow (case arms)
(    )    [    ]    {    }      grouping
,    :    .                     punctuation
```

---

## Built-in Variables

These variables have default values and control shape dimensions and styling:

```
arcrad       arrowhead    arrowht      arrowwid
boxht        boxrad       boxwid       charht       charwid
circlerad    color        cylht        cylrad       cylwid
dashwid      diamondht    diamondwid   dotrad
ellipseht    ellipsewid   fileht       filerad      filewid
fill         fontscale    lineht       linewid      movewid
ovalht       ovalwid      scale        textht       textwid
thickness
$pi          $2pi
```

---

## Keywords

All reserved keywords recognized by the tokenizer:

```
_         (wildcard/default pattern)
above     abs       aligned   alter     and       arc       arrow     as
assert    at
behind    below     between   big       block     bold      bot       bottom
bounce    box
c         case      ccw       center    chop      circle    close     color
con       containing          cos       cw        cylinder
d2r       dashed    define    diameter  diamond   dist      do
dot       dotted    down
e         ease      east      else      ellipse   end       ending    even
file      fill      first     fit       fn        for       from
go
heading   height    ht        hsl
if        in        int       invis     italic
last      left      line      ljust
max       min       mono      move
n         ne        no        north     not       nw
of        oklch     opacity   or        oval
print
r2d       rad       radius    rgb       right     rjust
s         same      se        sin       small     solid     south
spline    sqrt      start     starting  step      sw
t         take      text      the       then      thick     thickness thin
this      to        top
until     up
vertex
w         way       west      width     wid       with
x         y         yes
```

**Keyword aliases** (alternative spellings recognized by the tokenizer):

```
bot         → south edge (same as s)
invisible   → same as invis
monospace   → same as mono
previous    → same as last
t           → north edge (same as top)
```

---

## Grammar Notes

1. **Statement separator**: Statements are separated by newlines or semicolons.

2. **`<`/`>` ambiguity**: In position context, `<` and `>` are between-brackets
   (`n<p1,p2>`), not comparison operators. In expression context they are
   comparisons.

3. **Color names**: Uppercase `PLACENAME` tokens are tried as color names in both
   `rvalue_expr` and general expression contexts (e.g., `Red`, `LightBlue`).
   If not a known color, they are treated as object references.

4. **Macros**: `define name { body }` registers a macro. When `name` appears
   in subsequent code, it is expanded to `body` during tokenization (before
   parsing). Macro parameters use `$1`, `$2`, etc. and are passed via
   `name(arg1, arg2)`.

5. **`$`-prefixed variables**: Variables starting with `$` are stored in a
   lexically-scoped environment and support rich values (numbers, strings,
   booleans, lists, functions). Plain variables (without `$`) are stored in
   the traditional PIC numeric variable table.

6. **Functions**: First-class values defined with `$f = fn(params) { body }`.
   Function bodies can produce shapes. Called as `$f(args)` at both statement
   and expression level.

7. **String interpolation**: Strings support `${expr}` interpolation, where
   `expr` is evaluated and its result is inserted (numbers, strings, booleans).

8. **List builtins**: Functions like `len`, `head`, `map`, `filter`, etc. are
   not tokenizer keywords — they are recognized as identifiers followed by `(`
   and dispatched as builtin calls during parsing. Note: `last` is both a
   keyword (for object references) and a builtin function (for lists); the
   parser distinguishes them by whether `(` follows.

9. **Animations**: Animation statements are first-class values. When assigned
   to a `$`-prefixed variable, their `.start`, `.end`, and `.duration`
   properties can be accessed. Easing names (`linear`, `quad`, `cubic`,
   `exponential`) are parsed as identifiers, not keywords. The `ease` keyword
   uses two-word form: `ease in linear`, `ease out cubic`, or `ease cubic`
   (both in and out). Note: `"out"` is not a keyword — it is matched as a
   contextual identifier in `ease` and `bounce` clauses.

10. **`pikchr_date`**: The keyword `pikchr_date` is converted to the string
    `"pikchr"` during tokenization (compatibility with pikchr).
