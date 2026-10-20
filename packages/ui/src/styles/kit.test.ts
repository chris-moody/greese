// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compile as compileFile, compileString, NodePackageImporter } from 'sass-embedded'
import { describe, expect, it } from 'vitest'
import { createTheme, LAYER_ORDER } from '../index.ts'

const STYLES = fileURLToPath(new URL('.', import.meta.url))

const compile = (scss: string, use = `@use 'kit' as greese;`): string =>
  compileString(`${use}\n${scss}`, {
    loadPaths: [STYLES],
    importers: [new NodePackageImporter()],
  }).css

/** The custom properties a rule declares, in order. */
const declared = (css: string, selector: string): Array<[string, string]> => {
  const at = css.indexOf(`${selector} {`)
  expect(at, `${selector} in\n${css}`).toBeGreaterThanOrEqual(0)
  const body = css.slice(css.indexOf('{', at) + 1, css.indexOf('}', at))
  return [...body.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!])
}

describe('SCSS kit: names', () => {
  it('emits no CSS when used', () => {
    expect(compile('')).toBe('')
  })

  it('adds the prefix and separators to classes', () => {
    const css = compile(`
      a { --block: #{greese.class(Button)}; --part: #{greese.class(Button, icon)};
          --mod: #{greese.class(Button, $modifier: solid)};
          --part-mod: #{greese.class(Pagination, step, next)}; }`)
    expect(css).toContain('--block: .greese-Button;')
    expect(css).toContain('--part: .greese-Button-icon;')
    expect(css).toContain('--mod: .greese-Button--solid;')
    expect(css).toContain('--part-mod: .greese-Pagination-step--next;')
  })

  it('stops the build on unknown names, listing the real ones', () => {
    expect(() => compile('a { b: greese.class(Buton); }')).toThrow(
      /no component `Buton`.*Button/
    )
    expect(() => compile('a { b: greese.class(Button, icn); }')).toThrow(
      /`Button` has no part `icn`. Parts: icon/
    )
    expect(() => compile('a { b: greese.class(Button, $modifier: big); }')).toThrow(
      /no modifier `big`.*solid/
    )
    expect(() => compile('a { b: greese.token(color, acent); }')).toThrow(
      /no color token `acent`/
    )
  })

  it('lets unknown names through with $strict: false', () => {
    const css = compile(
      'a { b: greese.class(Future, $part: thing); }',
      `@use 'kit' as greese with ($strict: false);`
    )
    expect(css).toContain('b: .greese-Future-thing;')
  })

  it('reads tokens and component variables as var()', () => {
    const css = compile(
      'a { b: greese.token(fontSize, lg); c: greese.variable(button-tone); }'
    )
    expect(css).toContain('b: var(--greese-font-size-lg);')
    expect(css).toContain('c: var(--greese-button-tone);')
  })
})

describe('SCSS kit: component()', () => {
  const css = compile(`
    @include greese.component(Button) {
      font-weight: 700;
      @include greese.modifier(outline) { border-width: 2px; }
      @include greese.part(icon) { opacity: 0.8; }
      @include greese.hover { translate: 0 -1px; }
    }
    @include greese.component(Pagination) {
      @include greese.part(step) { @include greese.modifier(next) { color: red; } }
    }
  `)

  it('puts overrides in greese.overrides, above components and below utilities', () => {
    expect(css).toMatch(
      /\n@layer greese\.overrides \{\n {2}\.greese-Button \{\n {4}font-weight: 700;/
    )
  })

  it('starts with the layer order, once, so it holds whichever sheet loads first', () => {
    expect(css.startsWith(`${LAYER_ORDER}\n`)).toBe(true)
    expect(css.split('@layer greese.reset')).toHaveLength(2)
    expect(compile('@include greese.tokens((radius: (md: 1px)));')).toMatch(
      /^@layer greese\.reset, .*greese\.components, greese\.overrides, greese\.utilities;\n@layer greese\.theme \{/
    )
  })

  it('builds part and modifier selectors from the enclosing component', () => {
    expect(css).toContain(
      '.greese-Button.greese-Button--outline {\n    border-width: 2px;'
    )
    expect(css).toContain('.greese-Button .greese-Button-icon {\n    opacity: 0.8;')
    expect(css).toContain(
      '.greese-Pagination .greese-Pagination-step.greese-Pagination-step--next {'
    )
  })

  it('forwards the library mixins', () => {
    expect(css).toMatch(
      /@media \(hover: hover\) \{\s+\.greese-Button:hover \{\s+translate: 0 -1px;/
    )
  })

  it('needs a component around part() and modifier()', () => {
    expect(() => compile('a { @include greese.part(icon); }')).toThrow(
      /part\(\) goes inside component\(\)/
    )
  })
})

describe('SCSS kit: vars()', () => {
  const css = compile(`
    @include greese.component(Button) {
      @include greese.vars((
        tone: greese.token(color, positive),
        radius-md: 2px,
        on-tone: (light: white, dark: black),
        duration-fast: 60ms,
      ));
    }
    @include greese.component(FileInput) { @include greese.vars((file-height: 3rem)); }
  `)

  it('expands short names, and takes full names and tokens', () => {
    expect(declared(css, '  .greese-Button')).toEqual([
      ['--greese-button-tone', 'var(--greese-color-positive)'],
      ['--greese-radius-md', '2px'],
      ['--greese-button-on-tone', 'light-dark(white, black)'],
    ])
    expect(css).toContain('--greese-file-height: 3rem;')
  })

  it('keeps duration tokens out of reduced motion', () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: no-preference\) \{\s+\.greese-Button \{\s+--greese-duration-fast: 60ms;/
    )
  })

  it('rejects variables the component does not have', () => {
    expect(() =>
      compile('@include greese.component(Card) { @include greese.vars((tone: red)); }')
    ).toThrow(/`Card` has no variable `tone`. Its variables: --greese-card-padding/)
  })
})

describe('SCSS kit: motion()', () => {
  it('plays a preset on every instance, behind reduced motion, tunable per instance', () => {
    const css = compile(`@include greese.component(Card) {
      @include greese.motion((enter: fadeUp, duration: 0.4s, distance: 2rem, ease: in-out));
    }`)
    expect(css).toContain('--greese-motion-distance: 2rem;')
    expect(css).toMatch(
      /prefers-reduced-motion: no-preference\) \{\s+\.greese-Card \{\s+animation: greese-fade-up var\(--greese-motion-duration, 0\.4s\) var\(--greese-motion-ease, var\(--greese-ease-in-out\)\) var\(--greese-motion-delay, 0s\) backwards;/
    )
  })

  it('sets only what an overlay exit changes, as the exit classes do', () => {
    const css =
      compile(`@include greese.component(Dialog) { @include greese.motion((exit: scale-out)); }
      @include greese.component(Popover) { @include greese.motion((exit: fade-out-up)); }`)
    expect(declared(css, '.greese-Dialog')).toEqual([
      ['--greese-motion-exit-scale', '0.95'],
    ])
    expect(declared(css, '.greese-Popover')).toEqual([
      [
        '--greese-motion-exit-translate',
        '0 calc(-1 * var(--greese-motion-distance, 1rem))',
      ],
    ])
  })

  it('retunes the component’s transitions through its duration and easing tokens', () => {
    const css = compile(`@include greese.component(Switch) {
      @include greese.motion((durations: (fast: 80ms), easings: (standard: linear)));
    }`)
    expect(css).toContain('--greese-easing-standard: linear;')
    expect(css).toMatch(
      /no-preference\) \{\s+\.greese-Switch \{\s+--greese-duration-fast: 80ms;/
    )
  })

  it('tunes every entrance with motion-defaults()', () => {
    const css = compile('@include greese.motion-defaults((duration: 0.3s, ease: out));')
    expect(declared(css, ':root')).toEqual([
      ['--greese-motion-duration', '0.3s'],
      ['--greese-motion-ease', 'var(--greese-ease-out)'],
    ])
  })

  it('rejects unknown presets and options', () => {
    const inCard = (options: string) =>
      compile(`@include greese.component(Card) { @include greese.motion(${options}); }`)
    expect(() => inCard('(enter: wobble)')).toThrow(
      /no entrance `wobble`. Presets: fade-in/
    )
    expect(() => inCard('(speed: 2)')).toThrow(/motion\(\) has no option `speed`/)
  })
})

describe('SCSS kit: tokens() and theme()', () => {
  it('overrides only what you pass on the page, mirroring the default selectors', () => {
    const css = compile(`@include greese.tokens((
      color: (accent: (light: #7c3aed, dark: #c4b5fd)),
      radius: (md: 12px),
      font: (body: ('Inter', system-ui)),
      duration: (fast: 90ms),
    ));`)
    expect(css).toMatch(/^@layer greese\.reset[^\n]*\n@layer greese\.theme \{/)
    expect(declared(css, '  :root')).toEqual([
      ['--greese-radius-md', '12px'],
      ['--greese-font-body', '"Inter", system-ui'],
      ['--greese-duration-fast', '90ms'],
    ])
    expect(css).toContain(
      '[data-greese-scheme=system] {\n    --greese-color-accent: #7c3aed;'
    )
    expect(css).toContain(
      '[data-greese-scheme=dark] {\n    --greese-color-accent: #c4b5fd;'
    )
    expect(css).toMatch(
      /reduced-motion: reduce\) \{\s+:root \{\s+--greese-duration-fast: 0\.01ms;/
    )
  })

  it('declares the same complete theme as createTheme()', () => {
    const css = compile(`@include greese.theme(brand) {
      @include greese.tokens((color: (accent: (light: #7c3aed, dark: #c4b5fd), accentContent: #fff, primary: (light: #fde047, dark: #1e3a8a), secondary: lavender-600), radius: (md: 12px)));
    }`)
    // Derived colors included: primary's and secondary's content and strong.
    const theme = createTheme({
      name: 'brand',
      color: {
        accent: { light: '#7c3aed', dark: '#c4b5fd' },
        accentContent: '#fff',
        primary: { light: '#fde047', dark: '#1e3a8a' },
        secondary: '#7c3aed',
      },
      radius: { md: '12px' },
    })
    const T = "[data-greese-theme='brand']"
    const sass = '[data-greese-theme=brand]'
    // Sass drops the attribute quotes; createTheme's font stack keeps its own.
    const norm = (list: Array<[string, string]>) =>
      list.map(([p, v]) => [p, v.replace(/"/g, "'")])
    expect(norm(declared(css, `  ${sass}`))).toEqual(norm(declared(theme.css, `  ${T}`)))
    expect(
      declared(css, `:root[data-greese-scheme=dark] ${sass}:not([data-greese-scheme])`)
    ).toEqual(
      declared(
        theme.css,
        `:root[data-greese-scheme='dark'] ${T}:not([data-greese-scheme])`
      )
    )
  })

  it('derives content colors from hex strings, as Theme Studio writes them', () => {
    const css = compile(`@include greese.theme(brand) {
      @include greese.tokens((color: (negative: (light: "#00ff00", dark: "#1e3a8a"), positive: "#fff", info: "#0369A1")));
    }`)
    const theme = createTheme({
      name: 'brand',
      color: {
        negative: { light: '#00ff00', dark: '#1e3a8a' },
        positive: '#fff',
        info: '#0369A1',
      },
    })
    const T = "[data-greese-theme='brand']"
    const sass = '[data-greese-theme=brand]'
    const norm = (list: Array<[string, string]>) =>
      list.map(([p, v]) => [p, v.replace(/"/g, "'")])
    const light = declared(css, `  ${sass}`)
    expect(light).toContainEqual(['--greese-color-negative-content', '#0b0d10'])
    expect(norm(light)).toEqual(norm(declared(theme.css, `  ${T}`)))
  })

  it('scopes component overrides to the theme', () => {
    const css = compile(`@include greese.theme(brand) {
      @include greese.component(Card) { padding: 0; }
      @include greese.motion-defaults((distance: 2rem));
    }`)
    expect(css).toContain('[data-greese-theme=brand] .greese-Card {\n    padding: 0;')
    expect(declared(css, '  [data-greese-theme=brand]')).toEqual([
      ['--greese-motion-distance', '2rem'],
    ])
  })

  it('rejects unknown token groups and keys', () => {
    expect(() => compile('@include greese.tokens((color: (accent: red)));')).toThrow(
      /no token group `color`/
    )
    expect(() => compile('@include greese.tokens((radius: (huge: 1px)));')).toThrow(
      /no `radius` token `huge`. Keys: none, sm, md, lg, pill/
    )
  })
})

describe('style manifest', () => {
  it('is current: rebuild with `npm run build` after changing a stylesheet', async () => {
    const { manifestScss, styleManifest } = await import('../../scripts/styleManifest.ts')
    const components = fileURLToPath(new URL('../components', import.meta.url))
    const compiled = new Map(
      readdirSync(components).map((name) => [
        name,
        compileFile(`${components}/${name}/${name}.scss`).css,
      ])
    )
    const tokensCss = readFileSync(`${STYLES}/../../dist/tokens.css`, 'utf8')
    const tokenVars = new Set(tokensCss.match(/--greese-[a-z0-9-]+(?=:)/g))
    expect(readFileSync(`${STYLES}/_manifest.scss`, 'utf8')).toBe(
      manifestScss(styleManifest(compiled, tokenVars))
    )
  }, 30_000)
})
