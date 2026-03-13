#!/usr/bin/env node
// cli.ts — CLI entry point for picjs markdown processor

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import {
  findDiagrams,
  renderDiagram,
  updateMarkdown,
  deduplicateNames,
  type DiagramBlock,
  type RenderResult,
  type ProcessResult,
  type ProcessOptions,
} from './processor.ts';

function printUsage(): void {
  console.log(`Usage: picjs [options] <file.md> [file2.md ...]

Process markdown files containing picjs diagrams.

Options:
  --out <dir>    Output directory for SVG files (default: _diagrams)
  --dry-run      Show what would change without writing files
  --help, -h     Show this help message

Examples:
  picjs README.md
  picjs docs/*.md --out ./images
  picjs README.md --dry-run
`);
}

function parseArgs(args: string[]): { files: string[]; options: ProcessOptions } | null {
  const files: string[] = [];
  let outDir = '_diagrams';
  let dryRun = false;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      return null;
    }

    if (arg === '--out') {
      i++;
      if (i >= args.length) {
        console.error('Error: --out requires a directory argument');
        return null;
      }
      outDir = args[i];
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg.startsWith('-')) {
      console.error(`Error: Unknown option: ${arg}`);
      printUsage();
      return null;
    } else {
      files.push(arg);
    }
    i++;
  }

  if (files.length === 0) {
    console.error('Error: No input files specified');
    printUsage();
    return null;
  }

  return { files, options: { outDir, dryRun } };
}

function processFile(filePath: string, options: ProcessOptions): ProcessResult {
  const result: ProcessResult = {
    file: filePath,
    rawConverted: 0,
    rendered: 0,
    errors: 0,
    diagrams: [],
  };

  // Read file
  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`Error reading ${filePath}: ${err instanceof Error ? err.message : err}`);
    result.errors++;
    return result;
  }

  // Find all diagram blocks
  const blocks = findDiagrams(content);
  if (blocks.length === 0) {
    return result;
  }

  // Check for duplicates
  const uniqueNames = deduplicateNames(blocks);

  // Warn about duplicates
  const seenNames = new Set<string>();
  for (const block of blocks) {
    const uniqueName = uniqueNames.get(block)!;
    if (uniqueName !== block.name) {
      console.warn(`  Warning: duplicate name "${block.name}" renamed to "${uniqueName}"`);
    }
    seenNames.add(uniqueName);
  }

  // Render all diagrams
  const renderResults = new Map<DiagramBlock, RenderResult>();
  const fileDir = dirname(resolve(filePath));
  const outDirPath = join(fileDir, options.outDir);

  // Create output directory if needed
  if (!options.dryRun && blocks.length > 0) {
    if (!existsSync(outDirPath)) {
      mkdirSync(outDirPath, { recursive: true });
    }
  }

  for (const block of blocks) {
    const name = uniqueNames.get(block)!;
    const renderResult = renderDiagram(block.source);
    renderResults.set(block, renderResult);

    if (!block.isComment) {
      result.rawConverted++;
    }

    if (renderResult.success) {
      result.rendered++;
      result.diagrams.push({ name, success: true });

      // Write SVG file
      if (!options.dryRun) {
        const svgPath = join(outDirPath, `${name}.svg`);
        writeFileSync(svgPath, renderResult.svg!);
      }
    } else {
      result.errors++;
      result.diagrams.push({ name, success: false, error: renderResult.error });
    }
  }

  // Update markdown
  const newContent = updateMarkdown(content, blocks, renderResults, uniqueNames, options.outDir);

  // Write updated markdown
  if (!options.dryRun && newContent !== content) {
    writeFileSync(filePath, newContent);
  }

  return result;
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  const parsed = parseArgs(args);
  if (!parsed) {
    process.exit(1);
  }

  const { files, options } = parsed;

  let totalRaw = 0;
  let totalRendered = 0;
  let totalErrors = 0;

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const result = processFile(file, options);

    if (result.diagrams.length === 0) {
      console.log('  No diagrams found');
      continue;
    }

    if (result.rawConverted > 0) {
      console.log(`  Converted ${result.rawConverted} raw block(s) to comment form`);
    }

    for (const diag of result.diagrams) {
      if (diag.success) {
        if (options.dryRun) {
          console.log(`  Would render ${options.outDir}/${diag.name}.svg`);
        } else {
          console.log(`  Rendered ${options.outDir}/${diag.name}.svg`);
        }
      } else {
        console.log(`  Error in ${diag.name}: ${diag.error}`);
      }
    }

    totalRaw += result.rawConverted;
    totalRendered += result.rendered;
    totalErrors += result.errors;
  }

  if (files.length > 1) {
    console.log(`\nTotal: ${totalRendered} rendered, ${totalRaw} converted, ${totalErrors} error(s)`);
  }

  if (options.dryRun) {
    console.log('\n(dry run - no files were modified)');
  }

  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
