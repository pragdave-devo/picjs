// Da rules

// Values in shape.attrs are jp types (TNumber etc)
// Values in shaps.layout are native types (number etc)


import { SBase, ShapeArgs } from "./_base.js"
import { TFont, TString, RenderParameters } from "../types.js"
import { ShapeToRenderer } from "../render.js"
import { Palette } from "../palette.js"
import { parseFontSize } from "../renderers/svg/attribute_converters.js"
import { wrapText } from "../renderers/svg/label.js"

// const DefaultsForShape = { 
//     fill: `pink`,
//     "class": `jp-label`,
//     align: `c`, 
//   }


export class SLabel extends SBase {
  override shapeName = "SLabel"

  override setupParams(args: ShapeArgs) {
    // Track explicit fill in hidden (survives field initialization)
    this.hidden._hasExplicitFill = 'fill' in args
    super.setupParams(args)
    if (this.params.font)
      this.params.font = new TFont(this.params.font)
  }

  override applyAutoColoring() {
    if (this.hidden._hasExplicitFill || !this.params._parentFill) return

    const parentSlot = this.params._parentFillSlot
    if (parentSlot) {
      // Slot is "palette:bN" or just "bN" — extract the base slot and palette prefix
      const colonIdx = parentSlot.indexOf(':')
      const prefix = colonIdx >= 0 ? parentSlot.slice(0, colonIdx + 1) : ''
      const baseSlot = colonIdx >= 0 ? parentSlot.slice(colonIdx + 1) : parentSlot
      if (baseSlot.startsWith('b')) {
        const fBase = baseSlot.replace('b', 'f')
        const fSlot = `${prefix}${fBase}`
        const fColor = Palette.getColor(fBase)
        if (fColor) {
          this.params.fill = fColor
          this.params._fill_slot = fSlot
        }
        return
      }
    }
    const autoFg = Palette.getForegroundFor(this.params._parentFill)
    if (autoFg) {
      this.params.fill = autoFg
    }
  }


  // // this is so, so ugly, but I can't think of another way
  // // of getting the size without temporarily rendering it
  calculateDimensions() {
    if (typeof document === 'undefined' || !this.dispatcher?.hasSvgHolder()) {
      const fontSize = parseFontSize(this.params.font_size) ?? 0.14
      const { longestLine, height } = estimateWrappedExtent(
        this.params.text || '', fontSize, this.params.line_height, !!this.params._parentWidth, this.params.maxwidth
      )
      this.params.width  ??= estimateTextWidth(longestLine, fontSize, this.params.font_family)
      this.params.height ??= height
      return
    }

    const localParams = { ...this.params, width: 1, height: 1 }
    const dummyPosition: RenderParameters = {
      cardinal: `c`, x: 0, y: 0, nw: { x: 0, y: 0 },
      width: 0, height: 0, rotation: 0, rotationCenter: { x: 0, y: 0 },
    }
    const label = new ShapeToRenderer.SLabel(dummyPosition, localParams)
    const svgNode = label.node

    if (svgNode) {
      // Convert SvgNode to DOM element for measurement (browser only)
      const svgNS = 'http://www.w3.org/2000/svg'
      const text = document.createElementNS(svgNS, 'text') as SVGTextElement
      // Copy attributes
      for (const [key, value] of Object.entries(svgNode.attrs)) {
        text.setAttribute(key, String(value))
      }
      // Copy children
      const renderChild = (child: any): Node => {
        if (typeof child === 'string') {
          return document.createTextNode(child)
        }
        const el = document.createElementNS(svgNS, child.tag)
        for (const [k, v] of Object.entries(child.attrs || {})) {
          el.setAttribute(k, String(v))
        }
        for (const c of child.children || []) {
          el.appendChild(renderChild(c))
        }
        return el
      }
      for (const child of svgNode.children) {
        text.appendChild(renderChild(child))
      }

      // Check if getBBox is available
      if (typeof text.getBBox !== 'function') {
        // Fallback: estimate dimensions based on text content
        const fontSize = this.params.font?.size || 0.2
        const { longestLine, height } = estimateWrappedExtent(
          this.params.text || '', fontSize, this.params.line_height, !!this.params._parentWidth, this.params.maxwidth
        )
        this.params.width  ??= estimateTextWidth(longestLine, fontSize, this.params.font_family)
        this.params.height ??= height
        return
      }
      this.dispatcher.temporarilyAddSVGElement(text, () => {
        const bb = text.getBBox()
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
}

const FontAspectRatios: Record<string, number> = {
  'serif':       0.46,
  'sans-serif':  0.52,
  'monospace':   0.50,
  'roboto':      0.52,
  'arial':       0.52,
  'helvetica':   0.52,
  'verdana':     0.55,
  'georgia':     0.48,
  'times new roman': 0.45,
  'courier new': 0.43,
  'fira sans':   0.50,
  'consolas':    0.49,
}

function fontAspectRatio(fontFamily?: string): number {
  if (!fontFamily) return 0.52
  const lower = fontFamily.toLowerCase()
  for (const [name, ratio] of Object.entries(FontAspectRatios)) {
    if (lower.includes(name)) return ratio
  }
  return 0.52
}

function estimateTextWidth(charCount: number, fontSize: number, fontFamily?: string): number {
  const ratio = fontAspectRatio(fontFamily)
  return charCount * fontSize * ratio
}

// Estimates a label's wrapped/multi-paragraph extent using the same
// paragraph-then-line spacing rules renderParagraphs()/renderWrappedLines()
// (src/renderers/svg/label.ts) actually apply — same lineSpacing precedence
// (line_height, else fontSize*1.2), same doubled gap between paragraphs when
// the label has no parent shape (_parentWidth) — so the SSR-estimated width
// and height match what renders instead of the full unwrapped single line.
function estimateWrappedExtent(
  text: string, fontSize: number, lineHeight: number | undefined, hasParent: boolean, maxwidth?: number
): { longestLine: number, height: number } {
  const lineSpacing = lineHeight && lineHeight > 0 ? lineHeight : fontSize * 1.2
  const paragraphSpacing = hasParent ? lineSpacing : lineSpacing * 2

  // Mirrors reflowParagraphs(): split on blank-line boundaries, collapse
  // interior newlines to spaces within each paragraph.
  const paragraphs = (text.includes('\n') ? text.split(/\n\s*\n/) : [text])
    .map(p => p.replace(/\n/g, ' ').trim())

  let longestLine = 0
  let dySum = 0

  paragraphs.forEach((paragraph, pi) => {
    const wrapped = maxwidth ? wrapText(paragraph, maxwidth) : paragraph
    wrapped.split('\n').forEach((line, li) => {
      longestLine = Math.max(longestLine, line.length)
      if (pi === 0 && li === 0) return  // very first line carries no dy
      dySum += (li === 0 && pi > 0) ? paragraphSpacing : lineSpacing
    })
  })

  return { longestLine, height: fontSize * 1.2 + dySum }
}
