import { renderToString, parse } from "../../../dist/picjs.js";
import definePicjs from "../../syntax-highlighters/prism-picjs.js";

let Prism;

const picjsStyles = `
.picjs-example {
  margin: 0rem 0 1rem 0;
	padding: 0.5rem 0;
	border-top: 0.5px solid #888;
	border-bottom: 0.5px solid #888;
	background-color: #f8f8f8;
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center !important;
}
.picjs-example > * {
  flex: 1 1 0%;
  min-width: 18rem;
}
.picjs-example .picjs-source {
  margin: 0;
  padding: 0 1rem;
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
  display: block;
  width: 100%;
  height: auto;
  max-height: 80vh;
  object-fit: contain;
}
`;

function parseMeta(meta) {
  const isCode = /\bcode\b/.test(meta);
  const isAnimated = !isCode && /\banimated\b/.test(meta);
  const isStacked = !isCode && /\bstacked\b/.test(meta);
  const isExample = !isCode && /\bexample\b/.test(meta);
  const widthMatch = meta.match(/\bwidth=(\S+)/);
  const svgWidthMatch = meta.match(/\bsvgwidth=["']?([^"'\s]+)/);
  const scaleMatch = meta.match(/\bscale=(\S+)/);
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

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let animatedCounter = 0;

function buildAnimatedBlock(source, svgHtml, containerStyle) {
  const parsed = parse(source);
  if (parsed.status !== "ok") {
    return `<div class="picjs-error">picjs parse error: ${escapeHtml(parsed.error?.message || "unknown")}</div>`;
  }

  const astJson = JSON.stringify(parsed.ast);

  return (
    `<div class="picjs-player" data-picjs-player${containerStyle}>` +
    svgHtml +
    `<script type="application/json" data-picjs-ast>${astJson}</script>` +
    `</div>`
  );
}

function renderPicjsBlock(source, meta) {
  const { isCode, isAnimated, isStacked, isExample, width, svgWidth, scale } = parseMeta(meta);

  if (isCode) {
    const highlighted = Prism.highlight(source, Prism.languages.picjs, "picjs");
    return {
      html: `<pre class="language-picjs"><code class="language-picjs">${highlighted}</code></pre>`,
    };
  }

  const prefix = isAnimated ? `pj${animatedCounter++}` : null;
  const renderOpts = prefix ? { ids: { prefix } } : {};

  const result = renderToString(source, renderOpts);

  if (result.error) {
    return { html: `<div class="picjs-error">${escapeHtml(result.error)}</div>` };
  }

  const containerStyle = width ? ` style="width: ${width}"` : "";

  let svgHtml;
  if (svgWidth) {
    svgHtml = `<div style="width: ${svgWidth}; margin: 0 auto">${result.svg}</div>`;
  } else if (scale) {
    const cssWidth = result.width * scale;
    svgHtml = result.svg.replace("<svg", `<svg style="width: ${cssWidth}rem; height: auto"`);
  } else {
    svgHtml = result.svg;
  }

  if (isAnimated && (isExample || isStacked)) {
    const cls = isStacked ? "picjs-stacked" : "picjs-example";
    const displaySource = source.replace(/^[ \t]*\/\/-\n([\s\S]*?)\n[ \t]*\/\/\+\n?/gm, "");
    const highlighted = Prism.highlight(displaySource, Prism.languages.picjs, "picjs");
    const escapedSource = highlighted.replace(/\n/g, "&#10;");
    const playerHtml = buildAnimatedBlock(source, svgHtml, "");
    return {
      html:
        `<div class="${cls}"${containerStyle}>` +
        `<pre class="picjs-source language-picjs"><code class="language-picjs">${escapedSource}</code></pre>` +
        `<div class="picjs-diagram">${playerHtml}</div>` +
        `</div>`,
      needsStyles: true,
      needsRuntime: true,
    };
  }

  if (isAnimated) {
    return { html: buildAnimatedBlock(source, svgHtml, containerStyle), needsRuntime: true };
  }

  if (isExample || isStacked) {
    const cls = isStacked ? "picjs-stacked" : "picjs-example";
    const displaySource = source.replace(/^[ \t]*\/\/-\n([\s\S]*?)\n[ \t]*\/\/\+\n?/gm, "");
    const highlighted = Prism.highlight(displaySource, Prism.languages.picjs, "picjs");
    const escapedSource = highlighted.replace(/\n/g, "&#10;");
    return {
      html:
        `<div class="${cls}"${containerStyle}>` +
        `<pre class="picjs-source language-picjs"><code class="language-picjs">${escapedSource}</code></pre>` +
        `<div class="picjs-diagram">${svgHtml}</div>` +
        `</div>`,
      needsStyles: true,
    };
  }

  return { html: `<div class="picjs-diagram"${containerStyle}>${svgHtml}</div>` };
}

function markdownItPlugin(md) {
  const defaultFence =
    md.renderer.rules.fence ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    const info = token.info.trim();

    if (!info.startsWith("picjs")) {
      return defaultFence(tokens, idx, options, env, self);
    }

    const meta = info.slice("picjs".length).trim();
    const source = token.content.trimEnd();

    if (!source) {
      return defaultFence(tokens, idx, options, env, self);
    }

    // Track what this page needs so the transform can inject styles/scripts
    if (!env._picjs) env._picjs = { needsStyles: false, needsRuntime: false };

    try {
      const result = renderPicjsBlock(source, meta);
      if (result.needsStyles) env._picjs.needsStyles = true;
      if (result.needsRuntime) env._picjs.needsRuntime = true;
      return result.html;
    } catch (err) {
      console.warn(`[picjs] Failed to render: ${err.message}`);
      return `<pre><code>${escapeHtml(source)}</code></pre>`;
    }
  };
}

export default function picjsPlugin(eleventyConfig, { prism } = {}) {
  if (prism) {
    Prism = prism;
    definePicjs(Prism);
  }
  eleventyConfig.amendLibrary("md", (md) => md.use(markdownItPlugin));

  eleventyConfig.addTransform("picjs", async function (content) {
    if (!this.page.outputPath?.endsWith(".html")) return content;

    // Inject styles and runtime script if any picjs blocks needed them.
    // env._picjs is set during markdown rendering; for safety, also scan
    // the output for marker classes in case env wasn't propagated.
    const hasStyles = content.includes("picjs-example") || content.includes("picjs-stacked");
    const hasRuntime = content.includes("data-picjs-player");

    if (hasStyles) {
      content = content.replace("</head>", `<style>${picjsStyles}</style>\n</head>`);
    }

    if (hasRuntime) {
      content += `\n<script type="module">
import { initAnimations } from "/assets/runtime.js";
initAnimations();
</script>`;
    }

    return content;
  });
}
