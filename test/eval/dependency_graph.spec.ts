import { DependencyGraph } from "../../src/dependency_graph.js"

// Minimal stand-in for SBase: just needs reference identity
function shape(name: string): any {
  return { shapeName: name }
}

describe(`DependencyGraph`, () => {

  describe(`add`, () => {
    it(`records a dependent`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`)
      g.add(a, b)
      expect(g.dependentsOf(b)).toContain(a)
    })

    it(`allows multiple dependents on one shape`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`), c = shape(`c`)
      g.add(a, c)
      g.add(b, c)
      expect(g.dependentsOf(c)).toContain(a)
      expect(g.dependentsOf(c)).toContain(b)
    })

    it(`ignores self-dependencies`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`)
      g.add(a, a)
      expect(g.dependentsOf(a)).toHaveLength(0)
    })
  })

  describe(`evaluationOrder`, () => {
    it(`returns empty array when graph is empty`, () => {
      const g = new DependencyGraph()
      expect(g.evaluationOrder()).toEqual([])
    })

    it(`returns dependency before dependent`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`)
      g.add(a, b)  // a depends on b
      const order = g.evaluationOrder()
      expect(order.indexOf(b)).toBeLessThan(order.indexOf(a))
    })

    it(`handles a chain a→b→c`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`), c = shape(`c`)
      g.add(a, b)  // a depends on b
      g.add(b, c)  // b depends on c
      const order = g.evaluationOrder()
      expect(order.indexOf(c)).toBeLessThan(order.indexOf(b))
      expect(order.indexOf(b)).toBeLessThan(order.indexOf(a))
    })

    it(`handles a diamond dependency`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`), c = shape(`c`), d = shape(`d`)
      g.add(b, a)  // b depends on a
      g.add(c, a)  // c depends on a
      g.add(d, b)  // d depends on b
      g.add(d, c)  // d depends on c
      const order = g.evaluationOrder()
      expect(order.indexOf(a)).toBeLessThan(order.indexOf(b))
      expect(order.indexOf(a)).toBeLessThan(order.indexOf(c))
      expect(order.indexOf(b)).toBeLessThan(order.indexOf(d))
      expect(order.indexOf(c)).toBeLessThan(order.indexOf(d))
    })

    it(`raises RTE on a cycle`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`)
      g.add(a, b)
      g.add(b, a)
      expect(() => g.evaluationOrder()).toThrow()
    })

    it(`raises RTE on a longer cycle`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`), c = shape(`c`)
      g.add(a, b)
      g.add(b, c)
      g.add(c, a)
      expect(() => g.evaluationOrder()).toThrow()
    })
  })

  describe(`propagateDirty`, () => {
    it(`returns direct dependents`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`)
      g.add(a, b)
      expect(g.propagateDirty(b)).toContain(a)
    })

    it(`returns transitive dependents`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`), c = shape(`c`)
      g.add(a, b)
      g.add(b, c)
      const dirty = g.propagateDirty(c)
      expect(dirty).toContain(a)
      expect(dirty).toContain(b)
    })

    it(`returns dependents in evaluation order`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`), c = shape(`c`)
      g.add(a, b)  // a depends on b
      g.add(b, c)  // b depends on c
      const dirty = g.propagateDirty(c)
      // b must come before a (b is dependency of a)
      expect(dirty.indexOf(b)).toBeLessThan(dirty.indexOf(a))
    })

    it(`does not include the changed shape itself`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`), b = shape(`b`)
      g.add(a, b)
      expect(g.propagateDirty(b)).not.toContain(b)
    })

    it(`returns empty when nothing depends on shape`, () => {
      const g = new DependencyGraph()
      const a = shape(`a`)
      expect(g.propagateDirty(a)).toHaveLength(0)
    })
  })

})
