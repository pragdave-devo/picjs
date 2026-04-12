#!/usr/bin/env node
/**
 * CLI for processing markdown files with picjs code blocks.
 *
 * Workflow:
 * 1. Find ```picjs code blocks
 * 2. Check if there's a <!-- picjs:checksum --> comment and SVG after each
 * 3. If checksum matches, skip; otherwise regenerate SVG
 * 4. Code blocks are preserved for editing
 */

import { Command } from "commander"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"

// Dynamically import render-to-string to set up linkedom globals first
async function getRenderToString() {
  const { renderToString } = await import("./render-to-string.js")
  return renderToString
}

interface ProcessOptions {
  output?: string
  watch?: boolean
  verbose?: boolean
}

function computeChecksum(source: string): string {
  return crypto.createHash('md5').update(source).digest('hex').slice(0, 8)
}

interface CodeBlock {
  start: number           // Start index of code block
  end: number             // End index of code block
  source: string          // The picjs source code
  checksum: string        // Checksum of the source
  existingSvgEnd?: number // End of existing SVG (if any)
  existingChecksum?: string
}

function findPicjsBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = []

  // Match fenced code blocks with picjs language
  const fenceRegex = /^(```|~~~)picjs\s*\n([\s\S]*?)\n\1/gm

  let match
  while ((match = fenceRegex.exec(content)) !== null) {
    const source = match[2]
    const checksum = computeChecksum(source)

    const block: CodeBlock = {
      start: match.index,
      end: match.index + match[0].length,
      source,
      checksum
    }

    // Check if there's an existing picjs comment + SVG after this block
    const afterBlock = content.slice(block.end)
    const existingMatch = afterBlock.match(/^\s*<!--\s*picjs:([a-f0-9]+)\s*-->\s*<svg[\s\S]*?<\/svg>/i)

    if (existingMatch) {
      block.existingChecksum = existingMatch[1]
      block.existingSvgEnd = block.end + existingMatch[0].length
    }

    blocks.push(block)
  }

  return blocks
}

async function processMarkdown(content: string, verbose: boolean): Promise<string> {
  const renderToString = await getRenderToString()
  const blocks = findPicjsBlocks(content)

  if (blocks.length === 0) {
    if (verbose) console.log("No picjs blocks found")
    return content
  }

  if (verbose) console.log(`Found ${blocks.length} picjs block(s)`)

  // Process blocks in reverse order to preserve indices
  let result = content
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i]

    // Check if we need to regenerate
    if (block.existingChecksum === block.checksum) {
      if (verbose) console.log(`Block ${i + 1}: unchanged (checksum ${block.checksum})`)
      continue
    }

    if (verbose) console.log(`Block ${i + 1}: rendering...`)

    // Render the SVG
    const renderResult = await renderToString(block.source, {
      padding: 0.2,
      includeSource: false
    })

    if (renderResult.error) {
      console.error(`Error in block ${i + 1}:`, renderResult.error)
      continue
    }

    // Build the SVG insert: comment + SVG
    const svgInsert = `\n<!-- picjs:${block.checksum} -->\n${renderResult.svg}`

    // Determine what to replace
    const replaceEnd = block.existingSvgEnd ?? block.end

    // Keep the code block, replace/add the SVG after it
    result = result.slice(0, block.end) + svgInsert + result.slice(replaceEnd)

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
      // Debounce rapid changes
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
