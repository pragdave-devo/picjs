import { ParseStatus} from "../../src/parser.js"
import { Dispatcher } from "../../src/dispatcher.js"
import { parseToMockAST } from "./ast.js"

function logger(loc: any, result: any, src: any) {
  console.info(`LOG MESSAGE:`)
  console.log(`location:`, loc)
  console.log(`result:`, result)
  console.log(`src:`, src)
}

export function newDispatcher() {
  return new Dispatcher(logger, <SVGElement><unknown>null, 1)
  // return new Dispatcher(consoleLogger, null, 1)
}

export function valueOf(content: string, start = `Program`) {
  const parseResult =  parseToMockAST(start, content)

  if (parseResult.status !== ParseStatus.Ok)
    fail(parseResult.error)
  else {
    const dispatcher = newDispatcher()
    return dispatcher.valueOf(parseResult.ast, dispatcher.getCurrentBinding())
  }
}

// export function run(start, content: string, expected: any, 
//                     comparitor = (t, got, expected) => t.deepEqual(got.toNative(), expected.toNative()))
//                     {
//                       const result = valueOf(t, content, start)
//                       comparitor(t, result, expected)
//                     }

                    //// comparitor function that just compares node values
                    //export function cv(got: any, expected: any) {
                    //  t.deepEqual(got.value, expected.value)
                    //}

                    //// and comparing lists
                    ////
                    //export function cmpList(got: any, expected: any) {
                    //  got = got.toNative()
                    //  expected = expected.toNative()
                    //  t.deepEqual(got, expected)
                    //}

