import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { black, palette, paletteShades, lavender, white } from './palette.ts'
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

  it('builds every default color from the palette', () => {
    const inPalette = new Set<string>([
      white,
      black,
      ...Object.values(palette).flatMap((hue) => Object.values(hue)),
    ])
    const derived: string[] = []
    for (const [role, pair] of Object.entries(color)) {
      for (const value of [pair.light, pair.dark]) {
        if (!inPalette.has(value)) derived.push(role)
      }
    }
    // Only the roles built from other roles aren't a palette color.
    expect([...new Set(derived)]).toEqual(['focusRing', 'scrim'])
  })

  it('reads the semantic colors from the palette, with no hex of its own', () => {
    const source = readFileSync(join(process.cwd(), 'src/tokens.ts'), 'utf8')
    expect(source).not.toMatch(/#[0-9a-f]{3,6}\b/i)
    expect(color.primary).toEqual({ light: palette.blue[600], dark: palette.blue[400] })
    expect(color.canvas).toEqual({ light: white, dark: palette.steel[999] })
  })

  it('keeps the content inks the palette’s', () => {
    expect(CONTENT_LIGHT).toBe(white)
    expect(CONTENT_DARK).toBe(palette.steel[999])
    expect(color.primaryContent).toEqual({ light: white, dark: palette.steel[999] })
  })
})
