import { renderToStringAsync as renderToString } from "../../src/render-to-string.js"

describe("Sunset palette light mode", () => {
  it("uses hand-tuned light colors instead of luma-inverted ones", async () => {
    const result = await renderToString('Box "test"')
    const style = result.svg.match(/<style>(.*?)<\/style>/s)?.[1] || ''

    // Light-mode CSS should contain our hand-tuned periwinkle (#8b90b8)
    // not the luma-inverted dark purple
    expect(style).toContain("#8b90b8")
  })

  it("still uses the original dark-mode colors", async () => {
    const result = await renderToString('Box "test"')
    const style = result.svg.match(/<style>(.*?)<\/style>/s)?.[1] || ''

    // Dark-mode CSS should contain the original sunset deep purple
    expect(style).toContain("#41476b")
  })
})
