import { describe, expect, it } from 'vitest'
import { compileSpec as compileInBrowser } from '../src/studio/hosted.ts'
import {
  defaultNamespace,
  libraryUrl,
  mergeUses,
  rewriteLibraryUrls,
  scssProblems,
  splitScss,
  toggleImport,
} from '../src/studio/scssModule.ts'
import { specToScss, validateSpec, type ThemeSpec } from '../src/studio/spec.ts'
import { compileSpec } from './studio.ts'

describe('a component’s SCSS: imports, then a body', () => {
  it('splits the leading @use statements from the body, with comments between', () => {
    const { uses, body, bodyLine, problems } = splitScss(`// mine
@use 'sass:map';
/* the library's */
@use 'pkg:@greese/ui/scss/mixins';
@use "pkg:@greese/ui/scss/tones" as t;
@use 'sass:list' as *;

.a { b: c; }`)
    expect(uses).toEqual([
      { url: 'sass:map', namespace: 'map', line: 2 },
      { url: 'pkg:@greese/ui/scss/mixins', namespace: 'mixins', line: 4 },
      { url: 'pkg:@greese/ui/scss/tones', namespace: 't', line: 5 },
      { url: 'sass:list', namespace: '*', line: 6 },
    ])
    expect(body).toBe('.a { b: c; }')
    expect(bodyLine).toBe(8)
    expect(problems).toEqual([])
    expect(splitScss('padding: 0;').uses).toEqual([])
    expect(defaultNamespace('pkg:@greese/ui/scss/_floating.scss')).toBe('floating')
  })

  it('rewrites a library path from a component’s source to its pkg: form', () => {
    expect(libraryUrl('../../styles/mixins')).toBe('pkg:@greese/ui/scss/mixins')
    expect(libraryUrl('../../../dist/maps')).toBe('pkg:@greese/ui/scss/maps')
    expect(libraryUrl('../../styles/effect')).toBeUndefined()
    const { text, rewritten } = rewriteLibraryUrls(
      "@use 'sass:map';\n@use '../../styles/floating';\n@use '../../../dist/maps' as defaults;\n.a { b: c }"
    )
    expect(text).toBe(
      "@use 'sass:map';\n@use 'pkg:@greese/ui/scss/floating';\n@use 'pkg:@greese/ui/scss/maps' as defaults;\n.a { b: c }"
    )
    expect(rewritten).toEqual([
      '../../styles/floating → pkg:@greese/ui/scss/floating',
      '../../../dist/maps → pkg:@greese/ui/scss/maps',
    ])
  })

  it('says what it can’t use, and where', () => {
    const problems = (text: string) => scssProblems(text).join('\n')
    expect(problems("@use 'pkg:@greese/ui/scss/mixins';\n.a { b: c }")).toBe('')
    expect(problems("@forward 'sass:map';")).toMatch(/line 1: @forward is not allowed/)
    expect(problems("@import 'x';")).toMatch(/@import is not allowed/)
    expect(problems("@use 'pkg:@greese/ui/scss/config' with ($a: 1);")).toMatch(
      /with \(…\) is not allowed/
    )
    expect(problems("@use 'pkg:@greese/ui/scss';")).toMatch(/whole library again/)
    expect(problems("@use 'pkg:@greese/ui/scss/tokens';")).toMatch(
      /not one of the entry points/
    )
    expect(problems("@use '../../styles/mixins';")).toMatch(
      /write "..\/..\/styles\/mixins" as "pkg:/
    )
    expect(problems("@use './mine';")).toMatch(/only sass: modules/)
    expect(problems(".a { b: c }\n@use 'sass:map';")).toMatch(
      /line 2: @use must come before the styles/
    )
    expect(problems('.a { b: c')).toMatch(/never closed/)
    expect(problems('.a { b: c } }')).toMatch(
      /line 1: a closing brace has no opening one/
    )
    // Braces in strings and comments don't count.
    expect(problems(".a { content: '}'; /* { */ }")).toBe('')
  })

  it('merges every component’s imports, once each, and refuses one name for two modules', () => {
    const { lines, problems } = mergeUses(
      [
        [
          'Accordion',
          [{ url: 'pkg:@greese/ui/scss/mixins', namespace: 'mixins', line: 1 }],
        ],
        [
          'Card',
          [
            { url: 'pkg:@greese/ui/scss/mixins', namespace: 'mixins', line: 1 },
            { url: 'pkg:@greese/ui/scss/kit', namespace: 'greese', line: 2 },
            { url: 'sass:map', namespace: 'm', line: 3 },
          ],
        ],
        ['Dialog', [{ url: 'sass:list', namespace: 'm', line: 4 }]],
      ],
      [{ url: 'pkg:@greese/ui/scss/kit', namespace: 'greese' }]
    )
    expect(lines.map((l) => l.text)).toEqual([
      "@use 'pkg:@greese/ui/scss/mixins';",
      "@use 'sass:map' as m;",
    ])
    expect(problems).toEqual([
      'Dialog scss: line 4: "m" is already Card\'s name for sass:map; give one of them another name with "as"',
    ])
  })
})

describe('the imports menu', () => {
  it('adds an import after the others, or first, and removes every @use of it', () => {
    const text = "// mine\n@use 'sass:map';\n\n& { gap: 0; }\n"
    const added = toggleImport(text, 'pkg:@greese/ui/scss/mixins', true)
    expect(added).toBe(
      "// mine\n@use 'sass:map';\n@use 'pkg:@greese/ui/scss/mixins';\n\n& { gap: 0; }\n"
    )
    expect(toggleImport(added, 'pkg:@greese/ui/scss/mixins', false)).toBe(text)
    expect(toggleImport(text, 'sass:map', true)).toBe(text)
    expect(toggleImport('& { gap: 0; }', 'pkg:@greese/ui/scss/kit', true)).toBe(
      "@use 'pkg:@greese/ui/scss/kit' as greese;\n\n& { gap: 0; }"
    )
    expect(toggleImport("@use 'sass:map' as m;\n.a { b: c }", 'sass:map', false)).toBe(
      '.a { b: c }'
    )
  })
})

describe('declarations Sass allows only at the top of a file', () => {
  const text = `@use 'sass:list';
$counts: (1, 2);
$size: 2rem;
$list: ();

@mixin row { gap: $size; }
@function cols() { @return list.length($counts); }

@each $n in (a, b) {
  $list: list.append($list, $n);
}
.a { @include row; order: cols(); content: '#{$list}'; }`

  it('hoists mixins, functions and the variables they read; the rest stays in the body, line for line', () => {
    const { declarations, body } = splitScss(text)
    expect(declarations.map((d) => [d.kind, d.name, d.line])).toEqual([
      ['variable', 'counts', 2],
      ['variable', 'size', 3],
      ['mixin', 'row', 6],
      ['function', 'cols', 7],
    ])
    // `$list` is updated by the loop, so it stays where the loop can update it.
    expect(body).toContain('$list: ();')
    expect(body.split('\n')).toHaveLength(text.split('\n').length - 1)
  })

  it('compiles: the hoisted ones at the top of the file, the body in the component', () => {
    const spec: ThemeSpec = { tokens: {}, components: { Card: { scss: text } } }
    const scss = specToScss(spec)
    expect(scss.indexOf('@mixin row')).toBeLessThan(
      scss.indexOf('@include greese.component(Card)')
    )
    const css = (compileSpec(spec) as { css: string }).css
    expect(css).toMatch(/\.greese-Card \.a \{\s+gap: 2rem;\s+order: 2;\s+content: "a b";/)
  })

  it('refuses two components declaring one name, which would replace each other silently', () => {
    const errors = validateSpec({
      tokens: {},
      components: {
        Card: { scss: '@mixin row { gap: 0; }\n.a { @include row; }' },
        Chip: { scss: '\n@mixin row { gap: 1px; }' },
      },
    })
    expect(errors).toContainEqual(
      'Chip scss: line 2: Card also declares mixin row; the theme file holds both, so rename one'
    )
  })

  it('still points an error at the right line after hoisting', () => {
    const result = compileSpec({
      tokens: {},
      components: {
        Card: { scss: '@mixin row { gap: 0; }\n\n.a {\n  color: $nope;\n}' },
      },
    })
    expect(result).toMatchObject({ at: { component: 'Card', line: 4 } })
    const inMixin = compileSpec({
      tokens: {},
      components: {
        Card: { scss: '\n@mixin row {\n  gap: $nope;\n}\n.a { @include row; }' },
      },
    })
    expect(inMixin).toMatchObject({ at: { component: 'Card', line: 3 } })
  })
})

describe('component SCSS with imports, through the real kit', () => {
  const spec: ThemeSpec = {
    tokens: {},
    components: {
      Popover: {
        scss: `@use 'pkg:@greese/ui/scss/floating';
@use 'pkg:@greese/ui/scss/mixins';

@include floating.surface;
@include mixins.up(md) { padding: 2rem; }`,
      },
      Card: {
        scss: `@use 'pkg:@greese/ui/scss/mixins';
@use 'pkg:@greese/ui/scss/tones';
@use 'sass:list';
@use 'sass:map';
.greese-Card-title { color: list.nth(map.get(tones.$tones, primary), 1); }
@include mixins.hover { opacity: 0.9; }`,
      },
      Badge: { scss: '&:hover { color: red; }' },
    },
  }

  it('writes the imports once, at the top, after the kit, and the bodies in their components', () => {
    const scss = specToScss(spec)
    const top = scss.slice(0, scss.indexOf('@include'))
    expect(top.match(/@use 'pkg:@greese\/ui\/scss\/mixins';/g)).toHaveLength(1)
    expect(top.indexOf('as greese;')).toBeLessThan(top.indexOf('scss/floating'))
    expect(scss).toMatch(
      /@include greese\.component\(Popover\) \{\n {2}@include floating\.surface;/
    )
    expect(scss).not.toMatch(/component\([^)]*\) \{[^}]*@use/)
  })

  it('compiles on the server and in the browser to the same css, scoped to each component', async () => {
    expect(validateSpec(spec)).toEqual([])
    const served = compileSpec(spec)
    expect(served).not.toHaveProperty('errors')
    expect(await compileInBrowser(spec)).toEqual(served)
    const css = (served as { css: string }).css
    expect(css).toMatch(
      /@media \(width >= 900px\) \{\s+\.greese-Popover \{\s+padding: 2rem;/
    )
    expect(css).toMatch(
      /\.greese-Card \.greese-Card-title \{\s+color: var\(--greese-color-primary\);/
    )
    expect(css).toMatch(/\.greese-Card:hover \{\s+opacity: 0\.9;/)
    expect(css).toMatch(/\.greese-Badge:hover \{\s+color: red;/)
  }, 30_000)

  it('gives a component’s mixins the theme’s own breakpoints', () => {
    const custom = {
      ...spec,
      breakpoints: { xs: 0, sm: 500, md: 700, lg: 1000, xl: 1400 },
    }
    const css = (compileSpec(custom) as { css: string }).css
    expect(css).toMatch(
      /@media \(width >= 700px\) \{\s+\.greese-Popover \{\s+padding: 2rem;/
    )
  })

  it('keeps a named theme’s scope', () => {
    const css = (compileSpec({ ...spec, name: 'brand' }) as { css: string }).css
    expect(css).toMatch(
      /\[data-greese-theme=brand\] \.greese-Card:hover \{\s+opacity: 0\.9;/
    )
  })

  it('reports conflicting imports across components, and each component’s own problems', () => {
    const bad: ThemeSpec = {
      tokens: {},
      components: {
        Card: { scss: "@use 'sass:map' as x;\n.a { b: c }" },
        Chip: { scss: "@use 'sass:list' as x;\n@use '../../styles/nope';" },
      },
    }
    const errors = validateSpec(bad)
    expect(errors).toContainEqual(
      expect.stringMatching(/^Chip scss: line 2: only sass: modules/)
    )
    expect(errors).toContainEqual(
      expect.stringMatching(/^Chip scss: line 1: "x" is already Card's name for sass:map/)
    )
  })

  it('points a Sass error at the component’s box and line, on the server and in the browser', async () => {
    const broken: ThemeSpec = {
      tokens: {},
      components: {
        Card: { scss: "@use 'pkg:@greese/ui/scss/mixins';\n\n.a {\n  color: $nope;\n}" },
        Chip: { scss: '.b {\n  @include mixins.nope;\n}' },
      },
    }
    const served = compileSpec(broken)
    expect(served).toMatchObject({ at: { component: 'Card', line: 4 } })
    expect((served as { at: { message: string } }).at.message).toMatch(
      /Undefined variable/
    )
    expect(await compileInBrowser(broken)).toMatchObject({
      at: { component: 'Card', line: 4 },
    })
    const second = compileSpec({
      ...broken,
      components: { Chip: broken.components!.Chip! },
    })
    expect(second).toMatchObject({ at: { component: 'Chip', line: 2 } })
  })
})
