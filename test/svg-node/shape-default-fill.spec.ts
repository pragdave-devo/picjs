import { renderToStringAsync } from "../../src/render-to-string.js"

// docs/picjs-reference.md documents `Box.fill = ~lightblue` as the example of a
// shape default. Setting a concrete colour as a per-shape-type default and then
// giving that shape a label crashes while computing the label's contrast colour.

async function render(src: string) {
  return await renderToStringAsync(src, { includeSource: false })
}

describe(`shape type default fill`, () => {
  it(`renders a labelled Box whose fill comes from a named-colour default`, async () => {
    const r = await render(`Box.fill = ~yellow\nBox "a"`)
    expect(r.error).toBeUndefined()
    expect(r.svg).toContain(`<svg`)
  })

  it(`renders a labelled Box whose fill comes from a hex default`, async () => {
    const r = await render(`Box.fill = #ffff00\nBox "a"`)
    expect(r.error).toBeUndefined()
  })

  it(`renders a labelled Circle whose fill comes from a default`, async () => {
    const r = await render(`Circle.fill = ~yellow\nCircle "a"`)
    expect(r.error).toBeUndefined()
  })

  it(`renders a labelled Box whose fill comes from a class-qualified default`, async () => {
    const r = await render(`Box.highlight.fill = ~yellow\nBox "a" .highlight`)
    expect(r.error).toBeUndefined()
  })

  it(`still renders when the default fill shape carries no label`, async () => {
    const r = await render(`Box.fill = ~yellow\nBox`)
    expect(r.error).toBeUndefined()
  })
})
