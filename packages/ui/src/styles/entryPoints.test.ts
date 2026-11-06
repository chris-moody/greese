// @vitest-environment node
import { describe, expect, it } from 'vitest'
import manifest from '../../package.json' with { type: 'json' }
import { compileAsProject, rules } from '../test/sass.ts'

const compile = compileAsProject

const AUTHORING = [
  'mixins',
  'tones',
  'floating',
  'controls',
  'slides',
  'utilities',
] as const

describe('the SCSS entry points for theme authors (ADR 0021)', () => {
  it('are exported, and each compiles alone without writing CSS', () => {
    const exported = Object.keys(manifest.exports)
    for (const name of AUTHORING) {
      expect(exported, name).toContain(`./scss/${name}`)
      expect(compile(`@use 'pkg:@greese/ui/scss/${name}';`), name).toBe('')
    }
  }, 30_000)

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
    expect(rules(css, '.a:focus-visible')[0]?.declarations).toContainEqual([
      'outline',
      expect.stringMatching(/^2px solid /),
    ])
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

describe('a build that picks its components (ADR 0034)', () => {
  it('compiles core and chosen components from their sources, with its own breakpoints', () => {
    const css = compile(`
@use 'pkg:@greese/ui/scss/config' with ($breakpoints: (xs: 0px, sm: 480px, md: 700px, lg: 1024px, xl: 1440px));
@use 'pkg:@greese/ui/scss/core';
@use 'pkg:@greese/ui/scss/components/Stack';
@use 'pkg:@greese/ui/scss/components/Button';`)
    expect(css).toContain('--greese-color-primary:')
    expect(rules(css, '.greese-Button').length).toBeGreaterThan(0)
    expect(css).toContain('@media (width >= 700px)')
    expect(css).not.toContain('greese-Dialog')
    expect(css.match(/@layer greese\.reset, /g)).toHaveLength(1)
  })
})
