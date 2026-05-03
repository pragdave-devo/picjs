import { Arc }      from "./arc.js"
import { Circle }   from "./circle.js"
import { Ellipse }  from "./ellipse.js"
import { Group }    from "./group.js"
import { Label }    from "./label.js"
import { Line }     from "./line.js"
import { Polyline } from "./polyline.js"
import { Rect }     from "./rect.js"
import * as Shape from "../../shapes.js"
import { RenderParameters } from "../../types.js"
import { SGroup } from "../../shapes/sgroup.js"
import { SvgNode, svgNode, IdGenerator } from "../../svg-node.js"

import { SvgBase, resetUsedSlots, getUsedSlots } from "./_base.js"


export const ShapeToRenderer:Record<string, typeof SvgBase> = {
  SArc:      Arc,
  SBox:      Rect,
  SCircle:   Circle,
  SEllipse:  Ellipse,
  SGroup:    Group,
  SLabel:    Label,
  SLine:     Line,
  SOval:     Rect,
  SPolyline: Polyline,
}

export class Renderer {


  renderers: { [sid: string]: SvgBase } = {}
  parentGroups: { [sid: string]: SvgNode } = {}
  idGenerator?: IdGenerator

  constructor(_dispatcher: unknown) {
  }

  setIdGenerator(gen: IdGenerator) {
    this.idGenerator = gen
  }

  getUsedSlots(): Set<string> {
    return getUsedSlots()
  }

  render(shapes: Shape.SBase[]) {
    resetUsedSlots()
    const elements: SvgNode[] = []

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
        // ID is assigned inside renderGroup
        const groupEl = this.renderGroup(shape)
        elements.push(groupEl)
      }
      else if (shape.children.length > 0) {
        // Composite shape - ID assigned inside renderParentWithChildren
        const groupEl = this.renderParentWithChildren(shape)
        elements.push(groupEl)
      }
      else if (sid in this.renderers) {
        const renderer = this.renderers[sid].rerender(shape.requiredPosition(), params)
        if (this.idGenerator) {
          renderer.node.attrs.id = this.idGenerator.next()
        }
        elements.push(renderer.node)
      }
      else {
        const specificRenderer = ShapeToRenderer[shape.shapeName]
        if (specificRenderer) {
          const renderer = new specificRenderer(shape.requiredPosition(), params)
          renderer.node.attrs["data-jp-id"] = sid
          if (this.idGenerator) {
            renderer.node.attrs.id = this.idGenerator.next()
          }
          this.renderers[sid] = renderer
          elements.push(renderer.node)
        }
      }
    }

    return elements
  }

  private renderParentWithChildren(shape: Shape.SBase): SvgNode {
    const sid = shape.id
    const position = this.localPosition(shape)
    const rotation = shape.params.rotation
    const center = position?.rotationCenter

    // Build the rotation transform for the group
    let groupTransform = ``
    if (rotation && center) {
      groupTransform = `rotate(${rotation}, ${center.x}, ${center.y})`
    }

    // Generate main ID for the group if IdGenerator is present
    const mainId = this.idGenerator?.next()

    // Render parent without rotation
    const parentParams = { ...shape.params, rotation: 0 }
    const parentNode = this.renderSingleShape(shape, position ? { ...position, rotation: 0 } : position, parentParams, mainId ? this.idGenerator!.sub(mainId, "s") : undefined)

    // Render children — strip rotation only when the parent's rotation is
    // lifted to the group.  Line labels carry their own rotation (from the
    // line tangent) which must be preserved because the parent line has none.
    const childNodes: SvgNode[] = []
    for (const child of shape.children) {
      const childPos = this.localPosition(child)
      const childId = mainId ? this.idGenerator!.sub(mainId, "t") : undefined
      if (rotation) {
        const childParams = { ...child.params, rotation: 0 }
        childNodes.push(this.renderSingleShape(child, childPos ? { ...childPos, rotation: 0 } : childPos, childParams, childId))
      } else {
        childNodes.push(this.renderSingleShape(child, childPos, child.params, childId))
      }
    }

    // Wrap in group
    let groupNode = this.parentGroups[sid]
    if (!groupNode) {
      groupNode = svgNode("g")
      groupNode.attrs["data-jp-id"] = sid
      this.parentGroups[sid] = groupNode
    }
    if (groupTransform) {
      groupNode.attrs.transform = groupTransform
    } else {
      delete groupNode.attrs.transform
    }
    if (mainId) {
      groupNode.attrs.id = mainId
    }

    // Replace children
    groupNode.children = [parentNode, ...childNodes]

    return groupNode
  }

  private renderSingleShape(shape: Shape.SBase, position: RenderParameters, params: Shape.Args, explicitId?: string): SvgNode {
    const sid = shape.id
    if (sid in this.renderers) {
      const node = this.renderers[sid].rerender(position, params).node
      if (explicitId) {
        node.attrs.id = explicitId
      }
      return node
    }
    const specificRenderer = ShapeToRenderer[shape.shapeName]
    if (specificRenderer) {
      const renderer = new specificRenderer(position, params)
      renderer.node.attrs["data-jp-id"] = sid
      if (explicitId) {
        renderer.node.attrs.id = explicitId
      }
      this.renderers[sid] = renderer
      return renderer.node
    }
    return svgNode("g")
  }

  private renderGroup(group: SGroup): SvgNode {
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
      groupRenderer.node.attrs["data-jp-id"] = sid
      this.renderers[sid] = groupRenderer
    }

    // Assign ID if generator is present
    if (this.idGenerator) {
      groupRenderer.node.attrs.id = this.idGenerator.next()
    }

    // Identify shapes that are children of a parent (e.g. labels inside a box)
    // OR belong to a nested group — skip them, they're rendered inside their group
    const skipShapes = new Set<Shape.SBase>()
    for (const child of group.groupChildren) {
      for (const c of child.children) {
        skipShapes.add(c)
      }
      if (child instanceof SGroup) {
        for (const gc of child.groupChildren) {
          skipShapes.add(gc)
        }
      }
    }

    // Render children inside the group
    for (const child of group.groupChildren) {
      if (skipShapes.has(child)) continue
      const childNode = this.renderChild(child)
      if (childNode) {
        groupRenderer.addChild(childNode)
      }
    }

    return groupRenderer.node
  }

  private renderChild(shape: Shape.SBase): SvgNode | null {
    // Handle nested groups recursively - ID assigned inside renderGroup
    if (shape instanceof SGroup) {
      return this.renderGroup(shape)
    }

    // Handle shapes with children (e.g. rotated box with label inside a group)
    // ID assigned inside renderParentWithChildren
    if (shape.children.length > 0) {
      return this.renderParentWithChildren(shape)
    }

    const sid = shape.id
    const params = shape.params
    const position = this.localPosition(shape)

    if (sid in this.renderers) {
      const node = this.renderers[sid].rerender(position, params).node
      if (this.idGenerator) {
        node.attrs.id = this.idGenerator.next()
      }
      return node
    }
    else {
      const specificRenderer = ShapeToRenderer[shape.shapeName]
      if (specificRenderer) {
        const renderer = new specificRenderer(position, params)
        renderer.node.attrs["data-jp-id"] = sid
        if (this.idGenerator) {
          renderer.node.attrs.id = this.idGenerator.next()
        }
        this.renderers[sid] = renderer
        return renderer.node
      }
    }

    return null
  }

  // Return the shape's render position with rotationCenter in local coords.
  // Shapes inside a group have local x/y (relative to group anchor) but
  // requiredPosition().rotationCenter uses corner() which converts to global.
  // The SVG group already provides the global translation, so the rotation
  // center must match the local coordinate space.
  private localPosition(shape: Shape.SBase): RenderParameters {
    const pos = shape.requiredPosition()
    if (!pos) return pos
    if (shape.parentGroup) {
      const localCenter = { x: shape.anchorX ?? 0, y: shape.anchorY ?? 0 }
      return { ...pos, rotationCenter: localCenter }
    }
    return pos
  }
}
