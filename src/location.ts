export interface LocationPoint {
  line: number
  column: number
  offset: number
}

export interface Location {
  start: LocationPoint
  end: LocationPoint
  content?: string
}
