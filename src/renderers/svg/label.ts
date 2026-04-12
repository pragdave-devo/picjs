import { SvgBase } from "./_base.js"
import { RTE } from "../../runtime_error.js"
import * as Convert from "./attribute_converters.js"
import * as Shape from "../../shapes.js"

import * as MDModule from "simple-markdown"

// Handle CJS/ESM interop - simple-markdown exports are under .default in ESM
const MD = (MDModule as any).default || MDModule
import { setAttr, setChildren, svg, text } from "redom"
import { RenderParameters } from "../../types.js"





// const markdownBlock = SimpleMarkdown.defaultBlockParse()

export class Label extends SvgBase {

  private previousText?: string
  private previousX?: number
  private maxwidth?: number
  private lineHeight?: number
  private align: string = `c`
  private parentWidth?: number

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    // arrange for (x,y) to be top-left of text box
    this.attrs[`dominant-baseline`] = `text-before-edge`
    this.maxwidth = attrs.maxwidth ? Number(attrs.maxwidth) : undefined
    this.lineHeight = attrs.line_height ? Number(attrs.line_height) : undefined
    this.align = attrs.align || `c`
    this.parentWidth = attrs._parentWidth ? Number(attrs._parentWidth) : undefined

    this.build(`text`)
    this.setText(attrs.text)   // use original attrs — convertToSVG strips `text` from this.attrs
  }

  rerender(position: RenderParameters, attrs: Shape.Args) {
    super.rerender(position, attrs)
    this.maxwidth = attrs.maxwidth ? Number(attrs.maxwidth) : undefined
    this.lineHeight = attrs.line_height ? Number(attrs.line_height) : undefined
    this.align = attrs.align || `c`
    this.parentWidth = attrs._parentWidth ? Number(attrs._parentWidth) : undefined
    this.setText(attrs.text)
    return this
  }

  setText(text: string) {
    text = reflowParagraphs(text)

    const currentX = this.attrs.x
    if (text !== this.previousText || currentX !== this.previousX) {
      const paragraphs = text.split('\n\n')

      if (paragraphs.length === 1 && !text.includes('\n')) {
        this.el.removeAttribute('text-anchor')
        const parsed = MD.defaultInlineParse(text)
        const runs = flattenMDToRuns(parsed)
        const wrapped = this.maxwidth ? wrapRuns(runs, this.maxwidth) : [runs]
        if (wrapped.length <= 1) {
          this.runsToTSpans(this.el, wrapped[0] || runs)
        } else {
          this.renderWrappedLines(wrapped, false)
        }
      } else {
        this.renderParagraphs(paragraphs)
      }
      this.previousText = text
      this.previousX = currentX
    }
  }

  private renderParagraphs(paragraphs: string[]) {
    const fontSize = parseFloat(this.attrs[`font-size`]) || 0.14
    const lineSpacing = this.lineHeight && this.lineHeight > 0 ? this.lineHeight : fontSize * 1.2
    // Tighter paragraph spacing when inside a shape (parentWidth is set)
    const paragraphSpacing = this.parentWidth ? lineSpacing : lineSpacing * 2
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
    for (let pi = 0; pi < paragraphs.length; pi++) {
      const parsed = MD.defaultInlineParse(paragraphs[pi])
      const runs = flattenMDToRuns(parsed)
      const wrappedLines = this.maxwidth ? wrapRuns(runs, this.maxwidth) : [runs]

      for (let li = 0; li < wrappedLines.length; li++) {
        const attrs: Record<string, any> = { x: anchorX }
        if (children.length > 0) {
          attrs.dy = (li === 0 && pi > 0) ? paragraphSpacing : lineSpacing
        }
        const lineEl = svg('tspan', attrs)
        this.runsToTSpans(lineEl, wrappedLines[li])
        children.push(lineEl)
      }
    }
    setChildren(this.el, children)
  }

  private renderWrappedLines(lines: StyledRun[][], multiParagraph: boolean) {
    const fontSize = parseFloat(this.attrs[`font-size`]) || 0.14
    const lineSpacing = this.lineHeight && this.lineHeight > 0 ? this.lineHeight : fontSize * 1.2
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
      this.runsToTSpans(lineEl, lines[i])
      children.push(lineEl)
    }
    setChildren(this.el, children)
  }

  private runsToTSpans(parent: Node, runs: StyledRun[]) {
    const nodes = runs.map(run => {
      if (run.type === `text`) return text(run.text)
      if (run.type === `em`)   return svg(`tspan`, run.text, { "font-style": `italic` })
      return text(run.text)
    })
    setChildren(parent, nodes)
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
    delete newAttrs.line_height
    delete newAttrs._parentWidth
    delete newAttrs._parentHeight
    return newAttrs
  }


}


// ─── Styled runs: markdown → flat text runs → wrap-aware rendering ─────────

type StyledRun = { text: string, type: string }

// Flatten a simple-markdown AST into a flat list of {text, type} runs.
// Nested nodes (e.g. em containing text) are flattened so each run
// carries the innermost styling.

function flattenMDToRuns(nodes: SimpleMarkdown.SingleASTNode[], inheritType = `text`): StyledRun[] {
  const runs: StyledRun[] = []
  for (const node of nodes) {
    const type = node.type === `text` ? inheritType : node.type
    if (Array.isArray(node.content)) {
      runs.push(...flattenMDToRuns(node.content, type))
    } else {
      runs.push({ text: node.content, type })
    }
  }
  return runs
}

// Wrap styled runs to a maximum visible-character width.
// Returns an array of lines, each line being an array of runs.
// Only visible text counts toward the width — styling is preserved across breaks.

function wrapRuns(runs: StyledRun[], maxWidth: number): StyledRun[][] {
  const lines: StyledRun[][] = [[]]
  let col = 0

  for (const run of runs) {
    let remaining = run.text

    while (remaining.length > 0) {
      const space = maxWidth - col
      if (remaining.length <= space) {
        lines[lines.length - 1].push({ text: remaining, type: run.type })
        col += remaining.length
        break
      }

      // Need to break — find a good break point within the available space
      const breakAt = findBreakPointInRun(remaining, space)
      if (breakAt > 0) {
        lines[lines.length - 1].push({ text: remaining.substring(0, breakAt).trimEnd(), type: run.type })
        remaining = remaining.substring(breakAt).trimStart()
      } else if (col === 0) {
        // Forced break — no whitespace found and we're at line start
        lines[lines.length - 1].push({ text: remaining.substring(0, maxWidth), type: run.type })
        remaining = remaining.substring(maxWidth)
      }
      // Start new line
      lines.push([])
      col = 0
    }
  }

  return lines
}

function findBreakPointInRun(text: string, maxWidth: number): number {
  let best = -1
  for (let i = 0; i <= maxWidth && i < text.length; i++) {
    if (/\s/.test(text[i])) best = i
    if (text[i] === '-' && i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1]))
      best = i + 1
  }
  return best > 0 ? best : -1
}


// Reflow paragraphs in multi-line text:
// 1. Split text into paragraphs delimited by blank lines
// 2. Within each paragraph, replace newlines with spaces
// 3. Rejoin paragraphs with double newlines (rendered as extra gap)
// Single-line text passes through unchanged.

function reflowParagraphs(text: string): string {
  if (!text.includes('\n')) return text

  const paragraphs = text.split(/\n\s*\n/)
  const reflowed = paragraphs.map(p => p.replace(/\n/g, ` `).trim())
  return reflowed.join('\n\n')
}


// Wrap text to a maximum line width in characters.
// 1. Split into segments on existing newlines
// 2. Wrap each segment on whitespace or after hyphens
// 3. Rejoin with newlines

export function wrapText(text: string, maxWidth: number): string {
  return text.split('\n').map(seg => wrapSegment(seg, maxWidth)).join('\n')
}

function wrapSegment(segment: string, maxWidth: number): string {
  if (maxWidth <= 0) return segment  // Guard against infinite loop
  if (segment.length <= maxWidth) return segment

  const lines: string[] = []
  let remaining = segment

  while (remaining.length > maxWidth) {
    let breakAt = findBreakPoint(remaining, maxWidth)
    if (breakAt <= 0) {
      // No natural break point — force break at maxWidth
      breakAt = maxWidth
    }
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
