import { converter, formatHex, clampGamut, parse } from 'culori'
import type { Oklch } from 'culori'

const toOklch = converter('oklch')
const clampRgb = clampGamut('rgb')

function toLightBackground(hex: string): string {
  const color = parse(hex)
  if (!color) return hex
  const ok = toOklch(color) as Oklch

  // Remap to pastel range: high lightness, reduced chroma, same hue.
  // Dark colors (L<0.5) get pushed to L≈0.80; already-light colors stay near their level.
  const targetL = ok.l < 0.5 ? 0.80 : Math.min(0.90, ok.l + 0.15)
  const targetC = Math.min((ok.c ?? 0) * 0.8, 0.15)

  const pastel = clampRgb({ ...ok, l: targetL, c: targetC })!
  return formatHex(pastel)
}

function toLightForeground(hex: string): string {
  const color = parse(hex)
  if (!color) return hex
  const ok = toOklch(color) as Oklch

  // Foreground text in light mode: dark, slightly tinted to match the hue.
  // Light text (L>0.6) gets pushed to L≈0.30; already-dark text stays put.
  const targetL = ok.l > 0.6 ? 0.30 : Math.max(0.20, ok.l - 0.1)
  const targetC = Math.min((ok.c ?? 0) * 0.5, 0.06)

  const dark = clampRgb({ ...ok, l: targetL, c: targetC })!
  return formatHex(dark)
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
  nativeBgDark: string,
  getLightColor?: (paletteName: string, slot: string) => string | null,
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
        const explicit = getLightColor?.(paletteName, baseSlot)
        const lightHex = explicit ?? (baseSlot.startsWith('f')
          ? toLightForeground(hex)
          : toLightBackground(hex))
        result.set(key, { dark: hex, light: lightHex })
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

    // native-fg/native-bg use currentColor/transparent to inherit from the page,
    // with explicit light-mode overrides for reliable contrast
    if (slotKey === 'native-fg') {
      darkRules.push(`.${cls}{${attr}:currentColor}`)
      lightRules.push(`.${cls}{${attr}:#1a1a2e}`)
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
