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
 * Calculate tight bounding box from rendered shapes (no padding).
 * Returns null if no visible shapes with valid positions exist.
 */
export function calculateBoundingBox(shapes: SBase[], _padding: number = 0): BoundingBox | null {
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
      minX = Math.min(minX, shape.anchorX)
      minY = Math.min(minY, shape.anchorY)
      maxX = Math.max(maxX, shape.anchorX)
      maxY = Math.max(maxY, shape.anchorY)
    }
  }

  if (!isFinite(minX)) {
    return null
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

const DEFAULT_BOUNDS: BoundingBox = { minX: 0, minY: 0, maxX: 10, maxY: 7, width: 10, height: 7 }

/**
 * Generate SVG viewBox attribute value from bounding box, adding padding on all sides.
 */
export function viewBoxFromBounds(bounds: BoundingBox | null, padding: number = 0): string {
  const b = bounds || DEFAULT_BOUNDS
  return `${b.minX - padding} ${b.minY - padding} ${b.width + padding * 2} ${b.height + padding * 2}`
}

/**
 * Union two bounding boxes.
 * Null-safe: returns whichever operand is non-null, or null if both are null.
 */
export function unionBounds(a: BoundingBox | null, b: BoundingBox | null): BoundingBox | null {
  if (!a) return b
  if (!b) return a
  const minX = Math.min(a.minX, b.minX)
  const minY = Math.min(a.minY, b.minY)
  const maxX = Math.max(a.maxX, b.maxX)
  const maxY = Math.max(a.maxY, b.maxY)
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}
