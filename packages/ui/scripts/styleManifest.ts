/**
 * The styling API of every component, read from its compiled CSS: classes,
 * parts, modifiers, responsive props, state attributes and custom
 * properties. Framework-free: build-styles.ts writes it as
 * dist/style-manifest.json (for docs and Theme Studio) and
 * src/styles/_manifest.scss (so the SCSS kit can reject unknown names at
 * compile time). Which blocks each framework's components render is that
 * framework package's own manifest (@greese/react: component-styles.json).
 * Pure, and unit-tested.
 */

export interface BlockStyles {
  /** `Button`: what the SCSS kit's `component()` takes. */
  name: string
  /** `greese-Button`. */
  className: string
  /** The stylesheet that defines it: `css/<stylesheet>.css`. */
  stylesheet: string
  /** `icon` for `.greese-Button-icon`. */
  parts: string[]
  /** `solid` for `.greese-Button--solid`. Responsive classes are under `responsive`. */
  modifiers: string[]
  /** Modifiers of parts: `{ page: ['current'] }` for `.greese-Pagination-page--current`. */
  partModifiers: Record<string, string[]>
  /** Responsive props and their token classes: `{ width: ['full', 'auto'] }`. */
  responsive: Record<string, string[]>
  /** State attributes styled on the block or its parts: `[data-loading]`. */
  attributes: string[]
  /** Custom properties the block declares or reads, tokens excluded. */
  variables: string[]
  /**
   * Each class the block's rules style (`greese-Button`, `greese-Button-icon`,
   * `greese-Button--solid`): what it sits in and the properties set on it.
   */
  classes: Record<string, ClassStyles>
  /** Each state attribute: the classes it's styled on and what it sets there. */
  states: Record<string, StateStyles>
  /** Each of `variables`: its default, what it sets, and the kind of value it takes. */
  variableInfo: Record<string, VariableInfo>
}

export interface ClassStyles {
  /**
   * For a part, the class it sits inside, as its rules nest it (the root
   * where they don't say); for a modifier, the class it modifies. None for
   * the root.
   */
  parent?: string
  /** Properties its rules set, custom properties included, sorted. */
  properties: string[]
}

export interface StateStyles {
  /** The classes it's styled on. */
  on: string[]
  /** Properties set while it's present, custom properties included. */
  properties: string[]
}

export interface VariableInfo {
  /** Its value on the root or part that declares it, or a `var()` fallback. */
  default?: string
  /** Modifiers and states that set it (`greese-Button--solid`, `[data-loading]`). */
  setBy: string[]
  /** The CSS properties it ends up in, through other variables too. */
  affects: string[]
  /**
   * What it takes: `color`, `length`, `time`, `number`…, the one property it
   * ends up in (`text-transform`), or `value`.
   */
  type: string
}

export interface StyleManifest {
  /** Bump when the shape changes. */
  version: 4
  blocks: Record<string, BlockStyles>
}

const BREAKPOINT = /^(xs|sm|md|lg|xl)-([a-z][A-Za-z]*)(?:-(.+))?$/
const SELECTOR_CLASS = /\.greese-([A-Z][A-Za-z]*)(-[a-z][A-Za-z]*)?(--[A-Za-z0-9-]+)?/g
const ATTRIBUTES = /^((?:\[[^\]]+\])+)/
const VARIABLE = /--greese-[a-z0-9-]+/g
const RESPONSIVE_VAR = /-(xs|sm|md|lg|xl)$/

/** Every rule's selector list, at-rule preludes excluded. */
const selectorsOf = (css: string): string[] =>
  [...css.matchAll(/(?<=^|[{};])([^{};]+)\{/g)]
    .map((m) => m[1]!.trim())
    .filter((selector) => !selector.startsWith('@'))

/** `text` split on `separator` where it isn't inside brackets or quotes. */
const splitTop = (text: string, separator: RegExp): string[] => {
  const out: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (quote) {
      if (ch === '\\') i++
      else if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if ('([{'.includes(ch)) depth++
    else if (')]}'.includes(ch)) depth--
    else if (!depth && separator.test(ch)) {
      out.push(text.slice(start, i))
      start = i + 1
    }
  }
  out.push(text.slice(start))
  return out.map((part) => part.trim()).filter(Boolean)
}

interface Rule {
  selectors: string[]
  declarations: [property: string, value: string][]
}

/**
 * The style rules of compiled CSS: at-rules unwrapped (a rule in `@media`
 * still styles its class), keyframes and font faces skipped.
 */
const rulesOf = (css: string): Rule[] => {
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const rules: Rule[] = []
  let i = 0
  /** Reads to the next `{`, `}` or `;` outside quotes and brackets. */
  const prelude = (): [string, string | undefined] => {
    const start = i
    let quote = ''
    let depth = 0
    for (; i < src.length; i++) {
      const ch = src[i]!
      if (quote) {
        if (ch === '\\') i++
        else if (ch === quote) quote = ''
      } else if (ch === '"' || ch === "'") quote = ch
      else if (ch === '(' || ch === '[') depth++
      else if (ch === ')' || ch === ']') depth--
      else if (!depth && (ch === '{' || ch === '}' || ch === ';')) break
    }
    return [src.slice(start, i).trim(), src[i++]]
  }
  /** The body of the block just opened, to its matching `}`. */
  const body = (): string => {
    const start = i
    let depth = 1
    let quote = ''
    for (; i < src.length; i++) {
      const ch = src[i]!
      if (quote) {
        if (ch === '\\') i++
        else if (ch === quote) quote = ''
      } else if (ch === '"' || ch === "'") quote = ch
      else if (ch === '{') depth++
      else if (ch === '}' && !--depth) break
    }
    return src.slice(start, i++)
  }
  const walk = (): void => {
    while (i < src.length) {
      const [text, end] = prelude()
      if (end === '}' || end === undefined) return
      if (end === ';') continue
      if (/^@(?:[\w-]*keyframes|font-face|property)\b/.test(text)) body()
      else if (text.startsWith('@')) walk()
      else
        rules.push({
          selectors: splitTop(text, /,/),
          declarations: splitTop(body(), /;/).flatMap((d) => {
            const colon = d.indexOf(':')
            return colon > 0
              ? [
                  [
                    d.slice(0, colon).trim(),
                    d
                      .slice(colon + 1)
                      .trim()
                      .replace(/\s+/g, ' ')
                      .replace(/\( /g, '(')
                      .replace(/ \)/g, ')'),
                  ] as [string, string],
                ]
              : []
          }),
        })
    }
  }
  walk()
  return rules
}

/** `:not(…)` and `:has(…)` taken out: the classes in them aren't what's styled. */
const withoutNegations = (compound: string): string => {
  let out = compound
  for (let m; (m = /:(?:not|has)\(/.exec(out));) {
    let depth = 1
    let j = m.index + m[0].length
    for (; j < out.length && depth; j++) {
      if (out[j] === '(') depth++
      else if (out[j] === ')') depth--
    }
    out = out.slice(0, m.index) + out.slice(j)
  }
  return out
}

/** A selector's compound selectors, outermost first: the last is what it styles. */
const compoundsOf = (selector: string): string[] =>
  splitTop(selector.replace(/\s*([>+~])\s*/g, ' '), /\s/).map(withoutNegations)

const BARE_CLASS = /^\.greese-[A-Z][A-Za-z]*(?:-[a-z][A-Za-z]*)?$/

/** The value a `var(--name, …)` falls back to, if it has one. */
const fallbackOf = (css: string, name: string): string | undefined => {
  const at = css.indexOf(`var(${name},`)
  if (at < 0) return undefined
  let depth = 1
  let j = at + 4
  for (; j < css.length && depth; j++) {
    if (css[j] === '(') depth++
    else if (css[j] === ')') depth--
  }
  return (
    css
      .slice(at + `var(${name},`.length, j - 1)
      .trim()
      .replace(/\s+/g, ' ') || undefined
  )
}

/** Properties and the kind of value they take: the first that matches wins. */
const TYPES: [RegExp, string][] = [
  [/color$|^(background|fill|stroke)$|^border(-[a-z]+)*-color$/, 'color'],
  [/shadow$/, 'shadow'],
  [/duration$|delay$/, 'time'],
  [/timing-function$/, 'easing'],
  [
    /^(z-index|order|opacity|flex-grow|flex-shrink|font-weight|line-height|scale)$/,
    'number',
  ],
  [/^font-family$/, 'font family'],
  [/^(transform|translate|rotate)$/, 'transform'],
  [/^animation(-name)?$/, 'animation'],
  [/^grid-template/, 'track list'],
  [/image$|^mask$/, 'image'],
  [
    /size$|width$|height$|^(padding|margin|inset|gap|top|right|bottom|left|border-radius|letter-spacing|outline-offset)/,
    'length',
  ],
]

/** A literal default says what it is; otherwise, where it ends up does. */
const typeOf = (affects: string[], value = ''): string => {
  if (
    /^(#|rgb|hsl|oklch|oklab|lab|lch|color-mix|transparent$|currentcolor$|var\(--greese-color-)/i.test(
      value
    )
  )
    return 'color'
  if (/^-?[\d.]+m?s$/.test(value)) return 'time'
  if (/^-?[\d.]+(px|r?em|%|v[hwib]|cq\w+|ch|ex)$/.test(value)) return 'length'
  if (/^-?[\d.]+$/.test(value)) return 'number'
  for (const [pattern, type] of TYPES)
    if (affects.some((p) => pattern.test(p))) return type
  // One property it ends up in: a value of that (`text-transform`).
  return affects.length === 1 ? affects[0]! : 'value'
}

const add = (map: Map<string, Set<string>>, key: string, value: string) => {
  if (!map.has(key)) map.set(key, new Set())
  map.get(key)!.add(value)
}

const sorted = (set: Set<string> | undefined): string[] => [...(set ?? [])].sort()

/**
 * @param compiled   stylesheet name → its compiled CSS
 * @param tokenVars  custom properties that are design tokens, left out
 */
export const styleManifest = (
  compiled: Map<string, string>,
  tokenVars: Set<string>
): StyleManifest => {
  const stylesheetOf = new Map<string, string>()
  const parts = new Map<string, Set<string>>()
  const modifiers = new Map<string, Set<string>>()
  const partModifiers = new Map<string, Set<string>>()
  const responsive = new Map<string, Map<string, Set<string>>>()
  const attributes = new Map<string, Set<string>>()
  const variables = new Map<string, Set<string>>()
  /** Class → the properties set on it, and the classes its rules nest it in. */
  const classProps = new Map<string, Set<string>>()
  const nestedIn = new Map<string, Map<string, number>>()
  const stateOn = new Map<string, Set<string>>()
  const stateProps = new Map<string, Set<string>>()
  /** Variable → where it's declared and what reads it, across every sheet. */
  const declared = new Map<string, { compound: string; value: string }[]>()
  const readBy = new Map<string, Set<string>>()
  let allCss = ''

  for (const [stylesheet, css] of compiled) {
    const own: string[] = []
    for (const selector of selectorsOf(css)) {
      for (const m of selector.matchAll(SELECTOR_CLASS)) {
        const [whole, block, part, modifier] = m as unknown as [
          string,
          string,
          string?,
          string?,
        ]
        // The same block in two sheets (a part styled from its parent's
        // file) belongs to the sheet named after it, else the first.
        if (!stylesheetOf.has(block) || stylesheet === block)
          stylesheetOf.set(block, stylesheet)
        own.push(block)
        if (part) add(parts, block, part.slice(1))
        if (modifier) {
          const name = modifier.slice(2)
          const bp = BREAKPOINT.exec(name)
          if (part) add(partModifiers, `${block}${part}`, name)
          else if (bp) {
            if (!responsive.has(block)) responsive.set(block, new Map())
            const props = responsive.get(block)!
            if (!props.has(bp[2]!)) props.set(bp[2]!, new Set())
            if (bp[3]) props.get(bp[2]!)!.add(bp[3])
          } else add(modifiers, block, name)
        }
        const rest = selector.slice(m.index! + whole.length)
        const attrs = ATTRIBUTES.exec(rest)?.[1]
        if (attrs) for (const a of attrs.match(/\[[^\]]+\]/g)!) add(attributes, block, a)
      }
    }

    allCss += css
    for (const rule of rulesOf(css)) {
      const names = rule.declarations.map(([property]) => property)
      for (const [property, value] of rule.declarations) {
        for (const read of value.match(VARIABLE) ?? []) add(readBy, read, property)
      }
      for (const selector of rule.selectors) {
        const compounds = compoundsOf(selector)
        const subject = compounds.at(-1) ?? ''
        for (const [property, value] of rule.declarations)
          if (property.startsWith('--greese-')) {
            if (!declared.has(property)) declared.set(property, [])
            declared.get(property)!.push({ compound: subject, value })
          }
        // A state on the subject, or on a class around it (`[data-loading]
        // .greese-Button-icon`), is on that class.
        for (const compound of compounds)
          for (const state of compound.match(/\[[^\]]+\]/g) ?? [])
            for (const m of compound.matchAll(SELECTOR_CLASS)) {
              add(stateOn, `${m[1]}${state}`, m[0].slice(1))
              for (const name of names) add(stateProps, `${m[1]}${state}`, name)
            }
        for (const m of subject.matchAll(SELECTOR_CLASS)) {
          const [, block, part = '', modifier] = m as unknown as [
            string,
            string,
            string?,
            string?,
          ]
          const base = `greese-${block}${part}`
          if (modifier && BREAKPOINT.test(modifier.slice(2))) continue
          const styled = modifier ? `${base}${modifier}` : base
          for (const name of names) add(classProps, styled, name)
          if (!part || modifier) continue
          // The nearest enclosing class of its own block is where it sits.
          for (const outer of compounds.slice(0, -1).reverse()) {
            const own = [...outer.matchAll(SELECTOR_CLASS)].find((o) => o[1] === block)
            if (!own) continue
            const parent = `greese-${block}${own[2] ?? ''}`
            if (parent === base) break
            if (!nestedIn.has(base)) nestedIn.set(base, new Map())
            const counts = nestedIn.get(base)!
            counts.set(parent, (counts.get(parent) ?? 0) + 1)
            break
          }
        }
      }
    }

    // Variables belong to the block their name starts with, else to the
    // sheet's own block: --greese-file-font lives in FileInput.css.
    const blocks = [...new Set(own)].sort((a, b) => b.length - a.length)
    for (const v of new Set(css.match(VARIABLE) ?? [])) {
      if (tokenVars.has(v) || RESPONSIVE_VAR.test(v)) continue
      const owner =
        blocks.find((b) => v.startsWith(`--greese-${b.toLowerCase()}-`)) ??
        (blocks.includes(stylesheet) ? stylesheet : undefined)
      if (owner) add(variables, owner, v)
    }
  }

  /** The real properties a variable ends up in, through the variables it sets. */
  const affects = (variable: string, seen = new Set<string>()): string[] => {
    if (seen.has(variable)) return []
    seen.add(variable)
    return [
      ...new Set(
        [...(readBy.get(variable) ?? [])].flatMap((p) =>
          p.startsWith('--') ? affects(p, seen) : [p]
        )
      ),
    ].sort()
  }
  const variableInfo = (v: string): VariableInfo => {
    const declarations = declared.get(v) ?? []
    const bare = declarations.find((d) => BARE_CLASS.test(d.compound))
    const value = bare?.value ?? fallbackOf(allCss, v)
    const reaches = affects(v)
    return {
      ...(value === undefined ? {} : { default: value }),
      setBy: [
        ...new Set(
          declarations
            .filter((d) => !BARE_CLASS.test(d.compound))
            .flatMap((d) => [
              ...[...d.compound.matchAll(SELECTOR_CLASS)]
                .filter((m) => m[3])
                .map((m) => m[0].slice(1)),
              ...(d.compound.match(/\[[^\]]+\]/g) ?? []),
            ])
        ),
      ].sort(),
      affects: reaches,
      type: typeOf(reaches, value),
    }
  }

  const blocks: Record<string, BlockStyles> = {}
  for (const name of [...stylesheetOf.keys()].sort()) {
    const root = `greese-${name}`
    // Every class the manifest names, styled directly or only around others.
    const own = [
      ...new Set([
        root,
        ...sorted(parts.get(name)).map((p) => `${root}-${p}`),
        ...sorted(modifiers.get(name)).map((m) => `${root}--${m}`),
        ...sorted(parts.get(name)).flatMap((p) =>
          sorted(partModifiers.get(`${name}-${p}`)).map((m) => `${root}-${p}--${m}`)
        ),
        ...[...classProps.keys()].filter(
          (c) => c.startsWith(`${root}-`) && !/^[A-Z]/.test(c.slice(root.length + 1))
        ),
      ]),
    ].sort()
    const classes: Record<string, ClassStyles> = {}
    for (const c of own) {
      const modifier = /^(.*?)--/.exec(c)?.[1]
      const counts = [...(nestedIn.get(c) ?? [])].sort((a, b) => b[1] - a[1])
      const parent = modifier ?? (c === root ? undefined : (counts[0]?.[0] ?? root))
      classes[c] = {
        ...(parent ? { parent } : {}),
        properties: sorted(classProps.get(c)),
      }
    }
    const states: Record<string, StateStyles> = {}
    for (const state of sorted(attributes.get(name)))
      states[state] = {
        on: sorted(stateOn.get(`${name}${state}`)),
        properties: sorted(stateProps.get(`${name}${state}`)),
      }
    blocks[name] = {
      name,
      className: `greese-${name}`,
      stylesheet: stylesheetOf.get(name)!,
      parts: sorted(parts.get(name)),
      modifiers: sorted(modifiers.get(name)),
      partModifiers: Object.fromEntries(
        sorted(parts.get(name))
          .filter((part) => partModifiers.has(`${name}-${part}`))
          .map((part) => [part, sorted(partModifiers.get(`${name}-${part}`))])
      ),
      responsive: Object.fromEntries(
        [...(responsive.get(name) ?? [])]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([prop, tokens]) => [prop, sorted(tokens)])
      ),
      attributes: sorted(attributes.get(name)),
      variables: sorted(variables.get(name)),
      classes,
      states,
      variableInfo: Object.fromEntries(
        sorted(variables.get(name)).map((v) => [v, variableInfo(v)])
      ),
    }
  }
  return { version: 4, blocks }
}

const list = (items: string[]) =>
  items.length ? `(${items.map((i) => `'${i}'`).join(', ')},)` : '()'

const partMap = (b: BlockStyles) => {
  const entries = Object.entries(b.partModifiers)
  return entries.length
    ? `(${entries.map(([part, mods]) => `'${part}': ${list(mods)}`).join(', ')})`
    : '()'
}

/** The manifest as a Sass map, for the kit's compile-time name checks. */
export const manifestScss = (manifest: StyleManifest): string => {
  const entries = Object.values(manifest.blocks).map(
    (b) =>
      `  '${b.name}': (\n    parts: ${list(b.parts)},\n    modifiers: ${list(b.modifiers)},\n    part-modifiers: ${partMap(b)},\n    variables: ${list(b.variables)},\n  ),`
  )
  return `// GENERATED by scripts/build-styles.ts from the component stylesheets - do not edit.
// The SCSS kit (_kit.scss) checks component, part and modifier names against it.
$blocks: (
${entries.join('\n')}
);
`
}
