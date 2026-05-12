declare module "@strike48/picjs" {
  export interface RenderOptions {
    ids?: {
      prefix?: string;
    };
  }

  export interface RenderResult {
    svg: string;
    width: number;
    height: number;
    error?: string;
  }

  export interface ParseError {
    message: string;
  }

  export interface ParseResultOk {
    status: "ok";
    ast: unknown;
  }

  export interface ParseResultError {
    status: "error";
    error?: ParseError;
  }

  export type ParseResult = ParseResultOk | ParseResultError;

  export function renderToString(
    source: string,
    options?: RenderOptions
  ): RenderResult;

  export function parse(source: string): ParseResult;
}
