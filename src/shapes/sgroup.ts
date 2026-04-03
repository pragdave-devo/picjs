import { SBase, ShapeArgs } from "./_base.js"
import { WithConstraint } from "./_base.js"
import { Dispatcher } from "../dispatcher.js"

export class SGroup extends SBase {

  groupChildren: SBase[] = []

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
  }

  setAnimatablePosition(x: number, y: number) {
    const oldX = this.anchorX ?? x
    const oldY = this.anchorY ?? y
    const dx = x - oldX
    const dy = y - oldY

    if (dx !== 0 || dy !== 0) {
      for (const child of this.groupChildren) {
        child.setAnimatablePosition(
          (child.anchorX ?? 0) + dx,
          (child.anchorY ?? 0) + dy
        )
      }
    }

    super.setAnimatablePosition(x, y)
  }
}
