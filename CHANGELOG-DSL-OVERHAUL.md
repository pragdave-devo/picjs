# DSL Overhaul Changelog

This documents all changes made in the `dsl-overhaul` branch for updating documentation and skills.

## Overview

The DSL overhaul replaces the old eager-evaluation parser with a two-phase AST-based architecture:
1. **Parse phase**: Source → Tokenizer → AST (abstract syntax tree)
2. **Eval phase**: AST → Evaluator → PObj list → Layout → SVG

New files: `ast.ts`, `values.ts`, `environment.ts`, `parser2.ts`, `evaluator.ts`

Feature flag: `setUseNewParser(true/false)` in picjs.ts (default: true)

---

## New Language Features

### Phase 2A: Booleans, Comparisons, Logical Operators

**Boolean literals**
```
$flag = yes
$other = no
```

**Comparison operators**
```
$x = 5 > 3        # yes
$y = 10 == 10     # yes
$z = 5 != 3       # yes
$a = 5 >= 5       # yes
$b = 3 <= 5       # yes
```

**Logical operators**
```
$both = yes and yes      # yes
$either = yes or no      # yes
$neg = not no            # yes
```

**Comparisons with arithmetic**
```
$result = (2 + 3) > 4    # yes
```

### Phase 2A: List Literals

**List creation**
```
$colors = ["red", "blue", "green"]
$nums = [1, 2, 3, 4, 5]
$mixed = [1, "hello", yes]
```

**List indexing** (0-based)
```
$first = $colors[0]      # "red"
$second = $nums[1]       # 2
```

### Phase 2B: First-Class Functions

**Function definition**
```
$greet = fn(name) {
  box containing $name
}
```

**Function calls**
```
$greet("Hello")          # statement level
$result = $double(5)     # expression level
```

**Functions producing shapes**
```
$labeled_box = fn(label, col) {
  box $label fill col
}
$labeled_box("Title", LightBlue)
```

**Nested function calls**
```
$outer = fn(x) { $inner(x) }
$inner = fn(x) { box containing $x }
$outer("nested")
```

### Phase 2B: $-Prefixed Variables

**Rich value storage**
- `$`-prefixed variables are stored in the Environment (lexically scoped)
- Support strings, numbers, booleans, lists, functions
- Non-`$` variables remain in the old Pik numeric variable system

```
$name = "Alice"          # string
$count = 42              # number
$flag = yes              # boolean
$items = [1, 2, 3]       # list
$fn = fn(x) { x * 2 }    # function
```

**Backward compatibility**
- `$pi` and `$2pi` still work as before
- Plain variables like `boxwid` unchanged

### Phase 2C: Case Expressions

**Basic pattern matching**
```
case $value {
  1 => { box "one" }
  2 => { box "two" }
  3 => { box "three" }
}
```

**String matching**
```
case $color {
  "red" => { box fill Red }
  "blue" => { box fill Blue }
  "green" => { box fill Green }
}
```

**Case with expressions**
```
$x = 2
case $x * 2 {
  2 => { box "two" }
  4 => { box "four" }
  6 => { box "six" }
}
```

**Case in loops**
```
for i in [1, 2, 3] do {
  case i {
    1 => { circle }
    2 => { box }
    3 => { ellipse }
  }
}
```

**Default arm with `_` or `else`**
```
case $value {
  1 => { box "one" }
  2 => { box "two" }
  _ => { box "other" }      # default: matches anything
}

# Alternative syntax using else
case $value {
  1 => { box "one" }
  else => { box "other" }   # same as _
}
```

### Phase 2D: If/Else Statements

**Basic if**
```
if $x > 3 { box "big" }
```

**If with else**
```
if $flag {
  box "yes"
} else {
  box "no"
}
```

**If with boolean expression**
```
$flag = yes
if $flag { box "on" }

$enabled = $count > 0 and $ready
if $enabled { circle fill Green }
```

**If in loops**
```
for i from 1 to 5 do {
  if i == 3 { box "three" }
}
```

### Containing/Con Attribute

**Set shape text from expression**
```
$label = "Hello World"
box containing $label
box con $label           # short form
```

**With literals**
```
box containing "Static text"
box con 42               # numbers converted to string
```

**In functions**
```
$make_box = fn(text) {
  box containing $text fill LightYellow
}
$make_box("Dynamic!")
```

### String Interpolation

**Variable interpolation in strings**
```
$name = "World"
box "Hello ${name}!"     # "Hello World!"
```

**Expression interpolation**
```
$x = 5
box "Value: ${x * 2}"    # "Value: 10"
```

---

## Architecture Changes

### New Files

| File | Purpose |
|------|---------|
| `src/ast.ts` | AST node type definitions |
| `src/values.ts` | Runtime value types (VNumber, VString, VList, VFunction, etc.) |
| `src/environment.ts` | Lexically-scoped variable environment |
| `src/parser2.ts` | New recursive descent parser producing AST |
| `src/evaluator.ts` | AST evaluator producing shapes |

### Pipeline Change

**Old pipeline:**
```
Source → Tokenizer → Parser (eager eval) → PObj list → Layout → SVG
```

**New pipeline:**
```
Source → Tokenizer → Parser2 (AST) → Evaluator → PObj list → Layout → SVG
```

### Macro Handling

- `define` statements are processed eagerly during parsing (not evaluation)
- This ensures macros are available for subsequent code in the same file
- Macro expansion still happens in the tokenizer via `TokenStream`

### Keywords Table

- Keywords in `constants.ts` MUST be sorted by ASCII order
- Digits sort before letters: `d2r < dashed`, `r2d < rad`
- Binary search requires strict ordering

---

### Phase 2E: List Operations

**Basic list functions** (all return new lists, never mutate):
```
len($list)        # length of list or string
head($list)       # first element
last($list)       # last element
push($list, $v)   # append element
pop($list)        # remove last element
shift($list)      # remove first element
unshift($list, $v) # prepend element
reverse($list)    # reverse list or string
contains($list, $v) # membership test (returns boolean)
```

**String/list conversion:**
```
join($list, $sep)  # join list elements with separator
split($str, $sep)  # split string into list
```

**Concatenation with `+`:**
```
$a = [1, 2] + [3, 4]    # [1, 2, 3, 4]
$s = "hello" + "_world" # "hello_world"
```

**Range expressions:**
```
[1..5]          # [1, 2, 3, 4, 5]
[5..1]          # [5, 4, 3, 2, 1] (descending)
["A".."E"]      # ["A", "B", "C", "D", "E"]
["X1".."X5"]    # ["X1", "X2", "X3", "X4", "X5"] (multi-char, vary last)
```

**Range in for loops:**
```
for i in [1..5] do { box containing i }
for $ch in ["A".."C"] do { box containing $ch }  # string values need $-prefix
```

**Higher-order functions:**
```
# map: apply function to each element, return new list
$double = fn($x) { $result = $x * 2 }
$doubled = map([1, 2, 3], $double)  # [2, 4, 6]

# filter: keep elements where function returns truthy
$even = fn($x) { $result = ($x / 2) == int($x / 2) }
$evens = filter([1, 2, 3, 4], $even)  # [2, 4]

# sort: return sorted list (numbers by value, strings lexically)
$sorted = sort([3, 1, 2])  # [1, 2, 3]
```

## Test Coverage

- 166 tests passing (64 backward-compat + 102 new feature tests)
- Test file: `src/test-new-parser.ts`
- All original examples still render identically

---

## Grammar Updates

All new syntax is documented in `GRAMMAR.md`:
- `case_stmt` production
- `fncall_stmt` production
- `containing_attr` production
- Boolean literals (`yes`, `no`)
- Comparison and logical operators
- List literals and indexing
- Function definitions (`fn`)
- `$`-prefixed variables

---

## Migration Notes

### For Users

- All existing PIC/pikchr code continues to work unchanged
- New features are additive; no breaking changes
- Use `$`-prefixed variables for strings, lists, and functions
- Use plain variables for numeric values (backward compat)

### For Documentation

Update these sections:
1. Variable assignment - add `$` prefix for rich values
2. Expressions - add boolean, comparison, logical operators
3. Control flow - add `case` statement
4. Functions - new section for `fn` definitions
5. Attributes - add `containing`/`con`
6. Strings - add interpolation syntax `${expr}`
