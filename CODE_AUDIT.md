# Code Audit Report

## Remaining Issues

### Type Workarounds

| Location | Problem | Fix |
|----------|---------|-----|
| `src/render-to-string.ts:86` | Cast `svgElement as unknown as SVGElement` for linkedom compatibility | ✓ Documented with comment (unavoidable) |
| `src/shapes/_base.ts:101` | `parentGroup?: any` with comment "to avoid circular import" | Use proper forward reference or restructure imports |
| `src/jp-web.ts:445` | `(parsed.error as any).location` | Define proper error type with location property |
| `src/renderers/svg/label.ts:9` | `(MDModule as any).default` for CJS/ESM interop | Document the interop pattern with comment |
| `src/visitor.ts:8` | `[visitor: string]: any` with TODO comment | Define proper visitor method signatures |

### Incomplete Implementations

| Location | Problem | Fix |
|----------|---------|-----|
| `src/shapes/line_like.ts:20-23,45` | Getters/setters throw "not implemented" | These are abstract — consider using abstract class |
| `src/integrations/lume.ts:13-18` | Placeholder Lume types with "in a real setup" comment | Either import real types or document duck-typing is intentional |

*Fixed:* `src/shapes/slabel.ts` crossfade stubs - moved default no-op implementations to `SBase`.

### Code Duplication (FIXED)

Created `src/render-utils.ts` with shared utilities:
- `nullLogger` - no-op logger function
- `calculateBoundingBox()` - compute bounds from shapes
- `viewBoxFromBounds()` - generate viewBox attribute

Updated `browser.ts` and `render-to-string.ts` to use shared utilities.
Fixed `cli.ts` to use destructuring with defaults.

### TODOs Still in Code

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

### Style Inconsistencies

| Location | Problem | Fix |
|----------|---------|-----|
| `src/browser.ts:108` vs `src/render-to-string.ts:142` | Different error handling patterns (one checks RTE, one doesn't) | Standardize error handling |
| Various | Mix of `console.error` for real errors vs `console.log` for debug | Use logger abstraction |

### Design Issues

| Location | Problem | Fix |
|----------|---------|-----|
| `src/shapes/_base.ts:101` | Uses `any` to avoid circular imports | Reorganize module structure |
| `src/shapes/line_like.ts` | Runtime errors for "abstract" methods | Use TypeScript abstract classes |
| `src/renderers/svg/label.ts` | CJS/ESM interop hack for simple-markdown | Find ESM-native alternative or document workaround |
