// Which attributes each shape accepts.
//
// The grammar is deliberately permissive — most shapes parse the whole of
// SECommon — so it is not the place to say that a Group has no fill or that a
// Box has no font. Without this table those attributes were accepted, stored,
// and then silently dropped by the renderer.
//
// A shape is listed with what it actually honours, not with everything the
// grammar will parse. Underscore-prefixed args (_class, _behind, _same,
// _start, _waypoints …) are internal plumbing and are not checked here.
//
// Defaults set through `Box.fill = …` bypass setupParams entirely — they are
// merged straight into params — so VisitShapeDefaultSetter checks them against
// this same table.

const Position = [
  `at`, `x`, `y`,
] as const

const Painting = [
  `fill`, `stroke`, `stroke_width`, `linestyle`, `opacity`,
] as const

const Timing = [
  `reveal_time`, `hide_time`,
] as const

// Accepted by every shape that draws itself.
const Common = [
  ...Position, ...Painting, ...Timing, `rotation`, `fit`,
] as const

const Text = [
  `text`, `align`, `maxwidth`, `line_height`, `font`, `font_family`,
  `font_size`, `font_style`, `font_variant`, `font_weight`, `font_stretch`,
] as const

const LineLike = [
  `line_path`, `line_start`, `line_end`, `draw_progress`, `start`, `end`,
] as const

const Corners = [ `rx`, `ry` ] as const
const Size    = [ `width`, `height` ] as const

export const ShapeAttributes: Record<string, readonly string[]> = {
  SBase:     [ ...Common, ...Text, ...LineLike, ...Corners, ...Size, `r`, `turn`, `length` ],
  SBox:      [ ...Common, ...Size, ...Corners ],
  SCircle:   [ ...Common, `r` ],
  SEllipse:  [ ...Common, ...Corners ],
  SOval:     [ ...Common, ...Size, ...Corners ],
  SLabel:    [ ...Common, ...Text ],
  SLine:     [ ...Common, ...LineLike, `length` ],
  SPolyline: [ ...Common, ...LineLike, ...Corners, `closed`, `waypoints` ],
  SArc:      [ ...Common, ...LineLike, `turn` ],
  SPoint:    [ ...Position, ...Timing ],
  // A group positions and reveals its children and can be rotated or faded as
  // a unit, but paints nothing of its own — Group.convertToSVG keeps only the
  // transform and opacity. Until groups gain a background, `fill` and friends
  // would be accepted and discarded, so they are rejected instead.
  SGroup:    [ ...Position, ...Timing, `rotation`, `opacity` ],
}

// `Shape.attr = …` sets a default for every shape, so it may use any attribute
// some shape accepts.
export function isKnownAttribute(shapeName: string, attr: string): boolean {
  const accepted = ShapeAttributes[shapeName]
  if (!accepted) return true          // unknown shape type: not our error to raise
  return accepted.includes(attr)
}

export function acceptedAttributesFor(shapeName: string): string[] {
  return [ ...(ShapeAttributes[shapeName] ?? []) ].sort()
}
