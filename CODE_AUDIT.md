# Code Audit Report

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Type workarounds (`as any`) | 8 | Medium |
| Debugging code left in | 6 | High |
| Commented-out code | 10+ blocks | Medium |
| Incomplete implementations | 4 | Medium |
| Test quality issues | 15+ | Medium |
| Style inconsistencies | 5 | Low |

---

## Source Code Issues

### 1. Type Workarounds

| Location | Problem | Fix |
|----------|---------|-----|
| `src/render-to-string.ts:58` | Uses `as any` inconsistent with other files using `as unknown as` | Change to `PEG as unknown as Peggy.Parser` |
| `src/render-to-string.ts:83` | Cast `svgElement as unknown as SVGElement` for linkedom compatibility | Add comment explaining why cast is needed |
| `src/browser.ts:39` | Same PEG parser cast pattern | Consider a typed factory function |
| `src/index.ts:18` | Same PEG parser cast | Same — all three files repeat this pattern |
| `src/shapes/_base.ts:101` | `parentGroup?: any` with comment "to avoid circular import" | Use proper forward reference or restructure imports |
| `src/jp-web.ts:445` | `(parsed.error as any).location` | Define proper error type with location property |
| `src/renderers/svg/label.ts:9` | `(MDModule as any).default` for CJS/ESM interop | Document the interop pattern with comment |
| `src/visitor.ts:8` | `[visitor: string]: any` with TODO comment | Define proper visitor method signatures |

### 2. Debugging Code Left In

| Location | Problem | Fix |
|----------|---------|-----|
| `src/interpreter.ts:472` | `console.log("what", node.what)` — active debug log | Remove |
| `src/jp.ts:24,27,30,35` | Multiple `console.log` for program/AST output | Remove or gate behind debug flag |
| `src/jp-web.ts:528` | `console.log("mounting")` | Remove |
| `src/types/iterable.ts:35` | `console.log("FIRST", host)` | Remove |
| `src/binding.ts:196` | `console.log` in what appears to be debug output | Remove or gate behind flag |

### 3. Commented-Out Code

| Location | Problem | Fix |
|----------|---------|-----|
| `src/interpreter.ts:162-164` | Three commented console.log lines | Remove |
| `src/geometry.ts:131,135` | Commented repositioning debug logs | Remove |
| `src/jp.ts:3,31-32` | Commented ToDotVisitor imports/usage | Remove if unused |
| `src/binding.ts:39` | Commented `console.log("set"...)` | Remove |
| `src/parser.ts:40-49` | Tracing console.logs (may be intentional for debugging flag) | Gate behind explicit debug mode |

### 4. Incomplete Implementations

| Location | Problem | Fix |
|----------|---------|-----|
| `src/shapes/slabel.ts:92-100` | Three methods just log "not implemented" | Implement or throw proper NotImplementedError |
| `src/shapes/line_like.ts:20-23,45` | Getters/setters throw "not implemented" | These are abstract — consider using abstract class |
| `src/integrations/lume.ts:13-18` | Placeholder Lume types with "in a real setup" comment | Either import real types or document duck-typing is intentional |

### 5. Algorithm Bug

| Location | Problem | Fix |
|----------|---------|-----|
| `src/integrations/lume.ts:55` | Regex iterates over `page.content` but modifies `content` variable; only first match processed | Change `codeBlockRegex.exec(page.content)` to `codeBlockRegex.exec(content)` |

### 6. Code Duplication

| Location | Problem | Fix |
|----------|---------|-----|
| `src/browser.ts:50`, `src/render-to-string.ts:78` | Identical no-op logger pattern `const logger = () => {}` | Extract to shared utility |
| `src/cli.ts:126,147` | Repeated `options.verbose ?? false` | Use destructuring default |
| `src/browser.ts:56-84`, `src/render-to-string.ts:90-118` | Near-identical bounding box calculation | Extract to shared function |

### 7. TODOs Still in Code

| Location | Problem |
|----------|---------|
| `src/timeline/timeline_runner.ts:48` | `// TODO: Remove renderCallback?` |
| `src/timeline.ts:1` | `// todo: make this switchable` |
| `src/peg_parser/jp.pegjs:214` | `// TODO: combine synonyms` |
| `src/peg_parser/jp.pegjs:387` | `// TODO: is the expression case useful?` |
| `src/interpreter.ts:53` | `// TODO: very fragile, I suspect` |
| `src/interpreter.ts:151` | `// TODO: move me` |
| `src/shapes/_base.ts:411` | `// TODO: find better way` |
| `src/geometry.ts:84` | `// TODO: at some point double dispatch from shapes` |
| `src/types/_base.ts:80,100` | Two TODO comments about type improvements |

---

## Test Issues (FIXED)

The following test issues have been fixed:

- **Debugging code removed** from `test/eval/shapes.spec.ts` (3 console.log statements)
- **Test descriptions fixed** in `test/geometry/basic_positions.spec.ts` (X/Y mismatches corrected)
- **Vague descriptions replaced** in `test/geometry/line_constraints.spec.ts` ("has default" → specific descriptions)
- **Commented-out tests removed** from:
  - `test/geometry/basic_positions.spec.ts`
  - `test/parse/arithmetic_expressions.spec.ts`
  - `test/geometry/line_constraints.spec.ts`
  - `test/eval/assignment.spec.ts` (unused helper functions)

---

## Style Inconsistencies

| Location | Problem | Fix |
|----------|---------|-----|
| `src/render-to-string.ts` | Uses `as any` while other files use `as unknown as X` | Standardize on `as unknown as X` |
| `src/browser.ts:108` vs `src/render-to-string.ts:142` | Different error handling patterns (one checks RTE, one doesn't) | Standardize error handling |
| Various | Mix of `console.error` for real errors vs `console.log` for debug | Use logger abstraction |

---

## Potential Design Issues (indicated by special-case code)

1. **PEG Parser Type**: The repeated `as unknown as Peggy.Parser` cast in three files suggests the PEG module's types don't match expectations. Consider creating a properly typed wrapper.

2. **Circular Import Avoidance**: `src/shapes/_base.ts:101` uses `any` to avoid circular imports. This suggests the module structure could be reorganized.

3. **Abstract Methods via Throws**: `src/shapes/line_like.ts` uses runtime errors for "abstract" methods. TypeScript abstract classes would be cleaner.

4. **CJS/ESM Interop**: The `simple-markdown` interop hack in label.ts suggests dependency issues. Consider finding an ESM-native alternative or documenting the workaround properly.
