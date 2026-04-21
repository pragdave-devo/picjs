// src/dom-patcher.ts

type GetElementById = (id: string) => Element | null

interface SubIds {
  shape?: string
  text?: string
}

export class DomPatcher {
  private elements = new Map<string, { el: Element; subs: SubIds }>()
  private getById: GetElementById

  constructor(getById: GetElementById) {
    this.getById = getById
  }

  register(shapeId: string, elementId: string, subs?: SubIds) {
    const el = this.getById(elementId)
    if (el) this.elements.set(shapeId, { el, subs: subs || {} })
  }

  setAttr(shapeId: string, attrs: Record<string, string | number | undefined>) {
    const entry = this.elements.get(shapeId)
    if (!entry) return
    this.applyAttrs(entry.el, attrs)
  }

  setShapeAttr(shapeId: string, attrs: Record<string, string | number | undefined>) {
    const entry = this.elements.get(shapeId)
    if (!entry?.subs.shape) return this.setAttr(shapeId, attrs)
    const el = this.getById(entry.subs.shape)
    if (el) this.applyAttrs(el, attrs)
  }

  setTextAttr(shapeId: string, attrs: Record<string, string | number | undefined>) {
    const entry = this.elements.get(shapeId)
    if (!entry?.subs.text) return
    const el = this.getById(entry.subs.text)
    if (el) this.applyAttrs(el, attrs)
  }

  private applyAttrs(el: Element, attrs: Record<string, string | number | undefined>) {
    for (const [name, value] of Object.entries(attrs)) {
      if (value === undefined) {
        el.removeAttribute(name)
      } else {
        el.setAttribute(name, String(value))
      }
    }
  }
}
