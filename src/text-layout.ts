// Text layout for labels: markdown → styled runs → wrapped lines → spacing.
//
// This is the single authority for how a label's text is broken into lines and
// how far apart those lines sit. Both the size estimate (shapes/slabel.ts) and
// the SVG renderer (renderers/svg/label.ts) go through it, so a label reserves
// exactly the space it draws.
//
// They used to implement this separately, and drifted: the estimate wrapped the
// raw source text while the renderer wrapped the markdown-stripped runs, so
// `Label "**a** **b** **c**" maxwidth 10` reserved five lines and drew one.
// It also lives here rather than in the renderer because a shape must not have
// to import from a renderer to find out how big it is.

import * as MDModule from "simple-markdown"

interface SimpleMarkdownParser {
  defaultInlineParse(text: string): SimpleMarkdown.SingleASTNode[]
}

// Handle CJS/ESM interop - simple-markdown exports are under .default in ESM
const MD: SimpleMarkdownParser = (MDModule as any).default || MDModule

export type StyledRun = { text: string, type: string, url?: string }

export interface TextLayoutOptions {
  fontSize: number
  lineHeight?: number
  /** Labels inside a shape use a tighter gap between paragraphs. */
  hasParent: boolean
  maxwidth?: number
}

export interface LaidOutLine {
  runs: StyledRun[]
  /** Offset from the previous line. Zero for the first line, which carries none. */
  dy: number
  /** Visible characters, markdown markers excluded. */
  length: number
}

export interface TextLayout {
  lines: LaidOutLine[]
  longestLine: number
  height: number
  lineSpacing: number
  paragraphSpacing: number
}

// Flatten a simple-markdown AST into a flat list of {text, type, url} runs.
// Nested nodes (e.g. em containing text) are flattened so each run
// carries the innermost styling. `url` is tracked as its own inherited
// channel (from a "link" node's `target`), independent of `type`, so a
// link wrapping bold/italic text keeps both.

export function flattenMDToRuns(nodes: SimpleMarkdown.SingleASTNode[], inheritType = `text`, inheritUrl?: string): StyledRun[] {
  const runs: StyledRun[] = []
  for (const node of nodes) {
    const type = node.type === `text` ? inheritType : node.type
    const url = node.type === `link` ? node.target : inheritUrl
    if (Array.isArray(node.content)) {
      runs.push(...flattenMDToRuns(node.content, type, url))
    } else {
      runs.push(url ? { text: node.content, type, url } : { text: node.content, type })
    }
  }
  return runs
}

// Wrap styled runs to a maximum visible-character width.
// Returns an array of lines, each line being an array of runs.
// Only visible text counts toward the width — styling is preserved across breaks.

export function wrapRuns(runs: StyledRun[], maxWidth: number): StyledRun[][] {
  const lines: StyledRun[][] = [[]]
  let col = 0

  for (const run of runs) {
    let remaining = run.text

    while (remaining.length > 0) {
      const space = maxWidth - col
      if (remaining.length <= space) {
        lines[lines.length - 1].push({ ...run, text: remaining })
        col += remaining.length
        break
      }

      // Need to break — find a good break point within the available space
      const breakAt = findBreakPointInRun(remaining, space)
      if (breakAt > 0) {
        lines[lines.length - 1].push({ ...run, text: remaining.substring(0, breakAt).trimEnd() })
        remaining = remaining.substring(breakAt).trimStart()
      } else if (col === 0) {
        // Forced break — no whitespace found and we're at line start
        lines[lines.length - 1].push({ ...run, text: remaining.substring(0, maxWidth) })
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

export function reflowParagraphs(text: string): string {
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

// Split into paragraphs on blank lines, collapsing interior newlines to spaces.
export function splitIntoParagraphs(text: string): string[] {
  return reflowParagraphs(text).split('\n\n')
}

// Parse, wrap and space a label's text. `height` is the first line's own height
// plus every subsequent line's offset.
export function layoutText(text: string, opts: TextLayoutOptions): TextLayout {
  const { fontSize, lineHeight, hasParent, maxwidth } = opts

  const lineSpacing = lineHeight && lineHeight > 0 ? lineHeight : fontSize * 1.2
  const paragraphSpacing = hasParent ? lineSpacing : lineSpacing * 2

  const lines: LaidOutLine[] = []
  let longestLine = 0
  let dySum = 0

  splitIntoParagraphs(text).forEach((paragraph, pi) => {
    const runs = flattenMDToRuns(MD.defaultInlineParse(paragraph))
    const wrapped = maxwidth ? wrapRuns(runs, maxwidth) : [ runs ]

    wrapped.forEach((lineRuns, li) => {
      const length = lineRuns.reduce((n, run) => n + run.text.length, 0)
      longestLine = Math.max(longestLine, length)

      const dy = (pi === 0 && li === 0) ? 0
               : (li === 0)             ? paragraphSpacing
               :                          lineSpacing
      dySum += dy

      lines.push({ runs: lineRuns, dy, length })
    })
  })

  return {
    lines,
    longestLine,
    height: fontSize * 1.2 + dySum,
    lineSpacing,
    paragraphSpacing,
  }
}

