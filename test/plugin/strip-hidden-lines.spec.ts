import { jest } from "@jest/globals"

const stripHiddenLines = (source: string) =>
  source.replace(/^[ \t]*\/\/-\n([\s\S]*?)\n[ \t]*\/\/\+\n?/gm, "")

describe("stripHiddenLines", () => {
  it("strips a single hidden block", () => {
    const source = `visible 1\n//-\nhidden\n//+\nvisible 2`
    expect(stripHiddenLines(source)).toBe("visible 1\nvisible 2")
  })

  it("strips multiple hidden blocks", () => {
    const source = `a\n//-\nh1\n//+\nb\n//-\nh2\n//+\nc`
    expect(stripHiddenLines(source)).toBe("a\nb\nc")
  })

  it("strips a multi-line hidden block", () => {
    const source = `before\n//-\nline 1\nline 2\nline 3\n//+\nafter`
    expect(stripHiddenLines(source)).toBe("before\nafter")
  })

  it("strips a hidden block at the start", () => {
    const source = `//-\nsetup code\n//+\nbox "visible"`
    expect(stripHiddenLines(source)).toBe(`box "visible"`)
  })

  it("strips a hidden block at the end", () => {
    const source = `box "visible"\n//-\ncleanup\n//+`
    expect(stripHiddenLines(source)).toBe("box \"visible\"\n")
  })

  it("handles indented markers", () => {
    const source = `visible\n  //-\n  hidden\n  //+\nvisible 2`
    expect(stripHiddenLines(source)).toBe("visible\nvisible 2")
  })

  it("returns source unchanged when no markers present", () => {
    const source = `box "hello"\nline right`
    expect(stripHiddenLines(source)).toBe(source)
  })

  it("does not strip unpaired //-", () => {
    const source = `before\n//-\norphaned`
    expect(stripHiddenLines(source)).toBe(source)
  })
})
