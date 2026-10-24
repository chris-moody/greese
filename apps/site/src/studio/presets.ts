/**
 * Color themes: the brand colors and the neutrals (canvas, surfaces, text,
 * borders), tinted from one hue, as palette names the kit compiles. A color
 * theme is one of three layers (ADR 0025): applying one replaces the theme's
 * colors and nothing else, so shapes, radii and motion stay whatever their
 * own layers say. Content and strong colors are left out on purpose: the kit
 * derives readable ones (WCAG AA) from each color.
 */
import { GREESE_SPEC } from '../theme.ts'
import { setIn } from './edit.ts'
import type { SchemeValue, ThemeSpec } from './spec.ts'

export interface Preset {
  id: string
  label: string
  color: Record<string, SchemeValue>
}

const pair = (hue: string, light = 600, dark = 400): SchemeValue => ({
  light: `${hue}-${light}`,
  dark: `${hue}-${dark}`,
})

/**
 * The page's neutrals, tinted from one hue: the canvas and surfaces at the
 * light end in light mode and the dark end in dark mode, text and borders
 * from the same ramp (presets.test.ts checks the text meets AA on them).
 */
export const neutrals = (hue: string): Record<string, SchemeValue> => ({
  canvas: pair(hue, 50, 999),
  surface: pair(hue, 100, 900),
  'surface-overlay': { light: '#ffffff', dark: `${hue}-800` },
  fg: pair(hue, 999, 100),
  'fg-muted': pair(hue, 700, 300),
  border: pair(hue, 200, 800),
  'border-strong': pair(hue, 400, 700),
  track: pair(hue, 200, 600),
})

export const PRESETS: Preset[] = [
  // The official theme (theme.ts): GreeseUI with a warm orange primary.
  { id: 'greese', label: 'Greese', color: GREESE_SPEC.tokens!.color! },
  { id: 'default', label: 'Default', color: {} },
  {
    id: 'ocean',
    label: 'Ocean',
    color: {
      primary: pair('azure', 700),
      secondary: pair('royal'),
      tertiary: pair('turquoise', 700),
      accent: pair('gold', 500, 300),
      ...neutrals('azure'),
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    color: {
      primary: pair('orange', 700),
      secondary: pair('ruby'),
      tertiary: pair('gold', 700),
      accent: pair('magenta'),
      ...neutrals('orange'),
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    color: {
      primary: pair('jade', 700),
      secondary: pair('lime', 700),
      tertiary: pair('aqua', 700),
      accent: pair('orange'),
      ...neutrals('jade'),
    },
  },
  {
    id: 'grape',
    label: 'Grape',
    color: {
      primary: pair('lavender'),
      secondary: pair('magenta'),
      tertiary: pair('royal'),
      accent: pair('jade'),
      ...neutrals('lavender'),
    },
  },
  {
    id: 'mono',
    label: 'Mono',
    color: {
      primary: pair('silver', 900, 100),
      secondary: pair('silver', 600, 400),
      tertiary: pair('taupe', 700, 300),
      accent: pair('red'),
      ...neutrals('gray'),
    },
  },
  {
    id: 'candy',
    label: 'Candy',
    color: {
      primary: pair('pink', 600),
      secondary: pair('azure', 700),
      tertiary: pair('lavender', 500, 300),
      accent: pair('yellow', 400, 300),
      ...neutrals('pink'),
    },
  },
]

/** Hues with enough color to carry a brand. */
const HUES = [
  'red',
  'orange',
  'gold',
  'lime',
  'green',
  'jade',
  'turquoise',
  'aqua',
  'azure',
  'blue',
  'royal',
  'lavender',
  'purple',
  'magenta',
  'pink',
  'ruby',
]

/** Hues for tinted neutrals: the grays, and a few colors pale enough to read as paper. */
const NEUTRAL_HUES = ['steel', 'gray', 'ash', 'taupe', 'azure', 'jade', 'lavender', 'orange', 'pink']

/** Four different hues, shuffled, and neutrals tinted from another. `random` is injectable for tests. */
export const randomPreset = (random: () => number = Math.random): Preset => {
  const hues = [...HUES]
  const pick = () => hues.splice(Math.floor(random() * hues.length), 1)[0]!
  const [primary, secondary, tertiary, accent] = [pick(), pick(), pick(), pick()]
  return {
    id: 'random',
    label: 'Random',
    color: {
      primary: pair(primary, 700),
      secondary: pair(secondary),
      tertiary: pair(tertiary, 700),
      accent: pair(accent),
      ...neutrals(NEUTRAL_HUES[Math.floor(random() * NEUTRAL_HUES.length)]!),
    },
  }
}

/** A color theme: its colors in place of the theme's; nothing else changes. */
export const applyPreset = (spec: ThemeSpec, preset: Preset): ThemeSpec =>
  setIn(spec, ['tokens', 'color'], Object.keys(preset.color).length ? structuredClone(preset.color) : undefined)
