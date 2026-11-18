// Colour options for the Runenir theme.
//
// Runenir's own palette is violet: its greys are tinted violet (hue ~285) and
// its accent is violet.  Each option here keeps Runenir's exact lightness and
// strength for every colour and only turns the hue, so every option has the
// same contrast and feel as the original, just in another colour.
//
// Colours are worked in OKLCH (lightness, chroma = strength, hue), the same
// space Runenir's tokens use, then turned back into hex for the app.

import { makeColors } from './make-colors.js'

type Rgb = [number, number, number]

const toLinear = (c: number): number => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const fromLinear = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)

function hexToOklch(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  const r = toLinear(((n >> 16) & 255) / 255)
  const g = toLinear(((n >> 8) & 255) / 255)
  const b = toLinear((n & 255) / 255)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const h = (Math.atan2(B, A) * 180) / Math.PI

  return [L, Math.hypot(A, B), h < 0 ? h + 360 : h]
}

function oklchToRgb(L: number, C: number, h: number): Rgb {
  const rad = (h * Math.PI) / 180
  const A = C * Math.cos(rad)
  const B = C * Math.sin(rad)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

// Some hues can't be as strong as violet on a screen (bright teal, say).
// Lower the strength until the colour fits, keeping lightness and hue.
function oklchToHex(L: number, C: number, h: number): string {
  let c = C
  let rgb = oklchToRgb(L, c, h)
  while (c > 0 && rgb.some(v => v < -0.0001 || v > 1.0001)) {
    c -= 0.002
    rgb = oklchToRgb(L, c, h)
  }

  return '#' + rgb.map(v => Math.round(fromLinear(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, '0')).join('')
}

// Turn a Runenir colour to another hue.  `strength` scales chroma (0 = grey).
function turn(hex: string, hue: number, strength = 1): string {
  const [L, C] = hexToOklch(hex)

  return oklchToHex(L, C * strength, hue)
}

// Runenir Plain colours (text flattened onto the ground).
const BASE = {
  'surface-0': '#0b0a14', //      --runenir-ground
  'surface-1': '#13111f', //      --runenir-surface
  'surface-2': '#181626', //      one step up, for panels
  'surface-3': '#1d1a2c', //      menus
  'text-primary': '#e6e4ee', //   --runenir-text-1
  'text-secondary': '#c0bdcc', // --runenir-text-2
  'text-muted': '#9491a0', //     --runenir-text-3
} as const
const ACCENT = '#a48bff' // --runenir-accent
const GLOW = '#3b2f68' //   the corner glow, a little stronger than --runenir-page-glow

// The options, named after gemstones.  `hue` is the only thing that changes
// (OKLCH degrees); every option keeps Runenir's own lightness and strength.
// Amethyst is Runenir exactly.  Onyx is plain grey with a slate accent and glow.
// Note: Emerald's hue sits next to the success green (Runenir's own warning
// about emerald accents), so "done" ticks read close to the accent there.
export const PRESETS = {
  amethyst: { label: 'Amethyst', hue: null, greys: 1 },
  sapphire: { label: 'Sapphire', hue: 237.3, greys: 1 },
  turquoise: { label: 'Turquoise', hue: 182.5, greys: 1 },
  emerald: { label: 'Emerald', hue: 162.5, greys: 1 },
  citrine: { label: 'Citrine', hue: 86.0, greys: 1 },
  sunstone: { label: 'Sunstone', hue: 47.6, greys: 1 },
  ruby: { label: 'Ruby', hue: 16.4, greys: 1 },
  rosequartz: { label: 'Rose Quartz', hue: 349.8, greys: 1 },
  onyx: { label: 'Onyx', hue: null, greys: 0 },
} as const

export type PresetName = keyof typeof PRESETS
export const PRESET_NAMES = Object.keys(PRESETS) as PresetName[]
export const DEFAULT_PRESET: PresetName = 'amethyst'

export function buildPreset(name: PresetName) {
  const p = PRESETS[name]
  const [, , baseHue] = hexToOklch(BASE['surface-0'])
  const hue = p.hue ?? baseHue
  const anchors = Object.fromEntries(
    Object.entries(BASE).map(([k, hex]) => [k, name === 'amethyst' ? hex : turn(hex, hue, p.greys)]),
  ) as Record<keyof typeof BASE, string>
  const onyx = name === 'onyx'
  const accent = name === 'amethyst' ? ACCENT : onyx ? '#94a3b8' : turn(ACCENT, hue)
  const glow = name === 'amethyst' ? GLOW : onyx ? '#334155' : turn(GLOW, hue)

  const { theme, problems } = makeColors({
    label: `Runenir ${p.label}`,
    only: 'dark',
    roles: {
      accent,
      danger: '#fe5166', //  --runenir-danger-text
      success: '#35d399', // --runenir-status-success
      warning: '#fbbf25', // --runenir-status-warning
      pro: '#60a5fa', //     --runenir-status-info
    },
    dark: { gray: { anchors } },
  })

  return { label: p.label, theme, problems, ground: anchors['surface-0'], glow }
}
