/**
 * Starting points for a theme: the brand colours (and a radius scale) as
 * palette names, which the kit compiles to their colours. Applying one
 * replaces the theme's colours and radii and keeps everything else
 * (components, motion, other tokens). Content and strong colours are left
 * out on purpose: the kit derives readable ones (WCAG AA) from each colour.
 */
import { setIn } from './edit.ts'
import type { SchemeValue, ThemeSpec } from './spec.ts'

export interface Preset {
  id: string
  label: string
  color: Record<string, SchemeValue>
  radius?: Record<string, string>
}

const pair = (hue: string, light = 600, dark = 400): SchemeValue => ({
  light: `${hue}-${light}`,
  dark: `${hue}-${dark}`,
})

export const PRESETS: Preset[] = [
  { id: 'default', label: 'Default', color: {} },
  {
    id: 'ocean',
    label: 'Ocean',
    color: {
      primary: pair('azure', 700),
      secondary: pair('royal'),
      tertiary: pair('turquoise', 700),
      accent: pair('gold', 500, 300),
    },
    radius: { sm: '6px', md: '10px', lg: '18px' },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    color: {
      primary: pair('orange', 700),
      secondary: pair('ruby'),
      tertiary: pair('gold', 700),
      accent: pair('magenta'),
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
    },
    radius: { sm: '2px', md: '6px', lg: '12px' },
  },
  {
    id: 'grape',
    label: 'Grape',
    color: {
      primary: pair('lavender'),
      secondary: pair('magenta'),
      tertiary: pair('royal'),
      accent: pair('jade'),
    },
    radius: { sm: '8px', md: '14px', lg: '24px' },
  },
  {
    id: 'mono',
    label: 'Mono',
    color: {
      primary: pair('silver', 900, 100),
      secondary: pair('silver', 600, 400),
      tertiary: pair('taupe', 700, 300),
      accent: pair('red'),
    },
    radius: { sm: '0', md: '2px', lg: '4px' },
  },
  {
    id: 'candy',
    label: 'Candy',
    color: {
      primary: pair('pink', 600),
      secondary: pair('azure', 700),
      tertiary: pair('lavender', 500, 300),
      accent: pair('yellow', 400, 300),
    },
    radius: { sm: '10px', md: '18px', lg: '28px' },
  },
]

/** Hues with enough colour to carry a brand. */
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

const RADII = [
  { sm: '0', md: '2px', lg: '4px' },
  { sm: '4px', md: '8px', lg: '16px' },
  { sm: '6px', md: '12px', lg: '20px' },
  { sm: '10px', md: '18px', lg: '28px' },
]

/** Four different hues, shuffled, and a radius scale. `random` is injectable for tests. */
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
    },
    radius: RADII[Math.floor(random() * RADII.length)]!,
  }
}

/** A preset's colours and radii, replacing the theme's; everything else stays. */
export const applyPreset = (spec: ThemeSpec, preset: Preset): ThemeSpec => {
  const withColor = setIn(spec, ['tokens', 'color'], structuredClone(preset.color))
  return setIn(withColor, ['tokens', 'radius'], preset.radius && { ...preset.radius })
}
