// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compile as compileFile, compileString, NodePackageImporter } from 'sass-embedded'
import { describe, expect, it } from 'vitest'
import {
  createTheme,
  cssPlan,
  effectClass,
  effectCss,
  effectNames,
  effectPlan,
  entranceNames,
  LAYER_ORDER,
} from '../index.ts'

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
      'a { b: greese.token(lineHeight, tight); c: greese.variable(button-tone); }'
    )
    expect(css).toContain('b: var(--greese-line-height-tight);')
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
    expect(declared(css, '.greese-Dialog')).toEqual([['--greese-motion-exit-scale', '0']])
    expect(declared(css, '.greese-Popover')).toEqual([
      [
        '--greese-motion-exit-translate',
        '0px calc(-1 * var(--greese-motion-distance, 1rem))',
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

  it('accepts every entrance src/effects.ts defines, and the built CSS has its keyframes', () => {
    const built = readFileSync(
      new URL('../../dist/css/Motion.css', import.meta.url),
      'utf8'
    )
    expect(entranceNames()).toHaveLength(13)
    for (const effect of entranceNames()) {
      const name = effectClass(effect)
      expect(built, name).toContain(`@keyframes greese-${name} {`)
      const css = compile(
        `@include greese.component(Card) { @include greese.motion((enter: ${name})); }`
      )
      expect(css, name).toContain(`animation: greese-${name} `)
    }
  })

  it('rejects unknown presets and options', () => {
    const inCard = (options: string) =>
      compile(`@include greese.component(Card) { @include greese.motion(${options}); }`)
    expect(() => inCard('(enter: wobble)')).toThrow(
      /no entrance `wobble`. Effects that end at rest: fade-in/
    )
    expect(() => inCard('(speed: 2)')).toThrow(/motion\(\) has no option `speed`/)
  })
})

describe('SCSS kit: effect()', () => {
  const wobble = cssPlan({ rotate: [0, -6, 6, 0] })
  const scss = (plan: string) =>
    `@include greese.effect(wobble, ${plan});
    @include greese.component(Card) { @include greese.motion((enter: wobble)); }`

  it('makes an effect of your own work in motion(enter:) like a built-in', () => {
    const css = compile(
      scss(
        `(enter: (from: (rotate: '0deg'), '33.33%': (rotate: '-6deg'), '66.67%': (rotate: '6deg')))`
      )
    )
    expect(css).toMatch(
      /\.greese-Motion--enter-wobble,\s+\.greese-Motion--view-wobble \{\s+--greese-motion-name: greese-wobble;/
    )
    expect(css).toMatch(/@keyframes greese-wobble \{\s+from \{\s+rotate: 0deg;/)
    expect(css).toContain('animation: greese-wobble ')
    expect(wobble.enter).toHaveLength(3)
  })

  it('retunes an overlay exit, and accepts a new one in motion(exit:)', () => {
    const css = compile(
      `@include greese.effect(scale-out, (exit: (scale: '0.5')));
      @include greese.effect(sink, (exit: (translate: '0 2rem')));
      @include greese.component(Dialog) { @include greese.motion((exit: sink)); }`
    )
    expect(css).toMatch(
      /\.greese-Motion--exit-scale-out \{\s+--greese-motion-exit-scale: 0\.5;/
    )
    expect(declared(css, '.greese-Dialog')).toEqual([
      ['--greese-motion-exit-translate', '0 2rem'],
    ])
  })

  it('writes the CSS that effectCss() writes for a page without the compiled theme', () => {
    const squash = (css: string) => css.replace(/\s+/g, ' ').trim()
    const toScss = (plan: ReturnType<typeof cssPlan>) => {
      const decl = (values: Record<string, string>) =>
        `(${Object.entries(values)
          .map(([p, v]) => `'${p}': '${v}'`)
          .join(', ')})`
      return plan.enter
        ? `(enter: (${plan.enter.map(([at, d]) => `'${at}': ${decl(d)}`).join(', ')}))`
        : `(exit: ${Object.keys(plan.exit).length ? decl(plan.exit) : '()'})`
    }
    for (const effect of effectNames) {
      const plan = effectPlan(effect)
      const name = effectClass(effect)
      const css = squash(compile(`@include greese.effect(x-${name}, ${toScss(plan)});`))
      // The kit's rules sit in the utilities layer; the text is the rules alone.
      expect(css, effect).toContain(squash(effectCss(`x-${name}`, plan)))
    }
  })

  it('still stops the build on a name nothing defines', () => {
    expect(() =>
      compile(
        `@include greese.component(Card) { @include greese.motion((enter: wobble)); }`
      )
    ).toThrow(/no entrance `wobble`/)
    expect(() => compile(`@include greese.effect(wobble, ());`)).toThrow(/needs a plan/)
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
        secondary: '#7e5bd0',
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
    expect(light).toContainEqual(['--greese-color-negative-content', '#11171c'])
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
    expect(() => compile('@include greese.tokens((colr: (accent: red)));')).toThrow(
      /no token group `colr`/
    )
    expect(() => compile('@include greese.tokens((radius: (huge: 1px)));')).toThrow(
      /no `radius` token `huge`. Keys: none, sm, md, lg, pill/
    )
  })
})

describe('SCSS kit: new tokens', () => {
  const extended = `@include greese.tokens((), $extend: (
    color: (brand-ink: (light: #1b1340, dark: #e5defc), brand-flat: #123456),
    space: (9: 4rem),
    shadow: (glow: 0 0 12px red),
    duration: (glacial: 900ms),
  ));`

  it('declares them alongside the built-in tokens', () => {
    const css = compile(extended)
    expect(css).toContain('--greese-space-9: 4rem;')
    expect(css).toContain('--greese-shadow-glow: 0 0 12px red;')
    expect(css).toContain('--greese-color-brand-ink: #1b1340;')
    expect(css).toContain('--greese-color-brand-flat: #123456;')
    expect(css).toMatch(/--greese-color-brand-ink: #e5defc;/)
    expect(css).toMatch(/prefers-reduced-motion[^}]*--greese-duration-glacial: 0\.01ms/s)
  })

  it('lets token() and component variables use them afterwards', () => {
    const css = compile(`${extended}
      @include greese.component(Button) {
        color: greese.token(color, brand-ink);
        @include greese.vars((tone: greese.token(color, brand-flat)));
      }`)
    expect(css).toContain('color: var(--greese-color-brand-ink)')
  })

  it('still stops the build on unknown names, groups and repeats', () => {
    expect(() =>
      compile('@include greese.tokens((), $extend: (color: (accent: red)));')
    ).toThrow(/`color` token `accent` already exists/)
    expect(() =>
      compile('@include greese.tokens((), $extend: (colr: (x: red)));')
    ).toThrow(/no token group `colr` to extend/)
    expect(() =>
      compile('@include greese.component(Button) { color: greese.token(color, nope); }')
    ).toThrow(/no color token `nope`/)
  })

  it('declares them in a named theme too, in both schemes', () => {
    const css = compile(`@include greese.theme(brand) { ${extended} }`)
    expect(css).toContain('[data-greese-theme=brand]')
    expect(css).toContain('--greese-color-brand-ink: #e5defc;')
    expect(css).toContain('--greese-space-9: 4rem;')
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

describe('SCSS kit: typography()', () => {
  it('writes a variant complete, so its other breakpoints stay in step', () => {
    const css = compile(`@include greese.typography((
      h1: (base: (font-size: 2rem), lg: (font-size: 4rem, letter-spacing: -0.03em)),
    ));`)
    expect(css).toContain('@layer greese.theme')
    // base: the default h1's other values too, with the new size
    expect(css).toMatch(
      /--greese-type-h1-font-size: 2rem;[\s\S]*--greese-type-h1-font-weight: 700;/
    )
    // the default md step is kept, since the variant is written whole
    expect(css).toMatch(
      /@media \(width >= 900px\)[\s\S]*--greese-type-h1-font-size: 2\.75rem;/
    )
    expect(css).toMatch(
      /@media \(width >= 1200px\)[\s\S]*--greese-type-h1-font-size: 4rem;/
    )
    expect(css).toContain('--greese-type-h1-letter-spacing: -0.03em;')
    // other variants are left alone
    expect(css).not.toContain('--greese-type-h2-')
  })

  it('takes other properties, and scopes to a theme', () => {
    const css = compile(`@include greese.theme(brand) {
      @include greese.typography((caption: (base: (text-transform: uppercase, font-family: ('Inter', sans-serif), color: red))));
    }`)
    expect(css).toContain('[data-greese-theme=brand]')
    expect(css).toContain('--greese-type-caption-text-transform: uppercase;')
    expect(css).toContain('--greese-type-caption-font-family: "Inter", sans-serif;')
    expect(css).toContain('--greese-type-caption-color: red;')
  })

  it('stops the build on unknown variants, breakpoints and properties', () => {
    expect(() =>
      compile('@include greese.typography((h9: (base: (font-size: 1rem))));')
    ).toThrow(/no type variant `h9`/)
    expect(() =>
      compile('@include greese.typography((h1: (huge: (font-size: 1rem))));')
    ).toThrow(/no breakpoint `huge`/)
    expect(() =>
      compile('@include greese.typography((h1: (base: (colour: red))));')
    ).toThrow(/no type property `colour`/)
  })
})

describe('SCSS kit: keyframes()', () => {
  it('writes keyframes in the utilities layer, from steps', () => {
    const css = compile(`@include greese.keyframes(greese-fade-up, (
      from: (opacity: 0, translate: '0 2rem'),
      '60%': (opacity: 1),
      to: (opacity: 1, translate: '0 0'),
    ));`)
    expect(css).toContain('@layer greese.utilities')
    expect(css).toMatch(
      /@keyframes greese-fade-up\s*{\s*from\s*{\s*opacity:\s*0;\s*translate:\s*0 2rem;/
    )
    expect(css).toMatch(/60%\s*{\s*opacity:\s*1;/)
  })

  it('only takes names that start with greese-', () => {
    expect(() =>
      compile(`@include greese.keyframes(wobble, (from: (opacity: 0)));`)
    ).toThrow(/start with `greese-`/)
  })
})
