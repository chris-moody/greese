import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { specToScss, validateSpec, type ThemeSpec } from '../src/spec.ts'
import { importCss } from '../src/importer.ts'
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
    expect(scss).toContain("@use 'pkg:@greese/ui/scss/kit' as greese;")
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

  it('compiles palette names to their colors', () => {
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

describe('new tokens', () => {
  const spec: ThemeSpec = {
    tokens: {
      color: {
        'brand-ink': { light: '#1b1340', dark: '#e5defc' },
        primary: { light: 'lavender-600', dark: 'lavender-300' },
      },
      space: { '9': '4rem' },
      'line-height': { loose: '2' },
    },
    components: {},
  }

  it('writes them as $extend and keeps overrides as overrides', () => {
    const scss = specToScss(spec)
    expect(scss).toContain('$extend: (')
    expect(scss).toMatch(/color: \(\s+primary: \(light: "lavender-600"/)
    expect(scss).toMatch(/\$extend: \(\s+color: \(\s+brand-ink:/)
    expect(scss).toContain('\'9\': "4rem"')
  })

  it('compiles through the real kit, and an existing name is never extended', () => {
    const result = compileSpec(spec)
    expect(result).not.toHaveProperty('errors')
    const css = (result as { css: string }).css
    expect(css).toContain('--greese-space-9: 4rem;')
    expect(css).toContain('--greese-color-brand-ink: #1b1340;')
    expect(css).toContain('--greese-line-height-loose: 2;')
    // An unknown group still reaches the kit, which reports it.
    expect(compileSpec({ tokens: { colr: { x: 'red' } }, components: {} })).toEqual({
      errors: [expect.stringMatching(/no token group `colr`/)],
    })
  })

  it('imports them back from the compiled CSS', () => {
    const css = (compileSpec(spec) as { css: string }).css
    const back = importCss(css).spec
    expect(back.tokens?.space?.['9']).toBe('4rem')
    expect(back.tokens?.['line-height']?.loose).toBe('2')
    expect(back.tokens?.color?.['brand-ink']).toEqual({
      light: '#1b1340',
      dark: '#e5defc',
    })
  })
})

describe('typography', () => {
  const spec: ThemeSpec = {
    tokens: {},
    components: {},
    typography: {
      h1: { base: { size: '2rem' }, lg: { size: '4rem', tracking: '-0.03em' } },
      caption: { base: { transform: 'uppercase' } },
    },
  }

  it('writes the kit call', () => {
    const scss = specToScss(spec)
    expect(scss).toContain('@include greese.typography(')
    expect(scss).toMatch(/h1: \(\s+base: \(\s+size: "2rem"/)
    expect(scss).toMatch(/lg: \(\s+size: "4rem",\s+tracking: "-0.03em"/)
  })

  it('compiles through the real kit', () => {
    const result = compileSpec(spec)
    expect(result).not.toHaveProperty('errors')
    const css = (result as { css: string }).css
    expect(css).toContain('--greese-type-h1-size: 2rem;')
    expect(css).toMatch(/@media \(width >= 1200px\)[^@]*--greese-type-h1-size: 4rem;/)
    expect(css).toContain('--greese-type-caption-transform: uppercase;')
  })

  it('reports unknown variants and properties from the kit', () => {
    expect(compileSpec({ typography: { h9: { base: { size: '1rem' } } } })).toEqual({
      errors: [expect.stringMatching(/no type variant `h9`/)],
    })
    expect(compileSpec({ typography: { h1: { base: { colour: 'red' } } } })).toEqual({
      errors: [expect.stringMatching(/no type property `colour`/)],
    })
  })

  it('imports it back, leaving out the defaults a complete theme repeats', () => {
    const css = (compileSpec({ ...spec, name: 'brand' }) as { css: string }).css
    const back = importCss(css)
    expect(back.skipped).toEqual([])
    expect(back.spec.typography?.h1?.base).toEqual({ size: '2rem' })
    expect(back.spec.typography?.h1?.lg).toEqual({ size: '4rem', tracking: '-0.03em' })
    expect(back.spec.typography?.caption?.base).toEqual({ transform: 'uppercase' })
    // Everything else in h1 and the other variants is the default.
    expect(back.spec.typography?.h2).toBeUndefined()
    expect(back.spec.typography?.h1?.md).toBeUndefined()
  })

  it('reads createTheme() output as just its changes', async () => {
    const { createTheme } = await import('@greese/ui')
    const theme = createTheme({
      name: 'brand',
      typography: { h3: { md: { size: '2.5rem' } } },
    })
    const back = importCss(theme.css)
    expect(back.skipped).toEqual([])
    expect(back.spec.typography).toEqual({ h3: { md: { size: '2.5rem' } } })
  })
})

describe('breakpoints', () => {
  const bp = { xs: 0, sm: 480, tablet: 700, md: 800, lg: 1100, xl: 1500 }
  const spec: ThemeSpec = { breakpoints: bp, tokens: {}, components: {} }

  it('writes the stylesheet build ahead of the kit', () => {
    const scss = specToScss(spec)
    expect(scss).toContain(
      "@use 'pkg:@greese/ui/scss' with ($breakpoints: (xs: 0px, sm: 480px, tablet: 700px, md: 800px, lg: 1100px, xl: 1500px));"
    )
    expect(scss).toContain("@use 'pkg:@greese/ui/scss/kit' as greese;")
    expect(specToScss(spec, 'x.json', 'config')).toContain(
      "pkg:@greese/ui/scss/config' with"
    )
    expect(specToScss({ ...spec, breakpoints: undefined })).not.toContain('with (')
    // Breakpoints equal to the defaults are no change.
    expect(
      specToScss({
        ...spec,
        breakpoints: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
      })
    ).not.toContain('$breakpoints')
  })

  it('compiles the whole stylesheet for them, theme included', () => {
    const result = compileSpec({
      ...spec,
      tokens: { radius: { md: '2px' } },
    })
    expect(result).not.toHaveProperty('errors')
    const { css, full } = result as { css: string; full?: boolean }
    expect(full).toBe(true)
    expect(css).toContain('--greese-breakpoint-tablet: 700px;')
    expect(css).toContain('.greese-Stack--tablet-gap-3')
    expect(css).toContain('@media (width >= 800px)')
    expect(css).not.toContain('@media (width >= 900px)')
    expect(css).toContain('--greese-radius-md: 2px;')
    // Typography follows them too.
    expect(css).toMatch(/@media \(width >= 800px\)[^@]*--greese-type-h1-size: 2\.75rem/)
  })

  it('rejects breakpoints that components or the cascade can’t use', () => {
    const errors = (b: Record<string, number>) => validateSpec({ breakpoints: b })
    expect(errors({ xs: 0, sm: 600 }).join()).toMatch(/md is needed/)
    expect(errors({ ...bp, xs: 10 }).join()).toMatch(/xs: must be 0/)
    expect(errors({ ...bp, 'big-one': 1600 }).join()).toMatch(/one word/)
    expect(errors({ ...bp, tablet: 800 }).join()).toMatch(/own width/)
    expect(errors(bp)).toEqual([])
  })
})
