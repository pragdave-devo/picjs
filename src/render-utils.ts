/**
 * Shared utilities for rendering picjs diagrams.
 */

import type { SBase } from "./shapes/_base.js"

/** No-op logger for when logging is not needed */
export const nullLogger = () => {}

export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

/**
 * Calculate bounding box from rendered shapes.
 * Returns default bounds if no visible shapes exist.
 */
export function calculateBoundingBox(shapes: SBase[], padding: number = 0): BoundingBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const shape of shapes) {
    if (!shape.visible) continue
    if (shape.anchorX === null || shape.anchorY === null) continue

    const nw = shape.nw
    const se = shape.se

    if (!isNaN(nw.x) && !isNaN(se.x)) {
      minX = Math.min(minX, nw.x)
      minY = Math.min(minY, nw.y)
      maxX = Math.max(maxX, se.x)
      maxY = Math.max(maxY, se.y)
    } else {
      // Dimensionless shapes - use anchor
      minX = Math.min(minX, shape.anchorX)
      minY = Math.min(minY, shape.anchorY)
      maxX = Math.max(maxX, shape.anchorX)
      maxY = Math.max(maxY, shape.anchorY)
    }
  }

  // Handle empty or invalid bounds
  if (!isFinite(minX)) {
    minX = 0; minY = 0; maxX = 10; maxY = 7
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2
  }
}

/**
 * Generate SVG viewBox attribute value from bounding box.
 */
export function viewBoxFromBounds(bounds: BoundingBox, padding: number = 0): string {
  return `${bounds.minX - padding} ${bounds.minY - padding} ${bounds.width} ${bounds.height}`
}
