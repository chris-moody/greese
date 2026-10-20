import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { specToScss, validateSpec, type ThemeSpec } from '../src/spec.ts'
import { compileSpec, themeFiles } from './studio.ts'

const spec: ThemeSpec = {
  tokens: {
    color: { accent: { light: '#7c3aed', dark: '#c4b5fd' }, 'accent-content': '#fff' },
    space: { '4': '1.25rem' },
    font: { body: "'Inter', system-ui, sans-serif" },
  },
  motionDefaults: { duration: '0.3s' },
  components: {
    Card: { motion: { enter: 'fade-up', distance: '2rem' } },
    Button: {
      styles: { 'font-weight': '700' },
      vars: { 'button-tone': 'var(--greese-color-positive)' },
      modifiers: { outline: { 'border-width': '2px' } },
      parts: { icon: { opacity: '0.8' } },
      motion: { durations: { fast: '80ms' } },
    },
  },
}

describe('specToScss', () => {
  it('writes readable kit calls, components sorted', () => {
    const scss = specToScss(spec)
    expect(scss).toContain("@use 'pkg:@greese-ui/react/scss/kit' as greese;")
    expect(scss).toContain('accent: (light: "#7c3aed", dark: "#c4b5fd"),')
    expect(scss).toContain(`'4': "1.25rem",`)
    expect(scss).toContain(
      '@include greese.component(Button) {\n  font-weight: 700;\n  @include greese.vars('
    )
    expect(scss).toContain(
      '@include greese.modifier(outline) {\n    border-width: 2px;\n  }'
    )
    expect(scss.indexOf('component(Button)')).toBeLessThan(
      scss.indexOf('component(Card)')
    )
  })

  it('wraps a named theme', () => {
    expect(specToScss({ ...spec, name: 'brand' })).toContain(
      '@include greese.theme(brand) {\n  @include greese.tokens('
    )
  })

  it('leaves out empty values, so a cleared field disappears', () => {
    const scss = specToScss({
      components: { Card: { styles: { padding: '' }, motion: { enter: '' } } },
      tokens: { radius: { md: '' } },
    })
    expect(scss).not.toContain('component(Card)')
    expect(scss).not.toContain('tokens(')
  })
})

describe('validateSpec', () => {
  it('refuses values that could escape a declaration', () => {
    expect(
      validateSpec({ components: { Card: { styles: { color: 'red; } body { x: y' } } } })
    ).toEqual([expect.stringMatching(/Card styles color/)])
    expect(validateSpec({ components: { 'bad name': {} } })).toHaveLength(1)
    expect(validateSpec({ name: 'Brand!' })).toHaveLength(1)
  })
})

describe('compileSpec', () => {
  it('compiles through the kit into layered CSS', () => {
    const result = compileSpec(spec)
    if ('errors' in result) throw new Error(result.errors.join('\n'))
    expect(result.css).toContain('@layer greese.theme')
    expect(result.css).toContain('--greese-space-4: 1.25rem;')
    expect(result.css).toContain("--greese-font-body: 'Inter', system-ui, sans-serif;")
    expect(result.css).toContain('.greese-Button .greese-Button-icon {')
    expect(result.css).toContain('animation: greese-fade-up')
  })

  it('compiles palette names to their colours', () => {
    const result = compileSpec({
      tokens: { color: { primary: { light: 'lavender-600', dark: 'lavender-300' } } },
      components: { Badge: { vars: { tone: 'ruby-500' } } },
    })
    if ('errors' in result) throw new Error(result.errors.join('\n'))
    expect(result.css).toContain('--greese-color-primary: #7e5bd0;')
    expect(result.css).toContain('--greese-color-primary: #cdbfff;')
    expect(result.css).toContain('--greese-badge-tone: #f94b72;')
  })

  it('reports the kit’s errors instead of throwing', () => {
    const result = compileSpec({ components: { Buton: { styles: { color: 'red' } } } })
    expect(result).toEqual({ errors: [expect.stringMatching(/no component `Buton`/)] })
  })

  it('compiles the example theme', () => {
    const example = JSON.parse(
      readFileSync(themeFiles(undefined).json, 'utf8')
    ) as ThemeSpec
    expect(compileSpec(example)).not.toHaveProperty('errors')
  })
})

describe('themeFiles', () => {
  it('writes the SCSS and CSS next to the JSON', () => {
    expect(themeFiles('styles/brand.json', '/app')).toEqual({
      json: '/app/styles/brand.json',
      scss: '/app/styles/brand.scss',
      css: '/app/styles/brand.css',
    })
  })
})
