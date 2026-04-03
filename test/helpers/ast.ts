import * as parser from "../../src/peg_parser/jp-test.js"
import type * as Peggy from "peggy"
import * as AST from "../../src/ast.js"
import { parseToAST, ParseStatus, SyntaxError } from "../../src/parser.js"


// export function matches(t, ast, expected) {
//   if (Array.isArray(ast) && !Array.isArray(expected))
//     ast = ast[0]
//   // console.log(`got`, JSON.stringify(ast, null, 4))
//   // console.log(`qexpected`, JSON.stringify(expected, null, 4))
//   t.deepEqual(ast, expected)
// }

// function localMakeAST(_line, _column, _offset, originalargs) {
//   const args = Array.from(originalargs)
//   const astNodeType = args.shift()
//   if (astNodeType in AST) {
//     return new AST[astNodeType](`location`, ...args)
//   }
//   throw new Error(`Unknown node type: ${astNodeType}`)
// }

// export function parseExpr(content: string) {
//   return parseToMockAST(`Expression`, content)
// }

export function parseToMockAST(startRule: string, content: string) {
  return parseToAST(parser as unknown as Peggy.Parser, content, startRule, /* testing = */true)
}

export function parse(startRule: string, content: string, tests: ( result: AST.Base | SyntaxError) => void) {
  const parseResult =  parseToMockAST(startRule, content)

  if (parseResult.status !== ParseStatus.Ok)
    tests(parseResult.error)
  else
    tests(parseResult.ast)
}

export function testGivenStartSymbolParse(start: string, src: string, expected: any) {
  test(`${start}: ${src}`, () => {
  const result = parseToMockAST(start, src)
  if (result.status !== ParseStatus.Ok)
    fail(result.error)
  else
    expect(result.ast).toEqual(expected)
  })}


export function testProg(src: string, expected: any) {
  testGivenStartSymbolParse(`Program`, src, expected)
}

export function testParse(src: string, expected: any) {
  testGivenStartSymbolParse(`Expression`, src, expected)
}

// export function ast(t, startRule, content, expected) {
//   parse(t, startRule, content, (t, result) => {
//     matches(t, result, expected)
//   })
// }

// let n = 1
// ast.title = (providedTitle = ``, _startRule, input, _expected) =>
//   `${providedTitle} parse ${n++}: «${input}»`.trim()
// parse.title = ast.title

// // ast matchers

// export function mockAST(type, ...values) {
//   return localMakeAST(0, 0, 0, [ type, ...values ])
// }

export function assign(lvalue: any, rvalue: any) {
  return {
    type: `Assignment`,
    lvalue,
    rvalue,
  }
}

export function at(x: any, y: any) {
  return {
    type: `Position`,
    x,
    y,
  }
}

export function block(body: any) {
  return { type: `ExpressionList`, body }
}

export function boolean(value: boolean) {
  return { type: `Boolean`, value }
}

export function colorString(spec: string) {
    return { type:`ColorLiteralString`, spec }
}

export function colorModel(model: string, ...params: any[]) {
  return { type:`ColorLiteralWithModel`, model, params }
}

export function expression(expression: any) {
  return { type: `ExpressionStatement`, expression } 
}

export function ifAst(test: any, consequent: any, alternate: any) {
  return { type: `IfExpression`, test, consequent, alternate }
}

export function label(text: any) {
  return shape(`SLabel`, { text })
}

export function list(elements: any) {
  return { type: `ArrayExpression`, elements }
}

export function number(value: number) {
  return { type: `Number`, value }
}

export function identifier(name: string) {
  return { type: `Identifier`, name }
}

export function variableValue(name: string) {
  return { type: `VariableValue`, name }
}


export function moveto(what: any, place: any, params:any) {
  return {
    type: `MoveTo`,
    what,
    place,
    params,
  }
}

export function rotate(what: any, angle: any, about: any, params: any) {
  return {
    type: `Rotate`,
    what,
    angle,
    about,
    params,
  }
}

export function negate(value: any) {
  return { type: `UnaryExpression`, operator: `-`, argument: value }
}

export function program(body: any) {
  return { type: `Program`, body }
}

export function range(start: any, end:any) {
  return { type: `Range`, start, end }
}

export function binop(operator: string, left: any, right: any) {
  return { type: `BinaryExpression`, left, operator, right }
}

// export function builtin(name, args) {
//   return mockAST(`builtin`, name, args)
// }

// // export function index(name, index) {
// //   return { 
// //     type: `QualifiedRValue`, 
// //     left: name, 
// //     right: {
// //       qtype: `index`,
// //       index,
// //     },
// //   }
// // }

export function position(x: any, y: any) {
  return { type: `Position`, x, y }
}

export function set(what: any, value: any, params: any = {}) {
  return {
    type: `Set`,
    what,
    value,
    params,
  }
}

export function arc(options: any) {
  return { type: `Shape`, shape: `SArc`, args: options }
}

export function line(options: any) {
  return { type: `Shape`, shape: `SLine`, args: options }
}

export function lineEndings(...arglist: any) {

  const args = {
    line_path: string(`straight`),
  }

  if (typeof arglist[0] === `string`) {
    const str = arglist.shift()
    if (str.length > 0)
      (args as any).line_start = string(str)
  }
  if (typeof arglist[0] === `string`)
    (args as any).line_end = string(arglist.shift())

  return { type: `Shape`, shape: `SLine`, args }
}

export function shape(shape: any, args: any = {}, withConstraint:any = null) {
  return { type: `Shape`, shape, args: args || {}, withConstraint }
}

export function string(value: string) {
  return { type: `String`, value }
}

export function withConstraint(cardinal: any, place: any) {
  return {
    type: `WithConstraint`,
    cardinal,
    place,
  }
}

export function fndef(params: any, body: any) {
  const result = { type: `FunctionExpression`, params, body }
  return result
}

export function fncall(callee: any, args: any) {
  return { 
    type: `QualifiedRValue`, 
    left: callee,
    right: {
      qtype: `call`,
      args,
    },
  }
}

export function leftQualifier(left: any, qtype: string, right: any) {
  return aQualifier(`QualifiedLValue`, left, qtype, right)
}

export function rightQualifier(left: any, qtype: string, right: any) {
  return aQualifier(`QualifiedRValue`, left, qtype, right)
}

function aQualifier(nodeType: string, left: any, qtype: string, right: any) {
  return {
    type: nodeType,
    left,
    right: {
      qtype,
      qvalue: right,
    },
  }
}

// // export function attr_accessor(value, attr) {
// //   return { 
// //     type: `QualifiedRValue`, 
// //     left: value, 
// //     right: {
// //       qtype: `attr`,
// //       attr,
// //     },
// //   }
// // }


