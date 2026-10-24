import { describe, expect, it } from 'vitest'
import { derivedContent, derivedStrong, mixOklab } from '../src/studio/derived.ts'
import { over } from '../src/studio/panels/ColorsSection.tsx'
import { applyPreset, PRESETS, randomPreset } from '../src/studio/presets.ts'
import { contrastRatio } from '@greese/ui'
import { resolveColor } from '../src/studio/resolve.ts'
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
  }, 30_000)

  it('picks four different hues at random', () => {
    const { color } = randomPreset()
    const hues = (['primary', 'secondary', 'tertiary', 'accent'] as const).map((role) => {
      const v = color[role]!
      return (typeof v === 'string' ? v : v.light).split('-')[0]
    })
    expect(new Set(hues).size).toBe(4)
  })

  it('tint the neutrals, with text that meets AA on every ground, in both schemes', () => {
    for (const preset of PRESETS.filter((p) => p.color.canvas)) {
      for (const scheme of ['light', 'dark'] as const) {
        const hex = (role: string) => {
          const v = preset.color[role]!
          return resolveColor(typeof v === 'string' ? v : v[scheme], scheme)!
        }
        for (const text of ['fg', 'fg-muted'])
          for (const ground of ['canvas', 'surface', 'surface-overlay'])
            expect(
              contrastRatio(hex(text), hex(ground)),
              `${preset.id} ${scheme}: ${text} on ${ground}`
            ).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('replaces colors only: radii, components and motion are other layers', () => {
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
    expect(next.tokens!.radius).toEqual({ md: '3px' })
    expect(next.tokens!.space).toEqual({ 4: '1.1rem' })
    expect(next.components).toEqual(spec.components)
    expect(next.motionDefaults).toEqual(spec.motionDefaults)
    // Default clears the colors it doesn't set.
    expect(
      applyPreset(
        next,
        PRESETS.find((p) => p.id === 'default')!
      ).tokens!.color
    ).toBeUndefined()
  })
})
