/**
 * Finding picjs code blocks in a markdown file and replacing them with the
 * diagrams they describe.
 *
 * Block modes:
 *   ```picjs           — the diagram alone
 *   ```picjs example   — the diagram, then the source below it
 *   ```picjs 2up       — source and diagram side by side
 *
 * In every mode the fence is replaced outright. The source is preserved in an
 * HTML comment alongside a checksum, so it survives the round trip and a
 * re-run redraws only the blocks whose source has actually changed.
 */

import { renderToStringAsync } from "./render-to-string.js"
import * as crypto from "crypto"

export type BlockMode = "plain" | "example" | "2up"

export interface CodeBlock {
  start: number
  end: number
  source: string
  mode: BlockMode
  checksum: string
  renderedEnd?: number
  existingChecksum?: string
}

export interface ProcessResult {
  content: string
  rendered: number
  unchanged: number
  errors: number
}

export function computeChecksum(source: string): string {
  return crypto.createHash(`md5`).update(source).digest(`hex`).slice(0, 8)
}

// A rendered block: <!-- picjs:CHECKSUM:MODE ... source ... --> then the
// content, up to <!-- /picjs -->.
const RENDERED_RE = /\s*<!-- picjs:([a-f0-9]+):(plain|example|2up)\n([\s\S]*?)-->\n([\s\S]*?)<!-- \/picjs -->/

export function findPicjsBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = []
  const foundRanges: Array<{ start: number, end: number }> = []

  const fenceRegex = /^(```|~~~)picjs(?:\s+(example|2up))?\s*\n([\s\S]*?)\n\1/gm

  let match
  while ((match = fenceRegex.exec(content)) !== null) {
    const source = match[3]
    const block: CodeBlock = {
      start: match.index,
      end: match.index + match[0].length,
      source,
      mode: (match[2] || `plain`) as BlockMode,
      checksum: computeChecksum(source),
    }

    // A rendered block immediately following is this block's previous output.
    const afterBlock = content.slice(block.end)
    const existingMatch = afterBlock.match(RENDERED_RE)

    if (existingMatch && afterBlock.indexOf(existingMatch[0]) === 0) {
      block.existingChecksum = existingMatch[1]
      block.renderedEnd = block.end + existingMatch[0].length
      foundRanges.push({ start: block.start, end: block.renderedEnd })
    } else {
      foundRanges.push({ start: block.start, end: block.end })
    }

    blocks.push(block)
  }

  // Blocks rendered on a previous run no longer have a fence in front of them.
  const standaloneRegex = /<!-- picjs:([a-f0-9]+):(plain|example|2up)\n([\s\S]*?)-->\n([\s\S]*?)<!-- \/picjs -->/g

  while ((match = standaloneRegex.exec(content)) !== null) {
    const blockStart = match.index
    const blockEnd = match.index + match[0].length

    const overlaps = foundRanges.some(r =>
      (blockStart >= r.start && blockStart < r.end) ||
      (blockEnd > r.start && blockEnd <= r.end))
    if (overlaps) continue

    const source = match[3].replace(/\n$/, ``)

    blocks.push({
      start: blockStart,
      end: blockStart,          // no fence left to replace
      source,
      mode: match[2] as BlockMode,
      checksum: computeChecksum(source),
      existingChecksum: match[1],
      renderedEnd: blockEnd,
    })
  }

  blocks.sort((a, b) => a.start - b.start)

  return blocks
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`)
}

export function buildRenderedBlock(source: string, svg: string, mode: BlockMode, checksum: string): string {
  const comment = `<!-- picjs:${checksum}:${mode}\n${source}\n-->`
  const codeHtml = `<pre><code class="language-picjs">${escapeHtml(source)}</code></pre>`

  let body: string
  switch (mode) {
    case `example`:
      body = `${svg}\n\n${codeHtml}`
      break

    case `2up`:
      body = [
        `<table><tr>`,
        `<td>\n\n${codeHtml}\n\n</td>`,
        `<td>\n\n${svg}\n\n</td>`,
        `</tr></table>`,
      ].join(`\n`)
      break

    case `plain`:
    default:
      body = svg
      break
  }

  return `\n${comment}\n${body}\n<!-- /picjs -->`
}

export async function processMarkdown(
  content: string,
  report: (message: string) => void = () => {},
): Promise<ProcessResult> {
  const blocks = findPicjsBlocks(content)

  if (blocks.length === 0)
    return { content, rendered: 0, unchanged: 0, errors: 0 }

  let rendered = 0
  let unchanged = 0
  let errors = 0
  let result = content

  // Back to front, so that each replacement leaves earlier offsets valid.
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]

    if (block.existingChecksum === block.checksum) {
      unchanged++
      continue
    }

    const renderResult = await renderToStringAsync(block.source, {
      padding: 0.2,
      includeSource: false,
    })

    if (renderResult.error) {
      report(`Error in block ${i + 1}: ${renderResult.error}`)
      errors++
      continue
    }

    const renderedBlock = buildRenderedBlock(block.source, renderResult.svg, block.mode, block.checksum)
    const replaceEnd = block.renderedEnd ?? block.end

    result = result.slice(0, block.start) + renderedBlock + result.slice(replaceEnd)
    rendered++
  }

  return { content: result, rendered, unchanged, errors }
}
