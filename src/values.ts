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
export function mkPos(val: PPoint): PicValue { return { tag: "position", val }; }
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
