// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { compileString, NodePackageImporter } from 'sass-embedded'
import { describe, expect, it } from 'vitest'
import { resolveResponsive, responsiveVar, isSpaceToken } from '../utils/responsive.ts'

const compile = (scss: string): string =>
  compileString(`@use 'mixins';\n${scss}`, {
    loadPaths: [fileURLToPath(new URL('.', import.meta.url))],
    importers: [new NodePackageImporter()],
  }).css

describe('responsive-prop mixin', () => {
  const css = compile(`
    @include mixins.responsive-prop('greese-Test', 'gap', gap, mixins.space-tokens());
    @include mixins.responsive-prop('greese-Test', 'direction', flex-direction, (row: row, column: column), column);
  `)

  it('hangs everything off the uses class, never the block class', () => {
    expect(css).not.toMatch(/^\.greese-Test \{/m)
    expect(css).toMatch(/^\.greese-Test--gap \{/m)
  })

  it('registers every breakpoint variable as non-inheriting, so nested instances never leak', () => {
    for (const bp of ['xs', 'sm', 'md', 'lg', 'xl']) {
      expect(css).toContain(
        `@property ${responsiveVar('greese-Test', 'gap', bp as 'xs')} {\n  syntax: "*";\n  inherits: false;\n}`
      )
    }
    expect(css).not.toContain(': initial;')
  })

  it('reads a mobile-first fallback chain, with the fallback at the end', () => {
    expect(css).toContain('gap: var(--greese-test-gap-xs);')
    expect(css).toContain(
      'flex-direction: var(--greese-test-direction-md, var(--greese-test-direction-sm, var(--greese-test-direction-xs, column)));'
    )
    expect(css).toMatch(
      /@media \(width >= 900px\) \{\s+\.greese-Test--gap \{\s+gap: var\(--greese-test-gap-md,/
    )
  })

  it('token classes set the variable, never the property', () => {
    expect(css).toContain(
      '.greese-Test--md-gap-2 {\n  --greese-test-gap-md: var(--greese-space-2);\n}'
    )
    expect(css).not.toMatch(/\.greese-Test--[a-z]+-gap-\d+ \{\s+gap:/)
  })

  it('generates every class resolveResponsive can produce', () => {
    const { className } = resolveResponsive([
      [
        { xs: 0, sm: 1, md: 4, lg: 8, xl: 3 },
        { block: 'greese-Test', prop: 'gap', isToken: isSpaceToken },
      ],
      [
        { xs: 'row', xl: 'column' },
        { block: 'greese-Test', prop: 'direction' },
      ],
    ])
    for (const cls of className.split(' ')) expect(css).toContain(`.${cls} {`)
  })
})

describe('responsive-prop options', () => {
  it('wraps the chain in a template', () => {
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
      '.greese-G--container > .greese-I--span {\n  grid-column: var(--greese-i-span-xs);'
    )
    expect(css).toMatch(
      /@container \(width >= 900px\) \{\s+\.greese-G--container > \.greese-I--span \{\s+grid-column: var\(--greese-i-span-md,/
    )
    // The viewport variant is still there for grids that are not containers.
    expect(css).toMatch(/@media \(width >= 900px\) \{\s+\.greese-I--span \{/)
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
      loadPaths: [fileURLToPath(new URL('.', import.meta.url))],
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
