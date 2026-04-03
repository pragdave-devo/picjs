import { ParseStatus } from "../../src/parser.js"
import { 
  block,
  number,
  fndef,
  identifier,
  parseToMockAST,
} from "../helpers/ast.js"

export function parseFn(src: string, expected: any) {
  test(`fndef: ${src}`, () => {
  const result = parseToMockAST(`Expression`, src)
  if (result.status !== ParseStatus.Ok)
    fail(result.error)
  else
    expect((result.ast as any).args).toEqual(expected.args)
  })}

const a = identifier(`a`)
const b = identifier(`b`)


parseFn(`() => { 1 }`, 
  fndef([], block([ number(1) ])))
parseFn(`(a) => { 2 }`, 
  fndef([a], block([ number(2) ])))
parseFn(`(a, b) => { 3 }`, 
  fndef([a, b], block([ number(3) ])))

parseFn(`() => { 1 }`, 
  fndef([], block([ number(1) ])))

parseFn(`() => { 1 2 }`, 
  fndef([], block([ number(1), number(2) ])))

parseFn(`(a,b) => { 1 2 }`, 
  fndef( 
    [ a, b ], 
    block([ number(1), number(2) ]),
  ))

parseFn(`(a b) => { 1 2 }`, 
  fndef( 
    [ a, b ], 
    block([ number(1), number(2) ]),
  ))




