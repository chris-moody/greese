/**
 * A theme as data: plain JSON, the file Theme Studio (or any other tool)
 * reads and writes. `specToLayout()` turns it into a folder of SCSS modules
 * that use the SCSS kit (`pkg:@greese/ui/scss/kit`), to keep in your source
 * and edit a part at a time; `specToScss()` into one file. Either compiles
 * exactly like a theme written by hand. Pure: Node and the browser both use
 * it (`@greese/ui/theme-files`).
 */

import {
  breakpoints as defaultBreakpoints,
  color,
  cssProperty,
  effectClass,
  cssPlan,
  entranceNames,
  exitNames,
  isBuiltInEffect,
  scalarTokens,
  typography as typeDefaults,
  LAYER_ORDER,
} from '../index.ts'
import {
  shapeClass,
  shapeParams,
  shapeProperties,
  shapeSelector,
  shapesCss,
  shapeTarget,
  type ShapeDef,
  type ShapeSize,
  type ShapeUse,
} from '../shapes.ts'
import {
  declarationProblems,
  mergeUses,
  scssProblems,
  splitScss,
  type ReservedUse,
  type SplitScss,
} from './scssModule.ts'
import { kebab } from '../kebab.ts'

/** One value for both schemes, or a light/dark pair. */
export type SchemeValue = string | { light: string; dark: string }

/** CSS declarations: `{ 'font-weight': '700' }`. */
export type Declarations = Record<string, string>

export interface MotionSpec {
  /** An effect that ends at rest, kebab-case: `fade-up`, or one of the theme's own. */
  enter?: string
  /** Your own `@keyframes` name, instead of a preset. */
  keyframes?: string
  /** An overlay exit, kebab-case: `fade-out`, `scale-out`, or one of the theme's own. */
  exit?: string
  duration?: string
  delay?: string
  ease?: string
  distance?: string
  /** Transition speeds for this component: `{ fast: '80ms' }`. */
  durations?: Record<string, string>
  /** Transition curves for this component: `{ standard: 'linear' }`. */
  easings?: Record<string, string>
}

export interface ComponentSpec {
  /** Declarations on the component's root class. */
  styles?: Declarations
  /** Component variables and tokens, without `--greese-`: `{ 'button-tone': '…' }`. */
  vars?: Record<string, SchemeValue>
  /** Declarations per modifier: `{ outline: { 'border-width': '2px' } }`. */
  modifiers?: Record<string, Declarations>
  /** Declarations per part: `{ icon: { opacity: '0.8' } }`. */
  parts?: Record<string, Declarations>
  /**
   * The SCSS of this component and what it contains (ADR 0021): leading `@use`
   * lines, then a body written inside `.greese-<Name>` (`&`, nesting, mixins,
   * the kit). The Studio starts it from the library's own SCSS for the family;
   * it is stored only once edited, and then applies in full, inside this
   * component only.
   */
  scss?: string
  motion?: MotionSpec
  /** One of the theme's shapes (`shapes`), by name: its outline, border and motion. */
  shape?: string
}

/**
 * An effect's keyframes, as greese.js takes them and the theme's JSON holds
 * them: a list of frames, or property → values.
 */
export type ThemeKeyframes =
  ReadonlyArray<Record<string, unknown>> | Record<string, unknown>

/**
 * An effect the theme defines: its keyframes (greese.js's), and how long it
 * runs. A tool that knows greese.js's types narrows `K` to its `Keyframes`.
 */
export interface EffectSpec<K extends ThemeKeyframes = ThemeKeyframes> {
  keyframes: K
  /** Seconds. Without one, the effect takes the instance's, else 0.5. */
  duration?: number
}

/**
 * A selector rule for page transitions (ADR 0029; the kit's
 * `page-transitions()`): `'still'` keeps the elements in place, or their own
 * `enter` (an entrance) and `exit` (an exit) by kebab-case name or `none`,
 * `duration` (a token or a time), `delay` and `ease`. What it leaves out
 * follows the theme's page roles.
 */
export type PageRuleSpec =
  'still' | Partial<Record<'enter' | 'exit' | 'duration' | 'delay' | 'ease', string>>

/** What a page rule can set. */
export const PAGE_RULE_KEYS = ['enter', 'exit', 'duration', 'delay', 'ease'] as const

export interface ThemeSpec<K extends ThemeKeyframes = ThemeKeyframes> {
  /**
   * Scope to `data-greese-theme="<name>"` (a complete theme, as
   * `createTheme`). Empty: change the page's defaults.
   */
  name?: string
  /** Token overrides by group, kebab-case: `{ color: { accent: … }, radius: { md: '12px' } }`. */
  tokens?: Record<string, Record<string, SchemeValue>>
  /**
   * The breakpoints the stylesheet is built with, key to min-width in px:
   * every key (the five built-in ones stay; added ones are new), smallest
   * first. Absent means the defaults. Setting them makes the studio build the
   * whole stylesheet, since the media queries are fixed in it.
   */
  breakpoints?: Record<string, number>
  /**
   * The type system by variant, then `base` or a breakpoint, then property:
   * `{ h1: { base: { size: '2rem' }, lg: { size: '4rem' } } }`.
   */
  typography?: Record<string, Record<string, Record<string, string>>>
  /** Tunes every `greese` prop entrance: duration, delay, ease, distance. */
  motionDefaults?: Record<string, string>
  /** Parts of a page with page-transition motion of their own, by selector. */
  pageRules?: Record<string, PageRuleSpec>
  /**
   * Effects by camelCase name. A built-in's name retunes it (a preset's
   * `@keyframes` are overridden in the theme's CSS, and every effect is
   * defined for the runtime); any other name adds a new effect.
   */
  effects?: Record<string, EffectSpec<K>>
  /** Overrides by component name: `{ Button: { … } }`. */
  components?: Record<string, ComponentSpec>
  /**
   * Shapes by kebab-case name (ADR 0024): each is a `greese-shape-<name>`
   * class for any element, and components take one with `shape`.
   */
  shapes?: Record<string, ShapeDef>
}

export const emptySpec = (): ThemeSpec => ({ tokens: {}, components: {} })

/** The breakpoints in effect, smallest first: the theme's, else the defaults. */
export const breakpointsOf = (spec: ThemeSpec): Array<[string, number]> =>
  Object.entries(spec.breakpoints ?? defaultBreakpoints).sort(([, a], [, b]) => a - b)

/** The theme's own breakpoints, if they differ from the defaults. */
export const customBreakpoints = (
  spec: ThemeSpec
): Array<[string, number]> | undefined => {
  const own = breakpointsOf(spec)
  const standard = Object.entries(defaultBreakpoints)
  const same =
    own.length === standard.length &&
    own.every(([key, width], i) => key === standard[i]![0] && width === standard[i]![1])
  return spec.breakpoints && !same ? own : undefined
}

/** A Sass map of breakpoints: `(xs: 0px, tablet: 700px, '2xl': 1800px)`. */
const breakpointMap = (list: Array<[string, number]>): string =>
  `(${list.map(([key, width]) => `${/^\d/.test(key) ? `'${key}'` : key}: ${width}px`).join(', ')})`

const NAME = /^[a-z][a-z0-9-]*$/
const COMPONENT = /^[A-Z][A-Za-z]*$/
const EFFECT_NAME = /^[a-z][A-Za-z0-9]*$/
const PROPERTY = /^(--)?[a-z][a-z0-9-]*$/
const KEY = /^[a-z0-9][a-z0-9-]*$/
/** A type property, as the CSS property in its JavaScript form: `fontSize`. */
const TYPE_PROP = /^[a-z][a-zA-Z]*$/
// Values become CSS text: nothing that could end a declaration or a rule.
const UNSAFE = /[;{}]|<\//
const SHAPE_NAME = /^[a-z][a-z0-9-]*$/
const PARAM = /^[a-z][a-z0-9]*$/

/** Problems that would make the generated SCSS unsafe or invalid. */
export const validateSpec = (spec: ThemeSpec): string[] => {
  const errors: string[] = []
  const value = (where: string, v: unknown) => {
    const values = typeof v === 'object' && v !== null ? Object.values(v as object) : [v]
    for (const s of values)
      if (typeof s !== 'string' || UNSAFE.test(s))
        errors.push(`${where}: ${JSON.stringify(s)} is not a CSS value`)
  }
  const key = (where: string, k: string, pattern = KEY) => {
    if (!pattern.test(k))
      errors.push(`${where}: ${JSON.stringify(k)} is not a valid name`)
  }
  const decls = (where: string, d: Declarations | undefined) => {
    for (const [p, v] of Object.entries(d ?? {})) {
      key(where, p, PROPERTY)
      value(`${where} ${p}`, v)
    }
  }

  if (spec.name && !NAME.test(spec.name))
    errors.push(
      `name: ${JSON.stringify(spec.name)} must be lower-case letters, digits and -`
    )
  for (const [group, values] of Object.entries(spec.tokens ?? {})) {
    key('tokens', group)
    for (const [k, v] of Object.entries(values)) {
      key(`tokens.${group}`, k)
      value(`tokens.${group}.${k}`, v)
    }
  }
  if (spec.breakpoints) {
    const keys = Object.keys(spec.breakpoints)
    for (const built of Object.keys(defaultBreakpoints))
      if (!keys.includes(built))
        errors.push(`breakpoints: ${built} is needed, components use it`)
    for (const [k, width] of Object.entries(spec.breakpoints)) {
      if (!/^[a-z0-9]+$/i.test(k))
        errors.push(`breakpoints.${k}: a key is one word, letters and digits`)
      if (!Number.isInteger(width) || width < 0)
        errors.push(`breakpoints.${k}: ${JSON.stringify(width)} is not a width in px`)
    }
    if (spec.breakpoints.xs !== 0) errors.push('breakpoints.xs: must be 0')
    const widths = Object.values(spec.breakpoints)
    if (new Set(widths).size !== widths.length)
      errors.push('breakpoints: every key needs its own width')
  }
  for (const [variant, points] of Object.entries(spec.typography ?? {})) {
    key('typography', variant)
    for (const [point, style] of Object.entries(points)) {
      key(`typography.${variant}`, point)
      for (const [prop, v] of Object.entries(style)) {
        key(`typography.${variant}.${point}`, prop, TYPE_PROP)
        value(`typography.${variant}.${point}.${prop}`, v)
      }
    }
  }
  for (const [k, v] of Object.entries(spec.motionDefaults ?? {})) {
    key('motionDefaults', k)
    value(`motionDefaults.${k}`, v)
  }
  const entrances = new Set(entranceNames().map(effectClass))
  const exits = new Set(exitNames().map(effectClass))
  for (const [selector, rule] of Object.entries(spec.pageRules ?? {})) {
    const where = `pageRules[${JSON.stringify(selector)}]`
    // It's written into a stylesheet: nothing that could end a rule.
    if (!selector.trim() || /[<>{};]/.test(selector)) {
      errors.push(`${where}: not a selector`)
      continue
    }
    if (rule === 'still') continue
    if (typeof rule !== 'object' || rule === null) {
      errors.push(`${where}: \`still\`, or ${PAGE_RULE_KEYS.join(', ')}`)
      continue
    }
    for (const [k, v] of Object.entries(rule)) {
      if (!(PAGE_RULE_KEYS as readonly string[]).includes(k))
        errors.push(`${where}.${k}: a rule takes ${PAGE_RULE_KEYS.join(', ')}`)
      value(`${where}.${k}`, v)
      const names = k === 'enter' ? entrances : k === 'exit' ? exits : undefined
      if (names && v && v !== 'none' && !names.has(v))
        errors.push(
          `${where}.${k}: ${JSON.stringify(v)} is not ${k === 'enter' ? 'an entrance' : 'an exit'}`
        )
    }
  }
  for (const [name, effect] of Object.entries(spec.effects ?? {})) {
    if (!EFFECT_NAME.test(name))
      errors.push(`effects: ${JSON.stringify(name)} must be camelCase letters and digits`)
    else if (isBuiltInEffect(name))
      errors.push(
        `effects: ${name} is a built-in effect, which keeps its own keyframes; name yours differently and assign it`
      )
    const where = `effects.${name}`
    const frames = effect?.keyframes
    const list = Array.isArray(frames)
      ? frames
      : frames && typeof frames === 'object'
        ? [frames]
        : []
    if (
      !list.length ||
      !list.every((f) => f && typeof f === 'object' && !Array.isArray(f))
    )
      errors.push(`${where}: keyframes are an object, or a list of objects`)
    for (const frame of list) {
      for (const [prop, v] of Object.entries(frame as Record<string, unknown>)) {
        if (prop === 'offset') {
          if (!(typeof v === 'number' && v >= 0 && v <= 1))
            errors.push(
              `${where}: offset ${JSON.stringify(v)} is not a number from 0 to 1`
            )
          continue
        }
        if (prop === 'ease') {
          // An ease's name, with numbers if it takes them (`steps(4)`,
          // `elastic.out(1, 0.3)`), or a cubic Bézier's four numbers.
          const named =
            typeof v === 'string' && /^[A-Za-z][\w.-]*(\([\d., ]*\))?$/.test(v)
          const bezier =
            Array.isArray(v) &&
            v.length === 4 &&
            v.every((n) => typeof n === 'number' && Number.isFinite(n))
          if (!named && !bezier)
            errors.push(
              `${where}: ease ${JSON.stringify(v)} is not an ease name or four numbers`
            )
          continue
        }
        if (!/^(--)?[A-Za-z][A-Za-z0-9-]*$/.test(prop))
          errors.push(`${where}: ${JSON.stringify(prop)} is not a property name`)
        for (const x of Array.isArray(v) ? v : [v])
          if (
            !(typeof x === 'number' && Number.isFinite(x)) &&
            (typeof x !== 'string' || UNSAFE.test(x))
          )
            errors.push(`${where} ${prop}: ${JSON.stringify(x)} is not a value`)
      }
    }
    if (effect?.duration !== undefined && !(effect.duration > 0))
      errors.push(`${where}: duration is a number of seconds above 0`)
  }
  for (const [name, c] of Object.entries(spec.components ?? {})) {
    key('components', name, COMPONENT)
    decls(`${name} styles`, c.styles)
    for (const [k, v] of Object.entries(c.vars ?? {})) {
      key(`${name} vars`, k)
      value(`${name} vars.${k}`, v)
    }
    for (const [m, d] of Object.entries(c.modifiers ?? {})) {
      key(`${name} modifiers`, m)
      decls(`${name}--${m}`, d)
    }
    for (const [p, d] of Object.entries(c.parts ?? {})) {
      key(`${name} parts`, p)
      decls(`${name}-${p}`, d)
    }
    if (c.scss) errors.push(...scssProblems(c.scss).map((p) => `${name} scss: ${p}`))
    const { durations, easings, ...motion } = c.motion ?? {}
    for (const [k, v] of Object.entries({ ...motion, ...durations, ...easings }))
      value(`${name} motion.${k}`, v)
  }
  for (const [name, shape] of Object.entries(spec.shapes ?? {})) {
    const where = `shapes.${name}`
    if (!SHAPE_NAME.test(name))
      errors.push(`shapes: ${JSON.stringify(name)} is not a kebab-case name`)
    if (!Array.isArray(shape.points) || shape.points.length < 3)
      errors.push(`${where}: a shape needs at least 3 points`)
    for (const [i, p] of (shape.points ?? []).entries())
      for (const [axis, l] of [
        ['x', p?.x],
        ['y', p?.y],
      ] as const) {
        if (!l || typeof l !== 'object') {
          errors.push(`${where} point ${i + 1}: no ${axis}`)
          continue
        }
        for (const k of ['pct', 'px', 'k'] as const)
          if (l[k] !== undefined && !Number.isFinite(l[k]))
            errors.push(`${where} point ${i + 1} ${axis}.${k}: not a number`)
        if (l.param !== undefined && !PARAM.test(l.param))
          errors.push(
            `${where} point ${i + 1} ${axis}.param: ${JSON.stringify(l.param)} is not a parameter name`
          )
      }
    for (const state of ['params', 'hover', 'active'] as const)
      for (const [k, v] of Object.entries(shape[state] ?? {})) {
        if (!PARAM.test(k))
          errors.push(`${where}.${state}: ${JSON.stringify(k)} is not a parameter name`)
        if (!Number.isFinite(v)) errors.push(`${where}.${state}.${k}: not a number of px`)
      }
    if (shape.border?.color && UNSAFE.test(shape.border.color))
      errors.push(
        `${where}.border.color: ${JSON.stringify(shape.border.color)} is not a value`
      )
  }
  for (const [name, c] of Object.entries(spec.components ?? {}))
    if (c.shape && !spec.shapes?.[c.shape])
      errors.push(
        `${name} shape: the theme has no shape named ${JSON.stringify(c.shape)}`
      )
  errors.push(...mergedUses(spec, 'stylesheet').problems)
  errors.push(
    ...declarationProblems(
      componentSplits(spec).map(([name, split]) => [name, split.declarations])
    )
  )
  return errors
}

/** The imports the theme file writes itself, which a component's own may repeat but not contradict. */
const reservedUses = (spec: ThemeSpec, entry: 'stylesheet' | 'config'): ReservedUse[] => [
  { url: 'pkg:@greese/ui/scss/kit', namespace: 'greese' },
  ...(customBreakpoints(spec)
    ? [
        entry === 'config'
          ? { url: 'pkg:@greese/ui/scss/config', namespace: 'config' }
          : { url: 'pkg:@greese/ui/scss', namespace: 'scss' },
      ]
    : []),
]

/** Every component with SCSS, split into imports, declarations and body, by name. */
const componentSplits = (spec: ThemeSpec): Array<[string, SplitScss]> =>
  Object.keys(spec.components ?? {})
    .sort()
    .filter((name) => spec.components![name]!.scss?.trim())
    .map((name) => [name, splitScss(spec.components![name]!.scss!)])

/** Every component's SCSS imports, merged, for the top of the theme file. */
const mergedUses = (spec: ThemeSpec, entry: 'stylesheet' | 'config') =>
  mergeUses(
    componentSplits(spec).map(([name, split]) => [name, split.uses] as const),
    reservedUses(spec, entry)
  )

/** The token names the system has, by kebab-case group: `color`, `radius`, `line-height`… */
const KNOWN: Record<string, Set<string>> = {
  color: new Set(Object.keys(color).map(kebab)),
  ...Object.fromEntries(
    Object.entries(scalarTokens).map(([group, values]) => [
      kebab(group),
      new Set(Object.keys(values).map(kebab)),
    ])
  ),
}

/**
 * A token the theme adds: its group exists but the system has no token of
 * that name. (A group that doesn't exist stays an override, so the kit
 * reports it.)
 */
export const isCustomToken = (group: string, key: string): boolean =>
  group in KNOWN && !KNOWN[group]!.has(key)

const isEmpty = (o: object | undefined): boolean =>
  !o || Object.values(o).every((v) => v === '' || v === undefined)

/** A Sass string: the kit unquotes it when it writes CSS. */
const str = (value: string): string => JSON.stringify(value)

const schemeValue = (v: SchemeValue): string =>
  typeof v === 'string' ? str(v) : `(light: ${str(v.light)}, dark: ${str(v.dark)})`

/** A Sass map literal, one entry per line. */
const map = (entries: Array<[string, string]>, indent: string): string =>
  `(\n${entries.map(([k, v]) => `${indent}  ${k}: ${v},`).join('\n')}\n${indent})`

const filled = <T>(record: Record<string, T> | undefined): Array<[string, T]> =>
  Object.entries(record ?? {}).filter(
    ([, v]) =>
      v !== '' && v !== undefined && !(typeof v === 'object' && isEmpty(v as object))
  )

const declarations = (d: Declarations | undefined, indent: string): string[] =>
  filled(d).map(([p, v]) => `${indent}${p}: ${v};`)

const componentScss = (
  name: string,
  c: ComponentSpec,
  indent: string,
  mark: (origin: LineOrigin & { span: number }) => string
): string => {
  const inner = `${indent}  `
  const lines = declarations(c.styles, inner)
  const vars = filled(c.vars)
  if (vars.length)
    lines.push(
      `${inner}@include greese.vars(${map(
        vars.map(([k, v]) => [k, schemeValue(v)]),
        inner
      )});`
    )
  for (const [kind, targets] of [
    ['modifier', c.modifiers],
    ['part', c.parts],
  ] as const) {
    for (const [target, d] of filled(targets)) {
      const body = declarations(d, `${inner}  `)
      if (body.length)
        lines.push(
          `${inner}@include greese.${kind}(${target}) {\n${body.join('\n')}\n${inner}}`
        )
    }
  }
  const { durations, easings, ...motion } = c.motion ?? {}
  const options: Array<[string, string]> = filled(motion).map(([k, v]) => [k, str(v)])
  for (const [k, group] of [
    ['durations', durations],
    ['easings', easings],
  ] as const) {
    const entries = filled(group)
    if (entries.length)
      options.push([k, `(${entries.map(([key, v]) => `${key}: ${str(v)}`).join(', ')})`])
  }
  if (options.length)
    lines.push(`${inner}@include greese.motion(${map(options, inner)});`)
  if (c.scss?.trim()) {
    // Only the body: the imports go at the top of the file. Its first line
    // carries a marker, so an error can be traced back to the box and line.
    const { body, bodyLine } = splitScss(c.scss)
    const bodyLines = body.trimEnd().split('\n')
    if (body.trim())
      lines.push(
        `${inner}${mark({ component: name, line: bodyLine, span: bodyLines.length })}${bodyLines
          .map((line, i) => (i === 0 || !line ? line : `${inner}${line}`))
          .join('\n')}`
      )
  }
  if (!lines.length) return ''
  return `${indent}@include greese.component(${name}) {\n${lines.join('\n')}\n${indent}}`
}

type TokenList = Array<readonly [string, Array<[string, SchemeValue]>]>

/** Tokens as a Sass map, by group then key. */
const tokenMap = (list: TokenList, indent: string): string =>
  map(
    list.map(([group, values]) => [
      group,
      map(
        values.map(([k, v]) => [/^\d/.test(k) ? `'${k}'` : k, schemeValue(v)]),
        `${indent}  `
      ),
    ]),
    indent
  )

/**
 * The theme's tokens, by group: those the system has (`own`, overrides) and
 * the rest (`added`, new ones, declared with `$extend`: the kit never
 * guesses at names).
 */
const tokenLists = (spec: ThemeSpec): { own: TokenList; added: TokenList } => {
  const split = (custom: boolean): TokenList =>
    filled(spec.tokens)
      .map(
        ([group, values]) =>
          [
            group,
            filled(values).filter(([k]) => isCustomToken(group, k) === custom),
          ] as const
      )
      .filter(([, values]) => values.length)
  return { own: split(false), added: split(true) }
}

/** One `tokens()` call: these overrides, and these new tokens as `$extend`. */
const tokensCall = (own: TokenList, added: TokenList, indent: string): string =>
  `${indent}@include greese.tokens(${own.length ? tokenMap(own, indent) : '()'}${
    added.length ? `, $extend: ${tokenMap(added, indent)}` : ''
  });`

/** The type system's changes as a Sass map for `typography()`, if there are any. */
const typographyMap = (spec: ThemeSpec, indent: string): string | undefined => {
  const types = filled(spec.typography)
    .map(
      ([variant, points]) =>
        [
          variant,
          filled(points)
            .map(([point, style]) => [point, filled(style)] as const)
            .filter(([, values]) => values.length),
        ] as const
    )
    .filter(([, points]) => points.length)
  if (!types.length) return undefined
  return map(
    types.map(([variant, points]) => [
      variant,
      map(
        points.map(([point, values]) => [
          point,
          map(
            values.map(([prop, v]) => [cssProperty(prop), str(v)]),
            `${indent}    `
          ),
        ]),
        `${indent}  `
      ),
    ]),
    indent
  )
}

/** `motion-defaults()`'s options as a Sass map, if there are any. */
const motionDefaultsMap = (spec: ThemeSpec, indent: string): string | undefined => {
  const defaults = filled(spec.motionDefaults)
  return defaults.length
    ? map(
        defaults.map(([k, v]) => [k, str(v)]),
        indent
      )
    : undefined
}

/** Selector rules for page transitions as a Sass map; a rule with nothing set says nothing. */
const pageRulesMap = (spec: ThemeSpec, indent: string): string | undefined => {
  const rules = Object.entries(spec.pageRules ?? {}).flatMap(
    ([selector, rule]): Array<[string, string]> => {
      if (rule === 'still') return [[str(selector), 'still']]
      const set = filled(rule as Record<string, string>)
      return set.length
        ? [
            [
              str(selector),
              map(
                set.map(([k, v]) => [k, str(v)]),
                `${indent}  `
              ),
            ],
          ]
        : []
    }
  )
  return rules.length ? map(rules, indent) : undefined
}

/**
 * What a theme file starts with. With its own breakpoints it builds the whole
 * stylesheet with them (`pkg:@greese/ui/scss`, which the kit then shares), so
 * the compiled CSS is the complete stylesheet. `config` brings in only the
 * settings, no CSS, so the theme part can be compiled alone.
 */
const scssUseLines = (spec: ThemeSpec, entry: 'stylesheet' | 'config'): string => {
  const own = customBreakpoints(spec)
  const kit = "@use 'pkg:@greese/ui/scss/kit' as greese;"
  return own ? `${stylesheetScss(own, entry)}\n${kit}` : kit
}

/** The line that builds the stylesheet (or just its settings) with these breakpoints. */
export const stylesheetScss = (
  breakpoints: Array<[string, number]>,
  entry: 'stylesheet' | 'config' = 'stylesheet'
): string =>
  `@use 'pkg:@greese/ui/${entry === 'config' ? 'scss/config' : 'scss'}' with ($breakpoints: ${breakpointMap(breakpoints)});`

/**
 * The theme as SCSS for the kit. Output is stable (sorted components) so the
 * file diffs cleanly in version control.
 */
export const specToScss = (
  spec: ThemeSpec,
  source = 'greese-theme.json',
  /** How the stylesheet is brought in: whole (the output), or just its settings. */
  entry: 'stylesheet' | 'config' = 'stylesheet'
): string => specToScssWithLines(spec, source, entry).scss

/** Where a line of the generated theme came from: a component's SCSS box, and its line there. */
export interface LineOrigin {
  component: string
  line: number
}

/** A marked line, and how many lines from it come from the same place. */
type Marked = LineOrigin & { span: number }

const MARK = /\/\*§(\d+)§\*\//

/**
 * `specToScss`, and which component's SCSS each line of it came from, so a
 * Sass error in the generated file points back at the box and line you wrote.
 */
export const specToScssWithLines = (
  spec: ThemeSpec,
  source = 'greese-theme.json',
  entry: 'stylesheet' | 'config' = 'stylesheet'
): { scss: string; origin: (line: number) => LineOrigin | undefined } => {
  const marks: Marked[] = []
  const mark = (origin: Marked) => `/*§${marks.push(origin) - 1}§*/`
  const indent = spec.name ? '  ' : ''
  const blocks: string[] = []

  const { own, added } = tokenLists(spec)
  if (own.length || added.length) blocks.push(tokensCall(own, added, indent))
  const types = typographyMap(spec, indent)
  if (types) blocks.push(`${indent}@include greese.typography(${types});`)
  const defaults = motionDefaultsMap(spec, indent)
  if (defaults) blocks.push(`${indent}@include greese.motion-defaults(${defaults});`)
  const pageRules = pageRulesMap(spec, indent)
  if (pageRules) blocks.push(`${indent}@include greese.page-transitions(${pageRules});`)

  for (const name of Object.keys(spec.components ?? {}).sort()) {
    const block = componentScss(name, spec.components![name]!, indent, mark)
    if (block) blocks.push(block)
  }

  const body = spec.name
    ? `@include greese.theme(${spec.name}) {\n${blocks.join('\n\n')}\n}`
    : blocks.join('\n\n')
  // Effects first, outside the theme's scope (@keyframes are global): the kit
  // learns their names here, so a component's `motion()` below can use them.
  const effects = Object.entries(spec.effects ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, effect]) => effectScss(name, effect))
  // Components' own imports, once each, after the kit and any breakpoints
  // (the partials load the configured settings).
  const imports = mergedUses(spec, entry).lines.map(
    ({ text, component, line }) => `${mark({ component, line, span: 1 })}${text}`
  )
  // Then their top-level variables, mixins and functions, which Sass allows
  // only at a file's top level, before any component uses them.
  const declared = componentSplits(spec).flatMap(([component, { declarations }]) =>
    declarations.map(
      ({ text, line }) =>
        `${mark({ component, line, span: text.split('\n').length })}${text.trim()}`
    )
  )
  const shapes = shapesScss(spec)
  const marked = `// Generated by greese ui Theme Studio from ${source}. Edit it there, or in
// the studio (npm run studio); changes made here are overwritten.
${scssUseLines(spec, entry)}${imports.length ? `\n${imports.join('\n')}` : ''}${declared.length ? `\n\n${declared.join('\n\n')}` : ''}
${effects.length ? `\n${effects.join('\n\n')}\n` : ''}${body ? `\n${body}\n` : ''}${shapes ? `\n${shapes}\n` : ''}`
  // Strip the markers, keeping where each body and import landed.
  const starts: Array<[generated: number, origin: Marked]> = []
  const scss = marked
    .split('\n')
    .map((text, i) => {
      const found = MARK.exec(text)
      if (!found) return text
      starts.push([i + 1, marks[Number(found[1])]!])
      return text.replace(MARK, '')
    })
    .join('\n')
  const origin = (line: number): LineOrigin | undefined => {
    const before = starts.filter(([at]) => at <= line).at(-1)
    if (!before) return undefined
    const [at, { span, ...from }] = before
    return line - at < span ? { ...from, line: from.line + (line - at) } : undefined
  }
  return { scss, origin }
}

/**
 * The theme's shapes (ADR 0024): their parameters registered, a
 * `greese-shape-<name>` class for each, and the components that take one.
 * Written by @greese/ui/shapes, the same code the Studio's editor previews
 * with; each selector goes through the kit's `themed()`, which scopes it to
 * the theme (`scope`, a Sass expression for its name) and, for a component,
 * guards it for the shape layer, so `.greese-reset-shape` and `reset(shape)`
 * reach shapes too.
 */
export const shapesScss = (
  spec: ThemeSpec,
  scope = spec.name ?? 'null',
  size?: ShapeSize
): string => {
  const shapes = Object.fromEntries(filled(spec.shapes) as Array<[string, ShapeDef]>)
  if (!Object.keys(shapes).length) return ''
  const themed = (selector: string, component?: string) =>
    `#{greese.themed(${str(selector)}${component ? `, ${component}` : ''})}`
  const uses: ShapeUse[] = Object.keys(shapes).map((name) => ({
    shape: name,
    selector: themed(`.${shapeClass(name)}`),
  }))
  for (const name of Object.keys(spec.components ?? {}).sort()) {
    const shape = spec.components![name]!.shape
    if (shape && shapes[shape])
      uses.push({
        ...shapeTarget(name),
        shape,
        selector: themed(shapeSelector(name), name),
      })
  }
  const params = new Set(Object.values(shapes).flatMap((def) => shapeParams(def)))
  const css = shapesCss(shapes, uses, size)
    .split('\n')
    .map((l) => (l ? `    ${l}` : l))
    .join('\n')
  return `// Shapes (ADR 0024)\n${shapeProperties(params)}\n${LAYER_ORDER}\n@layer greese.overrides {\n  @include greese.scope(${scope}) {\n${css}\n  }\n}`
}

/**
 * One effect of the theme as the kit's `effect()`: the same CSS the built-in
 * effects have, planned by `cssPlan()` in @greese/ui from the keyframes alone.
 * A built-in's name retunes it; any other adds one that `motion()` accepts.
 */
const effectScss = (name: string, { keyframes }: EffectSpec): string => {
  const plan = cssPlan(keyframes)
  const declarations = (values: Record<string, string>) =>
    map(
      Object.entries(values).map(([p, v]) => [p, str(v)]),
      '    '
    )
  const parts: Array<[string, string]> = []
  if (plan.enter)
    parts.push([
      'enter',
      map(
        plan.enter.map(([at, values]) => [
          /%$/.test(at) ? `'${at}'` : at,
          declarations(values),
        ]),
        '  '
      ),
    ])
  else
    parts.push(['exit', Object.keys(plan.exit).length ? declarations(plan.exit) : '()'])
  return `@include greese.effect(${effectClass(name)}, ${map(parts, '')});`
}

// ---------------------------------------------------------------------------
// The layout: a theme as a folder of SCSS modules (ADR 0034).
// ---------------------------------------------------------------------------

/**
 * The first line of every file `specToLayout()` writes. A tool that rewrites
 * the layout leaves a file alone once this line is gone: whoever deleted it
 * maintains that file by hand now.
 */
export const LAYOUT_MARK = '// greese-theme: generated'

const header = (source: string, about: string): string =>
  `${LAYOUT_MARK} from ${source}. Delete this line to keep the file as yours:
// tools that regenerate the layout leave it alone from then on.
${about
  .trim()
  .split('\n')
  .map((line) => (line ? `// ${line}` : '//'))
  .join('\n')}
`

const KIT = "@use 'pkg:@greese/ui/scss/kit' as greese;"

/** A file name for a name: `AccordionItem` → `accordion-item`. */
const fileName = (name: string): string => kebab(name).replace(/^-/, '')

/** A Sass map's entries, live then commented out: what a file sets, then the defaults it leaves alone. */
const mapLines = (
  live: Array<[string, string]>,
  commented: Array<[string, string]>,
  indent: string
): string =>
  [
    ...live.map(([k, v]) => `${indent}${k}: ${v},`),
    ...commented.map(([k, v]) => `${indent}// ${k}: ${v},`),
  ].join('\n')

/** A Sass map key: one that starts with a digit is quoted (`'4'`). */
const key = (k: string): string => (/^\d/.test(k) ? `'${k}'` : k)

/** Every token group, kebab-case, with its keys' defaults: color first, as the docs list them. */
const TOKEN_DEFAULTS: Array<[string, Array<[string, SchemeValue]>]> = [
  ['color', Object.entries(color).map(([k, v]) => [kebab(k), v])],
  ...Object.entries(scalarTokens).map(
    ([group, values]): [string, Array<[string, SchemeValue]>] => [
      kebab(group),
      Object.entries(values).map(([k, v]) => [kebab(k), v as string]),
    ]
  ),
]

/** One token group's file: what the theme sets, then every default it leaves, commented. */
const tokenGroupScss = (
  group: string,
  set: Array<[string, SchemeValue]>,
  extra: Array<[string, SchemeValue]>,
  defaults: Array<[string, SchemeValue]>
): string => {
  const taken = new Set(set.map(([k]) => k))
  const live = set.map(([k, v]): [string, string] => [key(k), schemeValue(v)])
  const rest = defaults
    .filter(([k]) => !taken.has(k))
    .map(([k, v]): [string, string] => [key(k), schemeValue(v)])
  return `$tokens: (
  ${group}: (
${mapLines(live, rest, '    ')}
  ),
);
$extend: ${extra.length ? tokenMap([[group, extra]], '') : '()'};
`
}

/** The type system's changes, then every default left alone, commented, as `$changes`. */
const typographyScss = (spec: ThemeSpec): string => {
  const points = ['base', ...breakpointsOf(spec).map(([k]) => k)]
  const byPoint = (a: string, b: string) => points.indexOf(a) - points.indexOf(b)
  const props = (style: Record<string, string>) =>
    Object.entries(style).map(([p, v]): [string, string] => [cssProperty(p), str(v)])
  const oneLine = (style: Record<string, string>) =>
    `(${props(style)
      .map(([p, v]) => `${p}: ${v}`)
      .join(', ')})`
  const set = Object.fromEntries(
    filled(spec.typography).map(([variant, at]) => [
      variant,
      Object.fromEntries(
        filled(at)
          .map(([point, style]) => [point, Object.fromEntries(filled(style))] as const)
          .filter(([, style]) => Object.keys(style).length)
      ),
    ])
  ) as Record<string, Record<string, Record<string, string>>>
  const lines: string[] = []
  const variants = [
    ...Object.keys(set).filter((v) => Object.keys(set[v]!).length),
    ...Object.keys(typeDefaults).filter((v) => !set[v] || !Object.keys(set[v]!).length),
  ]
  for (const variant of variants) {
    const own = set[variant] ?? {}
    const base =
      (typeDefaults as Record<string, Record<string, Record<string, string>>>)[variant] ??
      {}
    if (!Object.keys(own).length) {
      // Untouched: the variant's defaults, commented out whole.
      lines.push(
        `  // ${variant}: (`,
        ...Object.keys(base)
          .sort(byPoint)
          .map((point) => `  //   ${point}: ${oneLine(base[point]!)},`),
        '  // ),'
      )
      continue
    }
    lines.push(`  ${variant}: (`)
    for (const point of Object.keys(own))
      lines.push(
        `    ${point}: (`,
        mapLines(
          props(own[point]!),
          props(
            Object.fromEntries(
              Object.entries(base[point] ?? {}).filter(([p]) => !(p in own[point]!))
            )
          ),
          '      '
        ),
        '    ),'
      )
    for (const point of Object.keys(base)
      .filter((p) => !own[p])
      .sort(byPoint))
      lines.push(`    // ${point}: ${oneLine(base[point]!)},`)
    lines.push('  ),')
  }
  return `$changes: (\n${lines.join('\n')}\n);\n`
}

/**
 * `motion-defaults()`'s options a theme leaves alone, with the library's own
 * value where it has one (the rest are listed in the file's comment).
 */
const MOTION_BASES: Array<[string, string]> = [
  ['duration', '0.5s'],
  ['delay', '0s'],
  ['ease', 'out'],
  ['stagger', '0s'],
  ['theme', 'fade-up'],
  ['page', 'fade-in'],
  ['page-exit', 'fade-out'],
  ['page-exit-order', 'reverse'],
  ['page-mode', 'auto'],
]

/** The breakpoints, one per line, for `_settings.scss`. */
const breakpointLines = (list: Array<[string, number]>): string =>
  list.map(([k, width]) => `    ${/^\d/.test(k) ? `'${k}'` : k}: ${width}px,`).join('\n')

/**
 * The theme as a folder of SCSS modules, by path inside the folder. Each file
 * is a Sass module that writes its own CSS when it is loaded, so a component,
 * a token group or the motion can be edited, reviewed and replaced alone;
 * `main.scss` loads them and is the file to compile. The theme's CSS is the
 * same as `specToScss()`'s.
 *
 * Every setting has its place, written out even when the theme leaves it
 * alone: each token group's file and the type system's list every default,
 * commented, so a change is an uncomment; `_settings.scss` holds the
 * breakpoints, and builds greese ui's stylesheet and utility classes with them
 * whenever they differ from the library's.
 *
 *   main.scss              the entry: only `@use` lines
 *   _settings.scss         breakpoints, `$library`, `$utilities` and `$theme`
 *   _library.scss          greese ui's stylesheet, built here when `$library`
 *   _resets.scss           theme layers taken back from components, first
 *   tokens/_index.scss     one `tokens()` call per group, then the type system
 *   tokens/_<group>.scss   a group's values (`$tokens`) and new tokens (`$extend`)
 *   tokens/_typography.scss
 *   motion/_index.scss     effects, motion roles and page transitions
 *   components/_<name>.scss   one component each, its own imports and helpers
 *   shapes/_index.scss     the shapes, their sizes and what takes them
 *   utilities/_index.scss  greese ui's utility classes when `$utilities`, and yours
 *
 * `options.components` names component modules of your own
 * (`components/_hero.scss`) for `main.scss` to load too, so a tool that
 * rewrites the layout keeps loading the files it no longer writes.
 */
export const specToLayout = (
  spec: ThemeSpec,
  source = 'greese-theme.json',
  options: { components?: string[] } = {}
): Record<string, string> => {
  const files: Record<string, string> = {}
  const scope = 'settings.$theme'
  const entry = ['settings', 'library', 'resets', 'tokens', 'motion']

  files['_settings.scss'] = `${header(
    source,
    `What every file of the theme reads. main.scss loads it first: Sass
configures a module once, when it is first loaded.`
  )}
/// The breakpoints, smallest first, in px: change one here and every media
/// query follows, the components' and the utility classes' alike. Keep xs
/// (at 0), sm, md, lg and xl; add your own (one word each). The type system's
/// values can be set here too: \`$typography\` (see tokens/_typography.scss).
@use 'pkg:@greese/ui/scss/config' with (
  $breakpoints: (
${breakpointLines(breakpointsOf(spec))}
  )
);
@use 'pkg:@greese/ui/scss/maps';

/// Build greese ui's whole stylesheet here, with these breakpoints: import
/// main.scss in place of \`styles.css\`. Its media queries are fixed when it's
/// built, so it's on whenever the breakpoints differ from the library's. Set
/// \`true\` to always ship one stylesheet; with \`false\`, import \`styles.css\`
/// before main.scss, and keep the library's breakpoints.
$library: config.$breakpoints != maps.$breakpoints;

/// Build greese ui's utility classes here too (utilities/_index.scss), with
/// these breakpoints, in place of \`utilities.css\`. Set \`false\` if the app uses
/// none, or set it \`true\` to purge them with \`$only\` there.
$utilities: $library;

/// The theme's name: its rules apply inside \`data-greese-theme="<name>"\`
/// (ThemeProvider's \`theme="<name>"\`). \`null\` makes them the page's own
/// defaults. Set it here rather than with \`@use … with ($theme: …)\`, where
/// Sass reads \`null\` as "not configured" and keeps this value.
$theme: ${spec.name || 'null'};
`

  files['_library.scss'] = `${header(
    source,
    `greese ui's whole stylesheet, built with the theme's breakpoints when
_settings.scss says so ($library). It comes before the theme, which the
cascade layers put above it anyway.`
  )}@use 'sass:meta';
@use 'settings';

@if settings.$library {
  @include meta.load-css('pkg:@greese/ui/scss');
}
`

  files['_resets.scss'] = `${header(
    source,
    `Theme layers (color, shape, motion) taken back from components. It loads
before the theme's rules, which a reset leaves out from then on:

  @include greese.scope(settings.$theme) {
    @include greese.component(Card) {
      @include greese.reset(shape);
    }
  }

Part of a page takes them back with a class instead: .greese-reset-color,
-shape, -motion, or .greese-reset for all three (@greese/ui/css/resets.css).`
  )}@use 'settings';
${KIT}
`

  // Tokens: a file per group, every group, then one call each, which add up
  // (one that sets nothing writes nothing).
  const { own: overrides, added } = tokenLists(spec)
  const setGroups = [...new Set([...overrides, ...added].map(([group]) => group))]
  const groups = [
    ...setGroups,
    ...TOKEN_DEFAULTS.map(([g]) => g).filter((g) => !setGroups.includes(g)),
  ]
  for (const group of groups) {
    const set = overrides.find(([g]) => g === group)?.[1] ?? []
    const extra = added.find(([g]) => g === group)?.[1] ?? []
    files[`tokens/_${group}.scss`] = `${header(
      source,
      `The theme's ${group} tokens: those it sets ($tokens), then the defaults it
leaves alone, commented (uncomment one to change it), and those it adds
($extend), which become --greese-${group}-<key>.`
    )}${tokenGroupScss(
      group,
      set,
      extra,
      TOKEN_DEFAULTS.find(([g]) => g === group)?.[1] ?? []
    )}`
  }
  files['tokens/_typography.scss'] = `${header(
    source,
    `The type system: by variant, then \`base\` or a breakpoint, then property.
What the theme changes, then the defaults it leaves alone, commented.`
  )}${typographyScss(spec)}`
  files['tokens/_index.scss'] = `${header(
    source,
    `The theme's tokens. Each tokens() call adds to the ones before it (in a
named theme, the first that sets anything declares the theme complete), so a
group's file can change alone.`
  )}@use '../settings';
${KIT}
${[...groups, 'typography'].map((g) => `@use '${g}';`).join('\n')}

@include greese.scope(${scope}) {
${[
  ...groups.map((g) => `  @include greese.tokens(${g}.$tokens, $extend: ${g}.$extend);`),
  '  @include greese.typography(typography.$changes);',
].join('\n')}
}
`

  // Motion: the theme's effects (global, as @keyframes are), then its roles.
  const effects = Object.entries(spec.effects ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, effect]) => effectScss(name, effect))
  const setMotion = filled(spec.motionDefaults)
  const pageRules = pageRulesMap(spec, '  ')
  files['motion/_index.scss'] = `${header(
    source,
    `The theme's motion: its own effects (before any component's motion() uses
them), entrance pacing and motion roles, and page transitions.

motion-defaults() takes duration, delay, ease, distance and stagger (every
\`greese\` entrance), and the motion roles: theme, content, rows, toast,
backdrop, overlay, dialog, popover, tooltip, drawer, carousel, carousel-back
(entrances); overlay-exit, dialog-exit, popover-exit, tooltip-exit,
drawer-exit, carousel-exit, carousel-back-exit (exits by name); their
-duration, enter-ease and exit-ease; page, page-back, page-exit,
page-back-exit, page-duration, page-ease, page-stagger, page-exit-order,
page-mode, share-duration, share-ease (Guides/Theming, "Motion roles").`
  )}@use '../settings';
${KIT}

${
  effects.length
    ? `${effects.join('\n\n')}\n`
    : `// An effect of the theme's own: a name, and the frame it starts from.
// @include greese.effect(float-up, (enter: (from: (translate: 0 1.5rem, opacity: 0))));
`
}
@include greese.scope(${scope}) {
  @include greese.motion-defaults((
${mapLines(
  setMotion.map(([k, v]) => [k, str(v)]),
  MOTION_BASES.filter(([k]) => !setMotion.some(([s]) => s === k)),
  '    '
)}
  ));

  // Parts of a page with page-transition motion of their own, by selector:
  // \`still\`, or (enter, exit, duration, delay, ease).
  @include greese.page-transitions(${
    pageRules ??
    `(
    // "header": still,
  )`
  });
}
`

  // Components: a module each, with its own imports and helpers.
  // `../settings` first in every file: it configures the breakpoints, which
  // the kit and the library's partials load.
  const reserved: ReservedUse[] = [
    { url: 'pkg:@greese/ui/scss/kit', namespace: 'greese' },
    { url: '../settings', namespace: 'settings' },
  ]
  const moduleOf = (path: string) => path.replace(/\/_/, '/').replace(/\.scss$/, '')
  for (const name of Object.keys(spec.components ?? {}).sort()) {
    const c = spec.components![name]!
    const block = componentScss(name, c, '  ', () => '')
    if (!block) continue
    const split = c.scss?.trim() ? splitScss(c.scss) : undefined
    const uses = mergeUses(split ? [[name, split.uses]] : [], reserved).lines.map(
      (l) => l.text
    )
    const helpers = (split?.declarations ?? []).map(({ text }) => text.trim())
    const path = `components/_${fileName(name)}.scss`
    files[path] =
      `${header(source, `${name}: its overrides, in @layer greese.overrides.`)}@use '../settings';
${KIT}${uses.length ? `\n${uses.join('\n')}` : ''}
${helpers.length ? `\n${helpers.join('\n\n')}\n` : ''}
@include greese.scope(${scope}) {
${block}
}
`
    entry.push(moduleOf(path))
  }
  // Component files of your own (or ones the theme stopped writing), after.
  for (const path of options.components ?? []) {
    const module = moduleOf(path.replace(/^components\/(?!_)/, 'components/_'))
    if (!entry.includes(module)) entry.push(module)
  }

  const shapes = shapesScss(spec, scope, shapeSize)
  if (shapes) {
    files['shapes/_index.scss'] = `${header(
      source,
      `The theme's shapes (ADR 0024), written by @greese/ui/shapes. Their sizes
come first: change one there. The outlines are generated geometry, best
changed in Theme Studio. Shape a component differently with a component
file, or take its shape back in _resets.scss.`
    )}@use '../settings';
${KIT}
@use 'sass:map';

${shapeSizes(spec)}
${shapes}
`
    entry.push('shapes')
  }

  files['utilities/_index.scss'] = `${header(
    source,
    `Utility classes, in @layer greese.utilities. greese ui's own are built
here when _settings.scss says so ($utilities), with the theme's breakpoints:
choose groups (spacing, sizing, layout, flex, grid, typography, border,
color, effects), purge with $only (class names to keep), or add a $prefix.
Your own go after them, in the same layer.`
  )}@use '../settings';
@use 'pkg:@greese/ui/scss/mixins';
@use 'pkg:@greese/ui/scss/utilities';

@if settings.$utilities {
  @include utilities.classes($groups: null, $only: null, $prefix: '');
}

// Your own:
// @layer greese.utilities {
//   .text-balance { text-wrap: balance; }
//   @include mixins.up(md) { .md-text-balance { text-wrap: balance; } }
// }
`
  entry.push('utilities')

  files['main.scss'] = `${header(
    source,
    `The theme's entry: compile this file. With greese ui built in
(_settings.scss, $library), it's the whole stylesheet; otherwise import it
after greese ui's styles.
Each module writes its CSS when it is first loaded, in this order. The cascade
layers decide what wins, so order matters only within a layer. Sass wants
every @use before any rule, so this file holds nothing else. Add a line for
each file you add.`
  )}${entry.map((url) => `@use '${url}';`).join('\n')}
`
  return files
}

/** A shape's size in the layout: read from the `$shapes` map at the file's top. */
const shapeSize: ShapeSize = (shape, state, param, _value, factor) => {
  const at =
    state === 'border'
      ? `map.get($shapes, ${str(shape)}, border)`
      : `map.get($shapes, ${str(shape)}, ${state}, ${str(param)})`
  return `#{${factor === 1 ? at : `${at} * ${Math.round(factor * 1000) / 1000}`}}`
}

/** Each shape's sizes as a Sass map: its border, its parameters at rest, hovered and pressed. */
const shapeSizes = (spec: ThemeSpec): string => {
  const px = (n: number) => `${Math.round(n * 1000) / 1000}px`
  const shapes = filled(spec.shapes) as Array<[string, ShapeDef]>
  return `/// Each shape's sizes, in px: its border's width, and its parameters at
/// rest, hovered and pressed (a smaller variant of an element scales them).
$shapes: (
${shapes
  .map(([name, def]) => {
    const states = (['params', 'hover', 'active'] as const)
      .filter((state) => def[state] && Object.keys(def[state]!).length)
      .map(
        (state) =>
          `    ${state}: (${Object.entries(def[state]!)
            .map(([k, v]) => `${str(k)}: ${px(v)}`)
            .join(', ')}),`
      )
    return `  ${str(name)}: (\n    border: ${px(def.border?.width ?? 1)},\n${states.join('\n')}\n  ),`
  })
  .join('\n')}
);
`
}
