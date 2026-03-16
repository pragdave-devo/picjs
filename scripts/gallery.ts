#!/usr/bin/env npx tsx
// gallery.ts — Generate PNG thumbnails and markdown gallery from .picjs examples
//
// Usage: npx tsx scripts/gallery.ts
//
// Requires: npm install @resvg/resvg-js

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename, extname } from 'path';
import { picjs } from '../src/picjs.ts';

// Try to import resvg - provide helpful error if not installed
let Resvg: any;
try {
  const resvg = await import('@resvg/resvg-js');
  Resvg = resvg.Resvg;
} catch {
  console.error('Error: @resvg/resvg-js is required for PNG generation');
  console.error('Install it with: npm install @resvg/resvg-js');
  process.exit(1);
}

const EXAMPLES_DIR = 'examples';
const OUTPUT_DIR = '_diagrams';
const THUMB_SIZE = 128;
const BASE_URL = 'https://pragdave-devo.github.io/picjs/?example=';

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Get all .picjs files
const files = readdirSync(EXAMPLES_DIR)
  .filter(f => extname(f).toLowerCase() === '.picjs')
  .sort();

const gallery: string[] = [];

for (const file of files) {
  const filePath = join(EXAMPLES_DIR, file);
  const name = basename(file, '.picjs');
  const pngName = `${name}.png`;
  const pngPath = join(OUTPUT_DIR, pngName);

  // Read and render the picjs source
  const source = readFileSync(filePath, 'utf-8');
  const result = picjs(source);

  if (result.isError) {
    console.error(`Error rendering ${file}: skipping`);
    continue;
  }

  // Convert SVG to PNG using resvg
  try {
    const resvg = new Resvg(result.svg, {
      fitTo: {
        mode: 'width',
        value: THUMB_SIZE,
      },
      background: 'white',
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();
    writeFileSync(pngPath, pngBuffer);
    console.error(`Generated ${pngPath}`);
  } catch (err) {
    console.error(`Error converting ${file} to PNG: ${err}`);
    continue;
  }

  // Add to gallery markdown
  const exampleUrl = `${BASE_URL}${name}`;
  gallery.push(`[![${name}](${OUTPUT_DIR}/${pngName})](${exampleUrl})`);
}

// Output markdown gallery to stdout
console.log(gallery.join(' '));
