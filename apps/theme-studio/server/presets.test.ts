import { describe, expect, it } from 'vitest'
import { derivedContent, derivedStrong, mixOklab } from '../src/derived.ts'
import { over } from '../src/panels/ColorsSection.tsx'
import { applyPreset, PRESETS, randomPreset } from '../src/presets.ts'
import { compileSpec } from './studio.ts'

describe('derived colors, as the studio shows them', () => {
  it('mixes in OKLab like the browser', () => {
    expect(mixOklab('#2563eb', '#2563eb', 0.5)).toBe('#2563eb')
    expect(mixOklab('#ffffff', '#000000', 1)).toBe('#ffffff')
    // OKLab's midpoint of white and black is L 0.5: a grey near #636363.
    expect(mixOklab('#ffffff', '#000000', 0.5)).toBe('#636363')
  })

  it('makes the strong shade darker in light and lighter in dark', () => {
    const lum = (hex: string) => parseInt(hex.slice(1, 3), 16)
    expect(lum(derivedStrong('#c2410c', 'light'))).toBeLessThan(lum('#c2410c'))
    expect(lum(derivedStrong('#c2410c', 'dark'))).toBeGreaterThan(lum('#c2410c'))
    expect(derivedContent('#fde047')).toBe('#11171c')
  })
})

describe('contrast of translucent colors', () => {
  it('composites alpha over what is behind, as the eye sees it', () => {
    expect(over('#00000080', '#ffffff')).toBe('#7f7f7f')
    expect(over('#ff000000', '#123456')).toBe('#123456')
    expect(over('#abcdef', '#000000')).toBe('#abcdef')
  })
})

describe('presets', () => {
  it('compiles every preset, and a few random themes, through the real kit', () => {
    const seeded = (seed: number) => () =>
      ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    for (const preset of [...PRESETS, randomPreset(seeded(1)), randomPreset(seeded(7))]) {
      expect(
        compileSpec(applyPreset({ tokens: {}, components: {} }, preset))
      ).not.toHaveProperty('errors')
    }
  })

  it('picks four different hues at random', () => {
    const { color } = randomPreset()
    const hues = Object.values(color).map(
      (v) => (typeof v === 'string' ? v : v.light).split('-')[0]
    )
    expect(new Set(hues).size).toBe(4)
  })

  it('replaces colors and radii, and keeps components and motion', () => {
    const spec = {
      tokens: {
        color: { canvas: '#000' },
        radius: { md: '3px' },
        space: { 4: '1.1rem' },
      },
      components: { Button: { styles: { 'font-weight': '700' } } },
      motionDefaults: { duration: '0.3s' },
    }
    const ocean = PRESETS.find((p) => p.id === 'ocean')!
    const next = applyPreset(spec, ocean)
    expect(next.tokens!.color).toEqual(ocean.color)
    expect(next.tokens!.radius).toEqual(ocean.radius)
    expect(next.tokens!.space).toEqual({ 4: '1.1rem' })
    expect(next.components).toEqual(spec.components)
    expect(next.motionDefaults).toEqual(spec.motionDefaults)
    // Default clears the colors it doesn't set.
    expect(applyPreset(next, PRESETS[0]!).tokens!.color).toEqual({})
  })
})
