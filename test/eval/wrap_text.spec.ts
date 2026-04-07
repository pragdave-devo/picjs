import { wrapText } from "../../src/renderers/svg/label.js"

describe(`wrapText`, () => {

  it(`returns short text unchanged`, () => {
    expect(wrapText(`hello`, 10)).toBe(`hello`)
  })

  it(`wraps on whitespace`, () => {
    expect(wrapText(`the cat sat on the mat`, 10)).toBe(
      `the cat\nsat on the\nmat`
    )
  })

  it(`preserves existing newlines`, () => {
    expect(wrapText(`hello world\ngoodbye world`, 8)).toBe(
      `hello\nworld\ngoodbye\nworld`
    )
  })

  it(`breaks after hyphens`, () => {
    expect(wrapText(`self-contained`, 10)).toBe(
      `self-\ncontained`
    )
  })

  it(`picks rightmost break within limit`, () => {
    // hyphen at position 6 is a better break than space at position 1
    expect(wrapText(`a self-contained box`, 12)).toBe(
      `a self-\ncontained\nbox`
    )
  })

  it(`force-breaks long words`, () => {
    expect(wrapText(`abcdefghijklmnop`, 5)).toBe(
      `abcde\nfghij\nklmno\np`
    )
  })

  it(`handles multiple segments with wrapping`, () => {
    expect(wrapText(`the cat sat\non the mat`, 7)).toBe(
      `the cat\nsat\non the\nmat`
    )
  })

  it(`does not wrap when text fits`, () => {
    expect(wrapText(`short`, 40)).toBe(`short`)
  })

  it(`wraps at exact maxwidth boundary`, () => {
    expect(wrapText(`12345 67890`, 5)).toBe(
      `12345\n67890`
    )
  })

  it(`handles empty string`, () => {
    expect(wrapText(``, 10)).toBe(``)
  })

  it(`handles single long word`, () => {
    expect(wrapText(`supercalifragilistic`, 10)).toBe(
      `supercalif\nragilistic`
    )
  })

  it(`trims trailing spaces on wrapped lines`, () => {
    const result = wrapText(`hello   world`, 6)
    const lines = result.split('\n')
    for (const line of lines) {
      expect(line).toBe(line.trimEnd())
    }
  })
})
