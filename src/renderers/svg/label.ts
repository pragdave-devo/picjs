import { SvgBase } from "./_base.js"
import { RTE } from "../../runtime_error.js"
import * as Convert from "./attribute_converters.js"
import * as Shape from "../../shapes.js"

import * as MD from "simple-markdown"
import { setAttr, setChildren, svg, text } from "redom"
import { RenderParameters } from "../../types.js"





// const markdownBlock = SimpleMarkdown.defaultBlockParse()

export class Label extends SvgBase {

  private previousText?: string
  private previousX?: number
  private maxwidth?: number
  private align: string = `c`
  private parentWidth?: number

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    // arrange for (x,y) to be top-left of text box
    this.attrs[`dominant-baseline`] = `text-before-edge`
    this.maxwidth = attrs.maxwidth ? Number(attrs.maxwidth) : undefined
    this.align = attrs.align || `c`
    this.parentWidth = attrs._parentWidth ? Number(attrs._parentWidth) : undefined

    this.build(`text`)
    this.setText(attrs.text)   // use original attrs — convertToSVG strips `text` from this.attrs
  }

  rerender(position: RenderParameters, attrs: Shape.Args) {
    super.rerender(position, attrs)
    this.maxwidth = attrs.maxwidth ? Number(attrs.maxwidth) : undefined
    this.align = attrs.align || `c`
    this.parentWidth = attrs._parentWidth ? Number(attrs._parentWidth) : undefined
    this.setText(attrs.text)
    return this
  }

  setText(text: string) {
    if (this.maxwidth)
      text = wrapText(text, this.maxwidth)

    const currentX = this.attrs.x
    if (text !== this.previousText || currentX !== this.previousX) {
      const lines = text.split('\n')
      if (lines.length <= 1) {
        this.el.removeAttribute('text-anchor')
        const parsedText = MD.defaultInlineParse(text)
        this.listToTSpans(this.el, parsedText)
      } else {
        const fontSize = parseFloat(this.attrs[`font-size`]) || 0.14
        const lineSpacing = fontSize * 1.2
        const margin = fontSize * 0.5
        const containerWidth = this.parentWidth || this.position.width
        const anchorX = this.align === `w` ? this.position.x - containerWidth / 2 + margin
                      : this.align === `e` ? this.position.x + containerWidth / 2 - margin
                      : this.position.x
        const textAnchor = this.align === `w` ? `start`
                         : this.align === `e` ? `end`
                         : `middle`
        setAttr(this.el, { 'text-anchor': textAnchor })
        const children: SVGElement[] = []
        for (let i = 0; i < lines.length; i++) {
          const attrs: Record<string, any> = { x: anchorX }
          if (i > 0) attrs.dy = lineSpacing
          const lineEl = svg('tspan', attrs)
          const parsedLine = MD.defaultInlineParse(lines[i])
          this.listToTSpans(lineEl, parsedLine)
          children.push(lineEl)
        }
        setChildren(this.el, children)
      }
      this.previousText = text
      this.previousX = currentX
    }
  }

  listToTSpans(parent: Node, list: SimpleMarkdown.SingleASTNode[]) {
    const result = list.map(node => {
      let content = node.content
      const type = node.type
      if (Array.isArray(content)) {
        const holder = this.contentToTSpan(``, type)
        this.listToTSpans(holder, content)
        return holder
      }
      return this.contentToTSpan(content, type)
    })
    setChildren(parent, result)
  }

  contentToTSpan(content: string, type: string): Node {
    switch (type) {
      case `text`:
        return text(content)
      case `em`:
        return this.tspan(content, { "font-style": `italic` }) 
      default:
        throw new RTE(`Can handle text category: ${type}`)
    }
  }

  tspan(content: string, attrs: Shape.Args): SVGElement {
    return svg(`tspan`, content, attrs)
  }


  convertToSVG(position: RenderParameters, attrs: Shape.Args) {
    const newAttrs = Convert.run(position, attrs, [
      Convert.rotation,
      Convert.anchorToSvgNW,
      Convert.font,
      Convert.fontSize,
    ])
    // Remove attributes that are meaningless on SVG <text> elements
    // and could interfere with rendering (e.g., width as inline-size in SVG 2)
    delete newAttrs.width
    delete newAttrs.height
    delete newAttrs.text      // text content is set via setText, not as an attribute
    delete newAttrs.font      // font sub-properties already injected; object value would serialize as [object Object]
    delete newAttrs.align
    delete newAttrs.maxwidth
    delete newAttrs._parentWidth
    delete newAttrs._parentHeight
    return newAttrs
  }


}


// Wrap text to a maximum line width in characters.
// 1. Split into segments on existing newlines
// 2. Wrap each segment on whitespace or after hyphens
// 3. Rejoin with newlines

export function wrapText(text: string, maxWidth: number): string {
  return text.split('\n').map(seg => wrapSegment(seg, maxWidth)).join('\n')
}

function wrapSegment(segment: string, maxWidth: number): string {
  if (segment.length <= maxWidth) return segment

  const lines: string[] = []
  let remaining = segment

  while (remaining.length > maxWidth) {
    const breakAt = findBreakPoint(remaining, maxWidth)
    lines.push(remaining.substring(0, breakAt).trimEnd())
    remaining = remaining.substring(breakAt).trimStart()
  }
  if (remaining) lines.push(remaining)
  return lines.join('\n')
}

function findBreakPoint(text: string, maxWidth: number): number {
  // Find the rightmost break point (whitespace or after hyphen) within maxWidth
  let best = -1

  for (let i = 0; i <= maxWidth && i < text.length; i++) {
    if (/\s/.test(text[i])) best = i
    if (text[i] === '-' && i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1]))
      best = i + 1   // break after the hyphen
  }

  if (best > 0) return best
  return maxWidth  // forced break
}
