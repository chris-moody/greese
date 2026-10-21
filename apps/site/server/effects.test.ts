import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { describeGreeseEffects } from '@greese/react'
import { toCssSteps } from '../src/studio/effectCss.ts'
import {
  BUILT_IN_EFFECTS,
  CSS_PRESETS,
  specToEffectsTs,
  specToScss,
  validateSpec,
  type ThemeSpec,
} from '../src/studio/spec.ts'
import { compileSpec } from './studio.ts'

const kebab = (n: string) => n.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

describe('effect lists', () => {
  it('keep in step with the library', async () => {
    expect([...BUILT_IN_EFFECTS].sort()).toEqual(
      Object.keys(await describeGreeseEffects()).sort()
    )
    const scss = readFileSync('../../packages/ui/src/components/Motion/Motion.scss', 'utf8')
    const list = /\$presets: \(([^)]*)\)/.exec(scss)![1]!
    expect([...list.matchAll(/'([a-z-]+)'/g)].map((m) => m[1])).toEqual(
      CSS_PRESETS.map(kebab)
    )
  })
})

describe('keyframes as CSS', () => {
  it('turns x, y, scale and rotate into the individual transform properties', () => {
    expect(toCssSteps({ opacity: [0, 1], y: ['1rem', '0px'], scale: [0.9, 1] })).toEqual([
      ['from', { translate: '0px 1rem', opacity: '0', scale: '0.9' }],
      ['to', { translate: '0px 0px', opacity: '1', scale: '1' }],
    ])
    expect(toCssSteps({ rotate: [0, 90] })[1]).toEqual(['to', { rotate: '90deg' }])
  })

  it('places a list of frames at their offsets, or evenly', () => {
    const steps = toCssSteps([{ scale: 0.8 }, { scale: 1.04, offset: 0.6 }, { scale: 1 }])
    expect(steps.map(([at]) => at)).toEqual(['from', '60%', 'to'])
  })
})

describe('a theme with effects', () => {
  const spec: ThemeSpec = {
    tokens: {},
    components: {},
    effects: {
      fadeUp: { keyframes: { opacity: [0, 1], y: ['2rem', '0px'] } },
      spinIn: { keyframes: { rotate: [-90, 0], opacity: [0, 1] }, duration: 0.8 },
    },
  }

  it('builds a retuned preset into the CSS, through the real kit', () => {
    const result = compileSpec(spec)
    expect(result).not.toHaveProperty('errors')
    const { css, scss } = result as { css: string; scss: string }
    expect(scss).toContain('@include greese.keyframes(greese-fade-up')
    expect(css).toMatch(/@keyframes greese-fade-up/)
    expect(css).toMatch(/translate:\s*0px 2rem/)
    // A new effect has no CSS: it's for the runtime.
    expect(css).not.toMatch(/spin-in/)
  })

  it('generates the module that defines every effect, and types the new names', () => {
    const ts = specToEffectsTs(spec)!
    expect(ts).toContain("defineGreeseEffect('fadeUp', {")
    expect(ts).toContain("defineGreeseEffect('spinIn', {")
    expect(ts).toContain('duration: 0.8,')
    expect(ts).toMatch(/GreeseEffectRegistry {\n\s+spinIn: true\n/)
    expect(ts).not.toMatch(/fadeUp: true/)
    expect(specToEffectsTs({ tokens: {} })).toBeUndefined()
    expect(specToScss({ tokens: {} })).not.toContain('keyframes')
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
