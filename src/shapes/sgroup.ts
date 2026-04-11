import { SBase, ShapeArgs } from "./_base.js"
import { WithConstraint } from "./_base.js"
import { Dispatcher } from "../dispatcher.js"
import { LineLike } from "./line_like.js"
import { SPolyline } from "./spolyline.js"
import { XY } from "../position.js"

// Groups use LOCAL COORDINATES: each child stores its position relative to
// the group's anchor point (0,0 in local space).
//
// Flow:
//   1. Group body executes -> children laid out at absolute positions
//   2. computeBoundingBox() calculates the group anchor at children's center,
//      then CONVERTS each child to local coordinates by subtracting the anchor.
//   3. SVG rendering wraps children in a <g transform="translate(x,y) rotate(r)">
//      element, so children render with their local coordinates and the
//      transform handles positioning/rotation automatically.
//
// This leverages SVG's native transform system - no manual repositioning needed.

export class SGroup extends SBase {

  groupChildren: SBase[] = []
  predecessorShape?: SBase
  needsFlowLayout = false

  constructor(args: ShapeArgs, withConstraint: WithConstraint | undefined, dispatcher: Dispatcher) {
    super(args, withConstraint, dispatcher)
    this.params.width = 0
    this.params.height = 0
  }

  missingDimensions() {
    return false
  }

  computeBoundingBox() {
    if (this.groupChildren.length === 0) {
      this.params.width = 0
      this.params.height = 0
      return
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const child of this.groupChildren) {
      if (child.anchorX === null || child.anchorY === null) continue
      const nw = child.nw
      const se = child.se
      if (isNaN(nw.x) || isNaN(se.x)) {
        // Dimensionless shapes (arcs, lines) - use anchor point directly
        const ax = child.anchorX!
        const ay = child.anchorY!
        minX = Math.min(minX, ax)
        minY = Math.min(minY, ay)
        maxX = Math.max(maxX, ax)
        maxY = Math.max(maxY, ay)
      } else {
        minX = Math.min(minX, nw.x)
        minY = Math.min(minY, nw.y)
        maxX = Math.max(maxX, se.x)
        maxY = Math.max(maxY, se.y)
      }
    }

    if (!isFinite(minX)) {
      this.params.width = 0
      this.params.height = 0
      return
    }

    this.params.width = maxX - minX
    this.params.height = maxY - minY

    // Group anchor is at the center of the bounding box
    const anchorX = (minX + maxX) / 2
    const anchorY = (minY + maxY) / 2
    this.anchorX = anchorX
    this.anchorY = anchorY

    // Convert each child to LOCAL coordinates (relative to group anchor).
    // Skip shapes already owned by a nested group.
    for (const child of this.groupChildren) {
      if (child.parentGroup) continue

      child.parentGroup = this

      // Convert anchor-based position to local
      child.anchorX = (child.anchorX ?? 0) - anchorX
      child.anchorY = (child.anchorY ?? 0) - anchorY

      // For line-like shapes, also convert all their points to local
      if (child instanceof LineLike) {
        const line = child as LineLike
        line.start = {
          x: line.start.x - anchorX,
          y: line.start.y - anchorY
        }
        line.end = {
          x: line.end.x - anchorX,
          y: line.end.y - anchorY
        }

        // For polylines, also convert waypoints
        if (child instanceof SPolyline) {
          const poly = child as SPolyline
          poly.waypoints = poly.waypoints.map((wp: XY) => ({
            x: wp.x - anchorX,
            y: wp.y - anchorY
          }))
        }
      }
    }
  }

  // Override to propagate opacity to children (rotation handled by SVG transform)
  setAnimatableAttr(attr: string, newValue: any) {
    super.setAnimatableAttr(attr, newValue)
    if (attr === `opacity`) {
      const raw = newValue.toNative()
      for (const child of this.groupChildren) {
        child.params[attr] = raw
        child.rememberRenderNeeded()
      }
    }
    // Rotation is handled by SVG transform - just mark for re-render
    if (attr === `rotation`) {
      this.rememberRenderNeeded()
    }
  }

  setAnimatablePosition(x: number, y: number) {
    super.setAnimatablePosition(x, y)
    // Position is handled by SVG transform - just mark for re-render
    this.rememberRenderNeeded()
  }

  // Get the SVG transform string for this group
  getSvgTransform(): string {
    const x = this.anchorX ?? 0
    const y = this.anchorY ?? 0
    const rotation = this.params.rotation ?? 0

    if (rotation === 0) {
      return `translate(${x}, ${y})`
    }
    // Rotate around the group's anchor point (which is at 0,0 in local space)
    return `translate(${x}, ${y}) rotate(${rotation})`
  }

  // Get a child's absolute position (group position + local offset, with rotation)
  childAbsolutePosition(child: SBase): XY {
    const localX = child.anchorX ?? 0
    const localY = child.anchorY ?? 0
    const rotation = (this.params.rotation ?? 0) * Math.PI / 180
    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    // Apply rotation then translation
    return {
      x: (this.anchorX ?? 0) + localX * cos - localY * sin,
      y: (this.anchorY ?? 0) + localX * sin + localY * cos
    }
  }
}
