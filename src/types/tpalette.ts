import { RTE } from "../runtime_error.js"
import { TBase, TA } from "./_base.js"
import { TString } from "./tstring.js"
import { TList } from "./tlist.js"
import { Palette } from "../palette.js"
import { applyPaletteToTheme } from "../defaults.js"

export class TPalette extends TBase<null> {
  constructor() {
    super(null)
  }

  getAtAttr(name: string): TA {
    // Palette.current → current palette name
    if (name === `current`) {
      return new TString(Palette.getCurrentName())
    }

    // Palette.names → list of available palette names
    if (name === `names`) {
      return new TList(Palette.getAvailableNames().map(n => new TString(n)))
    }

    // Palette.b1, Palette.f3, etc → color value
    if (Palette.isPaletteColor(name)) {
      const hex = Palette.getColor(name)
      if (hex) {
        // Return as TString for now - will be converted to TColor when used as color
        return new TString(hex)
      }
    }

    throw new RTE(`Unknown palette attribute: Palette.${name}`)
  }

  setAtAttr(name: string, value: TA): this {
    // Palette.current = "misty" → switch palettes
    if (name === `current`) {
      const paletteName = value.toNative()
      if (typeof paletteName !== `string`) {
        throw new RTE(`Palette.current must be a string, got ${typeof paletteName}`)
      }
      Palette.setCurrent(paletteName)
      // Update theme defaults to use palette colors
      const b1 = Palette.getColor(`b1`)!
      const f1 = Palette.getColor(`f1`)!
      applyPaletteToTheme(b1, f1)
      return this
    }

    // Palette.b1 = ~red → override a color
    if (Palette.isPaletteColor(name)) {
      const colorValue = value.toNative()
      if (typeof colorValue !== `string`) {
        throw new RTE(`Palette color must be a string or color, got ${typeof colorValue}`)
      }
      Palette.setOverride(name, colorValue)
      return this
    }

    throw new RTE(`Cannot set Palette.${name}. Settable attributes: current, b1-b8, f1-f8`)
  }

  toString() {
    return `Palette(${Palette.getCurrentName()})`
  }

  toNative() {
    return Palette.getCurrentColors()
  }
}
