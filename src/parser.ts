import * as AST from "./ast.js"
import type { SyntaxError as PEGSyntaxError } from "./peg_parser/jp.js"

export type { Location, LocationPoint } from "./location.js"

export type SyntaxError = PEGSyntaxError

export enum ParseStatus { Ok="ok", SyntaxError="error" }

export interface SuccessfulParseResult {
  status: ParseStatus.Ok
  ast: AST.Node
}


export interface FailedParseResult {
  status: ParseStatus.SyntaxError
  error: SyntaxError
}

export type ParseResult = SuccessfulParseResult | FailedParseResult

type ParseFunction = (input: string, options?: Record<string, unknown>) => unknown

export function parseToAST(
  parse: ParseFunction,
  content: string,
  start: string,
  testing = false
): ParseResult {

  let result

  try {
    result = parse(
      content,
      {
        startRule: start,
        AST,
        testing
      })
  }
  catch (error) {
    if (error instanceof Error && `location` in error) {
      return {
        status: ParseStatus.SyntaxError,
        error: error as SyntaxError
      }
    }
    else {
      throw error
    }
  }

  return { status: ParseStatus.Ok, ast: result as AST.Node }
}
