// values.ts — Rich value type system for the new DSL evaluator
// Part of the DSL overhaul (Phase 0)

import type { PPoint, PClass, PObj } from './types.ts';
import type { AnimationDescriptor } from './animation.ts';

// The PicValue tagged union
export type PicValue =
  | { tag: "number";     val: number }
  | { tag: "string";     val: string }
  | { tag: "boolean";    val: boolean }
  | { tag: "position";   val: PPoint }
  | { tag: "color";      val: number }        // packed 0xRRGGBB, -1 = none
  | { tag: "list";       val: PicValue[] }
  | { tag: "function";   val: PicFunction }
  | { tag: "shapeclass"; val: PClass }
  | { tag: "obj";        val: PObj }          // reference to a shape
  | { tag: "animation";  val: AnimationDescriptor }  // animation descriptor
  | { tag: "null" }

export interface PicFunction {
  params: string[];
  body: AstStmt[];
  closure: Environment | null;
}

// Forward reference — avoid circular import
import type { AstStmt } from './ast.ts';
import type { Environment } from './environment.ts';

// Constructors
export function mkNum(val: number): PicValue { return { tag: "number", val }; }
export function mkStr(val: string): PicValue { return { tag: "string", val }; }
export function mkBool(val: boolean): PicValue { return { tag: "boolean", val }; }
export function mkPos(x: number | PPoint, y?: number): PicValue {
  if (typeof x === 'number') return { tag: "position", val: { x, y: y! } };
  return { tag: "position", val: x };
}
export function mkColor(val: number): PicValue { return { tag: "color", val }; }
export function mkList(val: PicValue[]): PicValue { return { tag: "list", val }; }
export function mkFn(val: PicFunction): PicValue { return { tag: "function", val }; }
export function mkShapeClass(val: PClass): PicValue { return { tag: "shapeclass", val }; }
export function mkObj(val: PObj): PicValue { return { tag: "obj", val }; }
export function mkAnim(val: AnimationDescriptor): PicValue { return { tag: "animation", val }; }
export function mkNull(): PicValue { return { tag: "null" }; }

// Coercion helpers
export function toNumber(v: PicValue): number {
  switch (v.tag) {
    case "number":  return v.val;
    case "boolean": return v.val ? 1 : 0;
    case "color":   return v.val;
    case "null":    return 0;
    default:        return NaN;
  }
}

export function toString(v: PicValue): string {
  switch (v.tag) {
    case "string":    return v.val;
    case "number":    return String(v.val);
    case "boolean":   return v.val ? "yes" : "no";
    case "color":     return `#${(v.val >>> 0).toString(16).padStart(6, '0')}`;
    case "position":  return `(${v.val.x},${v.val.y})`;
    case "list":      return `[${v.val.map(toString).join(', ')}]`;
    case "function":  return `<fn(${v.val.params.join(', ')})>`;
    case "shapeclass": return v.val.zName;
    case "obj":       return `<shape${v.val.type ? ':' + v.val.type.zName : ''}>`;
    case "animation": return `<animation:${v.val.id}>`;
    case "null":      return "null";
  }
}

export function toBoolean(v: PicValue): boolean {
  switch (v.tag) {
    case "boolean":   return v.val;
    case "number":    return v.val !== 0;
    case "string":    return v.val.length > 0;
    case "list":      return v.val.length > 0;
    case "null":      return false;
    default:          return true;
  }
}

export function toPosition(v: PicValue): PPoint | null {
  if (v.tag === "position") return v.val;
  return null;
}

export function toColor(v: PicValue): number {
  switch (v.tag) {
    case "color":  return v.val;
    case "number": return v.val;
    default:       return -1;
  }
}

export function valuesEqual(a: PicValue, b: PicValue): boolean {
  if (a.tag !== b.tag) return false;
  switch (a.tag) {
    case "number":    return a.val === (b as typeof a).val;
    case "string":    return a.val === (b as typeof a).val;
    case "boolean":   return a.val === (b as typeof a).val;
    case "color":     return a.val === (b as typeof a).val;
    case "position": {
      const bp = (b as typeof a).val;
      return a.val.x === bp.x && a.val.y === bp.y;
    }
    case "null":      return true;
    case "list": {
      const bl = (b as typeof a).val;
      if (a.val.length !== bl.length) return false;
      return a.val.every((v, i) => valuesEqual(v, bl[i]));
    }
    default:          return a === b;
  }
}

// ============================================================
// Double Dispatch Operator Table
// ============================================================

export type BinOp = '+' | '-' | '*' | '/' | '%';
type OpHandler = (left: PicValue, right: PicValue) => PicValue;

// Partial table: [leftTag][rightTag][op] → handler
// Missing entries return null (unsupported operation)
type OpTable = Partial<Record<string, Partial<Record<string, Partial<Record<BinOp, OpHandler>>>>>>;

const opTable: OpTable = {
  number: {
    number: {
      '+': (l, r) => mkNum((l as {tag:"number",val:number}).val + (r as {tag:"number",val:number}).val),
      '-': (l, r) => mkNum((l as {tag:"number",val:number}).val - (r as {tag:"number",val:number}).val),
      '*': (l, r) => mkNum((l as {tag:"number",val:number}).val * (r as {tag:"number",val:number}).val),
      '/': (l, r) => mkNum((l as {tag:"number",val:number}).val / (r as {tag:"number",val:number}).val),
      '%': (l, r) => mkNum((l as {tag:"number",val:number}).val % (r as {tag:"number",val:number}).val),
    },
    position: {
      '*': (l, r) => {
        const n = (l as {tag:"number",val:number}).val;
        const p = (r as {tag:"position",val:PPoint}).val;
        return mkPos(n * p.x, n * p.y);
      },
    },
  },
  string: {
    string: {
      '+': (l, r) => mkStr((l as {tag:"string",val:string}).val + (r as {tag:"string",val:string}).val),
    },
  },
  list: {
    list: {
      '+': (l, r) => mkList([...(l as {tag:"list",val:PicValue[]}).val, ...(r as {tag:"list",val:PicValue[]}).val]),
    },
  },
  position: {
    position: {
      '+': (l, r) => {
        const lp = (l as {tag:"position",val:PPoint}).val;
        const rp = (r as {tag:"position",val:PPoint}).val;
        return mkPos(lp.x + rp.x, lp.y + rp.y);
      },
      '-': (l, r) => {
        const lp = (l as {tag:"position",val:PPoint}).val;
        const rp = (r as {tag:"position",val:PPoint}).val;
        return mkPos(lp.x - rp.x, lp.y - rp.y);
      },
    },
    number: {
      '+': (l, r) => {
        const p = (l as {tag:"position",val:PPoint}).val;
        const n = (r as {tag:"number",val:number}).val;
        return mkPos(p.x + n, p.y + n);
      },
      '-': (l, r) => {
        const p = (l as {tag:"position",val:PPoint}).val;
        const n = (r as {tag:"number",val:number}).val;
        return mkPos(p.x - n, p.y - n);
      },
      '*': (l, r) => {
        const p = (l as {tag:"position",val:PPoint}).val;
        const n = (r as {tag:"number",val:number}).val;
        return mkPos(p.x * n, p.y * n);
      },
      '/': (l, r) => {
        const p = (l as {tag:"position",val:PPoint}).val;
        const n = (r as {tag:"number",val:number}).val;
        return mkPos(p.x / n, p.y / n);
      },
    },
  },
};

/**
 * Apply a binary operator to two values using double dispatch.
 * Returns null if the operation is not supported for the given types.
 */
export function applyBinOp(op: BinOp, left: PicValue, right: PicValue): PicValue | null {
  const handler = opTable[left.tag]?.[right.tag]?.[op];
  return handler ? handler(left, right) : null;
}
