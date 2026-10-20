import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  black,
  palette,
  paletteShades,
  lavender,
  type PaletteHue,
  type PaletteShade,
  white,
} from './palette.ts'
import { CONTENT_DARK, CONTENT_LIGHT } from './contrast.ts'
import { color } from './tokens.ts'

describe('palette', () => {
  it('has every shade of every hue, as a hex color', () => {
    for (const shades of Object.values(palette)) {
      expect(Object.keys(shades).map(Number)).toEqual([...paletteShades])
      // Ends on 999, not 950.
      expect(paletteShades.at(-1)).toBe(999)
      for (const value of Object.values(shades)) expect(value).toMatch(/^#[0-9a-f]{6}$/)
    }
  })

  it('exports each hue on its own, for tree-shaking', () => {
    expect(lavender).toBe(palette.lavender)
    expect(lavender[600]).toBe(palette.lavender[600])
    expect(lavender[600]).toMatch(/^#[0-9a-f]{6}$/)
  })

  it('builds every default color from the palette, as its comments name', () => {
    const source = readFileSync(join(process.cwd(), 'src/tokens.ts'), 'utf8')
    const lines = source.split('\n').filter((line) => /^\s+\w+: \{ light: '#/.test(line))
    const value = (name: string): string => {
      if (name === 'white') return white
      if (name === 'black') return black
      const [, hue, shade] = /^([a-z]+)-(\d+)$/.exec(name)!
      return palette[hue as PaletteHue][Number(shade) as PaletteShade]
    }
    const named = new Set<string>()
    for (const line of lines) {
      const [, role] = /^\s+(\w+):/.exec(line)!
      const names = /\/\/ ([a-z]+(?:-\d+)?), ([a-z]+(?:-\d+)?)$/.exec(line)
      expect(names, `${role} names its palette colors`).not.toBeNull()
      const pair = color[role as keyof typeof color]
      expect(pair.light, role).toBe(value(names![1]!))
      expect(pair.dark, role).toBe(value(names![2]!))
      named.add(role!)
    }
    // Every role is a palette color, but the two built from other roles.
    expect(Object.keys(color).filter((role) => !named.has(role))).toEqual([
      'focusRing',
      'scrim',
    ])
  })

  it('keeps the content inks the palette’s', () => {
    expect(CONTENT_LIGHT).toBe(white)
    expect(CONTENT_DARK).toBe(palette.steel[999])
    expect(color.primaryContent).toEqual({ light: white, dark: palette.steel[999] })
  })
})
