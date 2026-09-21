#!/usr/bin/env node
/**
 * CLI for processing markdown files with picjs code blocks. The work of
 * finding and replacing the blocks lives in md-blocks.ts; this is the shell
 * around it.
 */

import { Command } from "commander"
import * as fs from "fs"
import * as path from "path"

import { processMarkdown } from "./md-blocks.js"
import { ensureReady } from "./render-to-string.js"

// Bumped by `npm version`, which rewrites package.json — so read it from
// there rather than keeping a second copy in step by hand.
const { version } = JSON.parse(
  fs.readFileSync(new URL(`../package.json`, import.meta.url), `utf-8`))

interface ProcessOptions {
  output?: string
  watch?: boolean
  verbose?: boolean
}

/** Resolves to the number of blocks that failed to render. */
async function processFile(inputPath: string, { verbose = false, output }: ProcessOptions): Promise<number> {
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`)
    process.exit(1)
  }

  await ensureReady()

  const content = fs.readFileSync(inputPath, `utf-8`)
  const result = await processMarkdown(content, message => console.error(message))

  if (verbose) console.log(summarise(result))

  const outputPath = output || inputPath

  if (result.content !== content || output) {
    fs.writeFileSync(outputPath, result.content)
    console.log(`Processed: ${outputPath}`)
  } else {
    if (verbose) console.log(`No changes: ${outputPath}`)
  }

  return result.errors
}

function summarise({ rendered, unchanged, errors }: { rendered: number, unchanged: number, errors: number }) {
  const total = rendered + unchanged + errors
  return `Found: ${total} blocks, Rendered: ${rendered}, Unchanged: ${unchanged}` +
         (errors ? `, Errors: ${errors}` : ``)
}

async function watchFile(inputPath: string, options: ProcessOptions): Promise<void> {
  const { verbose = false } = options

  console.log(`Watching ${inputPath}...`)
  await processFile(inputPath, options)

  let debounceTimer: NodeJS.Timeout | null = null

  fs.watch(inputPath, async (eventType) => {
    if (eventType === `change`) {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(async () => {
        if (verbose) console.log(`File changed, reprocessing...`)
        await processFile(inputPath, { ...options, watch: false })
      }, 100)
    }
  })
}

const program = new Command()
  .name(`picjs`)
  .description(`Process markdown files with picjs code blocks`)
  .version(version)
  .showHelpAfterError(true)

program
  .command(`process`)
  .description(`Process a markdown file, rendering picjs code blocks as SVG`)
  .argument(`<file>`, `Markdown file to process`)
  .option(`-o, --output <file>`, `Output file (default: overwrite input)`)
  .option(`-v, --verbose`, `Verbose output`)
  .action(async (file: string, options: ProcessOptions) => {
    // A build that silently leaves broken diagrams behind is a failed build.
    const errors = await processFile(path.resolve(file), options)
    if (errors) process.exit(1)
  })

program
  .command(`watch`)
  .description(`Watch a markdown file and reprocess on changes`)
  .argument(`<file>`, `Markdown file to watch`)
  .option(`-o, --output <file>`, `Output file (default: overwrite input)`)
  .option(`-v, --verbose`, `Verbose output`)
  .action(async (file: string, options: ProcessOptions) => {
    await watchFile(path.resolve(file), { ...options, watch: true })
  })

program.parse()
