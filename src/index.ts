import { parseToAST } from "./parser.js"
import { Dispatcher } from "./dispatcher.js"
export { RTE } from "./runtime_error.js"
import { LoggerInterface } from "./types.js"

import * as PEG from "./peg_parser/jp.js"
import type * as Peggy from "peggy"

export function parse(content: string) {
  return parseToAST(PEG as unknown as Peggy.Parser, content, `Start`, /* testing=*/ false)
}

export function createRunner(
  logger: LoggerInterface, 
  svgHolder: SVGElement,
  runNumber: number
) { 
    return new Dispatcher(logger, svgHolder, runNumber)
}

