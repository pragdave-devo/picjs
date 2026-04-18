import { Arc }      from "./arc.js"
import { Circle }   from "./circle.js"
import { Group }    from "./group.js"
import { Label }    from "./label.js"
import { Line }     from "./line.js"
import { Polyline } from "./polyline.js"
import { Rect }     from "./rect.js"
import * as Shape from "../../shapes.js"
import { RenderParameters } from "../../types.js"
import { SGroup } from "../../shapes/sgroup.js"
import { svg, setAttr } from "redom"

import { SvgBase } from "./_base.js"


export const ShapeToRenderer:Record<string, typeof SvgBase> = {
  SArc:      Arc,
  SBox:      Rect,
  SCircle:   Circle,
  SGroup:    Group,
  SLabel:    Label,
  SLine:     Line,
  SPolyline: Polyline,
}

export class Renderer {


  renderers: { [sid: string]: SvgBase } = {}
  parentGroups: { [sid: string]: SVGElement } = {}

  constructor(_dispatcher: unknown) {
  }

  render(shapes: Shape.SBase[]) {
    const elements: SVGElement[] = []

    // First pass: identify which shapes are group children or parent-child pairs
    const groupChildren = new Set<Shape.SBase>()
    const parentChildShapes = new Set<Shape.SBase>()
    for (const shape of shapes) {
      if (shape instanceof SGroup) {
        for (const child of shape.groupChildren) {
          groupChildren.add(child)
        }
      }
      if (shape.children.length > 0) {
        for (const child of shape.children) {
          parentChildShapes.add(child)
        }
      }
    }

    for (const shape of shapes) {
      // Skip group children - they're rendered inside their group
      if (groupChildren.has(shape)) continue
      // Skip shapes that are children of a parent — rendered inside parent's <g>
      if (parentChildShapes.has(shape)) continue

      const sid = shape.id
      const params = shape.params

      if (shape instanceof SGroup) {
        // Render group with transform, then render children inside
        const groupEl = this.renderGroup(shape)
        elements.push(groupEl)
      }
      else if (shape.children.length > 0) {
        const groupEl = this.renderParentWithChildren(shape)
        elements.push(groupEl)
      }
      else if (sid in this.renderers) {
        const existingElement = this.renderers[sid].rerender(shape.requiredPosition(), params).el
        elements.push(existingElement)
      }
      else {
        const specificRenderer = ShapeToRenderer[shape.shapeName]
        if (specificRenderer) {
          const renderer = new specificRenderer(shape.requiredPosition(), params)
          renderer.el.setAttribute(`data-jp-id`, sid)
          this.renderers[sid] = renderer
          elements.push(renderer.el)
        }
      }
    }

    return elements
  }

  private renderParentWithChildren(shape: Shape.SBase): SVGElement {
    const sid = shape.id
    const position = shape.requiredPosition()
    const rotation = shape.params.rotation
    const center = position.rotationCenter

    // Build the rotation transform for the group
    let groupTransform = ``
    if (rotation && center) {
      groupTransform = `rotate(${rotation}, ${center.x}, ${center.y})`
    }

    // Render parent without rotation
    const parentParams = { ...shape.params, rotation: 0 }
    const parentEl = this.renderSingleShape(shape, { ...position, rotation: 0 }, parentParams)

    // Render children — strip rotation only when the parent's rotation is
    // lifted to the group.  Line labels carry their own rotation (from the
    // line tangent) which must be preserved because the parent line has none.
    const childEls: SVGElement[] = []
    for (const child of shape.children) {
      const childPos = child.requiredPosition()
      if (rotation) {
        const childParams = { ...child.params, rotation: 0 }
        childEls.push(this.renderSingleShape(child, { ...childPos, rotation: 0 }, childParams))
      } else {
        childEls.push(this.renderSingleShape(child, childPos, child.params))
      }
    }

    // Wrap in group
    let groupEl = this.parentGroups[sid]
    if (!groupEl) {
      groupEl = svg('g') as SVGElement
      groupEl.setAttribute(`data-jp-id`, sid)
      this.parentGroups[sid] = groupEl
    }
    if (groupTransform) {
      setAttr(groupEl, { transform: groupTransform })
    } else {
      groupEl.removeAttribute(`transform`)
    }

    // Replace children
    while (groupEl.firstChild) groupEl.removeChild(groupEl.firstChild)
    groupEl.appendChild(parentEl)
    for (const el of childEls) groupEl.appendChild(el)

    return groupEl
  }

  private renderSingleShape(shape: Shape.SBase, position: RenderParameters, params: Shape.Args): SVGElement {
    const sid = shape.id
    if (sid in this.renderers) {
      return this.renderers[sid].rerender(position, params).el
    }
    const specificRenderer = ShapeToRenderer[shape.shapeName]
    if (specificRenderer) {
      const renderer = new specificRenderer(position, params)
      renderer.el.setAttribute(`data-jp-id`, sid)
      this.renderers[sid] = renderer
      return renderer.el
    }
    return svg('g') as SVGElement
  }

  private renderGroup(group: SGroup): SVGElement {
    const sid = group.id
    const params = {
      ...group.params,
      _svgTransform: group.getSvgTransform()
    }

    let groupRenderer: Group

    if (sid in this.renderers) {
      groupRenderer = this.renderers[sid] as Group
      groupRenderer.rerender(group.requiredPosition(), params)
      // Clear and re-add children (they may have changed)
      groupRenderer.clearChildren()
    }
    else {
      groupRenderer = new Group(group.requiredPosition(), params)
      groupRenderer.el.setAttribute(`data-jp-id`, sid)
      this.renderers[sid] = groupRenderer
    }

    // Identify shapes that are children of a parent (e.g. labels inside a box)
    // so we skip them — they'll be rendered inside their parent's <g>
    const parentOwned = new Set<Shape.SBase>()
    for (const child of group.groupChildren) {
      for (const c of child.children) {
        parentOwned.add(c)
      }
    }

    // Render children inside the group
    for (const child of group.groupChildren) {
      if (parentOwned.has(child)) continue
      const childEl = this.renderChild(child)
      if (childEl) {
        groupRenderer.addChild(childEl)
      }
    }

    return groupRenderer.el
  }

  private renderChild(shape: Shape.SBase): SVGElement | null {
    // Handle nested groups recursively
    if (shape instanceof SGroup) {
      return this.renderGroup(shape)
    }

    // Handle shapes with children (e.g. rotated box with label inside a group)
    if (shape.children.length > 0) {
      return this.renderParentWithChildren(shape)
    }

    const sid = shape.id
    const params = shape.params

    if (sid in this.renderers) {
      return this.renderers[sid].rerender(shape.requiredPosition(), params).el
    }
    else {
      const specificRenderer = ShapeToRenderer[shape.shapeName]
      if (specificRenderer) {
        const renderer = new specificRenderer(shape.requiredPosition(), params)
        renderer.el.setAttribute(`data-jp-id`, sid)
        this.renderers[sid] = renderer
        return renderer.el
      }
    }

    return null
  }
}
