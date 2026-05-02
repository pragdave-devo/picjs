" Vim syntax file
" Language:   JP (PIC-like diagram language)
" Maintainer: Dave Thomas
" License:    Same as the JP project

if exists('b:current_syntax')
  finish
endif

" --- Comments ---------------------------------------------------------------

syn match   jpComment   '//.*$' contains=jpTodo
syn keyword jpTodo      TODO FIXME XXX HACK NOTE contained

" --- Numbers ----------------------------------------------------------------

syn match   jpNumber    '\v<\d+(\.\d+)?([eE][+-]?\d+)?>'
syn match   jpNumber    '\v\.\d+([eE][+-]?\d+)?>'
syn match   jpPercent   '\v<\d+(\.\d+)?\%'
syn match   jpPercent   '\v\.\d+\%'

" --- Strings ----------------------------------------------------------------

syn region  jpString    start='"' skip='\\\\\|\\"' end='"' contains=jpEscape
syn region  jpString    start="'" skip="\\\\\\|\\'" end="'" contains=jpEscape
syn match   jpEscape    '\\[bfnrtv\\"'"'"']' contained
syn match   jpEscape    '\\x\x\{2}'          contained
syn match   jpEscape    '\\u\x\{2,4}'        contained
syn match   jpEscape    '\\0'                contained

" --- Colors -----------------------------------------------------------------

syn match   jpColorNamed    '\~[a-zA-Z0-9]\+'
syn match   jpColorHex      '#\x\{3,8}\>'
syn match   jpColorModel    '\v<(oklch|rgb|hsl|hsv)a?>' nextgroup=jpColorArgs
syn region  jpColorArgs     start='(' end=')' contained contains=jpNumber,jpPercent transparent

" --- Shape names (capitalized = type-like) ----------------------------------

syn keyword jpShape     Arc Aside Box Circle Ellipse Oval Group Line Label Skip Shape

" --- Shape names (lowercase aliases) ----------------------------------------

syn keyword jpShapeLow  arc box circle ellipse line oval

" --- Layout commands --------------------------------------------------------

syn keyword jpCommand   Face Gap Goto

" --- Control flow -----------------------------------------------------------

syn keyword jpConditional   if else

" --- Booleans ---------------------------------------------------------------

syn keyword jpBoolean   true false

" --- Animation keywords -----------------------------------------------------

syn keyword jpAnimation move rotate draw set then pause

" --- Attribute keywords (contextual, but worth highlighting) ----------------

syn keyword jpAttribute
      \ fill stroke thickness thick solid dotted dashed
      \ width wid height ht length len
      \ radius rad rotation rot
      \ rx ry
      \ align font font_family font_size font_style font_variant font_weight font_stretch
      \ maxwidth line_height stroke_width
      \ same behind nodraw close
      \ opacity fit
      \ above below inside outside
      \ straight stepped step smooth curve curved

" --- Position / constraint keywords -----------------------------------------

syn keyword jpKeyword   from to at with

" --- Direction keywords -----------------------------------------------------

syn keyword jpDirection
      \ north northeast northwest
      \ south southeast southwest
      \ east west
      \ up down left right
      \ n ne nw s se sw e w

" --- Waypoint / path keywords -----------------------------------------------

syn keyword jpKeyword   until even level about

" --- Animation parameters ---------------------------------------------------

syn keyword jpAnimParam take ease each about by

" --- Turn direction ---------------------------------------------------------

syn keyword jpAttribute cw ccw turn

" --- Operators --------------------------------------------------------------

syn match   jpArrow     '\v\<[-~][-~]?\>'
syn match   jpArrow     '\v[-~][-~]?\>'
syn match   jpArrow     '\v\<[-~]\>'
syn match   jpOperator  '\V=>'
syn match   jpOperator  '\V@@'
syn match   jpOperator  '\V??'
syn match   jpInspect   '\V??' nextgroup=jpComment

syn match   jpOperator  '[-+*/%^!]'
syn match   jpOperator  '\V=='
syn match   jpOperator  '\V!='
syn match   jpOperator  '\V<='
syn match   jpOperator  '\V>='
syn match   jpOperator  '\V&&'
syn match   jpOperator  '\V||'
syn match   jpOperator  '\V\.\.'

" --- Cardinal point access (.n .se .c etc) ----------------------------------

syn match   jpCardinal  '\.\(nw\|ne\|sw\|se\|n\|s\|e\|w\|c\)\>'

" --- Variables ($-prefixed) -------------------------------------------------

syn match   jpVariable  '\$[a-zA-Z_][a-zA-Z0-9_]*'

" --- Self reference ---------------------------------------------------------

syn keyword jpSelf      self

" --- Timeline reference -----------------------------------------------------

syn match   jpTimeline  '@\>'

" --- Shape class (.normal, .h1, .pole, etc) ---------------------------------

syn match   jpClass     '\<\(Arc\|Aside\|Box\|Circle\|Ellipse\|Group\|Oval\|Line\|Label\|Skip\)\(\.[a-zA-Z_][a-zA-Z0-9_]*\)\+' contains=jpShape

" --- Size expression (e.g. 20x150, 150%) -----------------------------------

syn match   jpSizeExpr  '\v<\d+\s*[x\u00D7]\s*\d+'

" --- Line endings -----------------------------------------------------------

syn match   jpLineEnd   '\v\<[-~][-~]?\>'
syn match   jpLineEnd   '\v[-~][-~]?\>'

" --- Highlighting links -----------------------------------------------------

hi def link jpComment       Comment
hi def link jpTodo          Todo
hi def link jpNumber        Number
hi def link jpPercent       Number
hi def link jpString        String
hi def link jpEscape        SpecialChar

hi def link jpColorNamed    Constant
hi def link jpColorHex      Constant
hi def link jpColorModel    Type

hi def link jpShape         Type
hi def link jpShapeLow      Type
hi def link jpCommand       Statement
hi def link jpConditional   Conditional
hi def link jpBoolean       Boolean
hi def link jpAnimation     Keyword

hi def link jpAttribute     Identifier
hi def link jpKeyword       Keyword
hi def link jpDirection     Special
hi def link jpAnimParam     Keyword

hi def link jpOperator      Operator
hi def link jpInspect       Debug
hi def link jpArrow         Delimiter
hi def link jpCardinal      Special
hi def link jpVariable      Identifier
hi def link jpSelf          Special
hi def link jpTimeline      Special
hi def link jpClass         Type
hi def link jpSizeExpr      Number
hi def link jpLineEnd       Delimiter

let b:current_syntax = 'jp'
