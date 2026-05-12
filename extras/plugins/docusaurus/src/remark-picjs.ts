import type { Transformer } from "unified";
import type { Root, Code } from "mdast";
import { renderToString, parse } from "@strike48/picjs";

interface MetaOptions {
  isCode: boolean;
  isExample: boolean;
  isStacked: boolean;
  isAnimated: boolean;
  width: string | null;
  svgWidth: string | null;
  scale: number | null;
}

function parseMeta(meta: string | null | undefined): MetaOptions {
  const m = meta ?? "";
  const isCode = /\bcode\b/.test(m);
  const isAnimated = !isCode && /\banimated\b/.test(m);
  const isStacked = !isCode && /\bstacked\b/.test(m);
  const isExample = !isCode && !isStacked && /\bexample\b/.test(m);
  const widthMatch = m.match(/\bwidth=(\S+)/);
  const svgWidthMatch = m.match(/\bsvgwidth=["']?([^"'\s]+)/);
  const scaleMatch = m.match(/\bscale=(\S+)/);
  return {
    isCode,
    isAnimated,
    isStacked,
    isExample,
    width: widthMatch ? widthMatch[1] : null,
    svgWidth: svgWidthMatch ? svgWidthMatch[1] : null,
    scale: scaleMatch ? parseFloat(scaleMatch[1]) : null,
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stripHiddenSections(source: string): string {
  return source.replace(/^[ \t]*\/\/-\n([\s\S]*?)\n[ \t]*\/\/\+\n?/gm, "");
}

let animatedCounter = 0;

interface RenderResult {
  html: string;
  needsRuntime: boolean;
}

function renderPicjsBlock(source: string, meta: MetaOptions): RenderResult {
  const { isCode, isAnimated, isStacked, isExample, width, svgWidth, scale } =
    meta;

  if (isCode) {
    const escaped = escapeHtml(source);
    return {
      html: `<pre class="picjs-source language-picjs"><code class="language-picjs">${escaped}</code></pre>`,
      needsRuntime: false,
    };
  }

  const prefix = isAnimated ? `pj${animatedCounter++}` : undefined;
  const renderOpts = prefix ? { ids: { prefix } } : {};

  const result = renderToString(source, renderOpts);

  if (result.error) {
    return {
      html: `<div class="picjs-error">PIC.js error: ${escapeHtml(result.error)}</div>`,
      needsRuntime: false,
    };
  }

  const containerStyle = width ? ` style="width: ${width}"` : "";

  let svgHtml: string;
  if (svgWidth) {
    svgHtml = `<div style="width: ${svgWidth}; margin: 0 auto">${result.svg}</div>`;
  } else if (scale) {
    const cssWidth = result.width * scale;
    svgHtml = result.svg.replace(
      "<svg",
      `<svg style="width: ${cssWidth}rem; height: auto"`
    );
  } else {
    svgHtml = result.svg;
  }

  if (isAnimated) {
    const parsed = parse(source);
    if (parsed.status !== "ok") {
      return {
        html: `<div class="picjs-error">PIC.js parse error: ${escapeHtml(parsed.error?.message || "unknown")}</div>`,
        needsRuntime: false,
      };
    }
    const astJson = JSON.stringify(parsed.ast);
    const playerHtml =
      `<div class="picjs-player" data-picjs-player${containerStyle}>` +
      svgHtml +
      `<script type="application/json" data-picjs-ast>${astJson}</script>` +
      `</div>`;

    if (isExample || isStacked) {
      const cls = isStacked ? "picjs-stacked" : "picjs-example";
      const displaySource = stripHiddenSections(source);
      const escaped = escapeHtml(displaySource);
      return {
        html:
          `<div class="${cls}"${containerStyle}>` +
          `<pre class="picjs-source language-picjs"><code class="language-picjs">${escaped}</code></pre>` +
          `<div class="picjs-diagram">${playerHtml}</div>` +
          `</div>`,
        needsRuntime: true,
      };
    }

    return { html: playerHtml, needsRuntime: true };
  }

  if (isExample || isStacked) {
    const cls = isStacked ? "picjs-stacked" : "picjs-example";
    const displaySource = stripHiddenSections(source);
    const escaped = escapeHtml(displaySource);
    return {
      html:
        `<div class="${cls}"${containerStyle}>` +
        `<pre class="picjs-source language-picjs"><code class="language-picjs">${escaped}</code></pre>` +
        `<div class="picjs-diagram">${svgHtml}</div>` +
        `</div>`,
      needsRuntime: false,
    };
  }

  return {
    html: `<div class="picjs-diagram"${containerStyle}>${svgHtml}</div>`,
    needsRuntime: false,
  };
}

export default function remarkPicjs(): Transformer<Root> {
  return async (root, file) => {
    const { visit } = await import("unist-util-visit");

    let needsRuntime = false;

    visit(root, "code", (node: Code, index, parent) => {
      if (node.lang !== "picjs" || !parent || index === undefined) {
        return;
      }

      const source = node.value.trimEnd();
      if (!source) return;

      const meta = parseMeta(node.meta);

      try {
        const result = renderPicjsBlock(source, meta);
        if (result.needsRuntime) {
          needsRuntime = true;
        }

        (parent.children as unknown[])[index] = {
          type: "html",
          value: result.html,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[picjs] Failed to render: ${message}`);
        (parent.children as unknown[])[index] = {
          type: "html",
          value: `<div class="picjs-error">PIC.js error: ${escapeHtml(message)}</div>`,
        };
      }
    });

    if (needsRuntime) {
      (file.data as Record<string, unknown>).picjsNeedsRuntime = true;
    }
  };
}

export { remarkPicjs };
