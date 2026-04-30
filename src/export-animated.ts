// src/export-animated.ts

export interface ExportOptions {
  prefix: string
  runtimeUrl: string
  padding?: number
}

export async function exportAnimatedHTML(
  source: string,
  options: ExportOptions
): Promise<string> {
  const { prefix, runtimeUrl, padding = 0.2 } = options

  const [
    { parseToAST, ParseStatus },
    { Dispatcher },
    { parse: pegParse },
    { nullLogger, calculateBoundingBox, viewBoxFromBounds },
    { svgNode, serialize, IdGenerator },
  ] = await Promise.all([
    import("./parser.js"),
    import("./dispatcher.js"),
    import("./peg_parser/jp.js"),
    import("./render-utils.js"),
    import("./svg-node.js"),
  ])

  const parsed = parseToAST(pegParse, source, "Start", false)
  if (parsed.status !== ParseStatus.Ok) {
    throw new Error(parsed.error?.message || "Parse error")
  }

  const dispatcher = new Dispatcher(nullLogger, null, 1)
  dispatcher.setIdGenerator(new IdGenerator(prefix))
  dispatcher.start(parsed.ast)
  dispatcher.applyTimelineUpTo(0)

  const svgChildren = dispatcher.renderToSvgNodes()
  const bounds = calculateBoundingBox(dispatcher.shapes(), padding)
  const viewBox = viewBoxFromBounds(bounds, padding)

  const root = svgNode("svg", {
    viewBox,
    class: "_myopic-1",
    xmlns: "http://www.w3.org/2000/svg"
  }, svgChildren)
  const svgStr = serialize(root)

  const astJson = JSON.stringify(parsed.ast)

  return `<div class="picjs-player" data-picjs-player>
${svgStr}
<script type="application/json" data-picjs-ast>
${astJson}
</script>
</div>
<script type="module">
import { initAnimations } from "${runtimeUrl}";
initAnimations();
</script>`
}
