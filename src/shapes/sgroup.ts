import { SBase, ShapeArgs } from "./_base.js"
import { WithConstraint } from "./_base.js"
import { Dispatcher } from "../dispatcher.js"

// Group children use **relative positioning**: each child stores an offset
// (relativeX, relativeY) from the group anchor rather than absolute coordinates.
//
// Flow:
//   1. Group body executes → children laid out at absolute positions (autolayout/explicit)
//   2. computeBoundingBox() sets the group anchor at the children's center,
//      then converts each child to a relative offset from that anchor.
//   3. When the group is positioned (by `with` constraint, autolayout, or animation),
//      repositionChildren() recomputes each child's absolute position as
//      group.anchor + child.relativeOffset.  Nested groups recurse.
//
// This ensures children move with their parent and will support future
// rotation and scaling transforms.

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
        // Dimensionless shapes (arcs, lines) — use anchor point directly
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
    this.anchorX = (minX + maxX) / 2
    this.anchorY = (minY + maxY) / 2

    // Store each direct child's offset from the group anchor.
    // Skip shapes already owned by a nested group — their offsets
    // are relative to THAT group, not this one.
    for (const child of this.groupChildren) {
      if (!child.parentGroup) {
        child.parentGroup = this
        child.relativeX = (child.anchorX ?? 0) - this.anchorX!
        child.relativeY = (child.anchorY ?? 0) - this.anchorY!
      }
    }
  }

  setAnimatableAttr(attr: string, newValue: any) {
    super.setAnimatableAttr(attr, newValue)
    if (attr === `opacity`) {
      const raw = newValue.toNative()
      for (const child of this.groupChildren) {
        child.params[attr] = raw
        child.rememberRenderNeeded()
      }
    }
  }

  repositionChildren() {
    for (const child of this.groupChildren) {
      if (child.parentGroup !== this) continue  // owned by a nested group
      const newX = this.anchorX! + (child.relativeX ?? 0)
      const newY = this.anchorY! + (child.relativeY ?? 0)
      child.anchorX = newX
      child.anchorY = newY
      if (child instanceof SGroup) {
        child.repositionChildren()
      }
    }
  }

  setAnimatablePosition(x: number, y: number) {
    super.setAnimatablePosition(x, y)
    this.repositionChildren()
  }
}
