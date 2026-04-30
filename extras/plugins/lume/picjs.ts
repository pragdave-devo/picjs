/**
 * Lume plugin: render ```picjs code blocks to SVG at build time.
 * Uses @strike48/picjs (npm) for diagram rendering.
 * Supports meta options: example, stacked, width=X, svgwidth=X
 *
 * Operates as a preprocessor on raw markdown (before markdown rendering)
 * so that code fence meta strings are available for parsing.
 */
import type { Site } from "lume/core/site.ts";
import { picjs } from "npm:@strike48/picjs";

const picjsStyles = `
.picjs-example {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-start;
}
.picjs-example > * {
  flex: 1 1 0%;
  min-width: 18rem;
}
.picjs-example .picjs-source {
  margin: 0;
  overflow-x: auto;
}
.picjs-stacked {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.picjs-stacked .picjs-source {
  margin: 0;
  overflow-x: auto;
}
.picjs-source code {
  line-height: 1.3;
  font-size: calc(1em - 1pt);
}
.picjs-diagram svg {
  width: 100%;
  height: auto;
}
`;

export default function picjsPlugin() {
  return (site: Site) => {
    // Use preprocess to work on raw markdown before the markdown renderer runs.
    // This lets us parse code fence meta strings (``` picjs example svgwidth="7rem")
    // which are stripped by the markdown renderer.
    site.preprocess([".md"], (pages) => {
      for (const page of pages) {
        // In preprocess, raw markdown is in page.data.content (not page.content)
        const content = page.data.content as string;
        if (!content || !content.includes("picjs")) continue;

        let hasExample = false;

        // Match fenced code blocks: ``` picjs [meta]\n...\n```
        // The regex captures: (1) opening fence backticks, (2) meta string, (3) code content
        page.data.content = content.replace(
          /^(`{3,}) *picjs([^\n]*)\n([\s\S]*?)^\1 *$/gm,
          (_match, _fence: string, meta: string, source: string) => {
            source = source.trimEnd();
            if (!source) return _match;

            meta = meta.trim();
            const isStacked = /\bstacked\b/.test(meta);
            const isExample = !isStacked && /\bexample\b/.test(meta);
            const widthMatch = meta.match(/\bwidth=(\S+)/);
            const width = widthMatch ? widthMatch[1] : null;
            const svgWidthMatch = meta.match(/\bsvgwidth=["']?([^"'\s]+)/);
            const svgWidth = svgWidthMatch ? svgWidthMatch[1] : null;

            try {
              const result = picjs(source);
              if (result.isError) {
                return `<div class="picjs-error">${result.svg}</div>`;
              }

              const containerStyle = width ? ` style="width: ${width}"` : "";
              let svgHtml = result.svg;
              if (svgWidth) {
                svgHtml = `<div style="width: ${svgWidth}; margin: 0 auto">${result.svg}</div>`;
              }

              if (isExample || isStacked) {
                hasExample = true;
                const cls = isStacked ? "picjs-stacked" : "picjs-example";
                const displaySource = source.replace(/^[ \t]*\/\/-\n([\s\S]*?)\n[ \t]*\/\/\+\n?/gm, "");
                const escapedSource = displaySource
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/\n/g, "&#10;");
                return `<div class="${cls}"${containerStyle}>` +
                  `<pre class="picjs-source"><code>${escapedSource}</code></pre>` +
                  `<div class="picjs-diagram">${svgHtml}</div>` +
                  `</div>`;
              }

              return `<div class="picjs-diagram"${containerStyle}>${svgHtml}</div>`;
            } catch (err) {
              console.warn(`[picjs] Failed to render: ${(err as Error).message}`);
              return _match;
            }
          }
        );

        if (hasExample) {
          page.data.content = `<style>${picjsStyles}</style>\n${page.data.content}`;
        }
      }
    });
  };
}
