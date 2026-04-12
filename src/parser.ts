//import fs from "fs"
// import Util from "pegjs-util"
import * as AST from "./ast.js"
import * as Peggy from "peggy"

export interface LocationPoint {
  line: number
  column: number
  offset: number
}

export interface Location {
  start: LocationPoint
  end: LocationPoint
  content?: string  // optional, can be added for error display
}

export type SyntaxError = Peggy.parser.SyntaxError

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


export function parseToAST(
  parser: Peggy.Parser, 
  content: string, 
  start: string,
    testing = false
) : ParseResult {

  let result

  try {
    result = parser.parse(
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

  return { status: ParseStatus.Ok, ast: result }
}
