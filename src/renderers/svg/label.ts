import { SvgBase } from "./_base.js"
import { RTE } from "../../runtime_error.js"
import * as Convert from "./attribute_converters.js"
import * as Shape from "../../shapes.js"


import { SvgNode, svgNode, sanitizeUrl } from "../../svg-node.js"
import { RenderParameters } from "../../types.js"
import { StyledRun, TextLayout, layoutText } from "../../text-layout.js"



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
    this.attrs[`dominant-baseline`] = `text-before-edge`
    this.node.attrs[`dominant-baseline`] = `text-before-edge`
    this.maxwidth = attrs.maxwidth ? Number(attrs.maxwidth) : undefined
    this.lineHeight = attrs.line_height ? Number(attrs.line_height) : undefined
    this.align = attrs.align || `c`
    this.parentWidth = attrs._parentWidth ? Number(attrs._parentWidth) : undefined
    this.previousText = undefined
    this.setText(attrs.text)
    return this
  }

  setText(text: string) {
    const currentX = this.attrs.x
    if (text === this.previousText && currentX === this.previousX)
      return

    // Same layout the size estimate used, so the text fits the space reserved.
    const layout = layoutText(text, {
      fontSize: parseFloat(this.attrs[`font-size`]) || 0.14,
      lineHeight: this.lineHeight,
      hasParent: !!this.parentWidth,
      maxwidth: this.maxwidth,
    })

    // A single centred line needs no tspan wrapper or anchor handling.
    if (layout.lines.length <= 1 && this.align === `c`) {
      delete this.node.attrs["text-anchor"]
      this.node.children = this.runsToTSpans(layout.lines[0]?.runs ?? [])
    } else {
      this.renderLines(layout)
    }

    this.previousText = text
    this.previousX = currentX
  }

  // Emit one tspan per laid-out line, using the offsets the shared layout
  // computed. Alignment decides the anchor; the layout decides the breaks.
  private renderLines(layout: TextLayout) {
    const fontSize = parseFloat(this.attrs[`font-size`]) || 0.14

    // The inset keeps aligned text off the edge of the shape holding it. A
    // standalone label has no such shape — its container is its own box, which
    // is only as wide as the text — so insetting there would push the text out
    // of its own bounds and into whatever comes next.
    const margin = this.parentWidth ? fontSize * 0.5 : 0
    const containerWidth = this.parentWidth || this.position.width

    const anchorX = this.align === `w` ? this.position.x - containerWidth / 2 + margin
                  : this.align === `e` ? this.position.x + containerWidth / 2 - margin
                  : this.position.x

    this.node.attrs["text-anchor"] = this.align === `w` ? `start`
                                   : this.align === `e` ? `end`
                                   :                      `middle`

    this.node.children = layout.lines.map((line, i) => {
      const attrs: Record<string, any> = { x: anchorX }
      if (i > 0) attrs.dy = line.dy
      return svgNode('tspan', attrs, this.runsToTSpans(line.runs))
    })
  }

  // Adjacent runs pointing at the same link (e.g. simple-markdown splits
  // "Foo & Bar" into separate "Foo " / "& Bar" nodes at the "&") are grouped
  // into a single <a>, so the serialized text has no element boundary where
  // a renderer's default whitespace handling could collapse a run-boundary space.
  private runsToTSpans(runs: StyledRun[]): (SvgNode | string)[] {
    const result: (SvgNode | string)[] = []
    let i = 0
    while (i < runs.length) {
      const url = runs[i].url ? sanitizeUrl(runs[i].url!) : null
      if (!url) {
        result.push(styledRunNode(runs[i]))
        i++
        continue
      }
      const group: StyledRun[] = []
      while (i < runs.length && runs[i].url && sanitizeUrl(runs[i].url!) === url) {
        group.push(runs[i])
        i++
      }
      result.push(svgNode("a", { href: url }, group.map(styledRunNode)))
    }
    return result
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
    delete newAttrs._parentFill
    delete newAttrs._parentFillSlot
    return newAttrs
  }


}


// ─── Styled runs: markdown → flat text runs → wrap-aware rendering ─────────


// Renders a run's own styling (bold/italic), independent of any link wrapping.
function styledRunNode(run: StyledRun): SvgNode | string {
  if (run.type === "strong") return svgNode("tspan", { "font-weight": "bold" }, [run.text])
  if (run.type === "em") return svgNode("tspan", { "font-style": "italic" }, [run.text])
  return run.text
}
