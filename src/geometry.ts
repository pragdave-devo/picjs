// import { RTE } from "./runtime_error.js"
import { TPosition } from "./types.js"
import { LineLike, SArc, SBase, SLine, SPoint, SPolyline } from "./shapes.js"
import { Cardinals, XY } from "./position.js"
import { Dispatcher } from "./dispatcher.js"



export const DegreesToRadians = 0.0174533

// class GeometryChange {
//   constructor(
//     public shape: SBase, 
//     public attribute: string, 
//     public value: any
//   ) {
//   }
// }

// class StyleChange {
//   constructor(
//     public shape: SBase, 
//     public attribute: string, 
//     public value: any
//   ) {
//   }
// }


export class Geometry {

  lastShape: SBase
  direction: XY = { x: 1, y: 0 }

  constructor(
    public dispatcher: Dispatcher,
    public width = 10,
      public height = 7
  ) {
    this.lastShape = new SPoint({ at: { x: 0, y: 0 } }, undefined, this.dispatcher)
    this.setDefaultDirection({ x: 1, y: 0 })
  }

  setDirectionFromAngle(degrees: number) {
    const radians = degrees * DegreesToRadians
    this.setDefaultDirection({ x: Math.cos(radians), y: Math.sin(radians) })
  }

  setDefaultDirection({ x, y }: XY) {
    // normalize to unit vector
    if (x !== 0 || y !== 0) {
      const len = Math.hypot(x, y)
      if (Math.abs(len - 1) > 0.1) {
        const factor = 1 / len
        x *= factor
        y *= factor
      }
    }
    this.direction = { x, y }
  }


  addShape(shape: SBase) {
    this.position(shape)
  }

  // updateShapeGeometry(shape: SBase, attribute: string, value: any) {
  //   this.dispatcher.addImmediate(new GeometryChange(shape, attribute, value))
  // }

  // updateShapeStyle(shape: SBase, attribute: string, value: any) {
  //   this.dispatcher.addImmediate(new StyleChange(shape, attribute, value))
  // }

  // Given a constraint:
  //   - make sure we don't also have attr.x or cy 
  //   - set layout.anchorX/Y from comstraint
  //
  // Otherwise, for anchorX and anchorY independently, either set the layout to the attr
  // specified, or calculate the layout value based on that previously drawn
  // shape and the current direction

  position(shape: SBase) {
    switch (shape.shapeName) { // TODO: at some point double dispatch from shapes
      case 'SLine':
      case `SArc`:
        this.positionLine(shape)
        break

      case `SPolyline`:
        this.positionPolyline(shape as SPolyline)
        break

      default:
        if (shape.missingDimensions())
          this.dispatcher.calculateDimensions(shape)

        if (shape.withConstraint) {
          this.constrainedLayout(shape)
        }
        else if (shape.hasNoXCoordinate() || shape.hasNoYCoordinate()) {
          this.autolayout(shape)
        }
        break
    }

    if (!shape.isChild() && shape.withConstraint?.type !== `ProcessedWithConstraint`)
      this.lastShape = shape
  }


  // called after an animation step to update shapes whose position is dependent of shapes 
  // that may have moved.

  //   updateDependentShapes(shapes) {
  //     shapes.forEach(shape => {
  //       if (shape.shapeName === `SLine`) {
  //         console.log(`reposition`, shape)
  //         this.positionLine(shape)
  //       }
  //       else if (shape.withConstraint) {
  //         console.log(`reposition`, shape)
  //         this.constrainedLayout(shape)
  //       }
  //     })
  //   }

  // project a line from the center of the last line in the current direction.
  // where that intersectws the last shape is the constraint point.
  // Now set the center of the target shape to zero, and project a line back 
  // in the reciprocal of the current direction. Where is intersects the shape is the
  // offset to the center. Position the new shape at (constraint - offset)
  autolayout(shape: SBase) {
    const c = this.lastShape.c

    if (this.lastShape.width === 0 && this.lastShape.height === 0) {
      shape.anchorX = this.lastShape.x
      shape.anchorY = this.lastShape.y
    }
    else {
      const projection = { x: c.x + this.direction.x, y: c.y + this.direction.y }
      const constraint = this.lastShape.cropLineTo(null, projection)

      shape.anchorX = shape.anchorY = 0
      const offset = shape.cropLineTo(null, { x: -this.direction.x, y: -this.direction.y })

      shape.anchorX = constraint.x - offset.x
      shape.anchorY = constraint.y - offset.y
    }
  }

  constrainedLayout(shape: SBase) {
    const constraint = shape.withConstraint
    if (constraint === undefined)
      throw new Error(`somehow got a constraint of null`)

    // Handle line label constraints specially
    if (constraint.type === `LineLabelConstraint`) {
      this.positionLineLabel(shape, constraint)
      return
    }

    const myAnchorName = constraint.cardinal

    // from the "there must be a better way" department...
    // If this is a child shape, then the constraint
    // target isn't known in AST terms: it's an
    // instantiated shape. This means we have to deal with both
    // an AST target and a Shape target

    let target
    if (constraint.type !== `ProcessedWithConstraint`) {
      target = shape.valueOfTree(constraint.place)
    }
    else {
      target = constraint.targetAsShapeObject
    }

    if (target instanceof SBase) {
      this.dispatcher.recordDependency(shape, target)
      target = target.handle_attr_c()
    }

    Geometry.positionCardinalToPoint(shape, myAnchorName, target.x, target.y)
  }

  // Position a label along a line/arc path with perpendicular offset.
  //
  // Text is always parallel to the line segment and never upside-down.
  // "above" offsets toward north (negative y in SVG), "below" toward south.
  // Offset distance = (line stroke-width + label font-size) / 2
  positionLineLabel(label: SBase, constraint: any) {
    const line = constraint.parentShape as LineLike
    const pathPercent = constraint.pathPercent ?? 0.5
    const side = constraint.side || `center`

    // Record dependency so label moves when line moves
    this.dispatcher.recordDependency(label, line)

    // Get point and tangent at the specified position along the path
    const { x, y, tangentAngle } = line.pointAtPercent(pathPercent)

    // Normalize tangent to [-π/2, π/2] so text is never upside-down
    let displayAngle = tangentAngle
    if (displayAngle > Math.PI / 2) displayAngle -= Math.PI
    if (displayAngle < -Math.PI / 2) displayAngle += Math.PI

    let targetX = x
    let targetY = y

    if (side !== `center`) {
      // Offset = (line thickness + font height) / 2
      const strokeWidth = line.params[`stroke-width`] || 0.04
      const fontSize = label.params[`font-size`] || 0.14
      const offsetDistance = (strokeWidth + fontSize) / 2

      // The perpendicular at (displayAngle + π/2) points northward (positive Y)
      // because sin(displayAngle + π/2) = cos(displayAngle) ≥ 0
      // for displayAngle ∈ [-π/2, π/2]
      const northPerpAngle = displayAngle + Math.PI / 2

      if (side === `above` || side === `outside`) {
        targetX += offsetDistance * Math.cos(northPerpAngle)
        targetY += offsetDistance * Math.sin(northPerpAngle)
      } else if (side === `below` || side === `inside`) {
        targetX -= offsetDistance * Math.cos(northPerpAngle)
        targetY -= offsetDistance * Math.sin(northPerpAngle)
      }
    }

    label.setAnimatablePosition(targetX, targetY)

    // Rotate label to match line direction (never upside-down)
    // Negated: positive model rotation = CW, but displayAngle is CCW from x-axis
    const rotationDegrees = -displayAngle * (180 / Math.PI)
    label.params.rotation = rotationDegrees
    label.setRotationVector()
  }

  // Set the center of shape to make the cardinal point coincident with
  // the target
  static positionCardinalToPoint(shape: SBase, cardinal: Cardinals, targetX: number, targetY: number) {
    const [xOffset, yOffset] = shape.getCardinalOffsetsFromAnchor(cardinal)
    shape.setAnimatablePosition(targetX - xOffset, targetY - yOffset)
  }


  // Fasten your seat belt:
  //
  // Lines are drawn between two points.
  // 
  // We have a number of cases
  //
  // - neither start nor end given: we draw from the current point in a direction
  //   given by this.direction
  //
  // - an end point is given, in which case we draw from the current point to it
  //
  // - both start and end are given
  //
  // Then, to make things more interesting, when a start or end is given to us,
  // we actually receive a thunk. This thunk should evaluate to either
  // a TPosition or a TShape. If it's a position, then we just use it. If
  // it's a shape object, then the implicit target is the center, but we crop
  // the line to the shape's periphery. 
  //
  // Finally, how we do the crop depends on the line_path. If it is straight,
  // we just head for the center and crop when we hit the edge. If it is 
  // smooth or stepped, we instead always connect to one of n, e, w, or s,
  // the choice depending on the relative position of both ends.

  positionLine(line: LineLike) {
    const [start, end] = this.getLineStartEnd(line)
    line.start = start
    line.end = end
    line.setAnimatablePosition(
      start.x + (end.x - start.x) / 2, 
      start.y + (end.y - start.y) / 2
    )
  }

  positionPolyline(poly: SPolyline) {
    // Resolve start
    let startAsType = poly.valueOfAttr(`_start`)
    if (startAsType instanceof SBase)
      this.dispatcher.recordDependency(poly, startAsType)

    let [startXY, cropStart] = this.convertToPosition(startAsType)

    // Resolve each waypoint
    const waypoints: XY[] = []
    const waypointTypes: any[] = []
    const cropFlags: boolean[] = []

    for (const wpThunk of poly._waypoints || []) {
      const wpType = poly.valueOfTree(wpThunk)
      if (wpType instanceof SBase)
        this.dispatcher.recordDependency(poly, wpType)
      const [xy, crop] = this.convertToPosition(wpType)
      waypoints.push(xy)
      waypointTypes.push(wpType)
      cropFlags.push(crop)
    }

    // Crop start to first waypoint's direction
    if (cropStart && waypoints.length > 0)
      startXY = startAsType.cropLineTo(poly, waypoints[0])

    // Crop each waypoint that references a shape
    for (let i = 0; i < waypoints.length; i++) {
      if (cropFlags[i]) {
        const prev = i === 0 ? startXY : waypoints[i - 1]
        waypoints[i] = waypointTypes[i].cropLineTo(poly, prev)
      }
    }

    poly.start = startXY
    poly.waypoints = waypoints

    // Set anchor to centroid of all points
    const allPts = poly.allPoints
    const cx = allPts.reduce((s, p) => s + p.x, 0) / allPts.length
    const cy = allPts.reduce((s, p) => s + p.y, 0) / allPts.length
    poly.setAnimatablePosition(cx, cy)
  }

  getLineStartEnd(line: LineLike) {
    let startAsType, startAsXY
    let endAsType, endAsXY
    let cropStart = false, cropEnd = false
    let newDirection = this.direction

    if (!line._start) {
      // Use the stored predecessor shape if available (set by resolveImplicitConnectorDependencies),
      // falling back to lastShape during the initial layout pass when it hasn't been set yet.
      const fromShape = line.predecessorShape ?? this.lastShape
      if (!line.predecessorShape)
        line.predecessorShape = fromShape   // remember for re-rendering
      if (fromShape instanceof LineLike) {
        // Line-to-line chaining: start at the predecessor's end point
        startAsType = { ...fromShape.end }
      } else {
        const c = fromShape.c
        const projection = { x: c.x + this.direction.x, y: c.y + this.direction.y }
        startAsType = fromShape.cropLineTo(line, projection)
      }
    }
    else {
      startAsType = line.valueOfAttr(`_start`)
      if (startAsType instanceof SBase)
        this.dispatcher.recordDependency(line, startAsType)
    }

    // at this point, `startAsType` is a Txxx value
    [startAsXY, cropStart] = this.convertToPosition(startAsType)

    if (!line._end) {
      if (line.successorShape) {
        // Crop to the successor shape's edge facing back toward the start
        endAsType = line.successorShape
        ;[endAsXY, cropEnd] = this.convertToPosition(endAsType)
      }
      else {
        const dir = line._layoutDirection ?? this.direction
        ;[endAsXY, newDirection] = line.getEndAndNewDirection(startAsXY, dir)
      }
    }
    else {
      endAsType = line.valueOfAttr(`_end`)
      if (endAsType instanceof SBase)
        this.dispatcher.recordDependency(line, endAsType)
      ;[endAsXY, cropEnd] = this.convertToPosition(endAsType)
    }

    if (cropStart)
      startAsXY = startAsType.cropLineTo(line, endAsXY)


    if (cropEnd)
      endAsXY = endAsType.cropLineTo(line, startAsXY)

    // OK to use updated startAsXY because it's colinear

    if (!line._layoutDirection)
      line._layoutDirection = newDirection

    this.direction = newDirection

    return [startAsXY, endAsXY]
  }

  // Return the position corresponding to a either a TPosition or a shape.
  // If it's a shape, the second part of the return is set to `true` to 
  // indicate that cropping is needed
  //
  convertToPosition(place: TPosition | SLine | SBase | XY): [ XY, boolean ] {
    if (place instanceof TPosition)
      return [place.toNative(), false]

    if (place instanceof SLine || place instanceof SArc || place instanceof SPolyline)
      return [place.end, false]

    if (place instanceof SBase)
      return [place.c, true]

    return [place, false]
  }
}
