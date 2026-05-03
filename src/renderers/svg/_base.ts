import { SvgNode, svgNode } from "../../svg-node.js"
import * as Shape from "../../shapes.js"
import { RenderParameters     } from "../../types.js"

export type LineDirection = -1 | 1

export class SvgBase {

  position: RenderParameters
  attrs: Shape.Args
  node!: SvgNode

  constructor(position: RenderParameters, attrs: Shape.Args) {
    this.position = position
    this.attrs = toSvgAttrNames(this.convertToSVG(position, attrs))
  }


  rerender(position: RenderParameters, attrs: Shape.Args) {
    const id = this.node?.attrs["data-jp-id"]
    this.position = position
    this.attrs = toSvgAttrNames(this.convertToSVG(position, attrs))
    this.node = svgNode(this.node.tag, this.attrs as Record<string, string | number>)
    if (id !== undefined) this.node.attrs["data-jp-id"] = id
    return this
  }

  build(tag: string) {
    this.node = svgNode(tag, this.attrs as Record<string, string | number>)
  }

  convertToSVG(_position: RenderParameters, _attrs: Shape.Args): Shape.Args {
    throw new Error(`renderer class is missing "convertToSVG"`)
  }

  // Apply draw animation: uses pathLength=1 so stroke-dashoffset ranges over [0,1].
  // Call this AFTER linestyle conversion and path computation.
  protected applyDrawProgress(attrs: Shape.Args) {
    const drawProgress = attrs.draw_progress
    delete attrs.draw_progress

    if (drawProgress !== undefined && drawProgress < 1) {
      attrs.pathLength = 1
      if (drawProgress <= 0) {
        // Zero-length dash + full gap: nothing visible, no browser rounding artifacts
        attrs[`stroke_dasharray`] = `0 1`
        attrs[`stroke_dashoffset`] = 0
      } else {
        attrs[`stroke_dasharray`] = 1
        attrs[`stroke_dashoffset`] = 1 - drawProgress
      }
    }
  }
}

// Tracks which palette slots are used in the current render pass
let _usedSlots: Set<string> = new Set()

export function resetUsedSlots() { _usedSlots = new Set() }
export function getUsedSlots(): Set<string> { return _usedSlots }
export function addUsedSlot(attr: string, slot: string) { _usedSlots.add(`${attr}:${slot}`) }

const SLOT_COLOR_ATTRS = new Set(['fill', 'stroke'])

// Convert internal underscore attribute names to SVG hyphenated names,
// and replace slotted colors with CSS classes
export function toSvgAttrNames(attrs: Shape.Args): Shape.Args {
  const result: Shape.Args = {}
  const classes: string[] = []

  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('_') && k.endsWith('_slot') && v) {
      const attrName = k.slice(1, -5) // _fill_slot → fill
      if (SLOT_COLOR_ATTRS.has(attrName)) {
        const cssSlot = (v as string).replace(':', '-')
        classes.push(`pj-${attrName}-${cssSlot}`)
        _usedSlots.add(`${attrName}:${v}`)
        continue
      }
    }
    if (k.startsWith('_')) continue // strip remaining internal fields
    result[k.replace(/_/g, '-')] = v
  }

  // If we have slot classes, remove the inline color and add the class
  for (const cls of classes) {
    const attr = cls.startsWith('pj-fill-') ? 'fill' : 'stroke'
    delete result[attr]
    result.class = result.class ? `${result.class} ${cls}` : cls
  }

  return result
}

export function arrowDimensions(strokeWidth: number) {
  const ratio = strokeWidth <= 0.05 ? 2
              : strokeWidth >= 0.25 ? 0.7
              : 2 - 6.5 * (strokeWidth - 0.05)
  const width = ratio * strokeWidth * 1.5
  const length = 1.8 * width
  return { length, halfWidth: width / 2 }
}
