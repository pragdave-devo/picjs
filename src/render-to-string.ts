/**
 * Server-side rendering for picjs.
 * Uses SvgNode serialization instead of DOM manipulation.
 */

import { svgNode, serialize, IdGenerator } from "./svg-node.js"

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
  /** CSS selector for light-mode activation (default: '[data-theme="light"]') */
  themeSelector?: string
}

interface Deps {
  parseToAST: any
  ParseStatus: any
  Dispatcher: any
  pegParse: any
  nullLogger: any
  calculateBoundingBox: any
  viewBoxFromBounds: any
  unionBounds: any
  resetTheme: any
  applyPaletteToTheme: any
  getDarkThemeValue: any
  Palette: any
  computeSlotColors: any
  generateCSS: any
}

let _deps: Deps | null = null
let _loading: Promise<void> | null = null

function loadDeps(): Promise<void> {
  if (_deps) return Promise.resolve()
  if (_loading) return _loading
  _loading = Promise.all([
    import("./parser.js"),
    import("./dispatcher.js"),
    import("./peg_parser/jp.js"),
    import("./render-utils.js"),
    import("./defaults.js"),
    import("./palette.js"),
    import("./palette-css.js"),
  ]).then(([parser, dispatcher, peg, utils, defaults, palette, paletteCss]) => {
    palette.Palette.setNativeColorResolver((name: string) => {
      return defaults.getThemeValue(name === 'native-fg' ? 'NativeFg' : 'NativeBg') as string | null
    })
    _deps = {
      parseToAST: parser.parseToAST,
      ParseStatus: parser.ParseStatus,
      Dispatcher: dispatcher.Dispatcher,
      pegParse: peg.parse,
      nullLogger: utils.nullLogger,
      calculateBoundingBox: utils.calculateBoundingBox,
      viewBoxFromBounds: utils.viewBoxFromBounds,
      unionBounds: utils.unionBounds,
      resetTheme: defaults.resetTheme,
      applyPaletteToTheme: defaults.applyPaletteToTheme,
      getDarkThemeValue: defaults.getDarkThemeValue,
      Palette: palette.Palette,
      computeSlotColors: paletteCss.computeSlotColors,
      generateCSS: paletteCss.generateCSS,
    }
  })
  return _loading
}

/**
 * Inject pre-loaded dependencies (used by index.ts to avoid async import).
 */
export function injectDeps(deps: Deps): void {
  _deps = deps
}

/**
 * Ensure dependencies are loaded. Call once before using renderToString.
 */
export async function ensureReady(): Promise<void> {
  await loadDeps()
}

function getDeps() {
  if (!_deps) throw new Error("picjs: call ensureReady() or renderToStringAsync() before renderToString()")
  return _deps
}

/**
 * Render picjs source to SVG (synchronous).
 * Requires ensureReady() to have been called first in unbundled environments.
 * In a bundled build, the dynamic imports resolve synchronously.
 */
export function renderToString(source: string, options: RenderOptions = {}): RenderResult {
  const { padding = 0.2, includeSource = true } = options
  const { parseToAST, ParseStatus, Dispatcher, pegParse, nullLogger, calculateBoundingBox, viewBoxFromBounds, unionBounds, resetTheme, applyPaletteToTheme, getDarkThemeValue, Palette, computeSlotColors, generateCSS } = getDeps()

  resetTheme()
  Palette.setCurrent(`sunset`)
  applyPaletteToTheme(Palette.getCurrentColors())

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
    const dispatcher = new Dispatcher(nullLogger, null, 1)

    if (options.ids) {
      const idGen = new IdGenerator(options.ids.prefix)
      dispatcher.setIdGenerator(idGen)
    }

    dispatcher.start(parsed.ast)
    dispatcher.applyTimelineUpTo(0)

    const svgChildren = dispatcher.renderToSvgNodes()

    let bounds = calculateBoundingBox(dispatcher.shapes(), padding)

    const boundaryTimes = dispatcher.animationBoundaryTimes()
    if (boundaryTimes.length > 1) {
      const MAX_PROBES = 20
      let probeTimes: number[]
      if (boundaryTimes.length <= MAX_PROBES) {
        probeTimes = boundaryTimes.filter((t: number) => t > 0)
      } else {
        probeTimes = []
        const step = (boundaryTimes.length - 1) / (MAX_PROBES - 1)
        for (let i = 1; i < MAX_PROBES - 1; i++) {
          probeTimes.push(boundaryTimes[Math.round(i * step)])
        }
        probeTimes.push(boundaryTimes[boundaryTimes.length - 1])
      }
      for (const t of probeTimes) {
        const probe = new Dispatcher(nullLogger, null, 1)
        if (options.ids) probe.setIdGenerator(new IdGenerator(options.ids.prefix + `_probe`))
        probe.start(parsed.ast)
        probe.applyTimelineUpTo(t)
        const tBounds = calculateBoundingBox(probe.shapes(), padding)
        bounds = unionBounds(bounds, tBounds)
      }
    }

    const viewBox = viewBoxFromBounds(bounds, padding)

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
      const css = generateCSS(usedSlots, slotColors, options.themeSelector)
      if (css) {
        svgChildren.unshift(svgNode('style', {}, [css]))
      }
    }

    const root = svgNode("svg", {
      viewBox,
      class: `_myopic-1`,
      xmlns: "http://www.w3.org/2000/svg"
    }, svgChildren)

    let svg = serialize(root)

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
 * Async version — loads dependencies then renders.
 */
export async function renderToStringAsync(source: string, options: RenderOptions = {}): Promise<RenderResult> {
  await loadDeps()
  return renderToString(source, options)
}

/**
 * Render picjs source and return just the SVG string.
 * Throws on error.
 */
export function render(source: string, options: RenderOptions = {}): string {
  const result = renderToString(source, options)
  if (result.error) {
    throw new Error(result.error)
  }
  return result.svg
}
