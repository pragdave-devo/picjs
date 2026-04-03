import { SBase } from "./shapes.js"
import { RTE } from "./runtime_error.js"

// Directed dependency graph over shapes and variables.
//
// An edge (A depends on B) means: when B changes, A needs re-evaluation.
// B can be a shape (SBase) or a variable name (string).
//
// We maintain both directions:
//   - dependencies: A → {B, C, ...}  (what A depends on — for topo sort)
//   - dependents:   B → {A, ...}     (what depends on B — for dirty propagation)
//
// evaluationOrder() returns all tracked shapes in topological order
// (dependencies before dependents), so callers can safely re-evaluate
// each shape knowing its inputs are already up-to-date.
// Only shape→shape edges participate in the topo sort.

export type DependencySource = SBase | string

export class DependencyGraph {

  private dependencies = new Map<SBase, Set<DependencySource>>()   // A → things A depends on
  private dependents   = new Map<DependencySource, Set<SBase>>()   // B → things that depend on B

  add(dependent: SBase, dependency: DependencySource): void {
    if (dependent === dependency) return  // self-dependency is a no-op

    let deps = this.dependencies.get(dependent)
    if (!deps) {
      deps = new Set()
      this.dependencies.set(dependent, deps)
    }
    deps.add(dependency)

    let revDeps = this.dependents.get(dependency)
    if (!revDeps) {
      revDeps = new Set()
      this.dependents.set(dependency, revDeps)
    }
    revDeps.add(dependent)
  }

  // Direct dependents of a shape or variable — shapes that depend on it.
  dependentsOf(source: DependencySource): SBase[] {
    return [...(this.dependents.get(source) ?? [])]
  }

  // All tracked shapes in safe re-evaluation order: dependencies before dependents.
  // Only considers shape→shape edges for ordering.
  // Raises RTE if a dependency cycle is detected.
  evaluationOrder(): SBase[] {
    const result: SBase[] = []
    const state = new Map<SBase, `in-progress` | `done`>()

    const allVertices = new Set<SBase>()
    for (const key of this.dependencies.keys()) allVertices.add(key)
    for (const [key, deps] of this.dependents) {
      if (typeof key !== 'string') allVertices.add(key)
      for (const dep of deps) allVertices.add(dep)
    }

    for (const vertex of allVertices) {
      if (!state.has(vertex)) {
        this.traverse(vertex, state, result)
      }
    }

    return result
  }

  // Collect all shapes that transitively depend on a shape (for dirty propagation).
  // Returns them in evaluation order.
  propagateDirty(shape: SBase): SBase[] {
    const dirty = new Set<SBase>()
    this.collectTransitiveDependents(shape, dirty)
    const order = this.evaluationOrder()
    return order.filter(s => dirty.has(s))
  }

  // Collect all shapes that transitively depend on a variable.
  propagateDirtyFromVariable(varName: string): SBase[] {
    const dirty = new Set<SBase>()
    this.collectTransitiveDependents(varName, dirty)
    const order = this.evaluationOrder()
    return order.filter(s => dirty.has(s))
  }

  private collectTransitiveDependents(source: DependencySource, dirty: Set<SBase>): void {
    for (const dep of (this.dependents.get(source) ?? [])) {
      if (!dirty.has(dep)) {
        dirty.add(dep)
        this.collectTransitiveDependents(dep, dirty)
      }
    }
  }

  private traverse(
    vertex: SBase,
    state: Map<SBase, `in-progress` | `done`>,
    result: SBase[],
  ): void {
    state.set(vertex, `in-progress`)

    for (const dep of (this.dependencies.get(vertex) ?? [])) {
      // Only traverse shape→shape edges for topo sort (skip variable deps)
      if (typeof dep === 'string') continue
      if (state.get(dep) === `in-progress`) {
        throw new RTE(`Dependency cycle detected: shapes depend on each other`)
      }
      if (!state.has(dep)) {
        this.traverse(dep, state, result)
      }
    }

    state.set(vertex, `done`)
    result.push(vertex)
  }
}
