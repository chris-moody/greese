/**
 * A Theme Studio theme: plain JSON, the file the studio reads and writes.
 * `specToScss()` turns it into a stylesheet that uses the SCSS kit
 * (`pkg:@greese/ui/scss/kit`), so a theme made here compiles exactly
 * like one written by hand. Pure: the server and the browser both use it.
 */

import type { Keyframes } from '@greese/js'
import {
  breakpoints as defaultBreakpoints,
  color,
  cssProperty,
  effectClass,
  effectNames,
  effectPlan,
  cssPlan,
  entranceNames,
  exitNames,
  isBuiltInEffect,
  scalarTokens,
  type CssPlan,
  LAYER_ORDER,
} from '@greese/ui'
import {
  shapeClass,
  shapeParams,
  shapeProperties,
  shapeSelector,
  shapesCss,
  shapeTarget,
  type ShapeDef,
  type ShapeUse,
} from '@greese/ui/shapes'
import {
  declarationProblems,
  mergeUses,
  scssProblems,
  splitScss,
  type ReservedUse,
  type SplitScss,
} from './scssModule.ts'
import { formatKeyframes } from './effectCode.ts'
import { kebab } from './naming.ts'

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

/** An effect the theme defines: its keyframes (greese.js's), and how long it runs. */
export interface EffectSpec {
  keyframes: Keyframes
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

export interface ThemeSpec {
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
  effects?: Record<string, EffectSpec>
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

  // Tokens the system has are overrides; the rest are new, declared with
  // `$extend` (the kit never guesses at names).
  const tokenMap = (
    list: ReadonlyArray<readonly [string, ReadonlyArray<[string, SchemeValue]>]>
  ) =>
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
  const own = filled(spec.tokens).map(
    ([group, values]) =>
      [group, filled(values).filter(([k]) => !isCustomToken(group, k))] as const
  )
  const extra = filled(spec.tokens).map(
    ([group, values]) =>
      [group, filled(values).filter(([k]) => isCustomToken(group, k))] as const
  )
  const overrides = own.filter(([, values]) => values.length)
  const extended = extra.filter(([, values]) => values.length)
  if (overrides.length || extended.length)
    blocks.push(
      `${indent}@include greese.tokens(${overrides.length ? tokenMap(overrides) : '()'}${
        extended.length ? `, $extend: ${tokenMap(extended)}` : ''
      });`
    )

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
  if (types.length)
    blocks.push(
      `${indent}@include greese.typography(${map(
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
      )});`
    )

  const defaults = filled(spec.motionDefaults)
  if (defaults.length)
    blocks.push(
      `${indent}@include greese.motion-defaults(${map(
        defaults.map(([k, v]) => [k, str(v)]),
        indent
      )});`
    )

  // Selector rules for page transitions; a rule with nothing set says nothing.
  const pageRules = Object.entries(spec.pageRules ?? {}).flatMap(
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
  if (pageRules.length)
    blocks.push(`${indent}@include greese.page-transitions(${map(pageRules, indent)});`)

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
 * The theme's shapes (ADR 0024), as plain CSS, which is also SCSS: their
 * parameters registered, a `greese-shape-<name>` class for each, and the
 * components that take one. Written by @greese/ui/shapes, the same code the
 * Studio's editor previews with; the kit isn't involved, since a shape needs
 * no names checked beyond the components'.
 */
export const shapesScss = (spec: ThemeSpec): string => {
  const shapes = Object.fromEntries(filled(spec.shapes) as Array<[string, ShapeDef]>)
  if (!Object.keys(shapes).length) return ''
  const scope = spec.name ? `:where([data-greese-theme='${spec.name}']) ` : ''
  const uses: ShapeUse[] = Object.keys(shapes).map((name) => ({
    shape: name,
    selector: `${scope}.${shapeClass(name)}`,
  }))
  for (const name of Object.keys(spec.components ?? {}).sort()) {
    const shape = spec.components![name]!.shape
    if (shape && shapes[shape])
      uses.push({
        ...shapeTarget(name),
        shape,
        selector: `${scope}${shapeSelector(name)}`,
      })
  }
  const params = new Set(Object.values(shapes).flatMap((def) => shapeParams(def)))
  const css = shapesCss(shapes, uses)
    .split('\n')
    .map((l) => (l ? `  ${l}` : l))
    .join('\n')
  return `// Shapes (ADR 0024)\n${shapeProperties(params)}\n${LAYER_ORDER}\n@layer greese.overrides {\n${css}\n}`
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

/**
 * What the Motion section can pick: the effects that end at rest for `enter`,
 * those that end away from it for `exit`, built in and the theme's own (kebab-case).
 */
export const motionChoices = (spec: ThemeSpec): { enter: string[]; exit: string[] } => {
  const plans = new Map<string, CssPlan>(
    effectNames.map((name) => [effectClass(name), effectPlan(name)])
  )
  for (const [name, effect] of Object.entries(spec.effects ?? {}))
    plans.set(effectClass(name), cssPlan(effect.keyframes))
  const names = (match: (plan: CssPlan) => boolean) =>
    [...plans].filter(([, plan]) => match(plan)).map(([name]) => name)
  return { enter: names((p) => !!p.enter), exit: names((p) => !p.enter) }
}

/**
 * The effects as a TypeScript module for the app: `defineGreeseEffect` for
 * each, and the names added to `GreeseEffectRegistry` so they type-check.
 * Import it once, at the app's entry. Without effects there's nothing to
 * generate (undefined).
 */
export const specToEffectsTs = (
  spec: ThemeSpec,
  source = 'greese-theme.json'
): string | undefined => {
  const entries = Object.entries(spec.effects ?? {}).sort(([a], [b]) =>
    a.localeCompare(b)
  )
  if (!entries.length) return undefined
  const added = entries.map(([name]) => name).filter((name) => !isBuiltInEffect(name))
  const indent = (text: string, by: string) => text.replace(/\n/g, `\n${by}`)
  return `// Generated by greese ui Theme Studio from ${source}. Edit it there, or in
// the studio (npm run studio); changes made here are overwritten.
// Import it once, at your app's entry, before anything renders.
import { defineGreeseEffect } from '@greese/react'
${
  added.length
    ? `
declare module '@greese/react' {
  interface GreeseEffectRegistry {
${added.map((name) => `    ${name}: true`).join('\n')}
  }
}
`
    : ''
}
${entries
  .map(
    ([name, effect]) =>
      `defineGreeseEffect('${name}', {\n  keyframes: ${indent(formatKeyframes(effect.keyframes), '  ')},${
        effect.duration !== undefined ? `\n  duration: ${effect.duration},` : ''
      }\n})`
  )
  .join('\n\n')}
`
}
