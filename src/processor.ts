// processor.ts — Markdown diagram processing logic

import { createHash } from 'crypto';
import { picjs } from './picjs.ts';

export interface DiagramBlock {
  name: string;
  source: string;
  startLine: number;
  endLine: number;
  isComment: boolean;
}

export interface RenderResult {
  success: boolean;
  svg?: string;
  error?: string;
}

// Generate a hash-based name for unnamed diagrams
function generateHashName(source: string): string {
  const hash = createHash('sha256').update(source).digest('hex');
  return `picjs-${hash.slice(0, 8)}`;
}

// Find all picjs diagram blocks in markdown content
export function findDiagrams(content: string): DiagramBlock[] {
  const blocks: DiagramBlock[] = [];
  const lines = content.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Check for raw code block: ```picjs [name]
    const rawMatch = line.match(/^```picjs(?:\s+(\S+))?\s*$/);
    if (rawMatch) {
      const name = rawMatch[1] || null;
      const startLine = i;
      i++;
      const sourceLines: string[] = [];

      while (i < lines.length && !lines[i].match(/^```\s*$/)) {
        sourceLines.push(lines[i]);
        i++;
      }

      const source = sourceLines.join('\n');
      blocks.push({
        name: name || generateHashName(source),
        source,
        startLine,
        endLine: i,
        isComment: false,
      });
      i++;
      continue;
    }

    // Check for comment block: <!-- picjs: name
    const commentMatch = line.match(/^<!--\s*picjs:\s*(\S+)\s*$/);
    if (commentMatch) {
      const name = commentMatch[1];
      const startLine = i;
      i++;
      const sourceLines: string[] = [];

      while (i < lines.length && !lines[i].match(/^-->\s*$/)) {
        sourceLines.push(lines[i]);
        i++;
      }

      const source = sourceLines.join('\n');
      blocks.push({
        name,
        source,
        startLine,
        endLine: i,
        isComment: true,
      });
      i++;
      continue;
    }

    i++;
  }

  return blocks;
}

// Convert a raw code block to comment form
export function convertToCommentForm(name: string, source: string): string {
  return `<!-- picjs: ${name}\n${source}\n-->`;
}

// Render a diagram using picjs
export function renderDiagram(source: string): RenderResult {
  try {
    const result = picjs(source);
    if (result.isError) {
      // Extract error message from the SVG error output
      const errorMatch = result.svg.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
      const errorText = errorMatch
        ? errorMatch[1].replace(/<[^>]+>/g, '').trim()
        : 'Unknown error';
      return { success: false, error: errorText };
    }
    return { success: true, svg: result.svg };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// Check for duplicate names and make them unique
export function deduplicateNames(blocks: DiagramBlock[]): Map<DiagramBlock, string> {
  const nameCount = new Map<string, number>();
  const result = new Map<DiagramBlock, string>();

  for (const block of blocks) {
    const count = nameCount.get(block.name) || 0;
    if (count === 0) {
      result.set(block, block.name);
    } else {
      result.set(block, `${block.name}-${count + 1}`);
    }
    nameCount.set(block.name, count + 1);
  }

  return result;
}

// Update markdown content with processed diagrams
export function updateMarkdown(
  content: string,
  blocks: DiagramBlock[],
  results: Map<DiagramBlock, RenderResult>,
  uniqueNames: Map<DiagramBlock, string>,
  outDir: string
): string {
  const lines = content.split('\n');

  // Process blocks in reverse order to preserve line numbers
  const sortedBlocks = [...blocks].sort((a, b) => b.startLine - a.startLine);

  for (const block of sortedBlocks) {
    const name = uniqueNames.get(block)!;
    const result = results.get(block)!;
    const imgRef = `![](./${outDir}/${name}.svg)`;

    // Determine the full range to replace (source block + any trailing error/image)
    let endIdx = block.endLine;

    // Skip any existing error blocks after the source block
    let j = endIdx + 1;
    while (j < lines.length && lines[j].match(/^<!--\s*picjs-error:/)) {
      // Find end of this error block
      j++;
      while (j < lines.length && !lines[j].match(/^-->\s*$/)) {
        j++;
      }
      j++; // skip the -->
    }

    // Check for existing image reference
    if (j < lines.length && lines[j].match(/^!\[\]\([^)]*\)$/)) {
      j++; // include the image ref in the range to replace
    }
    endIdx = j - 1;

    // Build new content for this block
    const newLines: string[] = [];

    // Always use comment form
    newLines.push(`<!-- picjs: ${name}`);
    newLines.push(block.source);
    newLines.push('-->');

    // Add error comment if render failed
    if (!result.success) {
      newLines.push(`<!-- picjs-error: ${name}`);
      newLines.push(result.error || 'Unknown error');
      newLines.push('-->');
    }

    // Always add image reference
    newLines.push(imgRef);

    // Replace the entire range
    const removeCount = endIdx - block.startLine + 1;
    lines.splice(block.startLine, removeCount, ...newLines);
  }

  return lines.join('\n');
}

export interface ProcessResult {
  file: string;
  rawConverted: number;
  rendered: number;
  errors: number;
  diagrams: Array<{ name: string; success: boolean; error?: string }>;
}

export interface ProcessOptions {
  outDir: string;
  dryRun: boolean;
}
