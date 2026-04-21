import { SvgNode, svgNode } from "../../svg-node.js"
import { SGroup } from "../../shapes/sgroup.js"
import { RenderParameters } from "../../types.js"
import { SvgBase } from "./_base.js"
import * as Shape from "../../shapes.js"

// Group renderer creates a <g> element with a transform.
// Children are rendered separately and added to the group element.
export class Group extends SvgBase {

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    this.build(`g`)
  }

  convertToSVG(_position: RenderParameters, attrs: Shape.Args): Shape.Args {
    const result: Shape.Args = {}

    // Apply transform from the group
    if (attrs._svgTransform) {
      result.transform = attrs._svgTransform
    }

    // Opacity applies to the whole group
    if (attrs.opacity !== undefined && attrs.opacity !== 1) {
      result.opacity = attrs.opacity
    }

    return result
  }

  rerender(_position: RenderParameters, attrs: Shape.Args) {
    this.attrs = this.convertToSVG(_position, attrs)
    const existingChildren = this.node ? this.node.children : []
    this.node = svgNode("g", this.attrs as Record<string, string | number>, existingChildren)
    return this
  }

  // Add a child element to this group
  addChild(childNode: SvgNode) {
    this.node.children.push(childNode)
  }

  // Clear all children (for re-render)
  clearChildren() {
    this.node.children = []
  }
}
