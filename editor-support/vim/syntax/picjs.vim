" Vim syntax file
" Language:    picjs (pikchr dialect)
" Maintainer:  Generated for picjs project
" Last Change: 2026-03-16
" Filenames:   *.picjs, *.pikchr

if exists("b:current_syntax")
  finish
endif

" Case sensitive
syn case match

" Comments
syn match   picjsComment      "#.*$"
syn match   picjsComment      "//.*$"
syn region  picjsComment      start="/\*" end="\*/"

" Strings
syn region  picjsString       start=+"+ skip=+\\\\\|\\"+ end=+"+ contains=picjsInterpolation
syn region  picjsInterpolation start="\${" end="}" contained

" Numbers
syn match   picjsNumber       "\<\d\+\>"
syn match   picjsNumber       "\<\d\+\.\d*\>"
syn match   picjsNumber       "\.\d\+\>"
syn match   picjsNumber       "\<0x[0-9a-fA-F]\+\>"

" Units
syn match   picjsUnit         "\<\d\+\(\.\d*\)\?\(in\|cm\|mm\|pt\|px\|pc\)\>"
syn match   picjsUnit         "\<\d\+%"

" Shape classes
syn keyword picjsShape        box circle ellipse oval cylinder diamond file
syn keyword picjsShape        dot text line arrow spline arc move

" Directions
syn keyword picjsDirection    right down left up
syn keyword picjsDirection    n ne e se s sw w nw
syn keyword picjsDirection    north south east west

" Position keywords
syn keyword picjsPosition     at from to with of the then go close
syn keyword picjsPosition     above below center top bottom
syn keyword picjsPosition     start end between way heading

" Attributes
syn keyword picjsAttribute    width wid height ht radius rad diameter
syn keyword picjsAttribute    thickness color fill
syn keyword picjsAttribute    dashed dotted solid thick thin invis invisible
syn keyword picjsAttribute    fit same behind chop cw ccw
syn keyword picjsAttribute    ljust rjust aligned
syn keyword picjsAttribute    bold italic mono monospace big small

" Control structures
syn keyword picjsControl      define for in do step if else
syn keyword picjsControl      print assert

" Special references
syn keyword picjsReference    last first previous this
syn match   picjsOrdinal      "\<\d\+\(st\|nd\|rd\|th\)\>"

" Functions
syn keyword picjsFunction     abs cos sin sqrt int max min dist
syn keyword picjsFunction     d2r r2d rgb hsl oklch

" Built-in variables
syn keyword picjsBuiltin      arcrad arrowhead arrowht arrowwid
syn keyword picjsBuiltin      boxht boxrad boxwid charht charwid
syn keyword picjsBuiltin      circlerad color cylht cylrad cylwid
syn keyword picjsBuiltin      dashwid diamondht diamondwid dotrad
syn keyword picjsBuiltin      ellipseht ellipsewid fileht filerad filewid
syn keyword picjsBuiltin      fill fontscale lineht linewid movewid
syn keyword picjsBuiltin      ovalht ovalwid scale textht textwid thickness

" Constants
syn match   picjsConstant     "\$pi\>"
syn match   picjsConstant     "\$2pi\>"

" Color names (common ones)
syn keyword picjsColor        red green blue yellow cyan magenta black white
syn keyword picjsColor        gray grey orange pink purple brown
syn keyword picjsColor        lightblue lightgreen darkblue darkgreen
syn keyword picjsColor        None Off

" Labels (start with uppercase)
syn match   picjsLabel        "\<[A-Z][A-Za-z0-9_]*\>"

" User variables
syn match   picjsVariable     "\<[a-z_][a-z0-9_]*\>"
syn match   picjsVariable     "\$[a-zA-Z_][a-zA-Z0-9_]*"
syn match   picjsVariable     "@[a-zA-Z_][a-zA-Z0-9_]*"

" Operators
syn match   picjsOperator     "[+\-*/=<>]"
syn match   picjsOperator     "<->"
syn match   picjsOperator     "<-"
syn match   picjsOperator     "->"
syn match   picjsOperator     "+="
syn match   picjsOperator     "-="
syn match   picjsOperator     "\*="
syn match   picjsOperator     "/="

" Compass points on objects
syn match   picjsEdgepoint    "\.\(n\|ne\|e\|se\|s\|sw\|w\|nw\|c\|center\)\>"
syn match   picjsEdgepoint    "\.\(north\|south\|east\|west\)\>"
syn match   picjsEdgepoint    "\.\(top\|bot\|bottom\|left\|right\)\>"
syn match   picjsEdgepoint    "\.\(start\|end\)\>"

" Property access
syn match   picjsProperty     "\.\(x\|y\|wid\|width\|ht\|height\)\>"
syn match   picjsProperty     "\.\(rad\|radius\|diameter\|thickness\)\>"
syn match   picjsProperty     "\.\(color\|fill\|dashed\|dotted\)\>"

" Brackets
syn match   picjsBracket      "[\[\](){}]"

" Define highlighting
hi def link picjsComment      Comment
hi def link picjsString       String
hi def link picjsInterpolation Special
hi def link picjsNumber       Number
hi def link picjsUnit         Number
hi def link picjsShape        Keyword
hi def link picjsDirection    Statement
hi def link picjsPosition     Keyword
hi def link picjsAttribute    Type
hi def link picjsControl      Conditional
hi def link picjsReference    Special
hi def link picjsOrdinal      Special
hi def link picjsFunction     Function
hi def link picjsBuiltin      Identifier
hi def link picjsConstant     Constant
hi def link picjsColor        Constant
hi def link picjsLabel        Label
hi def link picjsVariable     Identifier
hi def link picjsOperator     Operator
hi def link picjsEdgepoint    Special
hi def link picjsProperty     Special
hi def link picjsBracket      Delimiter

let b:current_syntax = "picjs"
