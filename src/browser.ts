/**
 * Browser integration for picjs.
 * Provides functions to render picjs diagrams from HTML elements.
 */

import { parseToAST, ParseStatus } from "./parser.js"
import { Dispatcher } from "./dispatcher.js"
import { parse as pegParse } from "./peg_parser/jp.js"

export interface RenderOptions {
  /** Padding around the content (default: 0.2) */
  padding?: number
  /** Preserve original source as HTML comment in SVG (default: true) */
  preserveSource?: boolean
}

/**
 * Render a single element containing picjs source code.
 * The element's text content is parsed as picjs and replaced with the rendered SVG.
 *
 * @param element - The element containing picjs source code
 * @param options - Rendering options
 * @returns The created SVG element, or null on error
 */
export function render(element: Element, options: RenderOptions = {}): SVGElement | null {
  const { padding = 0.2, preserveSource = true } = options

  const source = element.textContent || ''
  if (!source.trim()) return null

  // Create SVG element
  const svgNS = "http://www.w3.org/2000/svg"
  const svgElement = document.createElementNS(svgNS, "svg")
  svgElement.setAttribute("xmlns", svgNS)

  // Parse the source
  const parsed = parseToAST(pegParse, source, `Start`, false)

  if (parsed.status !== ParseStatus.Ok) {
    console.error('picjs parse error:', parsed.error?.message)
    const errorDiv = document.createElement('div')
    errorDiv.className = 'picjs-error'
    errorDiv.textContent = `picjs error: ${parsed.error?.message || 'Parse error'}`
    element.replaceWith(errorDiv)
    return null
  }

  // Create a simple logger
  const logger = () => {}

  try {
    // Create dispatcher and render
    const dispatcher = new Dispatcher(logger, svgElement, 1)
    dispatcher.start(parsed.ast)
    dispatcher.applyTimelineUpTo(0)

    // Get rendered shapes for bounding box calculation
    const shapes = dispatcher.shapes()

    // Calculate bounding box
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

    // Handle empty bounds
    if (!isFinite(minX)) {
      minX = 0; minY = 0; maxX = 10; maxY = 7
    }

    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2

    // Set viewBox
    svgElement.setAttribute("viewBox",
      `${minX - padding} ${minY - padding} ${width} ${height}`)

    // Preserve source as comment
    if (preserveSource) {
      const comment = document.createComment(` picjs source:\n${source}\n`)
      svgElement.insertBefore(comment, svgElement.firstChild)
    }

    // Replace the element with the SVG
    element.replaceWith(svgElement)
    return svgElement

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('picjs render error:', message)
    const errorDiv = document.createElement('div')
    errorDiv.className = 'picjs-error'
    errorDiv.textContent = `picjs error: ${message}`
    element.replaceWith(errorDiv)
    return null
  }
}

/**
 * Render all elements matching a CSS selector.
 * Each element's text content is parsed as picjs and replaced with the rendered SVG.
 *
 * @param selector - CSS selector to find elements (e.g., '.picjs', 'pre code.language-picjs')
 * @param options - Rendering options
 * @returns Array of created SVG elements (excludes any that failed to render)
 */
export function renderAll(selector: string, options: RenderOptions = {}): SVGElement[] {
  const elements = document.querySelectorAll(selector)
  const results: SVGElement[] = []

  // Convert to array since we're replacing elements
  const elementsArray = Array.from(elements)

  for (const element of elementsArray) {
    const svg = render(element, options)
    if (svg) {
      results.push(svg)
    }
  }

  return results
}

/**
 * Auto-initialize when the DOM is ready.
 * Call this to automatically render all elements with class "picjs" when the page loads.
 */
export function autoInit(selector: string = '.picjs', options: RenderOptions = {}): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderAll(selector, options))
  } else {
    renderAll(selector, options)
  }
}
