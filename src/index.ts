import { parseToAST } from "./parser.js"
import { Dispatcher } from "./dispatcher.js"
export { RTE } from "./runtime_error.js"
import { LoggerInterface } from "./types.js"

import { parse as pegParse } from "./peg_parser/jp.js"

// Re-export browser integration
export { render, renderAll, autoInit } from "./browser.js"
export type { RenderOptions as BrowserRenderOptions } from "./browser.js"

// Re-export server-side rendering (async)
export { renderToString, render as renderAsync } from "./render-to-string.js"
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

