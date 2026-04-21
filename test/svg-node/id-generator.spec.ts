// test/svg-node/id-generator.spec.ts
import { IdGenerator } from "../../src/svg-node.js"

describe("IdGenerator", () => {
  it("generates sequential lowercase IDs for first 26", () => {
    const gen = new IdGenerator("p")
    expect(gen.next()).toBe("pa")
    expect(gen.next()).toBe("pb")
    expect(gen.next()).toBe("pc")
  })

  it("generates uppercase IDs for 26-51", () => {
    const gen = new IdGenerator("x")
    // Skip to position 26
    for (let i = 0; i < 26; i++) gen.next()
    expect(gen.next()).toBe("xA")
    expect(gen.next()).toBe("xB")
    expect(gen.next()).toBe("xC")
  })

  it("generates base-36 IDs for 52+", () => {
    const gen = new IdGenerator("y")
    // Skip to position 52
    for (let i = 0; i < 52; i++) gen.next()
    expect(gen.next()).toBe("y1g") // 52 in base-36
    expect(gen.next()).toBe("y1h") // 53 in base-36
  })

  it("generates sub-IDs with hyphen separator", () => {
    const gen = new IdGenerator("p")
    expect(gen.sub("pa", "clip")).toBe("pa-clip")
    expect(gen.sub("rect5", "gradient")).toBe("rect5-gradient")
  })

  it("supports different prefixes", () => {
    const gen1 = new IdGenerator("elem")
    const gen2 = new IdGenerator("anim")
    expect(gen1.next()).toBe("elema")
    expect(gen2.next()).toBe("anima")
  })
})
