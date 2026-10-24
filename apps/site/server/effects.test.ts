import { describe, expect, it } from 'vitest'
import { describeGreeseEffects } from '@greese/react'
import { effectClass, effectNames, entranceNames } from '@greese/ui'
import {
  motionChoices,
  specToEffectsTs,
  specToScss,
  validateSpec,
  type ThemeSpec,
} from '../src/studio/spec.ts'
import { compileSpec } from './studio.ts'

describe('effect lists', () => {
  it('are the library’s own, not a copy', async () => {
    expect(Object.keys(await describeGreeseEffects()).sort()).toEqual(
      [...effectNames].sort()
    )
  })
})

describe('copying every built-in', () => {
  it('compiles and validates each effect, copied under its own name', async () => {
    const frames = await describeGreeseEffects()
    const effects = Object.fromEntries(
      Object.entries(frames).map(([name, keyframes]) => [`${name}Copy`, { keyframes }])
    )
    expect(validateSpec({ effects })).toEqual([])
    const result = compileSpec({ tokens: {}, components: {}, effects })
    expect(result).not.toHaveProperty('errors')
    const css = (result as { css: string }).css
    for (const name of entranceNames())
      expect(css).toContain(`@keyframes greese-${effectClass(name)}-copy`)
  }, 30_000)

  it('refuses a built-in’s name: a built-in keeps its keyframes', () => {
    expect(
      validateSpec({ effects: { fadeUp: { keyframes: { x: [0, 1] } } } })
    ).not.toEqual([])
  })
})

describe('a theme with effects', () => {
  const spec: ThemeSpec = {
    tokens: {},
    components: {},
    effects: {
      floatUp: { keyframes: { opacity: [0, 1], y: ['2rem', '0px'] } },
      spinIn: { keyframes: { rotate: [-90, 0], opacity: [0, 1] }, duration: 0.8 },
    },
  }

  it('builds every effect into the CSS alike, through the real kit', () => {
    const result = compileSpec({
      ...spec,
      effects: {
        ...spec.effects,
        // Overlay exits of the theme's own.
        shrink: { keyframes: { scale: [1, 0.5], opacity: [1, 0] } },
        sink: { keyframes: { y: [0, '2rem'], opacity: [1, 0] } },
      },
      components: {
        Card: { motion: { enter: 'spin-in' } },
        Dialog: { motion: { exit: 'sink' } },
      },
    })
    expect(result).not.toHaveProperty('errors')
    const { css, scss } = result as { css: string; scss: string }
    expect(scss).toContain('@include greese.effect(float-up,')
    expect(scss).toContain('@include greese.effect(spin-in,')
    expect(css).toMatch(/@keyframes greese-float-up/)
    expect(css).toMatch(/translate:\s*0px 2rem/)
    // A new effect gets the same CSS a built-in has, and motion() accepts it.
    expect(css).toMatch(/@keyframes greese-spin-in \{\s+from \{\s+rotate: -90deg/)
    expect(css).toMatch(/\.greese-Card \{[^}]*animation: greese-spin-in /)
    // Exits of the theme's own, and the built-ins' unchanged.
    expect(css).toMatch(
      /\.greese-Motion--exit-shrink \{[^}]*--greese-motion-exit-scale: 0\.5;/
    )
    expect(css).toMatch(
      /\.greese-Motion--exit-sink \{\s+--greese-motion-exit-translate: 0px 2rem;/
    )
    expect(css).toMatch(
      /\.greese-Dialog \{[^}]*--greese-motion-exit-translate: 0px 2rem;/
    )
  })

  it('offers its own effects in the Motion section', () => {
    const { enter, exit } = motionChoices({
      ...spec,
      effects: {
        ...spec.effects,
        sink: { keyframes: { y: [0, '2rem'], opacity: [1, 0] } },
      },
    })
    expect(enter).toContain('fade-up')
    expect(enter).toContain('float-up')
    expect(enter).toContain('spin-in')
    expect(exit).toContain('sink')
    expect(exit).toContain('fade-out')
    expect(enter).not.toContain('fade-out')
  })

  it('generates the module that defines every effect, and types the new names', () => {
    const ts = specToEffectsTs(spec)!
    expect(ts).toContain("defineGreeseEffect('floatUp', {")
    expect(ts).toContain("defineGreeseEffect('spinIn', {")
    expect(ts).toContain('duration: 0.8,')
    expect(ts).toMatch(/GreeseEffectRegistry {\n\s+floatUp: true\n\s+spinIn: true\n/)
    expect(specToEffectsTs({ tokens: {} })).toBeUndefined()
    expect(specToScss({ tokens: {} })).not.toContain('effect(')
  })

  it('refuses names and values that would write bad CSS or code', () => {
    const bad = (effects: ThemeSpec['effects']) => validateSpec({ effects })
    expect(bad({ 'Bad-Name': { keyframes: { x: [0, 1] } } })).not.toEqual([])
    expect(bad({ ok: { keyframes: { x: ['1px; } a {'] } } })).not.toEqual([])
    expect(bad({ ok: { keyframes: {} } })).toEqual([])
    expect(bad({ ok: { keyframes: { x: [0, 1] }, duration: 0 } })).not.toEqual([])
    expect(bad({ ok: { keyframes: { x: [0, 1] }, duration: 0.5 } })).toEqual([])
  })
})
