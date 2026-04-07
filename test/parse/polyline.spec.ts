import { testParse, string, position, number as n } from "../helpers/ast.js"

function polyline(args: any) {
  return { type: `Shape`, shape: `SPolyline`, args }
}

function dirWaypoint(...comps: [{ x: number, y: number }, number][]) {
  return {
    type: `DirectionalWaypoint`,
    components: comps.map(([direction, distance]) => ({
      direction,
      distance: n(distance),
    })),
  }
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

describe(`Directional waypoints`, () => {

  testParse(
    `line south 2 then east 3`,
    polyline({
      line_path: string(`straight`),
      _waypoints: [
        dirWaypoint([{ x: 0, y: 1 }, 2]),
        dirWaypoint([{ x: 1, y: 0 }, 3]),
      ],
    })
  )

  testParse(
    `line south 2 east 3 then north 1 then to (0,0)`,
    polyline({
      line_path: string(`straight`),
      _waypoints: [
        dirWaypoint([{ x: 0, y: 1 }, 2], [{ x: 1, y: 0 }, 3]),
        dirWaypoint([{ x: 0, y: -1 }, 1]),
        position(n(0), n(0)),
      ],
    })
  )

  testParse(
    `-> south 2 then east 3`,
    polyline({
      line_end: string(`>`),
      line_path: string(`straight`),
      _waypoints: [
        dirWaypoint([{ x: 0, y: 1 }, 2]),
        dirWaypoint([{ x: 1, y: 0 }, 3]),
      ],
    })
  )

  // Long cardinal names
  testParse(
    `line north 1 then west 2`,
    polyline({
      line_path: string(`straight`),
      _waypoints: [
        dirWaypoint([{ x: 0, y: -1 }, 1]),
        dirWaypoint([{ x: -1, y: 0 }, 2]),
      ],
    })
  )

  // Mixed: from + directional then
  testParse(
    `line from (0,0) then south 2 then east 3`,
    polyline({
      line_path: string(`straight`),
      _start: position(n(0), n(0)),
      _waypoints: [
        dirWaypoint([{ x: 0, y: 1 }, 2]),
        dirWaypoint([{ x: 1, y: 0 }, 3]),
      ],
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
