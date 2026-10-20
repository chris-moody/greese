// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { compileString, NodePackageImporter } from 'sass-embedded'
import { describe, expect, it } from 'vitest'
import { resolveResponsive, responsiveVar, isSpaceToken } from './responsive.ts'

/** The SCSS mixin lives in @greese/ui; this checks it against the resolver here. */
const STYLES = fileURLToPath(new URL('../../../ui/src/styles/', import.meta.url))

const compile = (scss: string): string =>
  compileString(`@use 'mixins';\n${scss}`, {
    loadPaths: [STYLES],
    importers: [new NodePackageImporter()],
  }).css

describe('responsive-prop mixin', () => {
  const css = compile(`
    @include mixins.responsive-prop('greese-Test', 'gap', gap, mixins.space-tokens());
    @include mixins.responsive-prop('greese-Test', 'direction', flex-direction, (row: row, column: column));
  `)

  it('sets the property directly, xs with no media query', () => {
    expect(css).toMatch(/^\.greese-Test--xs-gap-2 \{\s+gap: var\(--greese-space-2\);/m)
    expect(css).toMatch(
      /@media \(width >= 900px\) \{[^@]*\.greese-Test--md-gap-2 \{\s+gap: var\(--greese-space-2\);/
    )
  })

  it('emits breakpoints smallest first, so source order is the mobile-first fallback', () => {
    const at = ['xs', 'sm', 'md', 'lg', 'xl'].map((bp) =>
      css.indexOf(`.greese-Test--${bp}-gap-2 {`)
    )
    expect(at.every((i) => i >= 0)).toBe(true)
    expect([...at].sort((x, y) => x - y)).toEqual(at)
  })

  it('reads open-ended values from the breakpoint variable on a value class', () => {
    expect(css).toMatch(
      /@media \(width >= 900px\) \{[^@]*\.greese-Test--md-gap \{\s+gap: var\(--greese-test-gap-md\);/
    )
  })

  it('has no uses class, no fallback chain and nothing to register', () => {
    expect(css).not.toMatch(/\.greese-Test--gap \{/)
    expect(css).not.toContain('var(--greese-test-gap-md, ')
    expect(css).not.toContain('@property')
    // An unset prop never touches the element: nothing hangs off the block class.
    expect(css).not.toMatch(/^\.greese-Test \{/m)
  })

  it('generates every class resolveResponsive can produce', () => {
    const { className } = resolveResponsive([
      [
        { xs: 0, sm: 1, md: '13px', lg: 8, xl: 3 },
        { block: 'greese-Test', prop: 'gap', isToken: isSpaceToken },
      ],
      [
        { xs: 'row', xl: 'column' },
        { block: 'greese-Test', prop: 'direction' },
      ],
    ])
    for (const cls of className.split(' ')) expect(css).toContain(`.${cls} {`)
    expect(responsiveVar('greese-Test', 'gap', 'md')).toBe('--greese-test-gap-md')
  })
})

describe('responsive-prop options', () => {
  it('wraps values in a template', () => {
    const css =
      compile(`@include mixins.responsive-prop('greese-T', 'min', grid-template-columns,
      $template: 'repeat(auto-fill, minmax(min(VALUE, 100%), 1fr))');`)
    expect(css).toContain(
      'grid-template-columns: repeat(auto-fill, minmax(min(var(--greese-t-min-xs), 100%), 1fr));'
    )
  })

  it('adds container-query variants under a scope, winning by specificity', () => {
    const css = compile(`@include mixins.responsive-prop('greese-I', 'span', grid-column,
      (2: span 2), $container-scope: '.greese-G--container >');`)
    expect(css).toContain(
      '.greese-G--container > .greese-I--xs-span-2 {\n  grid-column: span 2;'
    )
    expect(css).toMatch(
      /@container \(width >= 900px\) \{[^@]*\.greese-G--container > \.greese-I--md-span \{\s+grid-column: var\(--greese-i-span-md\);/
    )
    // The viewport variant is still there for grids that are not containers.
    expect(css).toMatch(/@media \(width >= 900px\) \{[^@]*\.greese-I--md-span-2 \{/)
  })
})

describe('down mixin', () => {
  it('emits a max-range query and rejects xs', () => {
    expect(compile('.a { @include mixins.down(md) { color: red; } }')).toContain(
      '@media (width < 900px)'
    )
    expect(() => compile('.a { @include mixins.down(xs) { color: red; } }')).toThrow(
      /down\(\) needs a breakpoint above xs/
    )
  })
})

describe('up mixin', () => {
  it('emits no media query for xs and a range query otherwise', () => {
    const css = compile(`
      .a { @include mixins.up(xs) { color: red; } }
      .b { @include mixins.up(lg) { color: red; } }
    `)
    expect(css).toMatch(/^\.a \{\s+color: red;/m)
    expect(css).toContain('@media (width >= 1200px)')
  })

  it('fails the build on an unknown breakpoint', () => {
    expect(() => compile('.a { @include mixins.up(xxl) { color: red; } }')).toThrow(
      /Unknown breakpoint `xxl`/
    )
  })
})

describe('configurable breakpoints', () => {
  const load = (config: string) =>
    compileString(`@use 'index' with (${config});`, {
      loadPaths: [STYLES],
      importers: [new NodePackageImporter()],
    }).css

  it('recompiles every component with custom values', () => {
    const css = load(
      '$breakpoints: (xs: 0px, sm: 480px, md: 768px, lg: 1024px, xl: 1440px)'
    )
    expect(css).toContain('@media (width >= 768px)')
    expect(css).not.toContain('@media (width >= 900px)')
  })

  it('rejects renamed or missing keys', () => {
    expect(() => load('$breakpoints: (xs: 0px, tablet: 700px)')).toThrow(
      /must keep the keys/
    )
  })
})
