// @vitest-environment node
import { readFileSync } from 'node:fs'
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
import { blocks, compileScss, rules } from '../test/sass.ts'

/** The guard theme rules carry for `layer` (see reset-guard() in the kit). */
const guard = (layer: string) =>
  `:where(:not(.greese-reset-${layer}, .greese-reset-${layer} *, .greese-reset, .greese-reset *))`

/** Compiled kit output with or without the reset guards, which most tests aren't about. */
const compileGuarded = (scss: string, use = `@use 'kit' as greese;`): string =>
  compileScss(`${use}\n${scss}`)
const compile = (scss: string, use?: string): string =>
  compileGuarded(scss, use).replace(/:where\(:not\(\.greese-reset-[^)]*\)\)/g, '')

/** The custom properties the first rule for `selector` declares, in order. */
const declared = (css: string, selector: string): Array<[string, string]> => {
  const [rule] = rules(css, selector)
  expect(rule, `${selector} in\n${css}`).toBeDefined()
  return rule!.declarations.filter(([name]) => name.startsWith('--'))
}

/** The rule for `selector` inside `within` (outermost first); fails if there is none. */
const ruleIn = (css: string, selector: string, ...within: string[]) => {
  const rule = rules(css, selector).find((r) => r.within.join() === within.join())
  expect(rule, `${selector} in ${within.join(' > ')}:\n${css}`).toBeDefined()
  return rule!.declarations
}

const motionOk = '@media (prefers-reduced-motion: no-preference)'

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
    expect(ruleIn(css, '.greese-Button', '@layer greese.overrides')).toContainEqual([
      'font-weight',
      '700',
    ])
  })

  it('starts with the layer order, once, so it holds whichever sheet loads first', () => {
    const order = LAYER_ORDER.slice(0, -1)
    expect(blocks(css)[0]?.prelude).toBe(order)
    expect(css.split('@layer greese.reset')).toHaveLength(2)
    const tokens = blocks(compile('@include greese.tokens((radius: (md: 1px)));'))
    expect(tokens.slice(0, 2).map((b) => b.prelude)).toEqual([
      order,
      '@layer greese.theme',
    ])
  })

  it('builds part and modifier selectors from the enclosing component', () => {
    const layer = '@layer greese.overrides'
    expect(ruleIn(css, '.greese-Button.greese-Button--outline', layer)).toEqual([
      ['border-width', '2px'],
    ])
    expect(ruleIn(css, '.greese-Button .greese-Button-icon', layer)).toEqual([
      ['opacity', '0.8'],
    ])
    expect(
      ruleIn(
        css,
        '.greese-Pagination .greese-Pagination-step.greese-Pagination-step--next',
        layer
      )
    ).toEqual([['color', 'red']])
  })

  it('forwards the library mixins', () => {
    expect(
      ruleIn(
        css,
        '.greese-Button:hover',
        '@layer greese.overrides',
        '@media (hover: hover)'
      )
    ).toEqual([['translate', '0 -1px']])
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
    @include greese.component(FileInput) { @include greese.vars((file-font: 1rem)); }
  `)

  it('expands short names, and takes full names and tokens', () => {
    expect(declared(css, '.greese-Button')).toEqual([
      ['--greese-button-tone', 'var(--greese-color-positive)'],
      ['--greese-radius-md', '2px'],
      ['--greese-button-on-tone', 'light-dark(white, black)'],
    ])
    expect(css).toContain('--greese-file-font: 1rem;')
  })

  it('keeps duration tokens out of reduced motion', () => {
    expect(rules(css, '.greese-Button')).toContainEqual({
      within: ['@layer greese.overrides', motionOk],
      declarations: [['--greese-duration-fast', '60ms']],
    })
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
    expect(
      ruleIn(css, '.greese-Card', '@layer greese.overrides', motionOk)
    ).toContainEqual([
      'animation',
      'greese-fade-up var(--greese-motion-duration, 0.4s) var(--greese-motion-ease, var(--greese-ease-in-out)) var(--greese-motion-delay, 0s) backwards',
    ])
  })

  it('sets everything an overlay exit sets, as the exit classes do', () => {
    const css =
      compile(`@include greese.component(Dialog) { @include greese.motion((exit: scale-out)); }
      @include greese.component(Popover) { @include greese.motion((exit: fade-out-up)); }`)
    expect(declared(css, '.greese-Dialog')).toEqual([
      ['--greese-motion-exit-translate', '0px 0px'],
      ['--greese-motion-exit-scale', '0'],
      ['--greese-motion-exit-opacity', '0'],
      ['--greese-motion-exit-mask-image', 'none'],
      ['--greese-motion-exit-transform', 'none'],
    ])
    expect(Object.fromEntries(declared(css, '.greese-Popover'))).toMatchObject({
      '--greese-motion-exit-translate':
        '0px calc(-1 * var(--greese-motion-distance, 1rem))',
    })
  })

  it('retunes the component’s transitions through its duration and easing tokens', () => {
    const css = compile(`@include greese.component(Switch) {
      @include greese.motion((durations: (fast: 80ms), easings: (standard: linear)));
    }`)
    expect(css).toContain('--greese-easing-standard: linear;')
    expect(
      ruleIn(css, '.greese-Switch', '@layer greese.overrides', motionOk)
    ).toContainEqual(['--greese-duration-fast', '80ms'])
  })

  it('tunes every entrance with motion-defaults()', () => {
    const css = compile('@include greese.motion-defaults((duration: 0.3s, ease: out));')
    expect(declared(css, ':root')).toEqual([
      ['--greese-motion-duration', '0.3s'],
      ['--greese-motion-ease', 'var(--greese-ease-out)'],
    ])
  })

  it('assigns the carousel roles, forward and back', () => {
    const css = compile(`@include greese.motion-defaults((
      carousel: fade-in,
      carousel-back: pocket-right,
      carousel-exit: fade-out,
      carousel-back-exit: pocket-out-right,
      carousel-duration: slow,
    ));`)
    expect(Object.fromEntries(declared(css, ':root'))).toMatchObject({
      '--greese-motion-carousel': 'greese-fade-in',
      '--greese-motion-carousel-back': 'greese-pocket-right',
      '--greese-motion-carousel-exit-opacity': '0',
      '--greese-motion-carousel-back-exit-translate': '100% 0px',
      '--greese-motion-carousel-duration': 'var(--greese-duration-slow)',
    })
  })

  it('assigns motion roles with motion-defaults(), pointing at effects and tokens', () => {
    const css = compile(`@include greese.motion-defaults((
      content: wipe-open-x,
      rows: none,
      dialog: iris-in,
      dialog-exit: iris-out,
      content-duration: slow,
      exit-duration: 200ms,
      enter-ease: enter,
    ));`)
    const root = Object.fromEntries(declared(css, ':root'))
    expect(root).toMatchObject({
      '--greese-motion-content': 'greese-wipe-open-x',
      '--greese-motion-rows': 'none',
      '--greese-motion-dialog': 'greese-iris-in',
      '--greese-motion-dialog-exit-mask-size': '0% 0%',
      '--greese-motion-dialog-exit-mask-from': '142% 142%',
      '--greese-motion-content-duration': 'var(--greese-duration-slow)',
      '--greese-motion-exit-duration': '200ms',
      '--greese-motion-enter-ease': 'var(--greese-easing-enter)',
    })
    // The tokens and the effects keep their own values.
    expect(css).not.toMatch(/--greese-duration-slow:/)
    expect(css).toMatch(/@keyframes greese-wipe-open-x/)
    expect(() =>
      compile('@include greese.motion-defaults((content: fade-out));')
    ).toThrow(/no entrance `fade-out`/)
    expect(() =>
      compile('@include greese.motion-defaults((dialog-exit: fade-up));')
    ).toThrow(/no exit `fade-up`/)
  })

  it('assigns page transition roles with motion-defaults() (ADR 0029)', () => {
    const css = compile(`@include greese.motion-defaults((
      page: pocket-up,
      page-exit: pocket-out-down,
      page-back: none,
      page-duration: slow,
      page-ease: enter,
      share-duration: 300ms,
      page-stagger: 0.04s,
      page-exit-order: together,
      page-mode: live,
    ));`)
    expect(Object.fromEntries(declared(css, ':root'))).toMatchObject({
      '--greese-motion-page': 'greese-pocket-up',
      '--greese-motion-page-exit': 'greese-pocket-out-down',
      '--greese-motion-page-back': 'none',
      '--greese-motion-page-duration': 'var(--greese-duration-slow)',
      '--greese-motion-page-ease': 'var(--greese-easing-enter)',
      '--greese-motion-share-duration': '300ms',
      '--greese-motion-page-stagger': '0.04s',
      '--greese-motion-page-exit-order': 'together',
      '--greese-motion-page-mode': 'live',
    })
    // The keyframes its snapshots play come with it, the exit's included.
    expect(css).toMatch(/@keyframes greese-pocket-up/)
    expect(css).toMatch(/@keyframes greese-pocket-out-down/)
    expect(() =>
      compile('@include greese.motion-defaults((page-exit: fade-up));')
    ).toThrow(/no exit `fade-up` for `page-exit`/)
    expect(() => compile('@include greese.motion-defaults((page: fade-out));')).toThrow(
      /no entrance `fade-out` for `page`/
    )
    expect(() =>
      compile('@include greese.motion-defaults((page-mode: sometimes));')
    ).toThrow(/`page-mode` is one of auto, snapshot, live/)
  })

  it('puts a named theme’s page roles on the root too, where snapshots inherit from', () => {
    const css = compile(`@include greese.theme(ocean) {
      @include greese.motion-defaults((theme: fade-up, page: pocket-up, page-exit: pocket-out-down, share-duration: slow));
    }`)
    const scoped = Object.fromEntries(declared(css, '[data-greese-theme=ocean]'))
    expect(scoped).toMatchObject({
      '--greese-motion-theme': 'greese-fade-up',
      '--greese-motion-page': 'greese-pocket-up',
    })
    // Only the page roles reach the root, and only while the theme is on the page.
    expect(declared(css, ':root:has([data-greese-theme=ocean])')).toEqual([
      ['--greese-motion-page', 'greese-pocket-up'],
      ['--greese-motion-page-exit', 'greese-pocket-out-down'],
      ['--greese-motion-share-duration', 'var(--greese-duration-slow)'],
    ])
  })

  it('names selector rules only during a greese page change, with page-transitions()', () => {
    const css = compile(`@include greese.page-transitions((
      'header, footer': still,
      '.greese-Card': (exit: scale-out, enter: pop-in, duration: fast, delay: 0.05s),
    ));`)
    const during = ':root:active-view-transition-type(greese-page)'
    expect(declared(css, `${during} :is(header, footer)`)).toEqual([])
    expect(css).toMatch(
      /:is\(header, footer\) \{\s*view-transition-name: match-element;\s*view-transition-class: greese-PageTransition greese-PageTransition--still;/
    )
    expect(css).toMatch(
      /:is\(\.greese-Card\) \{\s*view-transition-name: match-element;\s*view-transition-class: greese-PageTransition greese-PageTransition--theme greese-page-base-2;/
    )
    expect(
      ruleIn(
        css,
        'html::view-transition-old(*.greese-page-base-2)',
        '@layer greese.overrides',
        motionOk
      )
    ).toEqual([
      ['animation-name', 'greese-scale-out'],
      ['animation-duration', 'var(--greese-duration-fast)'],
      ['animation-delay', '0.05s'],
    ])
    expect(
      ruleIn(
        css,
        'html::view-transition-new(*.greese-page-base-2)',
        '@layer greese.overrides',
        motionOk
      )
    ).toEqual([
      ['animation-name', 'greese-pop-in'],
      ['animation-duration', 'var(--greese-duration-fast)'],
      ['animation-delay', '0.05s'],
    ])
    expect(css).toMatch(/@keyframes greese-scale-out/)
    expect(() =>
      compile(`@include greese.page-transitions(('main': (exit: fade-up)));`)
    ).toThrow(/`main` has no exit `fade-up`/)
    expect(() =>
      compile(`@include greese.page-transitions(('main': (speed: 2)));`)
    ).toThrow(/`main` has no option `speed`/)
  })

  it('scopes selector rules to the theme they belong to', () => {
    const css = compile(`@include greese.theme(ocean) {
      @include greese.page-transitions(('main': (exit: fade-out)));
    }`)
    expect(css).toContain(
      ':root:active-view-transition-type(greese-page) [data-greese-theme=ocean] :is(main)'
    )
    expect(css).toContain('greese-page-ocean-1')
  })

  it('keeps a built-in effect’s plan: effect() refuses its name', () => {
    expect(() =>
      compile('@include greese.effect(fade-up, (enter: (from: (opacity: 0))));')
    ).toThrow(/built-in effect/)
  })

  it('gives every effect a page transition form: entrances arrive, exits leave', () => {
    const built = readFileSync(
      new URL('../../dist/css/PageTransition.css', import.meta.url),
      'utf8'
    ).replace(/\s+/g, ' ')
    const entrances = new Set(entranceNames())
    for (const effect of effectNames) {
      const name = effectClass(effect)
      if (entrances.has(effect)) {
        // The new snapshot plays the entrance's own keyframes (Motion.css).
        expect(built, name).toContain(
          `html::view-transition-new(*.greese-PageTransition--enter-${name}) { animation-name: greese-${name};`
        )
      } else {
        // The old snapshot plays the exit, from rest to where it ends.
        expect(effectPlan(effect).leave?.[0]?.[0], name).toBe('from')
        expect(built, name).toContain(
          `html::view-transition-old(*.greese-PageTransition--exit-${name}) { animation-name: greese-${name};`
        )
        expect(built, name).toContain(`@keyframes greese-${name} {`)
      }
    }
    // Reduced motion: greese snapshots don't animate at all.
    expect(built).toContain(
      '@media (prefers-reduced-motion: reduce) { html::view-transition-group(*.greese-PageTransition), html::view-transition-old(*.greese-PageTransition), html::view-transition-new(*.greese-PageTransition) { animation: none;'
    )
  })

  it('accepts every entrance src/effects.ts defines, and the built CSS has its keyframes', () => {
    const built = readFileSync(
      new URL('../../dist/css/Motion.css', import.meta.url),
      'utf8'
    )
    expect(entranceNames()).toHaveLength(54)
    // One compile for all of them: one each is seconds of Sass.
    const names = entranceNames().map(effectClass)
    const css = compile(
      names
        .map(
          (name) =>
            `@include greese.component(Card) { @include greese.motion((enter: ${name})); }`
        )
        .join('\n')
    )
    for (const name of names) {
      expect(built, name).toContain(`@keyframes greese-${name} {`)
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
    expect(
      rules(css, '.greese-Motion--enter-wobble, .greese-Motion--view-wobble')[0]
        ?.declarations
    ).toContainEqual(['--greese-motion-name', 'greese-wobble'])
    const wobbleFrom = blocks(css).find(
      (b) => b.prelude === 'from' && b.within.at(-1) === '@keyframes greese-wobble'
    )
    expect(wobbleFrom?.declarations).toEqual([['rotate', '0deg']])
    expect(css).toContain('animation: greese-wobble ')
    expect(wobble.enter).toHaveLength(3)
  })

  it('accepts an exit of the theme’s own in motion(exit:)', () => {
    const css = compile(
      `@include greese.effect(sink, (exit: (translate: '0 2rem')));
      @include greese.component(Dialog) { @include greese.motion((exit: sink)); }`
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
      const steps = (list: NonNullable<typeof plan.enter>) =>
        `(${list.map(([at, d]) => `'${at}': ${decl(d)}`).join(', ')})`
      return plan.enter
        ? `(enter: ${steps(plan.enter)})`
        : `(exit: ${Object.keys(plan.exit).length ? decl(plan.exit) : '()'}, leave: ${steps(plan.leave!)})`
    }
    // One compile for every effect (one each took seconds with 66 of them).
    const css = squash(
      compile(
        effectNames
          .map(
            (effect) =>
              `@include greese.effect(x-${effectClass(effect)}, ${toScss(effectPlan(effect))});`
          )
          .join('\n')
      )
    )
    // The kit's rules sit in the utilities layer; the text is the rules alone.
    for (const effect of effectNames)
      expect(css, effect).toContain(
        squash(effectCss(`x-${effectClass(effect)}`, effectPlan(effect)))
      )
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
    expect(blocks(css)[1]?.prelude).toBe('@layer greese.theme')
    expect(declared(css, ':root')).toEqual([
      ['--greese-radius-md', '12px'],
      ['--greese-font-body', '"Inter", system-ui'],
      ['--greese-duration-fast', '90ms'],
    ])
    expect(declared(css, '[data-greese-scheme=system]')).toContainEqual([
      '--greese-color-accent',
      '#7c3aed',
    ])
    expect(declared(css, '[data-greese-scheme=dark]')).toContainEqual([
      '--greese-color-accent',
      '#c4b5fd',
    ])
    expect(
      ruleIn(
        css,
        ':root',
        '@layer greese.theme',
        '@media (prefers-reduced-motion: reduce)'
      )
    ).toEqual([['--greese-duration-fast', '0.01ms']])
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
    expect(norm(declared(css, sass))).toEqual(norm(declared(theme.css, T)))
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
    const light = declared(css, sass)
    expect(light).toContainEqual(['--greese-color-negative-content', '#11171c'])
    expect(norm(light)).toEqual(norm(declared(theme.css, T)))
  })

  it('scopes component overrides to the theme', () => {
    const css = compile(`@include greese.theme(brand) {
      @include greese.component(Card) { padding: 0; }
      @include greese.motion-defaults((distance: 2rem));
    }`)
    expect(rules(css, '[data-greese-theme=brand] .greese-Card')[0]?.declarations).toEqual(
      [['padding', '0']]
    )
    expect(declared(css, '[data-greese-theme=brand]')).toEqual([
      ['--greese-motion-distance', '2rem'],
    ])
  })

  /** What each selector ends up declaring, by where it sits: later blocks win. */
  const effective = (css: string) => {
    const out = new Map<string, Map<string, string>>()
    for (const b of blocks(css)) {
      const key = [...b.within, b.prelude].join(' > ')
      const seen = out.get(key) ?? new Map<string, string>()
      for (const [p, v] of b.declarations) seen.set(p, v)
      if (b.declarations.length) out.set(key, seen)
    }
    return out
  }

  it.each([
    ['in a named theme', (body: string) => `@include greese.theme(brand) { ${body} }`],
    ['on the page', (body: string) => body],
  ])('adds up repeated calls %s, as one merged call', (_, wrap) => {
    const color = `@include greese.tokens((color: (primary: (light: #0f766e, dark: #5eead4), accentContent: #000)));`
    const shape = `@include greese.tokens((radius: (md: 2px), color: (accent: "#fde047")), $extend: (space: (9: 5rem)));`
    const merged = `@include greese.tokens((color: (primary: (light: #0f766e, dark: #5eead4), accentContent: #000, accent: "#fde047"), radius: (md: 2px)), $extend: (space: (9: 5rem)));`
    const split = compile(wrap(`${color}\n${shape}`))
    expect(effective(split)).toEqual(effective(compile(wrap(merged))))
    // The second call writes only what it changes, not the theme again.
    expect(split.match(/--greese-space-4:/g)?.length ?? 0).toBeLessThanOrEqual(1)
  })

  it('keeps an earlier call’s explicit value over what a later one derives', () => {
    const css = compile(`@include greese.theme(brand) {
      @include greese.tokens((color: (primaryContent: #123456)));
      @include greese.tokens((color: (primary: "#fde047")));
    }`)
    const values = effective(css).get('@layer greese.theme > [data-greese-theme=brand]')
    expect(values?.get('--greese-color-primary-content')).toBe('#123456')
    expect(values?.get('--greese-color-primary')).toBe('#fde047')
  })

  it('scopes to a theme with scope(name), and to the page with null, false or empty', () => {
    const card = `@include greese.component(Card) { padding: 0; }`
    expect(
      rules(
        compile(`@include greese.scope(brand) { ${card} }`),
        '[data-greese-theme=brand] .greese-Card'
      )
    ).toHaveLength(1)
    for (const none of ['null', 'false', "''"])
      expect(
        rules(compile(`@include greese.scope(${none}) { ${card} }`), '.greese-Card')
      ).toHaveLength(1)
  })

  it('rejects unknown token groups and keys', () => {
    expect(() => compile('@include greese.tokens((colr: (accent: red)));')).toThrow(
      /no token group `colr`/
    )
    expect(() => compile('@include greese.tokens((radius: (huge: 1px)));')).toThrow(
      /no `radius` token `huge`. Keys: none, sm, md, lg, xl, pill/
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
    const css = compile(`@include greese.keyframes(greese-float-up, (
      from: (opacity: 0, translate: '0 2rem'),
      '60%': (opacity: 1),
      to: (opacity: 1, translate: '0 0'),
    ));`)
    expect(css).toContain('@layer greese.utilities')
    const steps = blocks(css).filter(
      (b) => b.within.at(-1) === '@keyframes greese-float-up'
    )
    expect(steps.map((b) => [b.prelude, b.declarations])).toEqual([
      [
        'from',
        [
          ['opacity', '0'],
          ['translate', '0 2rem'],
        ],
      ],
      ['60%', [['opacity', '1']]],
      [
        'to',
        [
          ['opacity', '1'],
          ['translate', '0 0'],
        ],
      ],
    ])
  })

  it('only takes names that start with greese-, and none of a built-in', () => {
    expect(() =>
      compile(`@include greese.keyframes(wobble, (from: (opacity: 0)));`)
    ).toThrow(/start with `greese-`/)
    expect(() =>
      compile(`@include greese.keyframes(greese-fade-up, (from: (opacity: 0)));`)
    ).toThrow(/built-in effect keeps its keyframes/)
  })
})

describe('SCSS kit: resets', () => {
  it('guards each theme rule for its layer: component() as shape, motion() as motion', () => {
    const css = compileGuarded(`@include greese.component(Dialog) {
      padding: 0;
      @include greese.part(body) { margin: 0; }
      @include greese.motion((enter: fade-up));
    }
    @include greese.component(Card, $layer: color) { color: red; }`)
    expect(rules(css, `.greese-Dialog${guard('shape')}`)[0]?.declarations).toEqual([
      ['padding', '0'],
    ])
    expect(
      rules(css, `.greese-Dialog${guard('shape')} .greese-Dialog-body`)
    ).toHaveLength(1)
    expect(
      ruleIn(css, `.greese-Dialog${guard('motion')}`, '@layer greese.overrides', motionOk)
    ).toContainEqual(expect.arrayContaining(['animation']))
    expect(rules(css, `.greese-Card${guard('color')}`)).toHaveLength(1)
  })

  it('writes reset-guard() for rules of your own', () => {
    const css = compileGuarded(`.x#{greese.reset-guard(motion)} { a: b; }`)
    expect(rules(css, `.x${guard('motion')}`)).toHaveLength(1)
    expect(() => compileGuarded(`.x#{greese.reset-guard(sound)} { a: b; }`)).toThrow(
      /no theme layer `sound`. Layers: color, shape, motion/
    )
  })

  it('declares each layer’s defaults in the reset classes, and all three in .greese-reset', () => {
    const css = compileGuarded('@include greese.reset-classes;')
    const color = declared(css, '.greese-reset-color')
    expect(color).toContainEqual([
      '--greese-color-primary',
      'light-dark(#2771e0, #81b2ff)',
    ])
    expect(declared(css, '.greese-reset-shape')).toContainEqual([
      '--greese-corner-control',
      expect.any(String),
    ])
    expect(declared(css, '.greese-reset-motion')).toEqual(
      expect.arrayContaining([
        ['--greese-motion-overlay', 'initial'],
        ['--greese-motion-dialog-exit-opacity', 'initial'],
      ])
    )
    for (const layer of ['color', 'shape', 'motion'])
      expect(rules(css, '.greese-reset').map((r) => r.declarations)).toContainEqual(
        declared(css, `.greese-reset-${layer}`)
      )
  })

  it('declares the defaults in any rule with reset()', () => {
    const css = compileGuarded('.notice { @include greese.reset(color); }')
    expect(declared(css, '.notice')).toContainEqual([
      '--greese-color-primary',
      'light-dark(#2771e0, #81b2ff)',
    ])
    expect(declared(css, '.notice').some(([p]) => p.startsWith('--greese-corner'))).toBe(
      false
    )
  })

  it('leaves a component out of the layers reset() takes from it, for the rest of the build', () => {
    const css = compileGuarded(`
      @include greese.component(Card) { @include greese.reset(shape); }
      @include greese.component(Card) { border-radius: 0; @include greese.motion((enter: fade-up)); }
      @include greese.component(Card, $layer: color) { color: red; }
      .a { clip-path: none; }
      #{greese.themed('.greese-Card', Card)}, #{greese.themed('.greese-Tile', Tile)} { clip-path: inset(0); }`)
    // The reset layer's rule matches nothing; motion() inside it still plays.
    expect(
      rules(css, `.greese-Card${guard('shape')}:not(*)`).map((r) => r.declarations)
    ).toContainEqual([['border-radius', '0']])
    expect(
      ruleIn(css, `.greese-Card${guard('motion')}`, '@layer greese.overrides', motionOk)
    ).toHaveLength(1)
    expect(css).toContain('color: red')
    expect(
      rules(css, `.greese-Card${guard('shape')}:not(*)`).map((r) => r.declarations)
    ).toContainEqual([['clip-path', 'inset(0)']])
    expect(rules(css, `.greese-Tile${guard('shape')}`)).toHaveLength(1)
  })

  it('warns when reset() comes after the rules it would take back', () => {
    const warnings: string[] = []
    compileScss(
      `@use 'kit' as greese;
      @include greese.component(Card) { border-radius: 0; }
      @include greese.component(Card) { @include greese.reset(shape); }`,
      warnings
    )
    expect(warnings.join('\n')).toMatch(
      /reset\(shape\) for Card comes after Card's shape rules/
    )
  })
})
