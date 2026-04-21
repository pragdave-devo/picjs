// test/integration/generate-test-page.ts
import { renderToString } from "../../src/render-to-string.js"
import { exportAnimatedHTML } from "../../src/export-animated.js"
import { writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"

async function generate() {
  const outDir = resolve(dirname(new URL(import.meta.url).pathname), "../../dist/test-integration")
  mkdirSync(outDir, { recursive: true })

  // Static diagrams
  const static1 = await renderToString("Box", { includeSource: false })
  const static2 = await renderToString('Box\n->\nCircle "Hello"', { includeSource: false })

  // Animated diagram (with element IDs for future animation)
  const animated1 = await exportAnimatedHTML(
    'Box\nCircle',
    { prefix: "p0", runtimeUrl: "../runtime.js" }
  )

  // Animated diagram with multiple shapes
  const animated2 = await exportAnimatedHTML(
    'a = Box\n-> "yes"\nCircle',
    { prefix: "p1", runtimeUrl: "../runtime.js" }
  )

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>PicJS Integration Test</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; }
    .diagram { border: 1px solid #ccc; padding: 10px; margin: 20px 0; }
    .diagram svg { max-width: 100%; height: auto; }
    h2 { color: #333; }
  </style>
</head>
<body>
  <h1>PicJS SVG Render Pipeline - Integration Test</h1>

  <h2>Static Diagram 1: Box</h2>
  <div class="diagram">${static1.svg}</div>

  <h2>Static Diagram 2: Box → Circle</h2>
  <div class="diagram">${static2.svg}</div>

  <h2>Animated Diagram 1: Box + Circle (prefix: p0)</h2>
  <div class="diagram">${animated1}</div>

  <h2>Animated Diagram 2: Box → Circle (prefix: p1)</h2>
  <div class="diagram">${animated2}</div>

  <h2>Verification Checklist</h2>
  <ul>
    <li>Static diagrams render as SVG (no JS needed)</li>
    <li>Animated diagrams show initial state</li>
    <li>SVG elements in animated diagrams have IDs (inspect with DevTools)</li>
    <li>No ID collisions between p0 and p1 prefixed diagrams</li>
    <li>AST JSON is embedded in script tags (inspect source)</li>
    <li>All shapes visible and correctly positioned</li>
  </ul>
</body>
</html>`

  const outPath = resolve(outDir, "index.html")
  writeFileSync(outPath, html)
  console.log(`Test page generated: ${outPath}`)
}

generate().catch(console.error)
