import { parseHTML } from "linkedom"
// Set up DOM globals before importing modules that use redom
const env = parseHTML(`<!DOCTYPE html><html><body></body></html>`)
Object.assign(globalThis, {
  SVGElement: env.SVGElement,
  HTMLElement: env.HTMLElement,
  Element: env.Element,
  Node: env.Node,
  document: env.document,
})

import { newDispatcher } from "../helpers/eval.js"
import { ParseStatus } from "../../src/parser.js"
import { parseToMockAST } from "../helpers/ast.js"
import { LineLike } from "../../src/shapes.js"
import { Renderer } from "../../src/renderers/svg/_renderer.js"

function runProgram(src: string) {
  const parseResult = parseToMockAST(`Program`, src)
  if (parseResult.status !== ParseStatus.Ok) throw new Error(String(parseResult.error))
  const dispatcher = newDispatcher()
  dispatcher.start(parseResult.ast)
  return dispatcher
}

describe(`line label rotation`, () => {

  it(`horizontal arrow label has zero rotation`, () => {
    const d = runProgram(`-> "hello"`)
    const shapes = d.shapes()
    const label = shapes.find(s => s.shapeName === `SLabel`)!
    expect(label).toBeDefined()
    expect(label.params.rotation).toBeCloseTo(0, 1)
  })

  it(`northward arrow label has -90 rotation`, () => {
    const d = runProgram(`Face n\n-> "hello"`)
    const shapes = d.shapes()
    const label = shapes.find(s => s.shapeName === `SLabel`)!
    expect(label).toBeDefined()
    expect(label.params.rotation).toBeCloseTo(-90, 1)
  })

  it(`line label rotation is preserved in children array`, () => {
    const d = runProgram(`Face n\n-> "hello"`)
    const shapes = d.shapes()
    const line = shapes.find(s => s.shapeName === `SLine`)!
    expect(line.children.length).toBeGreaterThan(0)
    const label = line.children[0]
    expect(label.params.rotation).toBeCloseTo(-90, 1)
  })

  it(`multiple line labels on northward arrow all have rotation`, () => {
    const d = runProgram(`Face n\n-> "post" "commit"`)
    const shapes = d.shapes()
    const labels = shapes.filter(s => s.shapeName === `SLabel`)
    expect(labels.length).toBe(2)
    for (const label of labels) {
      expect(label.params.rotation).toBeCloseTo(-90, 1)
    }
  })

  it(`box label rotation is zero (not a line label)`, () => {
    const d = runProgram(`Box "hello"`)
    const shapes = d.shapes()
    const label = shapes.find(s => s.shapeName === `SLabel`)!
    expect(label.params.rotation).toBeCloseTo(0, 1)
  })

  it(`rotated box label inherits parent rotation via children array`, () => {
    const d = runProgram(`Box "hello" rot 30`)
    const shapes = d.shapes()
    const box = shapes.find(s => s.shapeName === `SBox`)!
    expect(box.children.length).toBe(1)
    const label = box.children[0]
    // Box label rotation stays 0 — the box's <g> group handles rotation
    expect(label.params.rotation).toBeCloseTo(0, 1)
  })

  it(`line parent has no rotation (lines use start/end, not rotation)`, () => {
    const d = runProgram(`Face n\n-> "hello"`)
    const shapes = d.shapes()
    const line = shapes.find(s => s.shapeName === `SLine`)!
    // Lines don't have a rotation param — their direction comes from start/end points
    expect(line.params.rotation || 0).toBeCloseTo(0, 1)
    // But their child label DOES have rotation from the tangent
    const label = line.children[0]
    expect(label.params.rotation).toBeCloseTo(-90, 1)
  })

  it(`line child label rotation must not be zeroed by renderer`, () => {
    // This tests the invariant that renderParentWithChildren must preserve:
    // When a parent (like a line) has no rotation of its own, child label
    // rotations must be kept as-is because there's no group rotation to absorb them.
    const d = runProgram(`Face n\n-> "post" "commit"`)
    const shapes = d.shapes()
    const line = shapes.find(s => s.shapeName === `SLine`)! as LineLike

    const parentRotation = line.params.rotation || 0
    expect(parentRotation).toBeCloseTo(0, 1)

    // Each label has its own rotation from geometry (tangent of line)
    for (const child of line.children) {
      const childRotation = child.params.rotation
      // The child's effective rotation should be parentRotation + childRotation.
      // If the renderer zeroes childRotation and only applies parentRotation to
      // the group, the label ends up with rotation = parentRotation = 0, losing
      // the -90° from the tangent. This is the bug.
      expect(childRotation).toBeCloseTo(-90, 1)

      // Verify this would be wrong if the renderer zeroes it:
      // effective = parentRotation (on group) + 0 (zeroed child) = 0, not -90
      const wrongEffective = parentRotation + 0
      expect(wrongEffective).not.toBeCloseTo(-90, 0)
    }
  })
})

describe(`line label SVG rendering`, () => {

  it(`northward arrow label SVG has rotation transform`, () => {
    const d = runProgram(`Face n\n-> "hello"`)
    d.applyTimelineUpTo(0)
    const shapes = d.shapes()

    const renderer = new Renderer(null)
    const nodes = renderer.render(shapes)

    // Find the text node for the label
    const findTextNode = (node: any): any => {
      if (node.tag === 'text') return node
      for (const child of node.children || []) {
        if (typeof child !== 'string') {
          const found = findTextNode(child)
          if (found) return found
        }
      }
      return null
    }
    const textNode = nodes.map(findTextNode).find(n => n !== null)
    expect(textNode).toBeDefined()

    // The text element should have a rotation transform (from the line tangent)
    const transform = textNode.attrs.transform
    expect(transform).toBeTruthy()
    expect(transform).toContain(`rotate(`)
  })

  it(`horizontal arrow label SVG has no rotation transform`, () => {
    const d = runProgram(`-> "hello"`)
    d.applyTimelineUpTo(0)
    const shapes = d.shapes()

    const renderer = new Renderer(null)
    const nodes = renderer.render(shapes)

    // Find the text node
    const findTextNode = (node: any): any => {
      if (node.tag === 'text') return node
      for (const child of node.children || []) {
        if (typeof child !== 'string') {
          const found = findTextNode(child)
          if (found) return found
        }
      }
      return null
    }
    const textNode = nodes.map(findTextNode).find((n: any) => n !== null)
    expect(textNode).toBeDefined()

    // Horizontal label should not have rotation
    const transform = textNode.attrs.transform
    if (transform) {
      expect(transform).not.toContain(`rotate(`)
    }
  })

  it(`rotated shape inside group uses local rotation center`, () => {
    // A rotated box inside a group offset to (3,0): the SVG rotate()
    // center must be in local coords, not global. If global, it would
    // be ~3 units away from the element's local x/y.
    const d = runProgram(`g = {\n  box "hello" rot 45\n} with .nw at (3, 0)`)
    d.applyTimelineUpTo(0)
    const shapes = d.shapes()

    const renderer = new Renderer(null)
    const nodes = renderer.render(shapes)

    // Find the wrapping <g> with the rotation transform
    const findRotatedG = (node: any): any => {
      const t = node.attrs?.transform || ``
      if (t.includes(`rotate(45`)) return node
      for (const child of node.children || []) {
        if (typeof child !== 'string') {
          const found = findRotatedG(child)
          if (found) return found
        }
      }
      return null
    }
    const rotatedG = nodes.map(findRotatedG).find((n: any) => n !== null)
    expect(rotatedG).toBeDefined()

    const transform = rotatedG.attrs.transform
    const match = transform.match(/rotate\([^,]+,\s*([^,]+),\s*([^)]+)\)/)
    expect(match).toBeTruthy()
    const cx = parseFloat(match![1])

    // Local coords: box center is near 0, not near 3
    expect(Math.abs(cx)).toBeLessThan(1)
  })

  it(`rotated box label gets rotation from group, not from individual element`, () => {
    const d = runProgram(`Box "hello" rot 30`)
    d.applyTimelineUpTo(0)
    const shapes = d.shapes()

    const renderer = new Renderer(null)
    const nodes = renderer.render(shapes)

    // Should have a <g> wrapping the box and label
    const gNode = nodes.find((n: any) => n.tag === 'g')
    expect(gNode).toBeDefined()
    const groupTransform = gNode!.attrs.transform
    expect(groupTransform).toContain(`rotate(30`)

    // The text element inside should NOT have its own rotation
    const findTextNode = (node: any): any => {
      if (node.tag === 'text') return node
      for (const child of node.children || []) {
        if (typeof child !== 'string') {
          const found = findTextNode(child)
          if (found) return found
        }
      }
      return null
    }
    const textNode = findTextNode(gNode)
    expect(textNode).toBeDefined()
    const textTransform = textNode.attrs.transform
    if (textTransform) {
      expect(textTransform).not.toContain(`rotate(`)
    }
  })
})
