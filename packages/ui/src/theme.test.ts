import { describe, expect, it } from 'vitest'
import { LAYER_ORDER } from './css.ts'
import {
  AA,
  CONTENT_DARK,
  CONTENT_LIGHT,
  contentColor,
  contrastRatio,
} from './contrast.ts'
import { createTheme, deriveColors } from './theme.ts'
import { color, scalarTokens } from './tokens.ts'

const T = "[data-greese-theme='brand']"

/** The declarations inside the first rule whose selector starts with `selector`. */
const rule = (css: string, selector: string): string => {
  const start = css.indexOf(`${selector}`)
  return css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
}

describe('createTheme', () => {
  it('scopes the theme to its attribute inside the theme layer', () => {
    const { name, css } = createTheme({ name: 'brand' })
    expect(name).toBe('brand')
    expect(css.startsWith(LAYER_ORDER)).toBe(true)
    expect(css).toContain('@layer greese.theme {')
  })

  it('is complete: declares every token, so themes never depend on ancestors', () => {
    const { css } = createTheme({ name: 'brand' })
    const base = rule(css, `  ${T} {`)
    const tokenCount =
      Object.keys(color).length +
      Object.values(scalarTokens).reduce((n, group) => n + Object.keys(group).length, 0)
    expect(base.match(/^\s*--greese-[\w-]+:/gm)).toHaveLength(tokenCount)
  })

  it('derives a readable content color and a strong shade from a brand color', () => {
    const { css } = createTheme({
      name: 'brand',
      color: { primary: { light: '#fde047', dark: '#1e3a8a' } },
    })
    const light = rule(css, `  ${T} {`)
    const dark = rule(css, `${T}[data-greese-scheme='dark']`)
    // Yellow wants dark ink; deep blue wants white.
    expect(light).toContain(`--greese-color-primary-content: ${CONTENT_DARK};`)
    expect(dark).toContain(`--greese-color-primary-content: ${CONTENT_LIGHT};`)
    expect(light).toContain(
      '--greese-color-primary-strong: color-mix(in oklab, var(--greese-color-primary) 80%, #000);'
    )
    expect(dark).toContain(
      '--greese-color-primary-strong: color-mix(in oklab, var(--greese-color-primary) 70%, #fff);'
    )
    // The accent is a color of its own now: setting primary leaves it be.
    expect(light).toContain(`--greese-color-accent: ${color.accent.light};`)
  })

  it('keeps what the theme sets, and defaults for colors it cannot measure', () => {
    const own = deriveColors({ accent: '#0f766e', accentContent: '#ffff00' })
    expect(own.accentContent).toBe('#ffff00')
    const unmeasured = deriveColors({ secondary: 'oklch(60% 0.2 300)' })
    expect(unmeasured.secondaryContent).toEqual(color.secondaryContent)
    expect(deriveColors({ negative: '#facc15' }).negativeContent).toEqual({
      light: CONTENT_DARK,
      dark: CONTENT_DARK,
    })
  })

  it('meets WCAG AA for every default content color, and any derived one', () => {
    for (const role of [
      'primary',
      'secondary',
      'tertiary',
      'accent',
      'negative',
    ] as const) {
      for (const scheme of ['light', 'dark'] as const) {
        const ratio = contrastRatio(color[role][scheme], color[`${role}Content`][scheme])
        expect(ratio, `${role} ${scheme}`).toBeGreaterThanOrEqual(AA)
      }
    }
    // A sweep of greys and hues, the mid-tones near the crossover included.
    for (let v = 0; v <= 255; v += 5) {
      for (const hex of [v, (v * 7) % 256, (v * 13) % 256].map((c) =>
        c.toString(16).padStart(2, '0')
      )) {
        const sample = `#${hex}${hex}${hex.split('').reverse().join('')}`
        expect(
          contrastRatio(sample, contentColor(sample)!),
          sample
        ).toBeGreaterThanOrEqual(AA)
      }
    }
  })

  it('applies light/dark overrides to the matching scheme rules', () => {
    const { css } = createTheme({
      name: 'brand',
      color: { accent: { light: '#7c3aed', dark: '#c4b5fd' } },
    })
    expect(rule(css, `  ${T} {`)).toContain('--greese-color-accent: #7c3aed;')
    expect(rule(css, `${T}:not([data-greese-scheme='light'])`)).toContain(
      '--greese-color-accent: #c4b5fd;'
    )
    expect(rule(css, `${T}[data-greese-scheme='dark']`)).toContain(
      '--greese-color-accent: #c4b5fd;'
    )
    expect(rule(css, `:root[data-greese-scheme='light'] ${T}`)).toContain(
      '--greese-color-accent: #7c3aed;'
    )
    // Untouched roles keep their defaults per scheme.
    expect(rule(css, `${T}[data-greese-scheme='dark']`)).toContain(
      `--greese-color-canvas: ${color.canvas.dark};`
    )
  })

  it('uses a single color value for both schemes', () => {
    const { css } = createTheme({ name: 'brand', color: { surface: '#fef3c7' } })
    expect(rule(css, `  ${T} {`)).toContain('--greese-color-surface: #fef3c7;')
    expect(rule(css, `${T}[data-greese-scheme='dark']`)).toContain(
      '--greese-color-surface: #fef3c7;'
    )
  })

  it('maps camelCase groups and keys to kebab-case properties', () => {
    const { css } = createTheme({
      name: 'brand',
      fontSize: { '2xl': '1.75rem' },
      space: { 4: '1.25rem' },
    })
    const base = rule(css, `  ${T} {`)
    expect(base).toContain('--greese-font-size-2xl: 1.75rem;')
    expect(base).toContain('--greese-space-4: 1.25rem;')
    expect(base).toContain('--greese-space-3: 0.75rem;')
  })

  it('collapses durations under reduced motion, overrides included', () => {
    const { css } = createTheme({ name: 'brand', duration: { normal: '400ms' } })
    expect(rule(css, `  ${T} {`)).toContain('--greese-duration-normal: 400ms;')
    expect(css).toMatch(
      /prefers-reduced-motion: reduce\) \{\n\s+\[data-greese-theme='brand'\] \{\n\s+--greese-duration-fast: 0\.01ms;/
    )
  })

  it.each(['', '1brand', 'has space', "x']{}"])('rejects the name %j', (name) => {
    expect(() => createTheme({ name })).toThrow(/name must match/)
  })

  it.each(['red; color: blue', '}', '</style>', '{'])('rejects the value %j', (value) => {
    expect(() => createTheme({ name: 'x', color: { accent: value } })).toThrow(
      /invalid value/
    )
  })
})

describe('createTheme: extend', () => {
  it('declares new tokens, a color in both schemes', () => {
    const { css } = createTheme({
      name: 'ext',
      extend: {
        color: { 'brand-ink': { light: '#1b1340', dark: '#e5defc' }, flat: '#123456' },
        space: { 9: '4rem' },
        fontSize: { '5xl': '3rem' },
      },
    })
    expect(css).toContain('--greese-space-9: 4rem;')
    expect(css).toContain('--greese-font-size-5xl: 3rem;')
    expect(css).toContain('--greese-color-brand-ink: #1b1340;')
    expect(css).toContain('--greese-color-brand-ink: #e5defc;')
    expect(css).toContain('--greese-color-flat: #123456;')
  })

  it('refuses names that exist, unknown groups and unsafe values', () => {
    expect(() =>
      createTheme({ name: 'a', extend: { color: { fgMuted: '#000' } } })
    ).toThrow(/invalid or already exists/)
    expect(() => createTheme({ name: 'a', extend: { radius: { md: '1px' } } })).toThrow(
      /invalid or already exists/
    )
    expect(() =>
      createTheme({ name: 'a', extend: { colr: { x: 'red' } } as never })
    ).toThrow(/no token group colr/)
    expect(() => createTheme({ name: 'a', extend: { shadow: { x: 'red; }' } } })).toThrow(
      /invalid value/
    )
  })
})
