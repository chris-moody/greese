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
    @include mixins.responsive-prop('sauce-Test', 'gap', gap, mixins.space-tokens());
    @include mixins.responsive-prop('sauce-Test', 'direction', flex-direction, (row: row, column: column), column);
  `)

  it('resets every breakpoint variable on the block so nested instances never inherit', () => {
    for (const bp of ['xs', 'sm', 'md', 'lg', 'xl']) {
      expect(css).toContain(`${responsiveVar('sauce-Test', 'gap', bp as 'xs')}: initial;`)
    }
  })

  it('reads a mobile-first fallback chain, with the fallback at the end', () => {
    expect(css).toContain('gap: var(--sauce-test-gap-xs);')
    expect(css).toContain(
      'flex-direction: var(--sauce-test-direction-md, var(--sauce-test-direction-sm, var(--sauce-test-direction-xs, column)));'
    )
    expect(css).toMatch(
      /@media \(width >= 900px\) \{\s+\.sauce-Test \{\s+gap: var\(--sauce-test-gap-md,/
    )
  })

  it('token classes set the variable, never the property', () => {
    expect(css).toContain(
      '.sauce-Test--md-gap-2 {\n  --sauce-test-gap-md: var(--sauce-space-2);\n}'
    )
    expect(css).not.toMatch(/\.sauce-Test--[a-z]+-gap-\d+ \{\s+gap:/)
  })

  it('generates every class resolveResponsive can produce', () => {
    const { className } = resolveResponsive([
      [
        { xs: 0, sm: 1, md: 4, lg: 8, xl: 3 },
        { block: 'sauce-Test', prop: 'gap', isToken: isSpaceToken },
      ],
      [
        { xs: 'row', xl: 'column' },
        { block: 'sauce-Test', prop: 'direction' },
      ],
    ])
    for (const cls of className.split(' ')) expect(css).toContain(`.${cls} {`)
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
