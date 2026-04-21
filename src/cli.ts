#!/usr/bin/env node
/**
 * CLI for processing markdown files with picjs code blocks.
 *
 * Block modes:
 *   ```picjs           — render SVG, keep code block above it
 *   ```picjs example   — render SVG, then show syntax-highlighted code below
 *   ```picjs 2up       — side-by-side table: code on left, SVG on right
 *
 * Each rendered block is wrapped in a comment containing the source and
 * a checksum so re-runs are idempotent.
 */

import { Command } from "commander"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

async function getRenderToString() {
  const { renderToString } = await import("./render-to-string.js")
  return renderToString
}

interface ProcessOptions {
  output?: string
  watch?: boolean
  verbose?: boolean
}

type BlockMode = "plain" | "example" | "2up"

function computeChecksum(source: string): string {
  return crypto.createHash('md5').update(source).digest('hex').slice(0, 8)
}

interface CodeBlock {
  start: number
  end: number
  source: string
  mode: BlockMode
  checksum: string
  renderedEnd?: number
  existingChecksum?: string
}

// Matches a rendered output block: <!-- picjs:CHECKSUM:MODE ... source ... --> then content
// The content ends at <!-- /picjs -->
const RENDERED_RE = /\s*<!-- picjs:([a-f0-9]+):(plain|example|2up)\n([\s\S]*?)-->\n([\s\S]*?)<!-- \/picjs -->/

function findPicjsBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = []

  const fenceRegex = /^(```|~~~)picjs(?:\s+(example|2up))?\s*\n([\s\S]*?)\n\1/gm

  let match
  while ((match = fenceRegex.exec(content)) !== null) {
    const mode = (match[2] || "plain") as BlockMode
    const source = match[3]
    const checksum = computeChecksum(source)

    const block: CodeBlock = {
      start: match.index,
      end: match.index + match[0].length,
      source,
      mode,
      checksum
    }

    // Check for existing rendered output after the code block
    const afterBlock = content.slice(block.end)
    const existingMatch = afterBlock.match(RENDERED_RE)

    if (existingMatch && afterBlock.indexOf(existingMatch[0]) === 0) {
      block.existingChecksum = existingMatch[1]
      block.renderedEnd = block.end + existingMatch[0].length
    }

    blocks.push(block)
  }

  return blocks
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildRenderedBlock(source: string, svg: string, mode: BlockMode, checksum: string): string {
  const comment = `<!-- picjs:${checksum}:${mode}\n${source}\n-->`
  const codeHtml = `<pre><code class="language-picjs">${escapeHtml(source)}</code></pre>`

  let body: string
  switch (mode) {
    case "example":
      body = `${svg}\n\n${codeHtml}`
      break

    case "2up":
      body = [
        `<table><tr>`,
        `<td>\n\n${codeHtml}\n\n</td>`,
        `<td>\n\n${svg}\n\n</td>`,
        `</tr></table>`,
      ].join("\n")
      break

    case "plain":
    default:
      body = svg
      break
  }

  return `\n${comment}\n${body}\n<!-- /picjs -->`
}

async function processMarkdown(content: string, verbose: boolean): Promise<string> {
  const renderToString = await getRenderToString()
  const blocks = findPicjsBlocks(content)

  if (blocks.length === 0) {
    if (verbose) console.log("No picjs blocks found")
    return content
  }

  if (verbose) console.log(`Found ${blocks.length} picjs block(s)`)

  let result = content
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]

    if (block.existingChecksum === block.checksum) {
      if (verbose) console.log(`Block ${i + 1}: unchanged (checksum ${block.checksum})`)
      continue
    }

    if (verbose) console.log(`Block ${i + 1}: rendering (${block.mode})...`)

    const renderResult = await renderToString(block.source, {
      padding: 0.2,
      includeSource: false
    })

    if (renderResult.error) {
      console.error(`Error in block ${i + 1}:`, renderResult.error)
      continue
    }

    const rendered = buildRenderedBlock(block.source, renderResult.svg, block.mode, block.checksum)
    const replaceEnd = block.renderedEnd ?? block.end

    result = result.slice(0, block.end) + rendered + result.slice(replaceEnd)

    if (verbose) console.log(`Block ${i + 1}: done`)
  }

  return result
}

async function processFile(inputPath: string, { verbose = false, output }: ProcessOptions): Promise<void> {
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`)
    process.exit(1)
  }

  const content = fs.readFileSync(inputPath, 'utf-8')
  const processed = await processMarkdown(content, verbose)

  const outputPath = output || inputPath

  if (processed !== content) {
    fs.writeFileSync(outputPath, processed)
    console.log(`Processed: ${outputPath}`)
  } else {
    if (verbose) console.log(`No changes: ${outputPath}`)
  }
}

async function watchFile(inputPath: string, options: ProcessOptions): Promise<void> {
  const { verbose = false } = options

  console.log(`Watching ${inputPath}...`)
  await processFile(inputPath, options)

  let debounceTimer: NodeJS.Timeout | null = null

  fs.watch(inputPath, async (eventType) => {
    if (eventType === 'change') {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        if (verbose) console.log(`File changed, reprocessing...`)
        await processFile(inputPath, { ...options, watch: false })
      }, 100)
    }
  })
}

const program = new Command()
  .name('picjs')
  .description('Process markdown files with picjs code blocks')
  .version('0.2.0')

program
  .command('process')
  .description('Process a markdown file, rendering picjs code blocks as SVG')
  .argument('<file>', 'Markdown file to process')
  .option('-o, --output <file>', 'Output file (default: overwrite input)')
  .option('-v, --verbose', 'Verbose output')
  .action(async (file: string, options: ProcessOptions) => {
    await processFile(path.resolve(file), options)
  })

program
  .command('watch')
  .description('Watch a markdown file and reprocess on changes')
  .argument('<file>', 'Markdown file to watch')
  .option('-o, --output <file>', 'Output file (default: overwrite input)')
  .option('-v, --verbose', 'Verbose output')
  .action(async (file: string, options: ProcessOptions) => {
    await watchFile(path.resolve(file), { ...options, watch: true })
  })

program.parse()
