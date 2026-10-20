/**
 * Turns an existing theme into a studio spec. Everything is read as CSS:
 * `createTheme()`'s output, the SCSS kit's (compiled first), and hand-written
 * overrides like the Theming guide's all have the same shapes. What the spec
 * can hold is imported; the rest is reported, with its CSS, never dropped
 * silently. Pure: the server and the tests use it.
 */
import { breakpoints, color, deriveColors, scalarTokens, typography } from '@greese/ui'
import { blocks } from './manifest.ts'
import type { ComponentSpec, Declarations, SchemeValue, ThemeSpec } from './spec.ts'

export interface Skipped {
  /** Where it came from: a selector, an at-rule. */
  where: string
  /** The CSS that wasn't imported, to keep in a stylesheet of your own. */
  css: string
  reason: string
}

export interface ImportResult {
  spec: ThemeSpec
  /** Every `data-greese-theme` name found; the spec takes the first. */
  themes: string[]
  /** How much came in. */
  counts: { tokens: number; components: number; motion: number }
  skipped: Skipped[]
}

// --- a small CSS parser: flat rules with their enclosing at-rules ---------

interface Rule {
  selector: string
  /** Enclosing at-rule preludes, outermost first. */
  context: string[]
  decls: Array<[string, string]>
}

/** Splits on `sep` at depth 0, outside strings and brackets. */
const splitTop = (text: string, sep: string): string[] => {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quote) {
      if (c === '\\') i++
      else if (c === quote) quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === sep && depth === 0) {
      out.push(text.slice(start, i))
      start = i + 1
    }
  }
  out.push(text.slice(start))
  return out.map((s) => s.trim()).filter(Boolean)
}

const declaration = (text: string): [string, string] | undefined => {
  const at = text.indexOf(':')
  if (at < 1) return undefined
  return [text.slice(0, at).trim(), text.slice(at + 1).trim()]
}

/** Resolves a nested selector against its parent (`&`, or a descendant). */
const nest = (parent: string | undefined, child: string): string => {
  if (!parent) return child
  const parents = splitTop(parent, ',')
  return splitTop(child, ',')
    .flatMap((c) =>
      parents.map((p) => (c.includes('&') ? c.replaceAll('&', p) : `${p} ${c}`))
    )
    .join(', ')
}

export const parseCss = (css: string): Rule[] => {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules: Rule[] = []
  let i = 0

  // Reads a block's body from `i` (just past `{`) to its closing `}`.
  const block = (selector: string | undefined, context: string[]) => {
    const decls: Array<[string, string]> = []
    let buffer = ''
    let quote = ''
    let parens = 0
    while (i < text.length) {
      const c = text[i++]!
      if (quote) {
        buffer += c
        if (c === '\\') buffer += text[i++] ?? ''
        else if (c === quote) quote = ''
        continue
      }
      if (c === '"' || c === "'") quote = c
      else if (c === '(') parens++
      else if (c === ')') parens--
      if (parens > 0 || (c !== '{' && c !== ';' && c !== '}')) {
        buffer += c
        continue
      }
      const prelude = buffer.trim()
      buffer = ''
      if (c === '{') {
        if (prelude.startsWith('@')) block(selector, [...context, prelude])
        else block(nest(selector, prelude), context)
      } else {
        // `;` ends a declaration (or an at-rule statement); `}` ends the block.
        if (prelude && selector && !prelude.startsWith('@')) {
          const decl = declaration(prelude)
          if (decl) decls.push(decl)
        }
        if (c === '}') break
      }
    }
    if (selector && decls.length) rules.push({ selector, context, decls })
  }

  while (i < text.length) block(undefined, [])
  return rules
}

// --- recognising what the studio holds ------------------------------------

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
const norm = (v: string) => v.replace(/\s+/g, ' ').replace(/"/g, "'").trim().toLowerCase()

const COLORS = new Map(Object.entries(color).map(([k, v]) => [kebab(k), v]))
const SCALARS = new Map(
  Object.entries(scalarTokens).map(([group, values]) => [
    kebab(group),
    new Map(Object.entries(values).map(([k, v]) => [kebab(k), String(v)])),
  ])
)
// Longest first: `font-size` before `font`.
const GROUPS = [...SCALARS.keys()].sort((a, b) => b.length - a.length)

type Token = { group: string; key: string }

/**
 * `--greese-line-height-tight` → `{ group: 'line-height', key: 'tight' }`. A name in a
 * group the system has counts whether or not the system has that token: an
 * unknown one is a token the theme adds (the kit's `$extend`).
 */
const tokenOf = (property: string): Token | undefined => {
  const name = property.replace(/^--greese-/, '')
  if (name === property) return undefined
  if (name.startsWith('color-')) {
    const key = name.slice(6)
    return key ? { group: 'color', key } : undefined
  }
  const group = GROUPS.find((g) => name.startsWith(`${g}-`))
  if (!group) return undefined
  const key = name.slice(group.length + 1)
  return key ? { group, key } : undefined
}

const TYPE_VAR = /^--greese-type-([a-z0-9]+)-([a-z]+)$/
/** `@media (width >= 900px)` → the default breakpoint with that width. */
const typePoint = (context: string): string | undefined => {
  const px = /^@media \(width >= (\d+)px\)$/.exec(context.trim())?.[1]
  return px === undefined
    ? undefined
    : Object.entries(breakpoints).find(([, width]) => width === Number(px))?.[0]
}

const THEME = /\[data-greese-theme=['"]?([\w-]+)['"]?\]/
const SCHEME = /\[data-greese-scheme=['"]?(light|dark|system)['"]?\]/
const PRESETS = new Set([
  'fade-in',
  'fade-up',
  'fade-down',
  'fade-start',
  'fade-end',
  'scale-in',
  'blur-in',
  'slide-up',
  'pop',
])
const EXITS: Record<string, [string, string]> = {
  'translate:0 calc(-1 * var(--greese-motion-distance, 1rem))': ['exit', 'fade-out-up'],
  'translate:0 var(--greese-motion-distance, 1rem)': ['exit', 'fade-out-down'],
  'scale:0.95': ['exit', 'scale-out'],
}
const MOTION_DEFAULTS = new Set(['duration', 'delay', 'ease', 'distance', 'stagger'])

type Scheme = 'base' | 'light' | 'dark'

/** Which scheme a rule's declarations apply to. */
const schemeOf = (rule: Rule): Scheme => {
  if (rule.context.some((c) => /prefers-color-scheme:\s*dark/.test(c))) return 'dark'
  // `:not([scheme=light])` names light only to exclude it.
  const selectors = splitTop(rule.selector, ',').map((s) =>
    s.replace(/:not\([^)]*\)/g, '')
  )
  if (selectors.some((s) => SCHEME.exec(s)?.[1] === 'dark')) return 'dark'
  if (selectors.some((s) => SCHEME.exec(s)?.[1] === 'light')) return 'light'
  return 'base'
}

/** A selector that only scopes tokens: `:root`, scheme and theme attributes. */
const isScope = (selector: string) =>
  splitTop(selector, ',').every((s) =>
    /^(:root|html|\.greese-ThemeProvider)?(\[[^\]]+\]|:not\([^)]*\)|\s|:root|html)*$/.test(
      s
    )
  )

/** `var(--x, fallback)` → `fallback`; anything else unchanged. */
const fallback = (value: string) => {
  const m = /^var\(--[\w-]+,\s*([\s\S]+)\)$/.exec(value.trim())
  return m ? m[1]!.trim() : value.trim()
}

const easeName = (value: string) =>
  /^var\(--greese-ease-([\w-]+)\)$/.exec(value)?.[1] ?? value

/** The kit's motion() animation, or undefined for any other animation. */
const kitAnimation = (value: string) => {
  const parts = splitTop(value, ' ')
  if (parts.length !== 5 || parts[4] !== 'backwards') return undefined
  const [name, duration, ease, delay] = parts as [string, string, string, string]
  if (!/^var\(--greese-motion-duration,/.test(duration)) return undefined
  return {
    name,
    duration: fallback(duration),
    ease: easeName(fallback(ease)),
    delay: fallback(delay),
  }
}

type Target = { block: string; kind: 'root' | 'modifier' | 'part'; name?: string }

/** `.greese-Button--outline` → the Button's `outline` modifier, and so on. */
const targetOf = (selector: string): Target | string => {
  const s = selector.replace(/\s+/g, ' ').trim()
  let m = /^\.greese-([A-Z][A-Za-z]*)$/.exec(s)
  if (m) return blocks[m[1]!] ? { block: m[1]!, kind: 'root' } : `no component ${m[1]}`
  m = /^(?:\.greese-([A-Z][A-Za-z]*))?\.greese-([A-Z][A-Za-z]*)--([a-z0-9-]+)$/.exec(s)
  if (m && (!m[1] || m[1] === m[2])) {
    const info = blocks[m[2]!]
    if (!info) return `no component ${m[2]}`
    return info.modifiers.includes(m[3]!)
      ? { block: m[2]!, kind: 'modifier', name: m[3]! }
      : `${m[2]} has no modifier ${m[3]}`
  }
  m =
    /^(?:\.greese-([A-Z][A-Za-z]*) )?\.greese-([A-Z][A-Za-z]*)-([a-z][A-Za-z0-9]*)$/.exec(
      s
    )
  if (m && (!m[1] || m[1] === m[2])) {
    const info = blocks[m[2]!]
    if (!info) return `no component ${m[2]}`
    return info.parts.includes(m[3]!)
      ? { block: m[2]!, kind: 'part', name: m[3]! }
      : `${m[2]} has no part ${m[3]}`
  }
  return 'the studio holds component, part and modifier rules only'
}

const cssOf = (rule: Rule, decls = rule.decls) => {
  const body = `${rule.selector} {\n${decls.map(([p, v]) => `  ${p}: ${v};`).join('\n')}\n}`
  return rule.context.reduceRight((inner, at) => `${at} {\n${inner}\n}`, body)
}

/**
 * Reads a theme's CSS into a spec.
 *
 * @param css    any GreeseUI theme CSS: createTheme's, the kit's, hand-written
 * @param prefer the theme to take when the CSS holds several
 */
export const importCss = (css: string, prefer?: string): ImportResult => {
  const rules = parseCss(css)
  const themes = [
    ...new Set(
      rules.flatMap((r) =>
        [...r.selector.matchAll(new RegExp(THEME, 'g'))].map((m) => m[1]!)
      )
    ),
  ]
  const name = prefer && themes.includes(prefer) ? prefer : themes[0]
  const skipped: Skipped[] = []
  const tokens: Record<Scheme, Map<string, string>> = {
    base: new Map(),
    light: new Map(),
    dark: new Map(),
  }
  const components: Record<string, ComponentSpec> = {}
  const motionDefaults: Record<string, string> = {}
  const typed: Record<string, Record<string, Record<string, string>>> = {}
  const component = (block: string) => (components[block] ??= {})
  const skip = (rule: Rule, reason: string, decls?: Array<[string, string]>) =>
    skipped.push({ where: rule.selector, css: cssOf(rule, decls), reason })

  for (const rule of rules) {
    const contexts = rule.context.filter((c) => !c.startsWith('@layer'))
    // Generated by the kit and createTheme for reduced motion: implied.
    if (contexts.some((c) => /prefers-reduced-motion:\s*reduce/.test(c))) continue
    const calm = contexts.some((c) => /prefers-reduced-motion:\s*no-preference/.test(c))
    const other = contexts.filter(
      (c) =>
        !/prefers-color-scheme:\s*dark|prefers-reduced-motion:\s*no-preference/.test(c)
    )
    // The type system's media queries: a breakpoint's values, kept as typography.
    const point = other.length === 1 ? typePoint(other[0]!) : undefined
    const typeOnly =
      point !== undefined && rule.decls.every(([property]) => TYPE_VAR.test(property))
    if (other.length && !typeOnly) {
      skip(
        rule,
        `inside ${other.join(' ')}: the studio has no responsive or conditional rules`
      )
      continue
    }

    // Scoped to a theme: keep the chosen one, strip its prefix.
    const ruleThemes = [...rule.selector.matchAll(new RegExp(THEME, 'g'))].map(
      (m) => m[1]!
    )
    if (ruleThemes.some((t) => t !== name)) {
      skip(rule, `belongs to theme "${ruleThemes.find((t) => t !== name)}"`)
      continue
    }

    if (isScope(rule.selector)) {
      const scheme = schemeOf(rule)
      const rest: Array<[string, string]> = []
      for (const [property, value] of rule.decls) {
        const token = tokenOf(property)
        const type = TYPE_VAR.exec(property)
        const motion = /^--greese-motion-([\w-]+)$/.exec(property)?.[1]
        if (type) {
          const at = point ?? 'base'
          ;((typed[type[1]!] ??= {})[at] ??= {})[type[2]!] = value
        } else if (token) tokens[scheme].set(`${token.group}\u0000${token.key}`, value)
        else if (motion && MOTION_DEFAULTS.has(motion))
          motionDefaults[motion] = motion === 'ease' ? easeName(value) : value
        else if (property !== 'color-scheme' && property !== '--greese-loaded')
          rest.push([property, value])
      }
      if (rest.length) skip(rule, 'page-level CSS, not a token', rest)
      continue
    }

    const selectors = splitTop(
      rule.selector.replace(new RegExp(`${THEME.source}\\s*`, 'g'), ''),
      ','
    )
    for (const selector of selectors) {
      const target = targetOf(selector)
      if (typeof target === 'string') {
        skip({ ...rule, selector }, target)
        continue
      }
      const c = component(target.block)
      const rest: Array<[string, string]> = []
      for (const [property, value] of rule.decls) {
        if (target.kind !== 'root') {
          const where = target.kind === 'part' ? (c.parts ??= {}) : (c.modifiers ??= {})
          ;(where[target.name!] ??= {} as Declarations)[property] = value
          continue
        }
        const animation =
          property === 'animation' && calm ? kitAnimation(value) : undefined
        const exit =
          EXITS[`${property.replace('--greese-motion-exit-', '')}:${norm(value)}`]
        const token = tokenOf(property)
        if (animation) {
          const preset = animation.name.replace(/^greese-/, '')
          c.motion = {
            ...c.motion,
            ...(PRESETS.has(preset) && animation.name.startsWith('greese-')
              ? { enter: preset }
              : { keyframes: animation.name }),
            ...(animation.duration !== '0.5s' && { duration: animation.duration }),
            ...(animation.delay !== '0s' && { delay: animation.delay }),
            ...(animation.ease !== 'out' && { ease: animation.ease }),
          }
        } else if (property === '--greese-motion-distance') {
          c.motion = { ...c.motion, distance: value }
        } else if (exit) {
          c.motion = { ...c.motion, exit: exit[1] }
        } else if (token && calm && token.group === 'duration') {
          c.motion = {
            ...c.motion,
            durations: { ...c.motion?.durations, [token.key]: value },
          }
        } else if (token && token.group === 'easing') {
          c.motion = {
            ...c.motion,
            easings: { ...c.motion?.easings, [token.key]: value },
          }
        } else if (calm) {
          rest.push([property, value])
        } else if (property.startsWith('--greese-')) {
          const pair = /^light-dark\(([\s\S]+)\)$/.exec(value)
          const parts = pair ? splitTop(pair[1]!, ',') : []
          ;(c.vars ??= {})[property.slice(9)] =
            parts.length === 2 ? { light: parts[0]!, dark: parts[1]! } : value
        } else {
          ;(c.styles ??= {})[property] = value
        }
      }
      if (rest.length)
        skip({ ...rule, selector }, 'motion the studio can’t express', rest)
    }
  }

  // Tokens: light and dark from their rules, falling back to the base one;
  // values equal to the defaults are left out, so a complete theme (as
  // createTheme writes) imports as just its overrides.
  const specTokens: Record<string, Record<string, SchemeValue>> = {}
  const keys = new Set([
    ...tokens.base.keys(),
    ...tokens.light.keys(),
    ...tokens.dark.keys(),
  ])
  for (const id of keys) {
    const [group, key] = id.split('\u0000') as [string, string]
    if (group === 'color') {
      const light = tokens.light.get(id) ?? tokens.base.get(id)
      const dark = tokens.dark.get(id) ?? tokens.base.get(id)
      // A color the system doesn't have has no default to match: it's new.
      const fallbackPair = COLORS.get(key)
      const l = light ?? fallbackPair?.light ?? dark!
      const d = dark ?? fallbackPair?.dark ?? l
      if (
        fallbackPair &&
        norm(l) === norm(fallbackPair.light) &&
        norm(d) === norm(fallbackPair.dark)
      )
        continue
      ;(specTokens.color ??= {})[key] = norm(l) === norm(d) ? l : { light: l, dark: d }
    } else {
      const value = tokens.base.get(id) ?? tokens.light.get(id) ?? tokens.dark.get(id)!
      const fallback = SCALARS.get(group)?.get(key)
      if (fallback !== undefined && norm(value) === norm(fallback)) continue
      ;(specTokens[group] ??= {})[key] = value
    }
  }

  if (specTokens.color) dropDerived(specTokens.color)

  // Type system: only what differs from the defaults, so a complete theme
  // (createTheme's, the kit's) imports as its changes.
  const types: Record<string, Record<string, Record<string, string>>> = {}
  for (const [variant, points] of Object.entries(typed)) {
    const known = (
      typography as unknown as Record<string, Record<string, Record<string, string>>>
    )[variant]
    if (!known) continue
    for (const [at, style] of Object.entries(points)) {
      for (const [prop, value] of Object.entries(style)) {
        const standard =
          known[at]?.[prop] ?? (at === 'base' ? known.xs?.[prop] : undefined)
        if (standard !== undefined && norm(standard) === norm(value)) continue
        ;((types[variant] ??= {})[at] ??= {})[prop] = value
      }
    }
  }

  const spec: ThemeSpec = { tokens: specTokens, components }
  if (Object.keys(types).length) spec.typography = types
  if (name) spec.name = name
  if (Object.keys(motionDefaults).length) spec.motionDefaults = motionDefaults
  return {
    spec,
    themes,
    counts: {
      tokens:
        Object.values(specTokens).reduce((n, g) => n + Object.keys(g).length, 0) +
        Object.values(types).reduce(
          (n, p) => n + Object.values(p).reduce((m, s) => m + Object.keys(s).length, 0),
          0
        ),
      components: Object.keys(components).length,
      motion:
        Object.values(components).filter((c) => c.motion).length +
        Object.keys(motionDefaults).length,
    },
    skipped,
  }
}

const camel = (kebab: string) =>
  kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

/**
 * Leaves out content and strong colors that are exactly what the kit and
 * `createTheme` derive from the brand color beside them, so a theme that
 * only set `primary` imports as just `primary`.
 */
const dropDerived = (colors: Record<string, SchemeValue>): void => {
  for (const [key, value] of Object.entries(colors)) {
    const derived = deriveColors({ [camel(key)]: value } as Parameters<
      typeof deriveColors
    >[0])
    for (const suffix of ['-content', '-strong']) {
      const own = colors[`${key}${suffix}`]
      const auto = derived[camel(`${key}${suffix}`) as keyof typeof derived]
      if (own === undefined || auto === undefined) continue
      const pair = (v: SchemeValue) => (typeof v === 'string' ? { light: v, dark: v } : v)
      const [a, b] = [pair(own), pair(auto)]
      if (norm(a.light) === norm(b.light) && norm(a.dark) === norm(b.dark))
        delete colors[`${key}${suffix}`]
    }
  }
}

/** `createTheme()` options (`{ name, color: { accentContent: … }, lineHeight: …, extend, typography }`) as a spec. */
export const importThemeOptions = (options: Record<string, unknown>): ImportResult => {
  const skipped: Skipped[] = []
  const tokens: Record<string, Record<string, SchemeValue>> = {}
  let typography: Record<string, Record<string, Record<string, string>>> | undefined
  for (const [group, values] of Object.entries(options)) {
    if (group === 'name') continue
    if (group === 'typography') {
      typography = values as Record<string, Record<string, Record<string, string>>>
      continue
    }
    if (group === 'extend') {
      // Tokens the theme adds are tokens like any other here.
      for (const [eg, added] of Object.entries(
        (values ?? {}) as Record<string, Record<string, SchemeValue>>
      ))
        for (const [key, value] of Object.entries(added ?? {}))
          (tokens[kebab(eg)] ??= {})[kebab(key)] = value
      continue
    }
    const g = kebab(group)
    if (g !== 'color' && !SCALARS.has(g)) {
      skipped.push({
        where: group,
        css: JSON.stringify(values),
        reason: 'not a token group',
      })
      continue
    }
    for (const [key, value] of Object.entries(
      (values ?? {}) as Record<string, SchemeValue>
    )) {
      const k = kebab(key)
      const known = g === 'color' ? COLORS.has(k) : SCALARS.get(g)!.has(k)
      if (!known) {
        skipped.push({
          where: `${group}.${key}`,
          css: JSON.stringify(value),
          reason: 'no such token',
        })
        continue
      }
      ;(tokens[g] ??= {})[k] = value
    }
  }
  const name = typeof options.name === 'string' ? options.name : undefined
  return {
    spec: {
      ...(name && { name }),
      tokens,
      ...(typography && { typography }),
      components: {},
    },
    themes: name ? [name] : [],
    counts: {
      tokens: Object.values(tokens).reduce((n, g) => n + Object.keys(g).length, 0),
      components: 0,
      motion: 0,
    },
    skipped,
  }
}

/** A studio spec, or createTheme options, from parsed JSON. */
export const importJson = (data: unknown): ImportResult => {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Expected a JSON object: a studio theme or createTheme() options.')
  const o = data as Record<string, unknown>
  if ('tokens' in o || 'components' in o || 'motionDefaults' in o) {
    const spec = o as ThemeSpec
    return {
      spec: { tokens: {}, components: {}, ...spec },
      themes: spec.name ? [spec.name] : [],
      counts: {
        tokens: Object.values(spec.tokens ?? {}).reduce(
          (n, g) => n + Object.keys(g).length,
          0
        ),
        components: Object.keys(spec.components ?? {}).length,
        motion: Object.values(spec.components ?? {}).filter((c) => c.motion).length,
      },
      skipped: [],
    }
  }
  return importThemeOptions(o)
}

/** What a pasted or uploaded text is, from its file name or its content. */
export const detectFormat = (text: string, filename = ''): 'json' | 'scss' | 'css' => {
  const ext = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase()
  if (ext === 'json' || ext === 'scss' || ext === 'css') return ext
  const t = text.trimStart()
  if (t.startsWith('{')) return 'json'
  if (/@use\b|@include\b|^\s*\$[\w-]+\s*:/m.test(t)) return 'scss'
  return 'css'
}

/** Drops empty objects, so a merge doesn't save `"vars": {}` and the like. */
const prune = <T>(value: T): T => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(value)) {
    const p = prune(v)
    if (p && typeof p === 'object' && !Object.keys(p).length) continue
    out[k] = p
  }
  return out as T
}

/** Merges an import into the current spec: imported values win. */
export const mergeSpecs = (base: ThemeSpec, incoming: ThemeSpec): ThemeSpec => {
  const tokens = { ...base.tokens }
  for (const [g, values] of Object.entries(incoming.tokens ?? {}))
    tokens[g] = { ...tokens[g], ...values }
  const components = { ...base.components }
  for (const [name, c] of Object.entries(incoming.components ?? {})) {
    const was = components[name] ?? {}
    components[name] = {
      styles: { ...was.styles, ...c.styles },
      vars: { ...was.vars, ...c.vars },
      modifiers: { ...was.modifiers, ...c.modifiers },
      parts: { ...was.parts, ...c.parts },
      motion: { ...was.motion, ...c.motion },
    }
  }
  return {
    ...prune({
      ...base,
      ...(incoming.name && { name: incoming.name }),
      motionDefaults: { ...base.motionDefaults, ...incoming.motionDefaults },
      components,
    }),
    tokens: prune(tokens),
    components: prune(components),
  }
}
