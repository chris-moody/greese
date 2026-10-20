/**
 * A Theme Studio theme: plain JSON, the file the studio reads and writes.
 * `specToScss()` turns it into a stylesheet that uses the SCSS kit
 * (`pkg:@greese-ui/react/scss/kit`), so a theme made here compiles exactly
 * like one written by hand. Pure: the server and the browser both use it.
 */

/** One value for both schemes, or a light/dark pair. */
export type SchemeValue = string | { light: string; dark: string }

/** CSS declarations: `{ 'font-weight': '700' }`. */
export type Declarations = Record<string, string>

export interface MotionSpec {
  /** An entrance preset, kebab-case: `fade-up`. */
  enter?: string
  /** Your own `@keyframes` name, instead of a preset. */
  keyframes?: string
  /** An overlay exit: `fade-out`, `fade-out-up`, `fade-out-down`, `scale-out`. */
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
  motion?: MotionSpec
}

export interface ThemeSpec {
  /**
   * Scope to `data-greese-theme="<name>"` (a complete theme, as
   * `createTheme`). Empty: change the page's defaults.
   */
  name?: string
  /** Token overrides by group, kebab-case: `{ color: { accent: … }, radius: { md: '12px' } }`. */
  tokens?: Record<string, Record<string, SchemeValue>>
  /** Tunes every `greese` prop entrance: duration, delay, ease, distance. */
  motionDefaults?: Record<string, string>
  /** Overrides by component name: `{ Button: { … } }`. */
  components?: Record<string, ComponentSpec>
}

export const emptySpec = (): ThemeSpec => ({ tokens: {}, components: {} })

const NAME = /^[a-z][a-z0-9-]*$/
const COMPONENT = /^[A-Z][A-Za-z]*$/
const PROPERTY = /^(--)?[a-z][a-z0-9-]*$/
const KEY = /^[a-z0-9][a-z0-9-]*$/
// Values become CSS text: nothing that could end a declaration or a rule.
const UNSAFE = /[;{}]|<\//

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
  for (const [k, v] of Object.entries(spec.motionDefaults ?? {})) {
    key('motionDefaults', k)
    value(`motionDefaults.${k}`, v)
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
    const { durations, easings, ...motion } = c.motion ?? {}
    for (const [k, v] of Object.entries({ ...motion, ...durations, ...easings }))
      value(`${name} motion.${k}`, v)
  }
  return errors
}

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

const componentScss = (name: string, c: ComponentSpec, indent: string): string => {
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
  if (!lines.length) return ''
  return `${indent}@include greese.component(${name}) {\n${lines.join('\n')}\n${indent}}`
}

/**
 * The theme as SCSS for the kit. Output is stable (sorted components) so the
 * file diffs cleanly in version control.
 */
export const specToScss = (spec: ThemeSpec, source = 'greese-theme.json'): string => {
  const indent = spec.name ? '  ' : ''
  const blocks: string[] = []

  const groups = filled(spec.tokens)
    .map(([group, values]) => [group, filled(values)] as const)
    .filter(([, values]) => values.length)
  if (groups.length)
    blocks.push(
      `${indent}@include greese.tokens(${map(
        groups.map(([group, values]) => [
          group,
          map(
            values.map(([k, v]) => [/^\d/.test(k) ? `'${k}'` : k, schemeValue(v)]),
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

  for (const name of Object.keys(spec.components ?? {}).sort()) {
    const block = componentScss(name, spec.components![name]!, indent)
    if (block) blocks.push(block)
  }

  const body = spec.name
    ? `@include greese.theme(${spec.name}) {\n${blocks.join('\n\n')}\n}`
    : blocks.join('\n\n')
  return `// Generated by GreeseUI Theme Studio from ${source}. Edit it there, or in
// the studio (npm run studio); changes made here are overwritten.
@use 'pkg:@greese-ui/react/scss/kit' as greese;
${body ? `\n${body}\n` : ''}`
}
