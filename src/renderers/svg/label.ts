// import { setAttr } from "redom"
import { SvgBase } from "./_base.js"
import { RTE } from "../../runtime_error.js"
import * as Convert from "./attribute_converters.js"
import * as Shape from "../../shapes.js"

import * as MD from "simple-markdown"
import { setChildren, svg, text } from "redom"
import { RenderParameters } from "../../types.js"





// const markdownBlock = SimpleMarkdown.defaultBlockParse()

export class Label extends SvgBase {

  private previousText?: string
  private previousX?: number

  constructor(position: RenderParameters, attrs: Shape.Args) {
    super(position, attrs)
    // arrange for (x,y) to be top-left of text box
    this.attrs[`dominant-baseline`] = `text-before-edge`

    this.build(`text`)
    this.setText(attrs.text)   // use original attrs — convertToSVG strips `text` from this.attrs
  }

  rerender(position: RenderParameters, attrs: Shape.Args) {
    super.rerender(position, attrs)
    this.setText(attrs.text)
    return this
  }

  setText(text: string) {
    const currentX = this.attrs.x
    if (text !== this.previousText || currentX !== this.previousX) {
      const lines = text.split('\n')
      if (lines.length <= 1) {
        const parsedText = MD.defaultInlineParse(text)
        this.listToTSpans(this.el, parsedText)
      } else {
        const fontSize = parseFloat(this.attrs[`font-size`]) || 0.14
        const lineSpacing = fontSize * 1.2
        const children: SVGElement[] = []
        for (let i = 0; i < lines.length; i++) {
          const attrs: Record<string, any> = { x: currentX }
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
    ])
    // Remove attributes that are meaningless on SVG <text> elements
    // and could interfere with rendering (e.g., width as inline-size in SVG 2)
    delete newAttrs.width
    delete newAttrs.height
    delete newAttrs.text   // text content is set via setText, not as an attribute
    delete newAttrs.font   // font sub-properties already injected; object value would serialize as [object Object]
    delete newAttrs.align
    return newAttrs
  }


}


