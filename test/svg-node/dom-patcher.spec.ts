// test/svg-node/dom-patcher.spec.ts

import { DomPatcher } from "../../src/dom-patcher.js"

describe("DomPatcher", () => {
  it("maps shape IDs to element attribute updates", () => {
    const calls: [string, string, string][] = []
    const mockGetById = (id: string) => ({
      setAttribute: (name: string, value: string) => calls.push([id, name, value]),
      removeAttribute: (_name: string) => {},
    })

    const patcher = new DomPatcher(mockGetById as any)
    patcher.register("p0a", "p0a")
    patcher.setAttr("p0a", { fill: "red", stroke: "blue" })

    expect(calls).toContainEqual(["p0a", "fill", "red"])
    expect(calls).toContainEqual(["p0a", "stroke", "blue"])
  })

  it("handles composite shapes with sub-IDs", () => {
    const calls: [string, string, string][] = []
    const mockGetById = (id: string) => ({
      setAttribute: (name: string, value: string) => calls.push([id, name, value]),
      removeAttribute: (_name: string) => {},
    })

    const patcher = new DomPatcher(mockGetById as any)
    patcher.register("p0a", "p0a", { shape: "p0a-s", text: "p0a-t" })
    patcher.setShapeAttr("p0a", { fill: "green" })
    patcher.setTextAttr("p0a", { "font-size": "14" })

    expect(calls).toContainEqual(["p0a-s", "fill", "green"])
    expect(calls).toContainEqual(["p0a-t", "font-size", "14"])
  })

  it("removes attributes when value is undefined", () => {
    const removed: [string, string][] = []
    const mockGetById = (id: string) => ({
      setAttribute: () => {},
      removeAttribute: (name: string) => removed.push([id, name]),
    })

    const patcher = new DomPatcher(mockGetById as any)
    patcher.register("p0a", "p0a")
    patcher.setAttr("p0a", { fill: undefined })

    expect(removed).toContainEqual(["p0a", "fill"])
  })

  it("ignores operations on unregistered shapes", () => {
    const calls: any[] = []
    const mockGetById = () => ({
      setAttribute: (...args: any[]) => calls.push(args),
      removeAttribute: () => {},
    })

    const patcher = new DomPatcher(mockGetById as any)
    patcher.setAttr("unknown", { fill: "red" })

    expect(calls).toHaveLength(0)
  })
})
