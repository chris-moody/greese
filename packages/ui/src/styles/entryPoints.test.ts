import { join } from 'node:path'
import { compileString, NodePackageImporter } from 'sass-embedded'
import { describe, expect, it } from 'vitest'
import manifest from '../../package.json' with { type: 'json' }

/** The repository root (tests run from the package), where `@greese/ui` is installed as a project installs it. */
const ROOT = join(process.cwd(), '../..')

/** Compiles as a project does: by package URL, from outside the package. */
const compile = (scss: string): string =>
  compileString(scss, {
    importers: [new NodePackageImporter(ROOT)],
    url: new URL(`file://${ROOT}/theme.scss`),
  }).css

const AUTHORING = ['mixins', 'tones', 'floating', 'controls'] as const

describe('the SCSS entry points for theme authors (ADR 0021)', () => {
  it('are exported, and each compiles alone without writing CSS', () => {
    const exported = Object.keys(manifest.exports)
    for (const name of AUTHORING) {
      expect(exported, name).toContain(`./scss/${name}`)
      expect(compile(`@use 'pkg:@greese/ui/scss/${name}';`), name).toBe('')
    }
  })

  it('give a component’s own members, under the name its source uses', () => {
    const css = compile(`
@use 'pkg:@greese/ui/scss/mixins';
@use 'pkg:@greese/ui/scss/floating';
@use 'pkg:@greese/ui/scss/controls';
@use 'pkg:@greese/ui/scss/tones';
@use 'sass:list';
@use 'sass:map';
.a {
  @include mixins.focus-ring;
  @include mixins.up(md) { gap: 1px; }
  @include floating.surface;
  @include controls.frame;
  color: list.nth(map.get(tones.$tones, primary), 1);
}`)
    expect(css).toContain('@media (width >= 900px)')
    expect(css).toMatch(/\.a:focus-visible \{\s+outline: 2px solid/)
    expect(css).toContain('var(--greese-color-primary)')
  })

  it('are the modules the kit loads: a configured breakpoint reaches them', () => {
    const css = compile(`
@use 'pkg:@greese/ui/scss/config' with ($breakpoints: (xs: 0px, sm: 500px, md: 700px, lg: 1000px, xl: 1400px));
@use 'pkg:@greese/ui/scss/kit' as greese;
@use 'pkg:@greese/ui/scss/mixins';
.a { @include mixins.up(md) { gap: 1px; } }
.b { @include greese.up(md) { gap: 1px; } }`)
    expect(css.match(/@media \(width >= 700px\)/g)).toHaveLength(2)
    expect(css).not.toContain('900px')
  })

  it('hide what only the library’s own sheets can use', () => {
    expect(() =>
      compile(
        `@use 'pkg:@greese/ui/scss/mixins'; .a { @include mixins.responsive-prop('greese-A', p, padding); }`
      )
    ).toThrow(/Undefined mixin/)
    expect(() =>
      compile(`@use 'pkg:@greese/ui/scss/mixins'; .a { b: mixins.space-tokens(); }`)
    ).toThrow()
    expect(() =>
      compile(
        `@use 'pkg:@greese/ui/scss/tones'; .a { @include tones.classes('greese-A', tone); }`
      )
    ).toThrow(/Undefined mixin/)
  })
})
