import { findPicjsBlocks, processMarkdown } from "../../src/md-blocks.js"

const fence = (mode: string, src: string) =>
  "```picjs" + (mode ? ` ${mode}` : ``) + `\n${src}\n` + "```\n"

/** The rendered SVG is large and uninteresting here; stand it down to a marker. */
const elide = (md: string) => md.replace(/<svg[\s\S]*?<\/svg>/g, `[SVG]`)

describe(`markdown block processing`, () => {

  describe(`finding blocks`, () => {
    it(`finds a plain fence`, () => {
      const blocks = findPicjsBlocks(fence(``, `box "a"`))
      expect(blocks).toHaveLength(1)
      expect(blocks[0].mode).toBe(`plain`)
      expect(blocks[0].source).toBe(`box "a"`)
    })

    it(`finds tilde fences as well as backtick ones`, () => {
      const blocks = findPicjsBlocks(`~~~picjs\nbox "a"\n~~~\n`)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].source).toBe(`box "a"`)
    })

    it(`records the mode`, () => {
      expect(findPicjsBlocks(fence(`example`, `box`))[0].mode).toBe(`example`)
      expect(findPicjsBlocks(fence(`2up`, `box`))[0].mode).toBe(`2up`)
    })

    it(`finds adjacent blocks separately`, () => {
      const blocks = findPicjsBlocks(fence(``, `box "p"`) + fence(``, `box "q"`))
      expect(blocks.map(b => b.source)).toEqual([ `box "p"`, `box "q"` ])
    })
  })

  describe(`rendering`, () => {
    it(`replaces a plain fence with just the diagram`, async () => {
      const { content } = await processMarkdown(fence(``, `box "a"`))
      expect(elide(content)).toContain(`[SVG]`)
      expect(content).not.toContain("```picjs")
      expect(content).not.toContain(`<pre>`)
    })

    // docs/integrating.md documents `example` as "the diagram, then the
    // source" — one copy of the source, after the diagram.
    it(`shows the source exactly once in example mode`, async () => {
      const { content } = await processMarkdown(fence(`example`, `box "a"`))
      expect(elide(content)).toContain(`[SVG]`)
      expect(content).not.toContain("```picjs")
      expect(content.match(/<code class="language-picjs">/g)).toHaveLength(1)
    })

    it(`shows the source exactly once in 2up mode`, async () => {
      const { content } = await processMarkdown(fence(`2up`, `box "a"`))
      expect(content).not.toContain("```picjs")
      expect(content.match(/<code class="language-picjs">/g)).toHaveLength(1)
    })

    it(`counts what it did`, async () => {
      const result = await processMarkdown(fence(``, `box "a"`))
      expect(result.rendered).toBe(1)
      expect(result.unchanged).toBe(0)
      expect(result.errors).toBe(0)
    })
  })

  describe(`re-running`, () => {
    for (const mode of [ ``, `example`, `2up` ]) {
      it(`is idempotent in ${mode || `plain`} mode`, async () => {
        const once = await processMarkdown(fence(mode, `box "a"`))
        const twice = await processMarkdown(once.content)
        expect(twice.content).toBe(once.content)
        expect(twice.rendered).toBe(0)
        expect(twice.unchanged).toBe(1)
      })
    }

    it(`redraws when the recorded source is edited`, async () => {
      const once = await processMarkdown(fence(``, `box "one"`))
      const edited = once.content.replace(/one/g, `two`)
      const twice = await processMarkdown(edited)
      expect(twice.rendered).toBe(1)
      expect(elide(twice.content)).toContain(`[SVG]`)
      expect(twice.content).toContain(`box "two"`)
    })
  })

  describe(`bad diagrams`, () => {
    it(`counts the failure and leaves the block alone`, async () => {
      const result = await processMarkdown(fence(``, `box ((( "bad"`))
      expect(result.errors).toBe(1)
      expect(result.rendered).toBe(0)
      expect(result.content).toContain("```picjs")
    })

    it(`still renders the good blocks around it`, async () => {
      const result = await processMarkdown(fence(``, `box "ok"`) + `\n` + fence(``, `box ((( "bad"`))
      expect(result.rendered).toBe(1)
      expect(result.errors).toBe(1)
    })
  })
})
