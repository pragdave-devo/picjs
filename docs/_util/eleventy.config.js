module.exports = function(eleventyConfig) {
  // Path prefix - set PATH_PREFIX env var for GitHub Pages (e.g., /picjs/)
  const pathPrefix = process.env.PATH_PREFIX || "/";

  // Watch parent directory for MD file changes
  eleventyConfig.addWatchTarget("../*.md");

  // Disable server caching for live reload
  eleventyConfig.setServerOptions({
    middleware: [(req, res, next) => {
      res.setHeader('Cache-Control', 'no-store');
      next();
    }]
  });

  // Copy assets (including jspic.umd.js) to output
  eleventyConfig.addPassthroughCopy({ "../../dist": "assets" });

  // Custom renderer for ```jspic fenced code blocks
  eleventyConfig.amendLibrary("md", md => {
    const originalFence = md.renderer.rules.fence;

    md.renderer.rules.fence = function(tokens, idx, options, env, self) {
      const token = tokens[idx];
      const info = token.info ? token.info.trim() : '';

      if (info === 'jspic') {
        // Wrap jspic code in a container that will be processed client-side
        const code = md.utils.escapeHtml(token.content);
        return `<div class="diagram-container"><code class="jspic">${code}</code></div>\n`;
      }

      if (info === 'jspic example') {
        // Side-by-side: source code on left, rendered diagram on right
        const code = md.utils.escapeHtml(token.content);
        return `<div class="example-container">
  <pre class="example-source"><code>${code}</code></pre>
  <div class="example-output"><code class="jspic">${code}</code></div>
</div>\n`;
      }

      // Fall back to default fence renderer
      if (originalFence) {
        return originalFence(tokens, idx, options, env, self);
      }
      return `<pre><code>${md.utils.escapeHtml(token.content)}</code></pre>\n`;
    };
  });

  // Ignore the _util directory, _html output, and Vite dev index.html
  eleventyConfig.ignores.add("_util/**");
  eleventyConfig.ignores.add("_html/**");

  return {
    pathPrefix: pathPrefix,
    dir: {
      input: "..",           // docs/
      output: "../_html",    // docs/_html/
      includes: "_util/_includes",
      data: "_util/_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
