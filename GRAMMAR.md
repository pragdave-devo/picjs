# JP Grammar (EBNF)

Generated from `src/peg_parser/jp.pegjs`. Alternatives are ordered
(first match wins, as in PEG). Negative lookaheads are written `!X`
and positive lookaheads `&X`; these consume no input.

Whitespace conventions:
- `_`  = optional whitespace (zero or more `WhiteSpace`)
- `__` = required whitespace (one or more `WhiteSpace`)
- `WhiteSpace` includes spaces, tabs, newlines, comments, and Unicode `Zs`

---

## Program

```ebnf
Start           = _ Program _ EOF ;

Program         = ExpressionList? ;

ExpressionList  = Expression ( _ Expression )+ 
                | Expression ;
```

## Expressions

```ebnf
Expression      = Inspect
                | ShapeDefaultSetter
                | GroupExpression
                | Shape
                | SetTime
                | AnimationSequence
                | Assignment
                | IfExpression
                | ConditionalExpression ;

NonShapeExpression
                = Inspect
                | Assignment
                | IfExpression
                | ConditionalExpression ;
```

## Inspect

```ebnf
Inspect         = '??' _ Expression ;
```

## Assignment

```ebnf
Assignment      = LValue _ '=' !'=' !'>' _ Expression
                | LValue _ AssignmentOperator '=' _ Expression ;

AssignmentOperator
                = '*' | '/' | '%' | '+' | '-' ;

LValue          = '@' !'.'
                | BaseLValue Qualifier+
                | Identifier ;

BaseLValue      = '(' _ Expression _ ')'
                | VariableValue ;

Qualifier       = Arguments
                | '[' _ Expression _ ']'
                | '.' ( AttrName | Identifier ) ;
```

## Conditional & If/Else

```ebnf
ConditionalExpression
                = LogicalORExpression _ '?' _ Expression _ ':' _ Expression
                | LogicalORExpression ;

IfExpression    = 'if' _ '(' _ LogicalORExpression _ ')' _ ExpressionOrBlock
                     _ 'else' _ ExpressionOrBlock
                | 'if' _ '(' _ LogicalORExpression _ ')' _ ExpressionOrBlock
                | LogicalORExpression ;

ExpressionOrBlock
                = '{' _ ExpressionList _ '}'
                | Expression ;
```

## Logical, Relational, and Arithmetic

```ebnf
LogicalORExpression
                = LogicalANDExpression ( _ '||' _ LogicalANDExpression )* ;

LogicalANDExpression
                = EqualityExpression ( _ '&&' _ EqualityExpression )* ;

EqualityExpression
                = RelationalExpression ( _ EqualityOperator _ RelationalExpression )* ;

EqualityOperator
                = '==' | '!=' ;

RelationalExpression
                = AdditiveExpression ( _ RelationalOperator _ AdditiveExpression )* ;

RelationalOperator
                = '<=' | '>=' | '<' !( '-' | Identifier '>' ) | '>' ;

AdditiveExpression
                = MultiplicativeExpression ( _ AdditiveOperator _ MultiplicativeExpression )* ;

AdditiveOperator
                = '+' | '-' !'>' ;

MultiplicativeExpression
                = PowerExpression ( _ MultiplicativeOperator _ PowerExpression )* ;

MultiplicativeOperator
                = '*' | '/' | '%' ;

PowerExpression = UnaryExpression ( _ '^' _ UnaryExpression )* ;

UnaryExpression = UnaryOperator _ QualifiedExpression
                | QualifiedExpression ;

UnaryOperator   = '+' | '-' !'>' | '!' ;

QualifiedExpression
                = FunctionDefOrPrimary Qualifier* ;
```

## Function Call & Arguments

```ebnf
Arguments       = '(' _ ArgumentList _ ')'
                | '(' _ ')' ;

ArgumentList    = Expression ( _ ( ',' _ )? Expression )* ;
```

## Function Definition

```ebnf
FunctionDefOrPrimary
                = FunctionDefinitionExpression
                | Primary ;

FunctionDefinitionExpression
                = '(' _ FormalParameterList _ ')' _ '=>' _ FunctionBody
                | Identifier _ '=>' _ FunctionBody
                | ( '(' _ ')' _ )? '=>' _ FunctionBody ;

FunctionBody    = '{' _ ExpressionList _ '}'
                | Expression ;

FormalParameterList
                = Identifier ( _ ( ',' _ )? Identifier )* ;
```

## Primary

```ebnf
Primary         = Number
                | Boolean
                | Color
                | Position
                | String
                | TimelineValue
                | ShapeDefaultGetter
                | VariableValue
                | ArrayOrRange
                | '(' _ Expression _ ')' ;

ShapeDefaultGetter
                = ShapeName SEClass '.' AttrName
                | ShapeName '.' AttrName ;

TimelineValue   = '@' ![ .\[( ] ;

VariableValue   = Identifier ;
```

## Position

```ebnf
Position        = '(' _ Expression _ ( ',' _ )? Expression _ ')' ;

PositionValue   = Expression ;
```

## Identifier

```ebnf
Identifier      = !Reserved IdentifierStart IdentifierPart*
                | '@' ;

IdentifierStart = UnicodeLetter | '_' | '$' ;

IdentifierPart  = IdentifierStart
                | UnicodeCombiningMark
                | UnicodeDigit
                | UnicodeConnectorPunctuation
                | '\u200C' | '\u200D' ;

UnicodeLetter   = Lu | Ll | Lt | Lm | Lo | Nl ;
UnicodeCombiningMark = Mn | Mc ;
UnicodeDigit    = Nd ;
UnicodeConnectorPunctuation = Pc ;
```

## Boolean

```ebnf
Boolean         = 'true' !IdentifierPart
                | 'false' !IdentifierPart ;
```

## Color

```ebnf
Color           = ColorModel '(' _ ColorComponents _ ')'
                | '#' HexByte HexByte HexByte HexByte? !HexNibble
                | '#' HexNibble HexNibble HexNibble HexNibble? !HexNibble
                | '~' [a-zA-Z0-9]+ ;

ColorModel      = ( 'oklch'i | 'rgb'i | 'hsl'i | 'hsv'i ) 'a'i? ;

ColorComponents = Expression _ ',' _ Expression _ ',' _ Expression _ ',' _ Expression
                | Expression _ ',' _ Expression _ ',' _ Expression ;

HexNibble       = [0-9a-fA-F] ;
HexByte         = HexNibble HexNibble ;
```

### Palette Colors

Colors can also be specified using WCAG-compliant palette names. Each palette
contains 8 background colors (`b1`-`b8`) paired with readable foreground
colors (`f1`-`f8`). The foreground color `f_n` is guaranteed to have at least
4.5:1 contrast ratio against its corresponding background `b_n`.

```
// Direct palette colors (prefixed with ~)
Box fill ~b1            // Dark blue-grey background
Box fill ~f1            // Light foreground color

// Via Palette object
Box fill Palette.b3     // Access palette color

// Auto text coloring: labels inside palette-colored shapes
// automatically use the matching foreground color
Box "Hello" fill ~b2    // Text is automatically white (f2)
```

**Palette management:**
```
Palette.current = "ocean"   // Switch palette
$names = Palette.names      // List available palettes
Palette.b1 = ~navy          // Override a color locally
```

**Available palettes:**
| Name | Description |
|------|-------------|
| `default` | Balanced colors with good contrast |
| `misty` | Soft pastels with dark text |
| `ocean` | Blues and teals |
| `forest` | Greens and browns |
| `warm` | Reds, oranges, and earth tones |
| `mono` | Grayscale |
| `starfish` | PNW-inspired: forest to coral |
| `shuksan` | PNW-inspired: purples and pinks |
| `bay` | PNW-inspired: deep blue and gold |
| `lake` | PNW-inspired: earth to sky |
| `cascades` | PNW-inspired: forest and lime |
| `sunset` | PNW-inspired: purple to gold |

The PNW-inspired palettes (starfish, shuksan, bay, lake, cascades, sunset) are
adapted from [PNWColors](https://github.com/jakelawlor/PNWColors), an R package
by Jake Lawlor featuring color palettes inspired by the Pacific Northwest.

## String

```ebnf
String          = '"""' TripleDoubleStringCharacter* '"""'
                | "'''" TripleSingleStringCharacter* "'''"
                | '"' DoubleStringCharacter* '"'
                | "'" SingleStringCharacter* "'" ;

TripleDoubleStringCharacter
                = !( '"""' ) . ;

TripleSingleStringCharacter
                = !( "'''" ) . ;

DoubleStringCharacter
                = !( '"' | '\\' | LineTerminator ) .
                | '\\' EscapeSequence
                | LineContinuation ;

SingleStringCharacter
                = !( "'" | '\\' | LineTerminator ) .
                | '\\' EscapeSequence
                | LineContinuation ;

LineContinuation
                = '\\' LineTerminatorSequence ;

EscapeSequence  = CharacterEscapeSequence
                | '0' !DecimalDigit
                | HexEscapeSequence
                | UnicodeEscapeSequence ;

CharacterEscapeSequence
                = SingleEscapeCharacter
                | NonEscapeCharacter ;

SingleEscapeCharacter
                = "'" | '"' | '\\' | 'b' | 'f' | 'n' | 'r' | 't' | 'v' ;

NonEscapeCharacter
                = !( EscapeCharacter | LineTerminator ) . ;

EscapeCharacter = SingleEscapeCharacter | DecimalDigit | 'x' | 'u' ;

HexEscapeSequence
                = 'x' HexByte ;

UnicodeEscapeSequence
                = 'u' HexByte HexByte? ;
```

## Number

```ebnf
Number          = ActualNumber '%'
                | ActualNumber ;

ActualNumber    = DecimalIntegerLiteral DecimalPoint DecimalDigit+ ExponentPart?
                | DecimalPoint DecimalDigit+ ExponentPart?
                | DecimalIntegerLiteral ExponentPart? ;

SimpleDecimalNumber
                = DecimalIntegerLiteral ( DecimalPoint DecimalDigit* )? ;

DecimalDigit    = [0-9] ;
DecimalIntegerLiteral
                = '0'
                | [1-9] DecimalDigit* ;

ExponentPart    = 'e'i [+-]? DecimalDigit+ ;
DecimalPoint    = '.' !'.' ;
```

## Array & Range

```ebnf
ArrayOrRange    = '[' _ Expression _ '..' _ Expression _ ']'
                | '[' _ ElementList _ ']'
                | '[' _ ']' ;

ElementList     = Expression ( _ ( ',' _ )? Expression )* ;
```

## Animation

```ebnf
SetTime         = '@@' ;

AnimationSequence
                = Animation ( _ 'then' __ Animation )+
                | Animation ;

Animation       = 'move' __ Expression _ ( 'to' __ )? Expression _ AnimationParams
                | 'rotate' __ Expression __ 'by' __ Expression _ 'about' __ PositionValue _ AnimationParams
                | 'rotate' __ Expression __ 'by' __ Expression _ AnimationParams
                | 'set' __ LValue ( _ ',' _ | __ ( 'to' __ )? ) Expression _ AnimationParams
                | 'draw' __ Expression _ AnimationParams
                | 'pause' __ ConditionalExpression
                | 'pause' ;

AnimationParams = AnimationParam* ;

AnimationParam  = 'take' __ Expression _
                | 'ease' __ String _
                | 'ease' __ [a-zA-Z] [a-zA-Z0-9]* _ ;
```

## Groups

```ebnf
GroupExpression = 'Aside' _ '{' _ ExpressionList _ '}'
                | 'Group' __ '{' _ ExpressionList _ '}'
                     ( __ SEBehind )* ( __ WithConstraint )? ( __ SEBehind )* ;
```

## Shape Names & Defaults

```ebnf
ShapeName       = ( 'Arc' | 'Box' | 'Circle' | 'Ellipse' | 'Oval'
                  | 'Line' | 'line' | 'Label' | 'Skip' ) !IdentifierPart
                | 'Shape' !IdentifierPart ;

ShapeDefaultSetter
                = ShapeName SEClass '.' AttrName _ '=' _ Expression
                | ShapeName '.' AttrName _ '=' _ Expression ;
```

## Shape (all shape instantiations)

### Arc

```ebnf
Shape           = 'Arc' __ FromPosition __ ToPosition
                     ( _ ( SELineEndings | SELineDraw | SELineLabel | SECommon | SETurn ) )*

                | 'Arc' __ SELineEndings __ FromPosition __ ToPosition
                     ( _ ( SELineDraw | SELineLabel | SECommon | SETurn ) )*

                | 'Arc' !'.' ( __ ( SELineEndings | SELineDraw | SELineLabel | SECommon | SETurn ) )*
```

### Box

```ebnf
                | 'Box' !'.' !'('
                     ( __ ( SECommon | SESize | SERadii ) )*
                     ( __ WithConstraint )?
                     ( __ ( SECommon | SESize | SERadii ) )*
```

### Circle / Ellipse / Oval

```ebnf
                | ( 'Circle' | 'Ellipse' | 'Oval' ) !'.' !'('
                     ( __ ( SECommon | SERadius ) )*
                     ( __ WithConstraint )?
                     ( __ ( SECommon | SERadius ) )*
```

### Polyline (from + then waypoints)

```ebnf
                | LineOrAbbrev __ FromPosition ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineEndings | SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*

                | 'Line' __ SELineEndings __ FromPosition ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*
```

### Polyline (from + to + then waypoints)

```ebnf
                | LineOrAbbrev __ FromPosition __ ToPosition ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineEndings | SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*

                | 'Line' __ SELineEndings __ FromPosition __ ToPosition ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*
```

### Polyline (from + directional waypoints + then)

```ebnf
                | LineOrAbbrev __ FromPosition __ DirectionalWaypoint ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineEndings | SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*

                | 'Line' __ SELineEndings __ FromPosition __ DirectionalWaypoint ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*
```

### Polyline (directional waypoints, no from)

```ebnf
                | LineOrAbbrev __ DirectionalWaypoint ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineEndings | SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*

                | 'Line' __ SELineEndings __ DirectionalWaypoint ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*
```

### Polyline (to + then waypoints, no from)

```ebnf
                | LineOrAbbrev __ ToPosition ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineEndings | SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*

                | 'Line' __ SELineEndings __ ToPosition ( __ ThenToPosition )+ ( __ 'close' )?
                     ( _ ( SELineDraw | SELineShape | SELineLabel | SECommon | SERadii ) )*
```

### Line (two-point)

```ebnf
                | LineOrAbbrev __ FromPosition __ ToPosition
                     ( _ ( SELineEndings | SELineDraw | SELineShape | SELineLabel | SECommon ) )*

                | 'Line' __ SELineEndings __ FromPosition __ ToPosition
                     ( _ ( SELineDraw | SELineShape | SELineLabel | SECommon ) )*
```

### Line (from only, endings first)

```ebnf
                | 'Line' __ SELineEndings __ FromPosition
                     ( _ ( SELineDraw | SELineShape | SELineLabel | SECommon | SELineLength ) )*
```

### Line (to only, endings first)

```ebnf
                | 'Line' __ SELineEndings __ ToPosition
                     ( _ ( SELineDraw | SELineShape | SELineLabel | SECommon | SELineLength ) )*
```

### Line (from only)

```ebnf
                | LineOrAbbrev __ FromPosition
                     ( _ ( SELineEndings | SELineDraw | SELineShape | SELineLabel | SECommon | SELineLength ) )*
```

### Line (to only)

```ebnf
                | LineOrAbbrev __ ToPosition
                     ( _ ( SELineEndings | SELineDraw | SELineShape | SELineLabel | SECommon | SELineLength ) )*
```

### Line (bare)

```ebnf
                | LineOrAbbrev !'.'
                     ( __ ( SELineEndings | SELineDraw | SELineLabel | SECommon | SELineShape | SELineLength ) )*
```

### Label

```ebnf
                | 'Label' _ Expression ( __ ( SEText | SECommon ) )* ( __ WithConstraint )?
```

### Face

```ebnf
                | 'Face' __ CardinalVector
                | 'Face' __ Expression
```

### Gap

```ebnf
                | 'Gap' __ 'same'
                | 'Gap' __ CardinalVector __ MoveDistance
                | 'Gap' __ CardinalVector
                | 'Gap' __ MoveDistance
                | 'Gap'
```

### Goto

```ebnf
                | 'Goto' __ CardinalVector __ MoveDistance
                | 'Goto' __ CardinalVector
                | 'Goto' __ Position
                | 'Goto' __ PositionValue
                | 'Goto' __ MoveDistance
                | 'Goto'
```

### Skip

```ebnf
                | 'Skip' __ SkipArgs ;

MoveDistance     = '-' Number
                | Number
                | '(' _ ConditionalExpression _ ')' ;

SkipArgs        = 'to' __ Expression
                | Position
                | 'x' __ Expression __ 'y' __ Expression
                | 'y' __ Expression __ 'x' __ Expression ;

LineOrAbbrev    = ( 'Line' | 'line' ) !IdentifierPart
                | SELineEndings ;
```

## Waypoints & Directions

```ebnf
FromPosition    = 'from' __ PositionValue
                | Position ;

ToPosition      = 'to' __ PositionValue
                | Position ;

ThenToPosition  = 'then' __ CardinalVector __ 'until' __ ( ( 'even' | 'level' ) __ 'with' __ )? PositionValue
                | 'then' __ DirectionalWaypoint
                | 'then' __ ( 'to' __ )? PositionValue ;

DirectionalWaypoint
                = DirectionalComponent __ DirectionalComponent
                | DirectionalComponent ;

DirectionalComponent
                = CardinalVector __ ConditionalExpression ;
```

## Shape Attributes (SE = Shape Element)

### Common

```ebnf
SECommon        = SELabel
                | SERotation
                | SEPos
                | SEFill
                | SEStroke
                | SEStrokeAttr
                | SEOpacity
                | SEBehind
                | SESame
                | SEClass ;
```

### Label

```ebnf
SELabel         = RichLabel
                | String ;

RichLabel       = '(' _ NonShapeExpression LabelTextAttr* _ ')' ;

LabelTextAttr   = __ SEText
                | __ SEFill
                | __ SEStroke
                | __ ActualFontSize ;
```

### Position & Size

```ebnf
SEPos           = 'at' __ Expression
                | 'at'? _ Position
                | 'x' __ Expression
                | 'y' __ Expression ;

SERadius        = 'radius' __ Expression ;

SERadii         = ( 'rx' | 'ry' ) __ Expression ;

SESize          = Expression _ ( 'x' | '\u00D7' ) _ Expression
                | 'width' __ Expression
                | 'height' __ Expression ;
```

### Appearance

```ebnf
SEFill          = 'fill' __ NonShapeExpression ;

SEStroke        = SEStrokeAttr ;

SEStrokeAttr    = 'stroke' __ NonShapeExpression
                | 'thickness' __ NonShapeExpression
                | ( 'solid' | 'dotted' | 'dashed' ) ;

SERotation      = 'rotation' __ Expression __ 'about' _ PositionValue
                | 'rotation' __ Expression ;
```

### Line-specific

```ebnf
SELineEndings   = '--'
                | '~~'
                | SELineEndStart LinePath SELineEndEnd
                | SELineEndStart LinePath
                | LinePath SELineEndEnd ;

LinePath        = '-'
                | '~' ;

SELineEndStart  = '<' | '|' | 'o' ;
SELineEndEnd    = '>' | '|' | 'o' ;

SELineLength    = 'length' __ Expression ;

SELineDraw      = 'nodraw' !IdentifierPart ;

SELineShape     = 'straight'
                | 'stepped'
                | 'smooth' ;

SELineLabel     = RichLabel ( __ 'at' __ Number )? ( __ ( 'above' | 'below' | 'inside' | 'outside' ) )?
                | String ( __ 'at' __ Number )? ( __ ( 'above' | 'below' | 'inside' | 'outside' ) )? ;
```

### Other

```ebnf
SEOpacity       = 'opacity' __ Number ;

SEBehind        = 'behind' __ NonShapeExpression ;

SESame          = 'same' ;

SEClass         = '.' Identifier ;

SEText          = 'align' __ Cardinal
                | 'maxwidth' __ Number
                | 'font' __ FontSpec ;

SETurn          = ( 'turn' __ )? ( 'ccw' | 'cw' )
                | 'turn' __ Expression ;
```

## Constraints

```ebnf
WithConstraint  = 'with' __ ( _ Cardinal )? ( _ 'at' )? _ Expression ;

Cardinal        = '.' ( 'nw' | 'ne' | 'n' | 'sw' | 'se' | 's' | 'w' | 'e' | 'c' ) !IdentifierPart ;

CardinalVector  = 'northwest' !IdentifierPart
                | 'northeast' !IdentifierPart
                | 'north'     !IdentifierPart
                | 'southwest' !IdentifierPart
                | 'southeast' !IdentifierPart
                | 'south'     !IdentifierPart
                | 'west'      !IdentifierPart
                | 'east'      !IdentifierPart
                | 'nw' !IdentifierPart
                | 'ne' !IdentifierPart
                | 'n'  !IdentifierPart
                | 'sw' !IdentifierPart
                | 'se' !IdentifierPart
                | 's'  !IdentifierPart
                | 'w'  !IdentifierPart
                | 'e'  !IdentifierPart ;
```

## Font Specification (subset of CSS)

```ebnf
FontSpec        = SystemFont
                | FontProperties ;

SystemFont      = ( 'caption' | 'icon' | 'menu' | 'message-box'
                  | 'small-caption' | 'status-bar' ) !IdentifierPart ;

FontProperties  = ( BeforeSizeProperty __ )* FontSize __ FontFamilyNames ;

BeforeSizeProperty
                = FontStyle | FontVariant | FontWeight | FontStretch ;

FontStyle       = IgnoreNormal
                | 'italic' !IdentifierPart
                | 'oblique' _ ObliqueAngle
                | 'oblique' !IdentifierPart ;

FontVariant     = IgnoreNormal
                | 'small-caps' !IdentifierPart ;

FontWeight      = IgnoreNormal
                | ( 'bold' | 'lighter' | 'darker' | [0-9] '00' ) ;

FontStretch     = IgnoreNormal
                | ( 'ultra-condensed' | 'extra-condensed' | 'condensed' | 'semi-condensed'
                  | 'semi-expanded' | 'expanded' | 'extra-expanded' | 'ultra-expanded'
                  | Percent ) ;

Percent         = SimpleDecimalNumber '%' ;

FontSize        = ActualFontSize '/' LineHeight
                | ActualFontSize ;

ActualFontSize  = ( 'xx-small' | 'x-small' | 'small' | 'medium' | 'large'
                  | 'x-large' | 'xx-large' | 'xxx-large' | 'smaller' | 'larger' ) !IdentifierPart
                | Percent
                | SimpleDecimalNumber SizeUnit ;

LineHeight      = IgnoreNormal
                | Percent
                | SimpleDecimalNumber SizeUnit? ;

SizeUnit        = ( 'Q' | 'ch' | 'cm' | 'em' | 'ex' | 'in' | 'lh' | 'mm' | 'pc'
                  | 'pt' | 'px' | 'rem' | 'vh' | 'vmax' | 'vmin' | 'vw' ) !IdentifierPart ;

FontFamilyNames = FontFamilyName ( _ ',' _ FontFamilyName )* ;

FontFamilyName  = '"' ( !'"' . )+ '"'
                | Identifier ( __ Identifier )* ;

ObliqueAngle    = [+-]? [0-9] [0-9] AngleUnit ;

AngleUnit       = 'deg' | 'grad' | 'rad' | 'turn' ;

IgnoreNormal    = 'normal' ;
```

## Reserved Words

```ebnf
Reserved        = AlwaysReserved ;

AlwaysReserved  = 'Arc' | 'arc' | 'Aside' | 'Box' | 'box' | 'Circle' | 'circle'
                | 'Ellipse' | 'Face' | 'Gap' | 'Goto' | 'Group'
                | 'Line' | 'line' | 'Label' | 'Oval' | 'Skip'
                | 'move' | 'pause' | 'rotate' | 'set' | 'then' | 'wait' | 'draw'
                | 'else' | 'if'
                | 'true' | 'false' ;
```

Note: `AttrName` keywords (at, fill, from, to, with, etc.) are reserved
only when parsing attribute positions within shape definitions, not globally.

```ebnf
AttrName        = 'align' | 'at' | 'ccw' | 'cw' | 'dashed' | 'dotted' | 'ease'
                | 'fill' | 'font_family' | 'font_size' | 'font_stretch'
                | 'font_style' | 'font_variant' | 'font_weight' | 'font'
                | 'from' | 'height' | 'length' | 'line_height' | 'maxwidth'
                | 'opacity' | 'radius'
                | 'rotation' | 'rx' | 'ry' | 'smooth' | 'solid' | 'stepped'
                | 'straight' | 'stroke_width' | 'stroke' | 'take'
                | 'thickness' | 'to' | 'turn' | 'width' | 'with' | 'x' | 'y' ;
```

## Whitespace & Lexical

```ebnf
_               = WhiteSpace* ;
__              = WhiteSpace+ ;

WhiteSpace      = '\t' | '\v' | '\f' | ' ' | '\u00A0' | '\uFEFF'
                | Zs
                | Comment
                | LineTerminator ;

LineTerminator  = '\n' | '\r' | '\u2028' | '\u2029' ;

LineTerminatorSequence
                = '\n' | '\r\n' | '\r' | '\u2028' | '\u2029' ;

Comment         = '//' ( !LineTerminator . )* ;

EOF             = !. ;
```

## Keyword Synonyms

Some keywords have shorter synonyms:

| Canonical     | Synonyms         |
|---------------|------------------|
| `height`      | `ht`             |
| `length`      | `len`            |
| `radius`      | `rad`, `r`       |
| `rotation`    | `rot`            |
| `smooth`      | `curve`, `curved`|
| `stepped`     | `step`           |
| `thickness`   | `thick`          |
| `width`       | `wid`            |
| `ease`        | `each`           |
| `Line`        | `line`           |
| `Arc`         | `arc`            |
| `Box`         | `box`            |
| `Circle`      | `circle`         |

---

## Cross-reference: PEG productions vs EBNF rules

Every PEG production is listed below with its corresponding EBNF rule name.
Productions marked (terminal) are keyword/attribute matchers that appear
in the Reserved Words or Keyword Synonyms sections rather than as
standalone EBNF rules.

| PEG production | EBNF rule |
|---|---|
| Start | Start |
| Reserved | Reserved |
| AlwaysReserved | AlwaysReserved |
| AttrName | AttrName |
| Aside | (terminal) |
| Arc | (terminal) |
| Box | (terminal) |
| Circle | (terminal) |
| Ellipse | (terminal) |
| Face | (terminal, in Shape) |
| Group | (terminal) |
| Line | (terminal) |
| Label | (terminal) |
| Gap | (terminal, in Shape) |
| Goto | (terminal, in Shape) |
| Oval | (terminal) |
| Skip | (terminal, in Shape) |
| draw | (terminal) |
| move | (terminal) |
| pause | (terminal) |
| set | (terminal) |
| then | (terminal) |
| wait | (terminal) |
| rotate | (terminal) |
| else | (terminal) |
| if | (terminal) |
| true | (terminal, in Boolean) |
| false | (terminal, in Boolean) |
| above | (terminal, in SELineLabel) |
| close | (terminal, in polyline) |
| about | (terminal, in SERotation/Animation) |
| align | (terminal, in SEText) |
| behind | (terminal, in SEBehind) |
| below | (terminal, in SELineLabel) |
| at | (terminal, in SEPos) |
| by | (terminal, in Animation) |
| dashed | (terminal, in SEStrokeAttr) |
| dotted | (terminal, in SEStrokeAttr) |
| ease | (terminal, in AnimationParam) |
| fill | (terminal, in SEFill) |
| font_family | (terminal, in AttrName) |
| font_size | (terminal, in AttrName) |
| font_stretch | (terminal, in AttrName) |
| font_style | (terminal, in AttrName) |
| font_variant | (terminal, in AttrName) |
| font_weight | (terminal, in AttrName) |
| font | (terminal, in SEText) |
| from | (terminal, in FromPosition) |
| rx | (terminal, in SERadii) |
| ry | (terminal, in SERadii) |
| inside | (terminal, in SELineLabel) |
| outside | (terminal, in SELineLabel) |
| same | (terminal, in SESame/Gap) |
| solid | (terminal, in SEStrokeAttr) |
| straight | (terminal, in SELineShape) |
| stroke_width | (terminal, in AttrName) |
| stroke | (terminal, in SEStrokeAttr) |
| take | (terminal, in AnimationParam) |
| to | (terminal, in ToPosition) |
| turn | (terminal, in SETurn) |
| with | (terminal, in WithConstraint) |
| x | (terminal, in SEPos/SkipArgs) |
| y | (terminal, in SEPos/SkipArgs) |
| line_height | (terminal, in AttrName) |
| height | (terminal, in SESize) |
| length | (terminal, in SELineLength) |
| radius | (terminal, in SERadius) |
| rotation | (terminal, in SERotation) |
| smooth | (terminal, in SELineShape) |
| stepped | (terminal, in SELineShape) |
| thickness | (terminal, in SEStrokeAttr) |
| width | (terminal, in SESize) |
| ccw | (terminal, in SETurn) |
| cw | (terminal, in SETurn) |
| Program | Program |
| ExpressionList | ExpressionList |
| Expression | Expression |
| NonShapeExpression | NonShapeExpression |
| Inspect | Inspect |
| Assignment | Assignment |
| AssignmentOperator | AssignmentOperator |
| LValue | LValue |
| BaseLValue | BaseLValue |
| Qualifier | Qualifier |
| ConditionalExpression | ConditionalExpression |
| IfExpression | IfExpression |
| ExpressionOrBlock | ExpressionOrBlock |
| LogicalORExpression | LogicalORExpression |
| LogicalANDExpression | LogicalANDExpression |
| EqualityExpression | EqualityExpression |
| EqualityOperator | EqualityOperator |
| RelationalExpression | RelationalExpression |
| RelationalOperator | RelationalOperator |
| AdditiveExpression | AdditiveExpression |
| AdditiveOperator | AdditiveOperator |
| MultiplicativeExpression | MultiplicativeExpression |
| MultiplicativeOperator | MultiplicativeOperator |
| PowerExpression | PowerExpression |
| UnaryExpression | UnaryExpression |
| UnaryOperator | UnaryOperator |
| QualifiedExpression | QualifiedExpression |
| Arguments | Arguments |
| ArgumentList | ArgumentList |
| FunctionDefOrPrimary | FunctionDefOrPrimary |
| Primary | Primary |
| ShapeDefaultGetter | ShapeDefaultGetter |
| TimelineValue | TimelineValue |
| VariableValue | VariableValue |
| FunctionDefinitionExpression | FunctionDefinitionExpression |
| FunctionBody | FunctionBody |
| FormalParameterList | FormalParameterList |
| Identifier | Identifier |
| IdentifierStart | IdentifierStart |
| IdentifierPart | IdentifierPart |
| UnicodeLetter | UnicodeLetter |
| UnicodeCombiningMark | UnicodeCombiningMark |
| UnicodeDigit | UnicodeDigit |
| UnicodeConnectorPunctuation | UnicodeConnectorPunctuation |
| Boolean | Boolean |
| Color | Color |
| ColorModel | ColorModel |
| ColorComponents | ColorComponents |
| HexNibble | HexNibble |
| HexByte | HexByte |
| String | String |
| TripleDoubleStringCharacter | TripleDoubleStringCharacter |
| TripleSingleStringCharacter | TripleSingleStringCharacter |
| DoubleStringCharacter | DoubleStringCharacter |
| SingleStringCharacter | SingleStringCharacter |
| LineContinuation | LineContinuation |
| EscapeSequence | EscapeSequence |
| CharacterEscapeSequence | CharacterEscapeSequence |
| SingleEscapeCharacter | SingleEscapeCharacter |
| NonEscapeCharacter | NonEscapeCharacter |
| EscapeCharacter | EscapeCharacter |
| HexEscapeSequence | HexEscapeSequence |
| UnicodeEscapeSequence | UnicodeEscapeSequence |
| Position | Position |
| SetTime | SetTime |
| AnimationSequence | AnimationSequence |
| Animation | Animation |
| AnimationParams | AnimationParams |
| AnimationParam | AnimationParam |
| GroupExpression | GroupExpression |
| ShapeName | ShapeName |
| ShapeDefaultSetter | ShapeDefaultSetter |
| Shape | Shape |
| MoveDistance | MoveDistance |
| SkipArgs | SkipArgs |
| LineOrAbbrev | LineOrAbbrev |
| FromPosition | FromPosition |
| ToPosition | ToPosition |
| ThenToPosition | ThenToPosition |
| DirectionalWaypoint | DirectionalWaypoint |
| DirectionalComponent | DirectionalComponent |
| PositionValue | PositionValue |
| SECommon | SECommon |
| SELabel | SELabel |
| RichLabel | RichLabel |
| LabelTextAttr | LabelTextAttr |
| SEPos | SEPos |
| SERadius | SERadius |
| SERadii | SERadii |
| SESize | SESize |
| SEFill | SEFill |
| SEStroke | SEStroke |
| SEStrokeAttr | SEStrokeAttr |
| SERotation | SERotation |
| SELineEndings | SELineEndings |
| LinePath | LinePath |
| SELineEndStart | SELineEndStart |
| SELineEndEnd | SELineEndEnd |
| SELineLength | SELineLength |
| SELineDraw | SELineDraw |
| SELineShape | SELineShape |
| SELineLabel | SELineLabel |
| SEOpacity | SEOpacity |
| SEBehind | SEBehind |
| SESame | SESame |
| SEClass | SEClass |
| SEText | SEText |
| SETurn | SETurn |
| WithConstraint | WithConstraint |
| Cardinal | Cardinal |
| CardinalVector | CardinalVector |
| Number | Number |
| ActualNumber | ActualNumber |
| SimpleDecimalNumber | SimpleDecimalNumber |
| DecimalDigit | DecimalDigit |
| DecimalIntegerLiteral | DecimalIntegerLiteral |
| ExponentPart | ExponentPart |
| DecimalPoint | DecimalPoint |
| ArrayOrRange | ArrayOrRange |
| ElementList | ElementList |
| FontSpec | FontSpec |
| SystemFont | SystemFont |
| FontProperties | FontProperties |
| BeforeSizeProperty | BeforeSizeProperty |
| FontStyle | FontStyle |
| FontVariant | FontVariant |
| FontWeight | FontWeight |
| FontStretch | FontStretch |
| Percent | Percent |
| FontSize | FontSize |
| ActualFontSize | ActualFontSize |
| LineHeight | LineHeight |
| SizeUnit | SizeUnit |
| FontFamilyNames | FontFamilyNames |
| FontFamilyName | FontFamilyName |
| ObliqueAngle | ObliqueAngle |
| AngleUnit | AngleUnit |
| IgnoreNormal | IgnoreNormal |
| _ | _ |
| __ | __ |
| EOF | EOF |
| WhiteSpace | WhiteSpace |
| LineTerminator | LineTerminator |
| LineTerminatorSequence | LineTerminatorSequence |
| Comment | Comment |
