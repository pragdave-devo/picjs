/**
 * Server-side rendering for picjs.
 * Uses linkedom to provide a virtual DOM for rendering SVG without a browser.
 */

import { parseHTML } from "linkedom"
import { RTE } from "./runtime_error.js"

export interface RenderResult {
  svg: string
  width: number
  height: number
  error?: string
}

export interface RenderOptions {
  /** Padding around the content (default: 0.2) */
  padding?: number
  /** Include source as HTML comment in SVG (default: true) */
  includeSource?: boolean
}

// Set up linkedom globals before dynamic imports
function setupLinkedomGlobals() {
  if (typeof globalThis.SVGElement === 'undefined') {
    const env = parseHTML(`<!DOCTYPE html><html><body></body></html>`)
    Object.assign(globalThis, {
      SVGElement: env.SVGElement,
      HTMLElement: env.HTMLElement,
      Element: env.Element,
      Node: env.Node,
      document: env.document,
    })
  }
}

/**
 * Render picjs source code to an SVG string.
 *
 * @param source - The picjs source code
 * @param options - Rendering options
 * @returns Object containing svg string, dimensions, and optional error
 */
export async function renderToString(source: string, options: RenderOptions = {}): Promise<RenderResult> {
  const { padding = 0.2, includeSource = true } = options

  // Set up DOM globals before importing modules that use redom
  setupLinkedomGlobals()

  // Dynamic imports to ensure globals are set first
  const [{ parseToAST, ParseStatus }, { Dispatcher }, { parse: pegParse }] = await Promise.all([
    import("./parser.js"),
    import("./dispatcher.js"),
    import("./peg_parser/jp.js")
  ])

  // Parse the source
  const parsed = parseToAST(pegParse, source, `Start`, false)

  if (parsed.status !== ParseStatus.Ok) {
    return {
      svg: '',
      width: 0,
      height: 0,
      error: parsed.error?.message || 'Parse error'
    }
  }

  // Create a virtual DOM with linkedom
  const { document } = parseHTML(`<!DOCTYPE html><html><body></body></html>`)

  // Create SVG element in the virtual DOM
  const svgNS = "http://www.w3.org/2000/svg"
  const svgElement = document.createElementNS(svgNS, "svg")
  svgElement.setAttribute("xmlns", svgNS)
  document.body.appendChild(svgElement)

  // Create a simple logger that does nothing
  const logger = () => {}

  try {
    // Create dispatcher with the virtual SVG element
    const dispatcher = new Dispatcher(logger, svgElement as unknown as SVGElement, 1)

    // Run the interpreter
    dispatcher.start(parsed.ast)

    // Apply timeline at t=0 to render initial state
    dispatcher.applyTimelineUpTo(0)

    // Get rendered shapes for bounding box calculation
    const shapes = dispatcher.shapes()

    // Calculate bounding box from shapes
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

    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2

    // Set viewBox
    svgElement.setAttribute("viewBox",
      `${minX - padding} ${minY - padding} ${width} ${height}`)

    // Add source as comment if requested
    if (includeSource) {
      const comment = document.createComment(` picjs source:\n${source}\n`)
      svgElement.insertBefore(comment, svgElement.firstChild)
    }

    // Serialize to string
    const svg = svgElement.outerHTML

    return { svg, width, height }

  } catch (e) {
    const message = e instanceof RTE ? e.message : (e instanceof Error ? e.message : String(e))
    return {
      svg: '',
      width: 0,
      height: 0,
      error: message
    }
  }
}

/**
 * Render picjs source and return just the SVG string.
 * Throws on error.
 */
export async function render(source: string, options: RenderOptions = {}): Promise<string> {
  const result = await renderToString(source, options)
  if (result.error) {
    throw new Error(result.error)
  }
  return result.svg
}
