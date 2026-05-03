import { parseToAST, ParseStatus } from "./parser.js"
import { Dispatcher } from "./dispatcher.js"
export { RTE } from "./runtime_error.js"
import { LoggerInterface } from "./types.js"

import { parse as pegParse } from "./peg_parser/jp.js"
import { nullLogger, calculateBoundingBox, viewBoxFromBounds, unionBounds } from "./render-utils.js"
import { resetTheme, applyPaletteToTheme, getThemeValue, getDarkThemeValue } from "./defaults.js"
import { Palette } from "./palette.js"
import { computeSlotColors, generateCSS } from "./palette-css.js"
import { injectDeps } from "./render-to-string.js"

Palette.setNativeColorResolver((name: string) => {
  return getThemeValue(name === 'native-fg' ? 'NativeFg' : 'NativeBg') as string | null
})

injectDeps({ parseToAST, ParseStatus, Dispatcher, pegParse, nullLogger, calculateBoundingBox, viewBoxFromBounds, unionBounds, resetTheme, applyPaletteToTheme, getDarkThemeValue, Palette, computeSlotColors, generateCSS })

// Re-export browser integration
export { render, renderAll, autoInit } from "./browser.js"
export type { RenderOptions as BrowserRenderOptions } from "./browser.js"

// Re-export server-side rendering
export { renderToString, renderToStringAsync, render as renderAsync, ensureReady } from "./render-to-string.js"
export type { RenderResult, RenderOptions as ServerRenderOptions } from "./render-to-string.js"

export function parse(content: string) {
  return parseToAST(pegParse, content, `Start`, false)
}

export function createRunner(
  logger: LoggerInterface,
  svgHolder: SVGElement,
  runNumber: number
) {
    return new Dispatcher(logger, svgHolder, runNumber)
}

