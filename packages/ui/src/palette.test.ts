import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  palette,
  paletteShades,
  lavender,
  type PaletteHue,
  type PaletteShade,
} from './palette.ts'
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

  it('matches the palette names in the color roles’ comments', () => {
    const source = readFileSync(join(process.cwd(), 'src/tokens.ts'), 'utf8')
    const lines = source.split('\n').filter((line) => /^\s+\w+: \{ light: '#/.test(line))
    let checked = 0
    for (const line of lines) {
      const [, role] = /^\s+(\w+):/.exec(line)!
      const named = /\/\/ (\w+)-(\d+), (\w+)-(\d+)$/.exec(line)
      if (!named) continue
      const [, lh, ls, dh, ds] = named
      const pair = color[role as keyof typeof color]
      expect(pair.light, role).toBe(palette[lh as PaletteHue][Number(ls) as PaletteShade])
      expect(pair.dark, role).toBe(palette[dh as PaletteHue][Number(ds) as PaletteShade])
      checked += 1
    }
    expect(checked).toBe(12)
  })
})
