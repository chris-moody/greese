import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTheme, scalarTokens } from '@greese/ui'
import {
  detectFormat,
  importCss,
  importJson,
  mergeSpecs,
  parseCss,
} from '../src/studio/importer.ts'
import { MOTIONS, motionOnlySpec } from '../src/studio/motions.ts'
import { applyShape, SHAPES } from '../src/studio/shapes.ts'
import type { ThemeSpec } from '../src/studio/spec.ts'
import { compileSpec, importTheme } from './studio.ts'

const css = (spec: ThemeSpec) => {
  const result = compileSpec(spec)
  if ('errors' in result) throw new Error(result.errors.join('\n'))
  return result.css
}

const rich: ThemeSpec = {
  tokens: {
    color: {
      accent: { light: '#7c3aed', dark: '#c4b5fd' },
      'accent-content': '#fff',
    },
    radius: { md: '12px' },
    font: { body: "'Inter', system-ui, sans-serif" },
    space: { '4': '1.25rem' },
    duration: { fast: '90ms' },
  },
  motionDefaults: { duration: '0.3s', ease: 'in-out' },
  components: {
    Button: {
      styles: { 'font-weight': '700' },
      vars: {
        'button-tone': 'var(--greese-color-positive)',
        'button-on-tone': { light: 'white', dark: 'black' },
      },
      modifiers: { outline: { 'border-width': '2px' } },
      parts: { icon: { opacity: '0.8' } },
      motion: { durations: { fast: '80ms' }, easings: { standard: 'linear' } },
    },
    Card: {
      motion: { enter: 'fade-up', duration: '0.4s', distance: '2rem', ease: 'in' },
    },
    Dialog: { motion: { exit: 'scale-out' } },
    Tooltip: { motion: { keyframes: 'my-wobble', delay: '0.1s' } },
  },
}

describe('importCss: round trip through the kit', () => {
  it('reads back everything the studio wrote, page theme', () => {
    const result = importCss(css(rich))
    expect(result.spec).toEqual(rich)
    expect(result.skipped).toEqual([])
    expect(result.counts).toEqual({ tokens: 6, components: 4, motion: 6 })
  })

  it('reads back a named theme, leaving out the defaults it repeats', () => {
    const named = { ...rich, name: 'brand' }
    const result = importCss(css(named))
    expect(result.themes).toEqual(['brand'])
    expect(result.spec).toEqual(named)
  })
})

describe('importCss: theme layers', () => {
  it.each(MOTIONS.map((m) => [m.id, m] as const))(
    'reads back the %s motion theme as its role assignments',
    (_id, preset) => {
      const result = importCss(css(motionOnlySpec(preset)))
      expect(result.spec.motionDefaults).toEqual(preset.defaults)
      expect(result.skipped).toEqual([])
    }
  )

  it.each(SHAPES.map((p) => [p.id, p] as const))(
    'reads back the %s shape theme’s radius roles',
    (_id, preset) => {
      const result = importCss(css(applyShape({}, preset)))
      // Roles the theme leaves at the library's own are left out, as every default is.
      expect({ ...scalarTokens.corner, ...result.spec.tokens?.corner }).toEqual(preset.corner)
    }
  )
})

describe('importCss: other sources', () => {
  it('imports createTheme() output as just its overrides', () => {
    const theme = createTheme({
      name: 'brand',
      color: { accent: { light: '#0f766e', dark: '#5eead4' }, accentContent: '#ffffff' },
      radius: { md: '2px' },
      lineHeight: { tight: '1.1' },
    })
    const { spec, skipped } = importCss(theme.css)
    expect(skipped).toEqual([])
    expect(spec).toEqual({
      name: 'brand',
      tokens: {
        // One value for both schemes: the dark default (#11171c) changes too.
        color: {
          accent: { light: '#0f766e', dark: '#5eead4' },
          'accent-content': '#ffffff',
        },
        radius: { md: '2px' },
        'line-height': { tight: '1.1' },
      },
      components: {},
    })
  })

  it('imports hand-written overrides, as the Theming guide writes them', () => {
    const { spec } = importCss(`
      :root { --greese-radius-md: 12px; }
      :root, [data-greese-scheme='light'], [data-greese-scheme='system'] {
        --greese-color-accent: #7c3aed;
      }
      @media (prefers-color-scheme: dark) {
        :root:not([data-greese-scheme='light']), [data-greese-scheme='system'] {
          --greese-color-accent: #c4b5fd;
        }
      }
      [data-greese-scheme='dark'] { --greese-color-accent: #c4b5fd; }
      .danger-zone .greese-Button { --greese-button-tone: red; }
      .greese-Card { box-shadow: var(--greese-shadow-lg); }
      /* nesting works too */
      .greese-Button { &.greese-Button--outline { border-width: 2px; } }
    `)
    expect(spec.tokens).toEqual({
      radius: { md: '12px' },
      color: { accent: { light: '#7c3aed', dark: '#c4b5fd' } },
    })
    expect(spec.components).toEqual({
      Card: { styles: { 'box-shadow': 'var(--greese-shadow-lg)' } },
      Button: { modifiers: { outline: { 'border-width': '2px' } } },
    })
  })

  it('reports what the studio can’t hold, with its CSS, instead of dropping it', () => {
    const { skipped, spec } = importCss(`
      @media (width >= 900px) { .greese-Card { padding: 2rem; } }
      @media (hover: hover) { .greese-Button:hover { translate: 0 -1px; } }
      .greese-Buton { color: red; }
      .greese-Button--huge { color: red; }
      :root { font-size: 18px; --greese-color-accent: teal; }
      [data-greese-theme='brand'] { --greese-radius-md: 0; }
      [data-greese-theme='other'] { --greese-radius-md: 9px; }
    `)
    expect(skipped.map((s) => s.reason)).toEqual([
      'inside @media (width >= 900px): the studio has no responsive or conditional rules',
      'inside @media (hover: hover): the studio has no responsive or conditional rules',
      'no component Buton',
      'Button has no modifier huge',
      'page-level CSS, not a token',
      'belongs to theme "other"',
    ])
    expect(skipped[4]!.css).toBe(':root {\n  font-size: 18px;\n}')
    expect(skipped[1]!.css).toContain('@media (hover: hover) {\n.greese-Button:hover {')
    // The first theme found is the one imported.
    expect(spec.name).toBe('brand')
    expect(spec.tokens).toEqual({ color: { accent: 'teal' }, radius: { md: '0' } })
  })

  it('takes the preferred theme when there are several', () => {
    const both = `${createTheme({ name: 'a', radius: { md: '1px' } }).css}
      ${createTheme({ name: 'b', radius: { md: '2px' } }).css}`
    const result = importCss(both, 'b')
    expect(result.themes).toEqual(['a', 'b'])
    expect(result.spec.tokens).toEqual({ radius: { md: '2px' } })
  })

  it('parses strings, nesting and at-rules', () => {
    expect(
      parseCss(`@layer x { .a { content: '}' ; b: url("a;b") } } .c, .d { e: f }`)
    ).toEqual([
      {
        selector: '.a',
        context: ['@layer x'],
        decls: [
          ['content', "'}'"],
          ['b', 'url("a;b")'],
        ],
      },
      { selector: '.c, .d', context: [], decls: [['e', 'f']] },
    ])
  })
})

describe('importJson', () => {
  it('takes a studio theme as it is', () => {
    expect(importJson({ name: 'x', components: { Card: {} } }).spec).toEqual({
      name: 'x',
      tokens: {},
      components: { Card: {} },
    })
  })

  it('takes createTheme() options, camelCase included', () => {
    const { spec, skipped } = importJson({
      name: 'brand',
      color: { accentContent: '#fff', nope: 'red' },
      lineHeight: { tight: '1.1' },
      wat: {},
    })
    expect(spec).toEqual({
      name: 'brand',
      tokens: { color: { 'accent-content': '#fff' }, 'line-height': { tight: '1.1' } },
      components: {},
    })
    expect(skipped.map((s) => s.where)).toEqual(['color.nope', 'wat'])
  })
})

describe('detectFormat', () => {
  it('goes by the extension, then the content', () => {
    expect(detectFormat('', 'theme.scss')).toBe('scss')
    expect(detectFormat('{"tokens":{}}')).toBe('json')
    expect(detectFormat("@use 'pkg:@greese/ui/scss/kit' as greese;")).toBe('scss')
    expect(detectFormat('$x: 1px;')).toBe('scss')
    expect(detectFormat(':root { --x: 1 }')).toBe('css')
  })
})

describe('mergeSpecs', () => {
  it('adds the import to the current theme, the import winning', () => {
    expect(
      mergeSpecs(
        {
          tokens: { radius: { md: '1px', lg: '2px' } },
          components: { Card: { styles: { a: '1' } } },
        },
        {
          tokens: { radius: { md: '9px' } },
          components: { Card: { styles: { b: '2' } } },
        }
      )
    ).toEqual({
      tokens: { radius: { md: '9px', lg: '2px' } },
      // Empty groups are pruned, so nothing like "vars": {} is saved.
      components: { Card: { styles: { a: '1', b: '2' } } },
    })
  })
})

describe('importTheme', () => {
  // Inside the app, so the fixtures resolve @greese packages like a project would.
  const root = join(dirname(fileURLToPath(import.meta.url)), '..', '.import-test')
  beforeAll(() => {
    mkdirSync(join(root, 'styles'), { recursive: true })
    writeFileSync(
      join(root, 'brand.ts'),
      `import { createTheme, scalarTokens } from '@greese/ui'
export const brand = createTheme({ name: 'brand', radius: { md: '3px' } })\n`
    )
    writeFileSync(
      join(root, 'options.mjs'),
      `export default { color: { accent: '#123456' } }\n`
    )
    writeFileSync(join(root, 'styles', '_vars.scss'), `$r: 5px;\n`)
    writeFileSync(
      join(root, 'styles', 'theme.scss'),
      `@use 'vars';
@use 'pkg:@greese/ui/scss/kit' as greese;
@include greese.tokens((radius: (md: vars.$r)));
@include greese.component(Card) { padding: 0; }\n`
    )
  })
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it('runs a module exporting createTheme() results', async () => {
    const result = await importTheme({ path: 'brand.ts' }, root)
    expect(result.spec).toEqual({
      name: 'brand',
      tokens: { radius: { md: '3px' } },
      components: {},
    })
  })

  it('reads createTheme() options from a module', async () => {
    const result = await importTheme({ path: 'options.mjs' }, root)
    expect(result.spec.tokens).toEqual({ color: { accent: '#123456' } })
  })

  it('compiles SCSS files with their own imports', async () => {
    const result = await importTheme({ path: 'styles/theme.scss' }, root)
    expect(result.spec).toEqual({
      tokens: { radius: { md: '5px' } },
      components: { Card: { styles: { padding: '0' } } },
    })
  })

  it('compiles pasted kit SCSS', async () => {
    const result = await importTheme(
      {
        text: `@use 'pkg:@greese/ui/scss/kit' as greese;
@include greese.component(Card) { @include greese.motion((enter: pop)); }`,
      },
      root
    )
    expect(result.spec.components).toEqual({ Card: { motion: { enter: 'pop' } } })
  })

  it('only reads files inside the project', async () => {
    await expect(importTheme({ path: '../package.json' }, root)).rejects.toThrow(
      /Only files inside/
    )
    await expect(importTheme({ path: 'missing.css' }, root)).rejects.toThrow(
      /No such file/
    )
  })
})
