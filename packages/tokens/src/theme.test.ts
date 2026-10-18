import { describe, expect, it } from 'vitest'
import { LAYER_ORDER } from './css.ts'
import { createTheme } from './theme.ts'
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
    expect(base.match(/--greese-/g)).toHaveLength(tokenCount)
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

  it('uses a single colour value for both schemes', () => {
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
