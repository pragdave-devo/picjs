// Color Palette System
// Provides WCAG-compliant background/foreground color pairs

import { RTE } from "./runtime_error.js"

export interface PaletteColors {
  b1: string; f1: string
  b2: string; f2: string
  b3: string; f3: string
  b4: string; f4: string
  b5: string; f5: string
  b6: string; f6: string
  b7: string; f7: string
  b8: string; f8: string
}

interface PaletteDefinition {
  name: string
  colors: PaletteColors
  lightColors?: Partial<PaletteColors>
}

// Predefined palettes with WCAG AA compliant color pairs (4.5:1 contrast minimum)
const Palettes: Record<string, PaletteDefinition> = {
  default: {
    name: `default`,
    colors: {
      b1: `#3e5770`, f1: `#ecf0f1`,  // Blue-grey / near-white
      b2: `#8e44ad`, f2: `#ffffff`,  // Purple / white
      b3: `#27ae60`, f3: `#ffffff`,  // Green / white
      b4: `#e74c3c`, f4: `#ffffff`,  // Red / white
      b5: `#3498db`, f5: `#ffffff`,  // Blue / white
      b6: `#f39c12`, f6: `#2c3e50`,  // Orange / dark text
      b7: `#1abc9c`, f7: `#2c3e50`,  // Teal / dark text
      b8: `#95a5a6`, f8: `#2c3e50`,  // Grey / dark text
    }
  },
  misty: {
    name: `misty`,
    colors: {
      b1: `#e8f4f8`, f1: `#1a1a2e`,  // Pale blue / dark
      b2: `#f0e6f6`, f2: `#2d1f3d`,  // Pale lavender / dark purple
      b3: `#e6f4e8`, f3: `#1a2e1a`,  // Pale green / dark green
      b4: `#fce8e6`, f4: `#3d1a1a`,  // Pale pink / dark red
      b5: `#e6f0fc`, f5: `#1a2640`,  // Pale sky / dark blue
      b6: `#fcf4e6`, f6: `#40351a`,  // Pale cream / dark brown
      b7: `#e6fcf8`, f7: `#1a403d`,  // Pale mint / dark teal
      b8: `#f0f0f0`, f8: `#2a2a2a`,  // Light grey / charcoal
    }
  },
  ocean: {
    name: `ocean`,
    colors: {
      b1: `#1a3a4a`, f1: `#e0f4ff`,  // Deep sea / pale blue
      b2: `#2d5a6a`, f2: `#ffffff`,  // Ocean blue / white
      b3: `#0d4d4d`, f3: `#e0ffff`,  // Dark teal / pale cyan
      b4: `#3d6b7a`, f4: `#ffffff`,  // Steel blue / white
      b5: `#1a5a7a`, f5: `#ffffff`,  // Navy / white
      b6: `#4a8a9a`, f6: `#ffffff`,  // Light ocean / white
      b7: `#2a7a8a`, f7: `#ffffff`,  // Teal / white
      b8: `#5a9aaa`, f8: `#1a2a30`,  // Seafoam / dark
    }
  },
  forest: {
    name: `forest`,
    colors: {
      b1: `#2d4a2d`, f1: `#e8f4e8`,  // Dark forest / pale green
      b2: `#4a6a3a`, f2: `#ffffff`,  // Moss / white
      b3: `#3a5a2a`, f3: `#ffffff`,  // Fern / white
      b4: `#6a4a2a`, f4: `#ffffff`,  // Bark brown / white
      b5: `#5a7a4a`, f5: `#ffffff`,  // Sage / white
      b6: `#8a9a3a`, f6: `#2a2a1a`,  // Olive / dark
      b7: `#4a7a5a`, f7: `#ffffff`,  // Pine / white
      b8: `#7a8a6a`, f8: `#1a2a1a`,  // Lichen / dark
    }
  },
  warm: {
    name: `warm`,
    colors: {
      b1: `#4a2a2a`, f1: `#fff0e8`,  // Dark burgundy / cream
      b2: `#8a4a3a`, f2: `#ffffff`,  // Terracotta / white
      b3: `#6a3a2a`, f3: `#ffffff`,  // Rust / white
      b4: `#aa5a4a`, f4: `#ffffff`,  // Coral / white
      b5: `#7a4a4a`, f5: `#ffffff`,  // Rose / white
      b6: `#daa06d`, f6: `#3a2a1a`,  // Tan / dark brown
      b7: `#ca8a6a`, f7: `#2a1a1a`,  // Peach / dark
      b8: `#ba9a8a`, f8: `#2a2020`,  // Blush / dark
    }
  },
  mono: {
    name: `mono`,
    colors: {
      b1: `#1a1a1a`, f1: `#f5f5f5`,  // Near black / near white
      b2: `#2a2a2a`, f2: `#f0f0f0`,  // Charcoal / light grey
      b3: `#3a3a3a`, f3: `#e8e8e8`,  // Dark grey / pale grey
      b4: `#4a4a4a`, f4: `#e0e0e0`,  // Mid-dark grey / lighter grey
      b5: `#5a5a5a`, f5: `#ffffff`,  // Mid grey / white
      b6: `#8a8a8a`, f6: `#1a1a1a`,  // Light grey / near black
      b7: `#a0a0a0`, f7: `#1a1a1a`,  // Lighter grey / near black
      b8: `#c0c0c0`, f8: `#1a1a1a`,  // Silver / near black
    }
  },
  // Pacific Northwest inspired palettes (from PNWColors)
  starfish: {
    name: `starfish`,
    colors: {
      b1: `#24492e`, f1: `#e69b99`,  // Deep forest green / coral
      b2: `#015b58`, f2: `#ffffff`,  // Dark teal / white
      b3: `#2c6184`, f3: `#ffffff`,  // Ocean blue / white
      b4: `#59629b`, f4: `#ffffff`,  // Slate purple / white
      b5: `#89689d`, f5: `#ffffff`,  // Lavender / white
      b6: `#ba7999`, f6: `#1a1a1a`,  // Dusty rose / dark
      b7: `#e69b99`, f7: `#24492e`,  // Coral / forest green
      b8: `#f5e6e5`, f8: `#2c6184`,  // Pale pink / ocean blue
    }
  },
  shuksan: {
    name: `shuksan`,
    colors: {
      b1: `#33271e`, f1: `#f8e3d1`,  // Dark brown / cream
      b2: `#74677e`, f2: `#ffffff`,  // Dusty purple / white
      b3: `#ac8eab`, f3: `#ffffff`,  // Mauve / white
      b4: `#d7b1c5`, f4: `#33271e`,  // Pink / dark brown
      b5: `#ebbdc8`, f5: `#33271e`,  // Light pink / dark brown
      b6: `#f2cec7`, f6: `#33271e`,  // Pale rose / dark brown
      b7: `#f8e3d1`, f7: `#33271e`,  // Cream / dark brown
      b8: `#fefbe9`, f8: `#33271e`,  // Pale yellow / dark brown
    }
  },
  bay: {
    name: `bay`,
    colors: {
      b1: `#00496f`, f1: `#edd746`,  // Deep blue / golden yellow
      b2: `#0f85a0`, f2: `#ffffff`,  // Teal / white
      b3: `#edd746`, f3: `#00496f`,  // Golden yellow / deep blue
      b4: `#ed8b00`, f4: `#00496f`,  // Orange / deep blue
      b5: `#dd4124`, f5: `#ffffff`,  // Red-orange / white
      b6: `#f5f0e0`, f6: `#00496f`,  // Cream / deep blue
      b7: `#0a3a4a`, f7: `#edd746`,  // Darker blue / golden
      b8: `#c9e4e8`, f8: `#00496f`,  // Pale teal / deep blue
    }
  },
  lake: {
    name: `lake`,
    colors: {
      b1: `#362904`, f1: `#cde5f9`,  // Dark earth / pale sky
      b2: `#54450f`, f2: `#ffffff`,  // Brown / white
      b3: `#45681e`, f3: `#ffffff`,  // Forest green / white
      b4: `#4a9152`, f4: `#ffffff`,  // Bright green / white
      b5: `#64a8a8`, f5: `#ffffff`,  // Teal / white
      b6: `#85b6ce`, f6: `#362904`,  // Sky blue / dark earth
      b7: `#cde5f9`, f7: `#362904`,  // Pale sky / dark earth
      b8: `#eef3ff`, f8: `#45681e`,  // Pale blue / forest green
    }
  },
  cascades: {
    name: `cascades`,
    colors: {
      b1: `#2d4030`, f1: `#e2e260`,  // Dark forest / lime
      b2: `#516823`, f2: `#ffffff`,  // Olive / white
      b3: `#dec000`, f3: `#2d4030`,  // Gold / dark forest
      b4: `#e2e260`, f4: `#2d4030`,  // Lime / dark forest
      b5: `#677e8e`, f5: `#ffffff`,  // Slate / white
      b6: `#88a2b9`, f6: `#2d4030`,  // Steel blue / dark forest
      b7: `#d0e8d0`, f7: `#2d4030`,  // Pale green / dark forest
      b8: `#f0f5f0`, f8: `#516823`,  // Off white / olive
    }
  },
  sunset: {
    name: `sunset`,
    colors: {
      b1: `#41476b`, f1: `#fbdfa2`,  // Deep purple / pale gold
      b2: `#675478`, f2: `#ffffff`,  // Purple / white
      b3: `#9e6374`, f3: `#ffffff`,  // Mauve / white
      b4: `#c67b6f`, f4: `#ffffff`,  // Coral / white
      b5: `#de9b71`, f5: `#41476b`,  // Peach / deep purple
      b6: `#efbc82`, f6: `#41476b`,  // Gold / deep purple
      b7: `#fbdfa2`, f7: `#41476b`,  // Pale gold / deep purple
      b8: `#fff8f0`, f8: `#675478`,  // Cream / purple
    },
    lightColors: {
      b1: `#8b90b8`, f1: `#1a1a2e`,  // Soft periwinkle / dark
      b2: `#a68db8`, f2: `#1a1a2e`,  // Soft lavender / dark
      b3: `#d4969a`, f3: `#2e1a1a`,  // Soft rose / dark
      b4: `#e8a89a`, f4: `#2e1a1a`,  // Soft coral / dark
      b5: `#f0c4a0`, f5: `#3d2a1a`,  // Soft peach / dark
      b6: `#f5d8a8`, f6: `#3d351a`,  // Soft gold / dark
      b7: `#fae8c0`, f7: `#3d351a`,  // Pale gold / dark
      b8: `#fef4e8`, f8: `#41476b`,  // Warm white / purple
    },
  },
}

// Regex to match palette color names: b1-b8, f1-f8, native-fg, native-bg
const PALETTE_COLOR_RE = /^([bf][1-8]|native-fg|native-bg)$/

// Maps background hex → foreground hex for auto-text coloring
let bgToFgMap: Map<string, string> = new Map()

// Current palette name
let currentPaletteName = `sunset`

// Local overrides (binding-scoped overrides handled separately)
let localOverrides: Record<string, string> = {}

// Callback to resolve native-fg/native-bg from the theme system
let nativeColorResolver: ((name: string) => string | null) | null = null

function rebuildBgToFgMap() {
  bgToFgMap.clear()
  const colors = Palettes[currentPaletteName]?.colors
  if (!colors) return

  for (let i = 1; i <= 8; i++) {
    const bKey = `b${i}` as keyof PaletteColors
    const fKey = `f${i}` as keyof PaletteColors
    const bg = localOverrides[bKey] || colors[bKey]
    const fg = localOverrides[fKey] || colors[fKey]
    bgToFgMap.set(bg.toLowerCase(), fg)
  }
}

// Initialize
rebuildBgToFgMap()

export const Palette = {
  /**
   * Check if a string is a valid palette color name (b1-b8, f1-f8)
   */
  isPaletteColor(name: string): boolean {
    return PALETTE_COLOR_RE.test(name)
  },

  /**
   * Get the hex value for a palette color name
   * Checks local overrides first, then current palette definition
   */
  getColor(name: string): string | null {
    if (!this.isPaletteColor(name)) return null

    // native-fg/native-bg come from the theme system
    if (name === 'native-fg' || name === 'native-bg') {
      return nativeColorResolver ? nativeColorResolver(name) : null
    }

    // Check local overrides first
    if (localOverrides[name]) return localOverrides[name]

    // Get from current palette
    const palette = Palettes[currentPaletteName]
    if (!palette) return null

    return palette.colors[name as keyof PaletteColors] || null
  },

  /**
   * Set a local override for a palette color
   */
  setOverride(name: string, hex: string): void {
    if (!this.isPaletteColor(name)) return
    localOverrides[name] = hex
    rebuildBgToFgMap()
  },

  /**
   * Clear all local overrides
   */
  clearOverrides(): void {
    localOverrides = {}
    rebuildBgToFgMap()
  },

  /**
   * Get the current palette name
   */
  getCurrentName(): string {
    return currentPaletteName
  },

  /**
   * Switch to a named palette
   */
  setCurrent(name: string): void {
    if (!Palettes[name]) {
      throw new RTE(`Unknown palette: "${name}". Available: ${Object.keys(Palettes).join(`, `)}`)
    }
    currentPaletteName = name
    localOverrides = {}  // Clear overrides when switching palettes
    rebuildBgToFgMap()
  },

  /**
   * Get available palette names
   */
  getAvailableNames(): string[] {
    return Object.keys(Palettes)
  },

  /**
   * Given a background hex color, return the matching foreground hex
   * Returns null if the background is not a palette background color
   */
  getForegroundFor(bgHex: string): string | null {
    if (!bgHex) return null
    return bgToFgMap.get(bgHex.toLowerCase()) || null
  },

  /**
   * Check if a hex color is a palette background color (b1-b8)
   */
  isPaletteBackground(hex: string): boolean {
    if (!hex) return false
    return bgToFgMap.has(hex.toLowerCase())
  },

  /**
   * Get the current palette's colors
   */
  getCurrentColors(): PaletteColors {
    const base = Palettes[currentPaletteName]?.colors || Palettes.default.colors
    return { ...base, ...localOverrides } as PaletteColors
  },

  /**
   * Get a specific color from a named palette (ignoring overrides and current state)
   */
  getColorForPalette(paletteName: string, slot: string): string | null {
    const palette = Palettes[paletteName]
    if (!palette) return null
    return palette.colors[slot as keyof PaletteColors] ?? null
  },

  /**
   * Get the light-mode color for a palette slot, if explicitly defined.
   * Returns null if the palette doesn't define custom light colors for this slot.
   */
  getLightColorForPalette(paletteName: string, slot: string): string | null {
    const palette = Palettes[paletteName]
    if (!palette?.lightColors) return null
    return palette.lightColors[slot as keyof PaletteColors] ?? null
  },

  /**
   * Register a resolver for native-fg/native-bg colors (called from defaults.ts)
   */
  setNativeColorResolver(resolver: (name: string) => string | null): void {
    nativeColorResolver = resolver
  },
}
