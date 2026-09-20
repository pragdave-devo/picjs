import { renderToStringAsync } from "../../src/render-to-string.js"

// docs/picjs-reference.md: "`Shape` (capitalized) refers to the base shape
// class." Defaults set on it were stored under `SBase`, which nothing ever
// read — silently ignored rather than applied.

async function fillOf(src: string, tag = `rect`) {
  const r = await renderToStringAsync(src, { includeSource: false })
  expect(r.error).toBeUndefined()
  return r.svg.match(new RegExp(`<${tag}[^>]*>`))?.[0]?.match(/fill="([^"]*)"/)?.[1]
}

describe(`Shape base-class defaults`, () => {
  it(`applies to a Box`, async () => {
    expect(await fillOf(`Shape.fill = ~yellow\nBox`)).toEqual(`#ffff00`)
  })

  it(`applies to a Circle`, async () => {
    expect(await fillOf(`Shape.fill = ~yellow\nCircle`, `circle`)).toEqual(`#ffff00`)
  })

  it(`is overridden by a shape-specific default, whichever is set first`, async () => {
    expect(await fillOf(`Shape.fill = ~yellow\nBox.fill = ~red\nBox`)).toEqual(`#ff0000`)
    expect(await fillOf(`Box.fill = ~red\nShape.fill = ~yellow\nBox`)).toEqual(`#ff0000`)
  })

  it(`is overridden by an inline attribute`, async () => {
    expect(await fillOf(`Shape.fill = ~yellow\nBox fill ~red`)).toEqual(`#ff0000`)
  })

  it(`leaves other shapes' built-in defaults alone when unset`, async () => {
    const plain = await fillOf(`Box`)
    expect(plain).not.toEqual(`#ffff00`)
  })

  it(`can be read back`, async () => {
    const r = await renderToStringAsync(`Shape.fill = ~yellow\nLabel ("#{Shape.fill}")`,
                                        { includeSource: false })
    expect(r.error).toBeUndefined()
    expect(r.svg).toContain(`#ffff00`)
  })

  it(`supports a class-qualified base default`, async () => {
    expect(await fillOf(`Shape.hl.fill = ~yellow\nBox .hl`)).toEqual(`#ffff00`)
  })
})
