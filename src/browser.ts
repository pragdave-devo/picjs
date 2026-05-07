/**
 * Browser integration for picjs.
 * Provides functions to render picjs diagrams from HTML elements.
 */

import { parseToAST, ParseStatus } from "./parser.js"
import { Dispatcher } from "./dispatcher.js"
import { parse as pegParse } from "./peg_parser/jp.js"
import { nullLogger, calculateBoundingBox, viewBoxFromBounds, unionBounds } from "./render-utils.js"
import { Palette } from "./palette.js"
import { getDarkThemeValue } from "./defaults.js"
import { computeSlotColors, generateCSS } from "./palette-css.js"
import { BUILD_STAMP } from "./build-stamp.js"

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

  // Create SVG element — must be in-DOM for getBBox to work during layout
  const svgNS = "http://www.w3.org/2000/svg"
  const svgElement = document.createElementNS(svgNS, "svg")
  svgElement.setAttribute("xmlns", svgNS)
  svgElement.style.cssText = "position:absolute;left:-9999px;width:0;height:0"
  document.body.appendChild(svgElement)

  // Parse the source
  const parsed = parseToAST(pegParse, source, `Start`, false)

  if (parsed.status !== ParseStatus.Ok) {
    document.body.removeChild(svgElement)
    console.error('picjs parse error:', parsed.error?.message)
    const errorDiv = document.createElement('div')
    errorDiv.className = 'picjs-error'
    errorDiv.textContent = `picjs error: ${parsed.error?.message || 'Parse error'}`
    element.replaceWith(errorDiv)
    return null
  }

  try {
    // Create dispatcher and render
    const dispatcher = new Dispatcher(nullLogger, svgElement, 1)
    dispatcher.start(parsed.ast)
    dispatcher.applyTimelineUpTo(0)

    // Calculate bounding box covering all animation states
    let bounds = calculateBoundingBox(dispatcher.shapes(), padding)
    const times = dispatcher.animationBoundaryTimes()
    if (times.length > 1) {
      const probeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
      probeSvg.style.cssText = "position:absolute;left:-9999px;width:0;height:0"
      document.body.appendChild(probeSvg)
      for (const t of times) {
        if (t === 0) continue
        const probe = new Dispatcher(nullLogger, probeSvg, -1)
        probe.start(parsed.ast)
        probe.applyTimelineUpTo(t)
        bounds = unionBounds(bounds, calculateBoundingBox(probe.shapes(), padding))
      }
      document.body.removeChild(probeSvg)
    }
    svgElement.setAttribute("viewBox", viewBoxFromBounds(bounds, padding))

    // Emit <style> with dark/light CSS for used palette slots
    const usedSlots = dispatcher.getUsedSlots()
    if (usedSlots.size > 0) {
      const slotColors = computeSlotColors(
        usedSlots,
        (pal: string, slot: string) => Palette.getColorForPalette(pal, slot),
        getDarkThemeValue('NativeFg'),
        getDarkThemeValue('NativeBg'),
        (pal: string, slot: string) => Palette.getLightColorForPalette(pal, slot),
      )
      const css = generateCSS(usedSlots, slotColors)
      if (css) {
        const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style")
        styleEl.textContent = css
        svgElement.insertBefore(styleEl, svgElement.firstChild)
      }
    }

    // Build stamp
    const vb = svgElement.getAttribute("viewBox")!.split(" ").map(Number)
    const stampEl = document.createElementNS("http://www.w3.org/2000/svg", "text")
    stampEl.setAttribute("x", String(vb[0] + 0.05))
    stampEl.setAttribute("y", String(vb[1] + 0.12))
    stampEl.setAttribute("font-size", "0.08")
    stampEl.setAttribute("fill", "#888")
    stampEl.setAttribute("font-family", "monospace")
    stampEl.textContent = BUILD_STAMP
    svgElement.appendChild(stampEl)

    // Preserve source as comment
    if (preserveSource) {
      const comment = document.createComment(` picjs source:\n${source}\n`)
      svgElement.insertBefore(comment, svgElement.firstChild)
    }

    // Move SVG from hidden position to replace the source element
    svgElement.removeAttribute("style")
    element.replaceWith(svgElement)
    return svgElement

  } catch (e) {
    document.body.removeChild(svgElement)
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
