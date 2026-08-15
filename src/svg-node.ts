// src/svg-node.ts

export interface SvgNode {
  tag: string
  attrs: Record<string, string | number>
  children: (SvgNode | string)[]
}

export function svgNode(
  tag: string,
  attrs: Record<string, string | number> = {},
  children?: (SvgNode | string)[]
): SvgNode {
  return { tag, attrs, children: children || [] }
}

// When rendering to linkedom (server-side), self-closing SVG tags like <rect/>
// are incorrectly parsed as opening tags without closing, causing subsequent
// elements to nest inside them. Always use explicit closing tags.
// See: https://github.com/WebReflection/linkedom/issues/270
const USE_SELF_CLOSING_TAGS = false

// Elements that must always have a closing tag even with no children
// (browsers treat self-closing <text/> differently than <text></text>)
const NEEDS_CLOSING_TAG = new Set(["text", "tspan", "textPath", "g", "svg", "defs", "clipPath", "mask", "pattern", "a", "style"])

export function serialize(node: SvgNode): string {
  const tag = validateTag(node.tag)
  const attrStr = serializeAttrs(node.attrs, tag)
  const prefix = attrStr ? `<${tag} ${attrStr}` : `<${tag}`

  if (USE_SELF_CLOSING_TAGS && node.children.length === 0 && !NEEDS_CLOSING_TAG.has(tag)) {
    return `${prefix}/>`
  }

  const inner = node.children.map(child =>
    typeof child === "string" ? escapeText(child) : serialize(child)
  ).join("")

  return `${prefix}>${inner}</${tag}>`
}

function serializeAttrs(attrs: Record<string, string | number>, tag?: string): string {
  const parts: string[] = []
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue
    // href is blocked everywhere except a sanitized <a> tag - see BLOCKED_ATTRS
    if (tag === "a" && key.toLowerCase() === "href") {
      const safeUrl = sanitizeUrl(String(value))
      if (!safeUrl) throw new Error(`Unsafe URL scheme for "href": "${value}"`)
      parts.push(`href="${escapeAttr(safeUrl)}"`)
      continue
    }
    const name = validateAttrName(key)
    parts.push(`${name}="${escapeAttr(String(value))}"`)
  }
  return parts.join(" ")
}

// Only relative/fragment URLs and a small allowlist of safe schemes may become
// an <a href>. Blocks javascript:/data:/vbscript: and similar script-executing schemes.
const SAFE_URL_SCHEME = /^(https?:|mailto:)/i
const SAFE_RELATIVE_URL = /^[#/.]/

export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  if (SAFE_RELATIVE_URL.test(trimmed) || SAFE_URL_SCHEME.test(trimmed)) return trimmed
  return null
}

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

// --- Tag whitelist ---

const SVG_TAGS = new Set([
  "svg", "g", "defs", "symbol", "use",
  "rect", "circle", "ellipse", "line", "polyline", "polygon", "path",
  "text", "tspan", "textPath",
  "clipPath", "mask", "pattern",
  "linearGradient", "radialGradient", "stop",
  "filter", "feGaussianBlur", "feOffset", "feBlend", "feComposite",
  "marker", "title", "desc",
  "image", "a", "style",
])

// --- Attribute validation ---

const SVG_ATTR_PATTERN = /^[a-zA-Z][a-zA-Z0-9-]*$/

const BLOCKED_ATTRS = new Set([
  "href", "xlink:href",
])

function validateTag(tag: string): string {
  if (!SVG_TAGS.has(tag)) {
    throw new Error(`Disallowed SVG tag: "${tag}"`)
  }
  return tag
}

function validateAttrName(name: string): string {
  if (!SVG_ATTR_PATTERN.test(name)) {
    throw new Error(`Invalid SVG attribute name: "${name}"`)
  }
  if (name.toLowerCase().startsWith("on")) {
    throw new Error(`Event handler attributes are not allowed: "${name}"`)
  }
  if (BLOCKED_ATTRS.has(name.toLowerCase())) {
    throw new Error(`Blocked attribute: "${name}"`)
  }
  return name
}

// --- ID generation ---

export class IdGenerator {
  private counter = 0
  constructor(private prefix: string) {}

  next(): string {
    const n = this.counter++
    if (n < 26) return `${this.prefix}${String.fromCharCode(97 + n)}`       // a-z
    if (n < 52) return `${this.prefix}${String.fromCharCode(65 + n - 26)}`  // A-Z
    return `${this.prefix}${n.toString(36)}`                                 // base-36 fallback
  }

  sub(parentId: string, suffix: string): string {
    return `${parentId}-${suffix}`
  }
}
