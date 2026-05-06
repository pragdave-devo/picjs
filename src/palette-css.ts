import { converter, formatHex, clampGamut, parse } from 'culori'
import type { Oklch } from 'culori'

const toOklch = converter('oklch')
const clampRgb = clampGamut('rgb')

function invertLuma(hex: string): string {
  const color = parse(hex)
  if (!color) return hex
  const ok = toOklch(color) as Oklch
  const inverted = clampRgb({ ...ok, l: 1 - ok.l })!
  return formatHex(inverted)
}

export interface SlotColors {
  dark: string
  light: string
}

/**
 * Compute dark/light hex pairs for every slot used in a drawing.
 * Slot names are either "palette:bN"/"palette:fN" (palette-qualified)
 * or "native-fg"/"native-bg" (unqualified).
 */
export function computeSlotColors(
  usedSlots: Set<string>,
  getPaletteColor: (paletteName: string, slot: string) => string | null,
  nativeFgDark: string,
  nativeBgDark: string
): Map<string, SlotColors> {
  const result = new Map<string, SlotColors>()

  // Collect unique slot keys from usedSlots (entries are "attr:slotKey")
  const slotKeys = new Set<string>()
  for (const entry of usedSlots) {
    // "fill:default:b1" → slotKey = "default:b1"
    // "fill:native-fg"  → slotKey = "native-fg"
    const firstColon = entry.indexOf(':')
    if (firstColon < 0) continue
    slotKeys.add(entry.slice(firstColon + 1))
  }

  for (const key of slotKeys) {
    if (key === 'native-fg') {
      result.set(key, { dark: nativeFgDark, light: nativeBgDark })
    } else if (key === 'native-bg') {
      result.set(key, { dark: nativeBgDark, light: nativeFgDark })
    } else {
      // "default:b1" → paletteName="default", baseSlot="b1"
      const colonIdx = key.indexOf(':')
      if (colonIdx < 0) continue
      const paletteName = key.slice(0, colonIdx)
      const baseSlot = key.slice(colonIdx + 1)
      const hex = getPaletteColor(paletteName, baseSlot)
      if (hex) {
        result.set(key, { dark: hex, light: invertLuma(hex) })
      }
    }
  }

  return result
}

export function generateCSS(
  usedSlots: Set<string>,
  slotColors: Map<string, SlotColors>,
  lightSelector: string = '[data-theme="light"]'
): string {
  const darkRules: string[] = []
  const lightRules: string[] = []

  const seenEntries = new Set<string>()
  for (const entry of usedSlots) {
    if (seenEntries.has(entry)) continue
    seenEntries.add(entry)

    // "fill:default:b1" → attr="fill", slotKey="default:b1"
    const firstColon = entry.indexOf(':')
    if (firstColon < 0) continue
    const attr = entry.slice(0, firstColon)
    const slotKey = entry.slice(firstColon + 1)

    const colors = slotColors.get(slotKey)
    if (!colors) continue

    // CSS class uses hyphen instead of colon: "default:b1" → "default-b1"
    const cssSlot = slotKey.replace(':', '-')
    const cls = `pj-${attr}-${cssSlot}`

    // native-fg/native-bg use currentColor/transparent to inherit from the page
    if (slotKey === 'native-fg') {
      darkRules.push(`.${cls}{${attr}:currentColor}`)
    } else if (slotKey === 'native-bg') {
      darkRules.push(`.${cls}{${attr}:transparent}`)
    } else {
      darkRules.push(`.${cls}{${attr}:${colors.dark}}`)
      lightRules.push(`.${cls}{${attr}:${colors.light}}`)
    }
  }

  if (darkRules.length === 0) return ''

  const isMedia = lightSelector.startsWith('@media')
  const lightBlock = isMedia
    ? `${lightSelector}{${lightRules.join('')}}`
    : lightRules.map(r => `${lightSelector} ${r}`).join('\n')

  return [...darkRules, lightBlock].join('\n')
}
