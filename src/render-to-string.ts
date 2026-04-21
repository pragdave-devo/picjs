/**
 * Server-side rendering for picjs.
 * Uses SvgNode serialization instead of DOM manipulation.
 */

import { SvgNode, svgNode, serialize, IdGenerator } from "./svg-node.js"

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
  /** Optional ID generation for animation runtime */
  ids?: { prefix: string }
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

  // Dynamic imports
  const [
    { parseToAST, ParseStatus },
    { Dispatcher },
    { parse: pegParse },
    { nullLogger, calculateBoundingBox, viewBoxFromBounds }
  ] = await Promise.all([
    import("./parser.js"),
    import("./dispatcher.js"),
    import("./peg_parser/jp.js"),
    import("./render-utils.js")
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

  try {
    // Create dispatcher without DOM (svgHolder = null)
    // The Dispatcher will skip DOM manipulation and renderers will produce SvgNode trees
    const dispatcher = new Dispatcher(nullLogger, null, 1)

    // Set up ID generator if requested
    if (options.ids) {
      const idGen = new IdGenerator(options.ids.prefix)
      dispatcher.setIdGenerator(idGen)
    }

    // Run the interpreter
    dispatcher.start(parsed.ast)
    dispatcher.applyTimelineUpTo(0)

    // Get rendered SvgNode array
    const svgChildren = dispatcher.renderToSvgNodes()

    // Calculate bounding box and create viewBox
    const bounds = calculateBoundingBox(dispatcher.shapes(), padding)
    const viewBox = viewBoxFromBounds(bounds, padding)

    // Build root SVG element with cssPrefix class
    const root = svgNode("svg", {
      viewBox,
      class: `_myopic-1`,
      xmlns: "http://www.w3.org/2000/svg"
    }, svgChildren)

    // Serialize to string
    let svg = serialize(root)

    // Add source as comment if requested
    if (includeSource) {
      const comment = `<!-- picjs source:\n${source}\n-->`
      svg = svg.replace("<svg", `${comment}\n<svg`)
    }

    return { svg, width: bounds.width, height: bounds.height }

  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
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
