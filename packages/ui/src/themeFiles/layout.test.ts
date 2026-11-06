// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { blocks, compileAsProject, compileFiles } from '../test/sass.ts'
import { LAYOUT_MARK, specToLayout, specToScss, type ThemeSpec } from './index.ts'

/** What each selector ends up declaring, by where it sits: later blocks win. */
const effective = (css: string) => {
  const out: Record<string, Record<string, string>> = {}
  for (const b of blocks(css)) {
    if (!b.declarations.length) continue
    const key = [...b.within, b.prelude].join(' > ')
    out[key] = { ...out[key], ...Object.fromEntries(b.declarations) }
  }
  return out
}

const rich: ThemeSpec = {
  tokens: {
    color: { accent: { light: '#7c3aed', dark: '#c4b5fd' }, 'brand-ink': '#1b1340' },
    radius: { md: '12px' },
    space: { '4': '1.25rem' },
    duration: { fast: '90ms' },
  },
  typography: { h1: { base: { fontSize: '2rem' }, lg: { fontSize: '3rem' } } },
  motionDefaults: { duration: '0.3s', content: 'fade-in' },
  pageRules: { 'header, footer': 'still' },
  effects: { wobble: { keyframes: { rotate: [0, 4, 0] } } },
  components: {
    Button: {
      styles: { 'font-weight': '700' },
      modifiers: { outline: { 'border-width': '2px' } },
      motion: { durations: { fast: '80ms' } },
      shape: 'notch',
    },
    Card: { motion: { enter: 'wobble' } },
    Popover: {
      scss: `@use 'pkg:@greese/ui/scss/floating';
@use 'pkg:@greese/ui/scss/mixins';
@mixin edge { border-width: 2px; }
@include floating.surface;
@include mixins.up(md) { @include edge; }`,
    },
    AccordionItem: { styles: { gap: '0' } },
  },
  shapes: {
    notch: {
      points: [
        { x: { pct: 0 }, y: { pct: 0 } },
        { x: { pct: 100 }, y: { pct: 0 } },
        { x: { pct: 100 }, y: { pct: 100 } },
        { x: { pct: 0 }, y: { pct: 100 } },
      ],
    },
  },
}

describe('specToLayout', () => {
  it.each([
    ['a named theme', { ...rich, name: 'brand' }],
    ['the page’s defaults', rich],
    [
      'custom breakpoints',
      {
        ...rich,
        name: 'brand',
        breakpoints: { xs: 0, sm: 480, md: 700, lg: 1024, xl: 1440 },
      },
    ],
  ])(
    'compiles %s to the CSS one file does',
    (_, spec) => {
      const files = specToLayout(spec)
      // One file doesn't build the utility classes; the layout does by default
      // with breakpoints of its own (fourth test).
      files['_settings.scss'] = files['_settings.scss']!.replace(
        '$utilities: $library;',
        '$utilities: false;'
      )
      const layout = compileFiles(files)
      expect(effective(layout)).toEqual(effective(compileAsProject(specToScss(spec))))
    },
    60_000
  )

  it('writes a module per component, token group and concern, loaded from main.scss', () => {
    const files = specToLayout({ ...rich, name: 'brand' })
    expect(Object.keys(files).sort()).toEqual([
      '_library.scss',
      '_resets.scss',
      '_settings.scss',
      'components/_accordion-item.scss',
      'components/_button.scss',
      'components/_card.scss',
      'components/_popover.scss',
      'main.scss',
      'motion/_index.scss',
      'shapes/_index.scss',
      // Every token group, set or not.
      'tokens/_color.scss',
      'tokens/_corner.scss',
      'tokens/_duration.scss',
      'tokens/_easing.scss',
      'tokens/_font-weight.scss',
      'tokens/_font.scss',
      'tokens/_index.scss',
      'tokens/_line-height.scss',
      'tokens/_radius.scss',
      'tokens/_shadow.scss',
      'tokens/_space.scss',
      'tokens/_typography.scss',
      'tokens/_z-index.scss',
      'utilities/_index.scss',
    ])
    expect(files['main.scss']).toMatch(
      /@use 'settings';\n@use 'library';\n@use 'resets';\n@use 'tokens';\n@use 'motion';\n@use 'components\/accordion-item';[\s\S]*@use 'shapes';\n@use 'utilities';\n$/
    )
    // The defaults a file leaves alone are there, commented.
    expect(files['tokens/_color.scss']).toMatch(/^ {4}\/\/ canvas: \(light: "#ffffff"/m)
    expect(files['tokens/_shadow.scss']).toMatch(/^ {4}\/\/ sm: "0 1px 2px/m)
    expect(files['tokens/_typography.scss']).toMatch(/^ {2}\/\/ h2: \($/m)
    expect(files['motion/_index.scss']).toContain('// theme: fade-up,')
    expect(files['_settings.scss']).toContain('$theme: brand;')
    expect(specToLayout(rich)['_settings.scss']).toContain('$theme: null;')
    // A component's own imports and helpers stay in its file.
    expect(files['components/_popover.scss']).toMatch(
      /@use 'pkg:@greese\/ui\/scss\/floating';\n@use 'pkg:@greese\/ui\/scss\/mixins';\n\n@mixin edge/
    )
    for (const text of Object.values(files))
      expect(text.startsWith(LAYOUT_MARK)).toBe(true)
  })

  it('builds the library and its utility classes with breakpoints of its own, from _settings.scss alone', () => {
    const files = specToLayout({ tokens: { radius: { md: '12px' } } })
    // The library's breakpoints: the theme alone.
    const plain = compileFiles(files)
    expect(plain).not.toContain('.greese-Button {')
    expect(plain).not.toContain('.md-p-4')
    // One value changed there: the whole stylesheet and its utilities follow.
    files['_settings.scss'] = files['_settings.scss']!.replace('md: 900px', 'md: 777px')
    const css = compileFiles(files)
    expect(css).toContain('.greese-Button')
    expect(css).toMatch(/@media \(width >= 777px\) \{[^@]*\.md-p-4 \{/)
    expect(css).not.toContain('900px')
    expect(css).toContain('--greese-breakpoint-md: 777px;')
    expect(css).toContain('--greese-breakpoint-keys: xs sm md lg xl;')
    // Without the utilities.
    files['_settings.scss'] = files['_settings.scss']!.replace(
      '$utilities: $library;',
      '$utilities: false;'
    )
    expect(compileFiles(files)).not.toContain('.md-p-4')
  }, 60_000)

  it('changes a default by uncommenting it', () => {
    const files = specToLayout({ name: 'brand' })
    expect(compileFiles(files)).not.toContain('--greese-shadow-sm')
    files['tokens/_shadow.scss'] = files['tokens/_shadow.scss']!.replace(
      '// sm: "0 1px 2px',
      'sm: "0 2px 4px'
    )
    files['tokens/_typography.scss'] = files['tokens/_typography.scss']!.replace(
      /\/\/ caption: \(\n {2}\/\/ {3}base: \(([^\n]*)\),\n {2}\/\/ \),/,
      'caption: (\n    base: ($1),\n  ),'
    )
    const css = compileFiles(files)
    expect(css).toMatch(
      /\[data-greese-theme=brand\][^{]*\{[^}]*--greese-shadow-sm: 0 2px 4px/
    )
    expect(css).toContain('--greese-type-caption-font-size: 0.75rem')
  }, 60_000)

  it('reads the shapes’ sizes from the map at the top of their file', () => {
    const spec: ThemeSpec = {
      ...rich,
      shapes: { notch: { ...rich.shapes!.notch!, params: { a: 10 }, hover: { a: 4 } } },
    }
    const files = specToLayout(spec)
    expect(files['shapes/_index.scss']).toMatch(
      /\$shapes: \(\n {2}"notch": \(\n {4}border: 1px,\n {4}params: \("a": 10px\),\n {4}hover: \("a": 4px\),/
    )
    expect(compileFiles(files)).toContain('--greese-shape-a: 10px')
    files['shapes/_index.scss'] = files['shapes/_index.scss']!.replace(
      'params: ("a": 10px)',
      'params: ("a": 14px)'
    )
    const css = compileFiles(files)
    expect(css).toContain('--greese-shape-a: 14px')
    expect(css).not.toContain('--greese-shape-a: 10px')
  }, 60_000)

  it('loads component files it doesn’t write', () => {
    const main = specToLayout(rich, 'x.json', {
      components: ['components/_hero.scss', 'components/_card.scss'],
    })['main.scss']!
    expect(main).toContain("@use 'components/hero';\n@use 'shapes';")
    expect(main.match(/components\/card/g)).toHaveLength(1)
  })

  it('compiles each component’s file on its own', () => {
    const files = specToLayout({ ...rich, name: 'brand' })
    const css = compileFiles(files, 'components/_button.scss')
    expect(css).toContain('[data-greese-theme=brand] .greese-Button')
    expect(css).not.toContain('greese-Card')
  })

  it('takes a theme layer back from a component with _resets.scss', () => {
    const files = specToLayout({ ...rich, name: 'brand' })
    files['_resets.scss'] += `
@include greese.scope(settings.$theme) {
  @include greese.component(Button) { @include greese.reset(shape); }
}`
    const css = compileFiles(files)
    expect(css).toMatch(
      /\.greese-Button:where\(:not\(\.greese-reset-shape[^{]*\):not\(\*\) \{\s*font-weight: 700/
    )
  })
})
