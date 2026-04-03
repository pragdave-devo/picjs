import { testParse, string, position, number as n } from "../helpers/ast.js"

function polyline(args: any) {
  return { type: `Shape`, shape: `SPolyline`, args }
}

describe(`Polyline parsing`, () => {

  testParse(
    `line from (0,0) then (50,50) then (100,0)`,
    polyline({
      line_path: string(`straight`),
      _start: position(n(0), n(0)),
      _waypoints: [position(n(50), n(50)), position(n(100), n(0))],
    })
  )

  testParse(
    `line from (0,0) then to (50,50) then to (100,0)`,
    polyline({
      line_path: string(`straight`),
      _start: position(n(0), n(0)),
      _waypoints: [position(n(50), n(50)), position(n(100), n(0))],
    })
  )

  testParse(
    `line from (0,0) then (50,50) then (100,0) close`,
    polyline({
      line_path: string(`straight`),
      _start: position(n(0), n(0)),
      _waypoints: [position(n(50), n(50)), position(n(100), n(0))],
      _closed: true,
    })
  )
})

describe(`Polyline with endings`, () => {

  testParse(
    `-> from (0,0) then (50,50) then (100,0)`,
    polyline({
      line_end: string(`>`),
      line_path: string(`straight`),
      _start: position(n(0), n(0)),
      _waypoints: [position(n(50), n(50)), position(n(100), n(0))],
    })
  )
})

describe(`Polyline with radius`, () => {

  testParse(
    `line from (0,0) then (50,50) then (100,0) rx 10`,
    polyline({
      line_path: string(`straight`),
      _start: position(n(0), n(0)),
      _waypoints: [position(n(50), n(50)), position(n(100), n(0))],
      rx: n(10),
    })
  )
})
