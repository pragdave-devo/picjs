// environment.ts — Lexical scoping for the new DSL evaluator
// Part of the DSL overhaul (Phase 0)

import type { PicValue } from './values.ts';

export class Environment {
  private bindings: Map<string, PicValue> = new Map();
  private parent: Environment | null;

  constructor(parent: Environment | null = null) {
    this.parent = parent;
  }

  /** Lookup a variable, walking the scope chain */
  get(name: string): PicValue | undefined {
    const val = this.bindings.get(name);
    if (val !== undefined) return val;
    if (this.parent) return this.parent.get(name);
    return undefined;
  }

  /** Update nearest scope that has this binding, or create in current scope */
  set(name: string, value: PicValue): void {
    let env: Environment | null = this;
    while (env) {
      if (env.bindings.has(name)) {
        env.bindings.set(name, value);
        return;
      }
      env = env.parent;
    }
    // Not found anywhere — define in current scope
    this.bindings.set(name, value);
  }

  /** Define in current scope only (for function parameters, loop variables) */
  define(name: string, value: PicValue): void {
    this.bindings.set(name, value);
  }

  /** Create a child scope */
  child(): Environment {
    return new Environment(this);
  }

  /** Check if a binding exists anywhere in the scope chain */
  has(name: string): boolean {
    if (this.bindings.has(name)) return true;
    if (this.parent) return this.parent.has(name);
    return false;
  }
}
