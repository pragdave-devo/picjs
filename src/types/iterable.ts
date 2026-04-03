/*
 * An iterable type must implement the following interface:
 *
 * - `at[i]`  : return the value at index `i`. 
 * - `first_index()` : return the index (a number) of the first element
 * - `last_index()`  : and the last
 * - `default_step()` : how much to add to the index when iterating through
 *
 * Given that, a type may mix in this module to get
 *
 *  - first() : return the first value  (`at(first_index()]`
 *  - last()
 *  - each : for i = first_index; i<= last_index; i+= default_step  { callback(at[i]) }
 *           (can also supply a step, overriding default)
 *  - random() : a random value picked from the iterable
 *  - map()
 */

import { RTE } from "../runtime_error.js"
import { TList } from "./tlist.js"
import { TNative } from "./tnative.js"
import { TNumber } from "./tnumber.js"
import { TA } from "../types.js"
import { Interpreter } from "../interpreter.js"

const EachMsg = `.each() and map() take a optional step value and a required callback function`

type IterableCallback = (thisBeingIterated:TA, step: number) => void

export function addToAttrs(host: TA) {
  host.attrs.first = new TNative(`first`, [],
    `return the first item in this collection or range`,

    (_interpreter) => {
      console.log(`FIRST`, host)
      return host.at(host.first_index())
    })

  host.attrs.last = new TNative(`last`, [],
    `return the last item in host collection or range`,

    (_interpreter) => {
      return host.at(host.last_index())
    })


  function iterate(host: TA, _interpreter: Interpreter, requestedStep: TNumber, callback: IterableCallback) {
    let step
    if (requestedStep) {
      if (requestedStep instanceof TNumber) {
        step = requestedStep.toNative()
      }
      else {
        throw new RTE(EachMsg + ` (it looks as if the step value is not a number)`)
      }
    }
    else {
      step = host.default_step()
    }

    if (step <= 0)
      throw new RTE(`the step value must be greater than zero`)

    if (step >= 1 && !(Number.isInteger(step)))
      throw new RTE(`A step value of 1 or more must be an integer`)

    let start, end

    if (step < 1) {
      start = 0.0
      end = 1.000001   // allow for errors as we accumulate i in the loop
    }
    else {
      start = host.first_index()
      end = host.last_index()
    }

    for (let i = start, n = 0; i <= end; i += step, n++) {
      callback(host.at(i), n)
    }
  }

  host.attrs.each = new TNative(`each`, [ `[step]`, `callback` ],
    `invoke 'callback' with each item in turn. The optional step ` +
    `allows you to select each nth item. It 0.0 < step < 1.0, then ` +
    `we do interpolation`,
    (interpreter, requestedStep, callback) => {
      if (!callback) {
        callback = requestedStep
        requestedStep = undefined
      } 
      iterate(host, interpreter, requestedStep, (value, index) => {
        interpreter.callFunction(callback, [ value, new TNumber(index) ])
      })

      return host
    })


  host.attrs.map = new TNative(`map`, [ `[step]`, `callback` ],
    `invoke 'callback' with each item in turn, and collect ` + 
    `the results into a list, which we return. The optional step ` +
    `allows you to select each nth item. It 0.0 < step < 1.0, then ` +
    `we do interpolation`,

    (interpreter, requestedStep, callback) => {

      const result: TA[] = []
      
      if (!callback) {
        callback = requestedStep
        requestedStep = null
      } 

      iterate(host, interpreter, requestedStep, (value, index) => {
        result.push(interpreter.callFunction(callback, [ value, new TNumber(index) ]))
      })

      return new TList(result)
    })
}
