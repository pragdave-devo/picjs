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

    // Only these belong on the <g> itself. Paint attributes must not go here:
    // they would be inherited by every child that has not set its own. They
    // are drawn on the background rect instead — see backgroundAttrs.
    if (attrs._svgTransform) {
      result.transform = attrs._svgTransform
    }

    // Opacity applies to the whole group
    if (attrs.opacity !== undefined && attrs.opacity !== 1) {
      result.opacity = attrs.opacity
    }

    return result
  }

  // What the background rect is painted with, taken from the group's own
  // attributes. Rotation is left out: the <g> already carries it, so the
  // background turns with everything else.
  static backgroundAttrs(params: Shape.Args, width: number, height: number): Shape.Args {
    const attrs: Shape.Args = { width, height }

    for (const key of [ `fill`, `stroke`, `stroke_width`, `linestyle`, `rx`, `ry`,
                        `_fill_slot`, `_stroke_slot` ]) {
      if (params[key] !== undefined) attrs[key] = params[key]
    }

    return attrs
  }

  rerender(_position: RenderParameters, attrs: Shape.Args) {
    const id = this.node?.attrs["data-jp-id"]
    this.attrs = this.convertToSVG(_position, attrs)
    const existingChildren = this.node ? this.node.children : []
    this.node = svgNode("g", this.attrs as Record<string, string | number>, existingChildren)
    if (id !== undefined) this.node.attrs["data-jp-id"] = id
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
