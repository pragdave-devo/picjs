// Da rules

// Values in shape.attrs are jp types (TNumber etc)
// Values in shaps.layout are native types (number etc)


import { SBase, ShapeArgs } from "./_base.js"
import { TFont, TString, RenderParameters } from "../types.js"
import { ShapeToRenderer } from "../render.js"
import { Palette } from "../palette.js"

// const DefaultsForShape = { 
//     fill: `pink`,
//     "class": `jp-label`,
//     align: `c`, 
//   }


export class SLabel extends SBase {

  setupParams(args: ShapeArgs) {
    super.setupParams(args)
    if (this.params.font)
      this.params.font = new TFont(this.params.font)

    // Auto-text coloring: if parent has palette background and no explicit fill was set,
    // use the matching foreground color
    if (!args.fill && this.params._parentFill) {
      const autoFg = Palette.getForegroundFor(this.params._parentFill)
      if (autoFg) {
        this.params.fill = autoFg
      }
    }
  }


  // // this is so, so ugly, but I can't think of another way
  // // of getting the size without temporarily rendering it
  calculateDimensions() {
    if (typeof document === 'undefined') {
      // no DOM (test environment) — use fallback dimensions
      this.params.width  ??= 1
      this.params.height ??= 1
      return
    }

    const localParams = { ...this.params, width: 1, height: 1 }
    const dummyPosition: RenderParameters = {
      cardinal: `c`, x: 0, y: 0, nw: { x: 0, y: 0 },
      width: 0, height: 0, rotation: 0, rotationCenter: { x: 0, y: 0 },
    }
    const label = new ShapeToRenderer.SLabel(dummyPosition, localParams)
    const text = label.el

    if (text) {
      this.dispatcher.temporarilyAddSVGElement(text, () => {
        const bb = (text as SVGGraphicsElement).getBBox()
        this.params.width = bb.width
        this.params.height = bb.height
      })
    }
  }

  get text() { return this.params.text }
  set text(val) { this.params.text = val }
  handle_attr_text() { return new TString(this.text) }

  get font() { return this.params.font }
  handle_attr_font() { return new TFont(this.font) }

  setAtAttr(name: string, value: any) {
    if (name === `text`) {
      this.text = value.toNative()
      this.calculateDimensions()
      return this
    }
    else {
      return super.setAtAttr(name, value)
    }
  }

  prepareForCrossfade(targetValue: number) {
    console.error("not implemented")
  }

  updateCrossFade(ratio: number) {
    console.error("not implemented")
  }

  finalizeCrossFade() {
    console.error("not implemented")
  }

}


