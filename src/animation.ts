// animation.ts — Animation data model for PicJS
// Part of the animation system (Phase A)

import type { PObj } from './types.ts';

// Easing function names
export type EasingFn = 'linear' | 'quad' | 'cubic' | 'exponential';

// A single alter within an animation
export interface AlterDescriptor {
  targetId: string;              // data-picjs-id of the SVG element
  property: AlterableProperty;   // which property to animate
  fromValue: number | string;    // value at t=0 (captured from static render)
  toValue: number | string;      // target value at animation end
}

// Properties that can be animated
export type AlterableProperty =
  | 'cx' | 'cy'                 // center position (compass points map to center)
  | 'width' | 'height'          // dimensions
  | 'radius'                    // for circles
  | 'fill' | 'color'            // colors (as 0xRRGGBB integers)
  | 'opacity'                   // 0-1
  | 'sw'                        // stroke width
  ;

// A complete animation descriptor (produced by evaluator, serialized to JSON)
export interface AnimationDescriptor {
  id: string;                    // unique ID, e.g. "$scene1" or auto-generated
  startTime: number | null;      // seconds (null if derived from endTime - duration)
  endTime: number | null;        // seconds (null if derived from startTime + duration)
  duration: number;              // seconds
  easeIn: EasingFn;
  easeOut: EasingFn;
  bounceStart: number;           // seconds (0 = no bounce)
  bounceEnd: number;             // seconds (0 = no bounce)
  alterations: AlterDescriptor[];
}

// How an object's position was determined (for constraint propagation)
export type PosConstraintKind =
  | 'explicit_at'    // "at" referencing another object
  | 'with_at'        // "with .edge at obj.edge"
  | 'from_to'        // line from/to connected endpoints
  | 'sequential'     // layout placed it after prior object (coincidence)
  ;

export interface PosConstraint {
  kind: PosConstraintKind;
  sourceObj: PObj | null;        // the object this depends on (null for sequential)
  sourceEdge: number;            // compass point on source
  targetEdge: number;            // compass point on this object
}

// Connector constraint (serialized to JSON for the runtime)
export interface ConnectorConstraint {
  lineId: string;                // data-picjs-id of the line element
  endpoint: 'start' | 'end';    // which end is connected
  targetId: string;              // data-picjs-id of the shape it connects to
  targetEdge: number;            // compass point on the target shape
  chopEnabled: boolean;          // whether chop was specified
}

// Compute resolved start/end times for an animation
export function resolveAnimTiming(anim: AnimationDescriptor): { start: number; end: number } {
  if (anim.startTime != null) {
    return { start: anim.startTime, end: anim.startTime + anim.duration };
  }
  if (anim.endTime != null) {
    return { start: anim.endTime - anim.duration, end: anim.endTime };
  }
  return { start: 0, end: anim.duration };
}
