/**
 * Lume plugin for picjs.
 * Renders picjs code blocks in markdown files to SVG.
 *
 * Usage in _config.ts:
 * ```typescript
 * import picjs from "picjs/lume"
 * site.use(picjs())
 * ```
 */

// This is a placeholder for Lume's types - in a real setup, you'd import from "lume/core.ts"
interface Site {
  hooks: {
    addMarkdownItPlugin: (plugin: (md: any) => void) => void
  }
  process(extensions: string[], callback: (pages: any[]) => Promise<void>): void
}

interface PicjsOptions {
  /** CSS class to add to the SVG wrapper (default: "picjs-diagram") */
  className?: string
  /** Padding around the content (default: 0.2) */
  padding?: number
  /** Wrap SVG in a figure element (default: false) */
  figure?: boolean
}

/**
 * Lume plugin that renders picjs code blocks to SVG.
 */
export default function picjsPlugin(options: PicjsOptions = {}) {
  const {
    className = "picjs-diagram",
    padding = 0.2,
    figure = false
  } = options

  return (site: Site) => {
    // Process HTML pages after markdown is converted
    site.process([".html"], async (pages) => {
      // Dynamically import to set up linkedom globals
      const { renderToString } = await import("../render-to-string.js")

      for (const page of pages) {
        if (!page.content || typeof page.content !== 'string') continue

        // Find picjs code blocks that haven't been converted yet
        // These would be <pre><code class="language-picjs">...</code></pre>
        const codeBlockRegex = /<pre><code class="language-picjs">([\s\S]*?)<\/code><\/pre>/g

        // Collect all matches first to avoid regex state issues during replacement
        const matches = [...page.content.matchAll(codeBlockRegex)]
        if (matches.length === 0) continue

        let content = page.content

        for (const match of matches) {
          const source = decodeHtmlEntities(match[1])

          const result = await renderToString(source, {
            padding,
            includeSource: true
          })

          if (result.error) {
            console.error(`picjs error in ${page.sourcePath}:`, result.error)
            continue
          }

          let replacement: string
          if (figure) {
            replacement = `<figure class="${className}">${result.svg}</figure>`
          } else {
            replacement = `<div class="${className}">${result.svg}</div>`
          }

          content = content.replace(match[0], replacement)
        }

        page.content = content
      }
    })
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}
