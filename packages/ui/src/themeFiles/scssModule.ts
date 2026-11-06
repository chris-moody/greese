/**
 * A component's SCSS in a theme (ADR 0021): leading `@use` statements, then a
 * body written inside `component(Name) { }`. The Studio splits the two, checks
 * the imports, rewrites a library path copied from a component's source to its
 * `pkg:` form, and merges every component's imports into one list at the top of
 * the theme file. Pure.
 */

/** The `@greese/ui` SCSS entry points a component's SCSS may `@use`: the ones that write no CSS. */
export const AUTHORING_ENTRIES = [
  'kit',
  'config',
  'maps',
  'mixins',
  'tones',
  'floating',
  'controls',
  'slides',
  'utilities',
] as const

const PKG = 'pkg:@greese/ui/scss/'

export interface ScssUse {
  url: string
  /** `map` for `@use 'sass:map'`, the name after `as`, or `*`. */
  namespace: string
  /** Its line in the component's text, from 1. */
  line: number
}

/** A top-level `$variable`, `@mixin` or `@function` in the body, which Sass allows only at a file's top level. */
export interface ScssDeclaration {
  kind: 'variable' | 'mixin' | 'function'
  name: string
  text: string
  /** Its first line in the component's text, from 1. */
  line: number
}

export interface SplitScss {
  uses: ScssUse[]
  /** Hoisted to the theme file's top level, after the imports. */
  declarations: ScssDeclaration[]
  /** The rest, declarations blanked out line for line, so its lines still match the box's. */
  body: string
  /** The line of the component's text the body starts on, from 1. */
  bodyLine: number
  problems: string[]
}

/** The namespace Sass gives a `@use` without `as`: the URL's last segment, without `_` or extension. */
export const defaultNamespace = (url: string): string => {
  const last = url.split(/[/:]/).pop() ?? url
  return last.replace(/^_/, '').replace(/\.s[ac]ss$/, '')
}

/**
 * A path as a component's own stylesheet writes it, as the theme must:
 * `../../styles/mixins` → `pkg:@greese/ui/scss/mixins`, `../../../dist/maps` →
 * `pkg:@greese/ui/scss/maps`. Undefined for anything else.
 */
export const libraryUrl = (url: string): string | undefined => {
  const partial = /^(?:\.\.\/)+styles\/_?([\w-]+)$/.exec(url)?.[1]
  if (partial && (AUTHORING_ENTRIES as readonly string[]).includes(partial))
    return `${PKG}${partial}`
  const generated = /^(?:\.\.\/)+dist\/_?(maps)$/.exec(url)?.[1]
  return generated ? `${PKG}${generated}` : undefined
}

const USE = /^@use\s+(['"])([^'"]+)\1\s*(?:as\s+(\*|[\w-]+))?\s*(with\b[\s\S]*)?$/

/** The end of a statement: the next `;` outside quotes and parentheses. */
const statementEnd = (text: string, from: number): number => {
  let depth = 0
  let quote = ''
  for (let i = from; i < text.length; i++) {
    const c = text[i]!
    if (quote) {
      if (c === quote) quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if (c === '(') depth++
    else if (c === ')') depth--
    else if (c === ';' && depth <= 0) return i
  }
  return text.length
}

const lineAt = (text: string, index: number): number =>
  text.slice(0, index).split('\n').length

/** Splits the leading `@use` statements (with the comments and blank lines between them) from the body. */
export const splitScss = (text: string): SplitScss => {
  const uses: ScssUse[] = []
  const problems: string[] = []
  let i = 0
  for (;;) {
    const rest = text.slice(i)
    const space = /^\s+/.exec(rest)?.[0] ?? ''
    if (space) {
      i += space.length
      continue
    }
    if (rest.startsWith('//')) {
      const end = text.indexOf('\n', i)
      i = end < 0 ? text.length : end + 1
      continue
    }
    if (rest.startsWith('/*')) {
      const end = text.indexOf('*/', i + 2)
      i = end < 0 ? text.length : end + 2
      continue
    }
    const rule = /^@(use|forward|import)\b/.exec(rest)?.[1]
    if (!rule) break
    const end = statementEnd(text, i)
    const statement = text.slice(i, end).trim()
    const line = lineAt(text, i)
    if (rule !== 'use') problems.push(`line ${line}: @${rule} is not allowed; use @use`)
    else {
      const match = USE.exec(statement)
      if (!match)
        problems.push(`line ${line}: "${statement}" is not a @use this box can read`)
      else {
        const [, , url, namespace, configured] = match
        if (configured)
          problems.push(
            `line ${line}: @use … with (…) is not allowed here; the theme's breakpoints configure the library`
          )
        uses.push({ url: url!, namespace: namespace ?? defaultNamespace(url!), line })
      }
    }
    i = end + 1
  }
  const bodyLine = lineAt(text, i)
  const { body, declarations } = hoist(text.slice(i), bodyLine)
  return { uses, declarations, body, bodyLine, problems }
}

/** Past a string or comment starting at `i`, or `i` itself. */
const skipLiteral = (text: string, i: number): number => {
  const c = text[i]
  if (c === '"' || c === "'") {
    for (let j = i + 1; j < text.length; j++) {
      if (text[j] === '\\') j++
      else if (text[j] === c) return j + 1
    }
    return text.length
  }
  if (text.startsWith('//', i)) {
    const end = text.indexOf('\n', i)
    return end < 0 ? text.length : end
  }
  if (text.startsWith('/*', i)) {
    const end = text.indexOf('*/', i + 2)
    return end < 0 ? text.length : end + 2
  }
  return i
}

/** The end (exclusive) of the top-level item starting at `i`: a `;` statement, or a `{ … }` block. */
const itemEnd = (text: string, i: number): number => {
  let depth = 0
  for (let j = i; j < text.length;) {
    const past = skipLiteral(text, j)
    if (past !== j) {
      j = past
      continue
    }
    const c = text[j]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth <= 0) return j + 1
    } else if (c === ';' && depth <= 0) return j + 1
    j++
  }
  return text.length
}

const DECLARATION = /^(?:\$([\w-]+)\s*:|@(mixin|function)\s+([\w-]+))/

/**
 * Takes out of the body what Sass allows only at a file's top level: every
 * top-level `@mixin` and `@function`, and the top-level variables they read
 * (directly or through each other). Other variables stay in the body, where a
 * loop that updates one (`$list: list.append($list, …)`) still updates it.
 * Each is replaced by as many blank lines, so the body's lines stay put.
 */
const hoist = (
  body: string,
  bodyLine: number
): { body: string; declarations: ScssDeclaration[] } => {
  const items: Array<{ start: number; end: number; declaration?: ScssDeclaration }> = []
  let i = 0
  while (i < body.length) {
    const past = skipLiteral(body, i)
    if (past !== i || /\s/.test(body[i]!)) {
      i = past !== i ? past : i + 1
      continue
    }
    const end = itemEnd(body, i)
    const item = body.slice(i, end)
    const found = DECLARATION.exec(item)
    items.push({
      start: i,
      end,
      declaration: found
        ? {
            kind: found[1] ? 'variable' : (found[2] as 'mixin' | 'function'),
            name: found[1] ?? found[3]!,
            text: item,
            line: bodyLine + body.slice(0, i).split('\n').length - 1,
          }
        : undefined,
    })
    i = end
  }
  const declared = items.flatMap((item) => (item.declaration ? [item.declaration] : []))
  const hoisted = new Set(declared.filter((d) => d.kind !== 'variable'))
  // The variables the hoisted ones read, until nothing new is needed.
  for (let grew = true; grew;) {
    grew = false
    for (const d of declared)
      if (
        d.kind === 'variable' &&
        !hoisted.has(d) &&
        [...hoisted].some((h) => new RegExp(`\\$${d.name}(?![\\w-])`).test(h.text))
      ) {
        hoisted.add(d)
        grew = true
      }
  }
  let out = ''
  let at = 0
  for (const { start, end, declaration } of items) {
    if (!declaration || !hoisted.has(declaration)) continue
    out += body.slice(at, start) + body.slice(start, end).replace(/[^\n]/g, '')
    at = end
  }
  out += body.slice(at)
  return { body: out, declarations: declared.filter((d) => hoisted.has(d)) }
}

/** The body's top-level items (rules, at-rules, declarations), as offsets into it, with comments and space between left out. */
export const topLevelItems = (text: string): Array<{ start: number; end: number }> => {
  const items: Array<{ start: number; end: number }> = []
  let i = 0
  while (i < text.length) {
    const past = skipLiteral(text, i)
    if (past !== i || /\s/.test(text[i]!)) {
      i = past !== i ? past : i + 1
      continue
    }
    const end = itemEnd(text, i)
    items.push({ start: i, end })
    i = end
  }
  return items
}

/** Declarations two components both make: Sass would let the later one replace the other's silently. */
export const declarationProblems = (
  components: ReadonlyArray<[name: string, declarations: readonly ScssDeclaration[]]>
): string[] => {
  const seen = new Map<string, string>()
  const problems: string[] = []
  for (const [name, declarations] of components)
    for (const { kind, name: member, line } of declarations) {
      const key = `${kind} ${member}`
      const other = seen.get(key)
      const shown = kind === 'variable' ? `$${member}` : `${kind} ${member}`
      if (other && other !== name)
        problems.push(
          `${name} scss: line ${line}: ${other} also declares ${shown}; the theme file holds both, so rename one`
        )
      else seen.set(key, name)
    }
  return problems
}

/** What is wrong with one import. */
const scssUseProblem = ({ url, line }: ScssUse): string | undefined => {
  if (url.startsWith('sass:')) return undefined
  if (url.startsWith(PKG)) {
    const entry = url.slice(PKG.length)
    return (AUTHORING_ENTRIES as readonly string[]).includes(entry)
      ? undefined
      : `line ${line}: ${url} is not one of the entry points a component can use (${AUTHORING_ENTRIES.map((e) => `scss/${e}`).join(', ')})`
  }
  if (url === 'pkg:@greese/ui/scss')
    return `line ${line}: pkg:@greese/ui/scss would write the whole library again; use its parts (${PKG}mixins…)`
  if (libraryUrl(url)) return `line ${line}: write "${url}" as "${libraryUrl(url)}"`
  return `line ${line}: only sass: modules and ${PKG}… can be used here, not "${url}"`
}

/** Everything wrong with a component's SCSS: its imports, and a body whose braces don't balance or that imports. */
export const scssProblems = (text: string): string[] => {
  const { uses, body, bodyLine, problems } = splitScss(text)
  const out = [...problems]
  for (const use of uses) {
    const problem = scssUseProblem(use)
    if (problem) out.push(problem)
  }
  const bare = body
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, '')
    .replace(/(['"])(?:\\.|(?!\1)[^\\\n])*\1/g, '""')
  const late = /^\s*@(use|forward|import)\b/m.exec(bare)
  if (late)
    out.push(
      `line ${lineAt(bare, late.index + late[0].indexOf('@')) + bodyLine - 1}: @${late[1]} must come before the styles`
    )
  let depth = 0
  for (let k = 0; k < bare.length; k++) {
    const c = bare[k]
    depth += c === '{' ? 1 : c === '}' ? -1 : 0
    if (depth < 0) {
      out.push(
        `line ${lineAt(bare, k) + bodyLine - 1}: a closing brace has no opening one`
      )
      break
    }
  }
  if (depth > 0) out.push('a block is never closed')
  return out
}

/**
 * The text with each library path a component's source uses rewritten to its
 * `pkg:` form, so pasted source compiles in a project. Returns what changed.
 */
export const rewriteLibraryUrls = (
  text: string
): { text: string; rewritten: string[] } => {
  const rewritten: string[] = []
  const { uses } = splitScss(text)
  let out = text
  for (const { url } of uses) {
    const to = libraryUrl(url)
    if (!to) continue
    out = out.replace(
      new RegExp(`(['"])${url.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\1`),
      `'${to}'`
    )
    rewritten.push(`${url} → ${to}`)
  }
  return { text: out, rewritten }
}

/** A `@use` the theme file writes itself (the kit, the breakpoints), which a component's own can't contradict. */
export interface ReservedUse {
  url: string
  namespace: string
}

export interface MergedUses {
  /** The statements, once each, in the order first written. */
  lines: Array<{ text: string; component: string; line: number }>
  problems: string[]
}

/**
 * Every component's imports as one list for the top of the theme file. Sass
 * refuses one namespace for two statements, even the same one twice, so an
 * identical import (or one the theme already writes) is kept once, and two
 * imports that claim one namespace are an error naming both components.
 */
export const mergeUses = (
  components: ReadonlyArray<[name: string, uses: readonly ScssUse[]]>,
  reserved: readonly ReservedUse[]
): MergedUses => {
  const lines: MergedUses['lines'] = []
  const problems: string[] = []
  const claimed = new Map<string, { url: string; from: string }>()
  const starred = new Set<string>()
  for (const { url, namespace } of reserved)
    claimed.set(namespace, { url, from: 'the theme' })
  for (const [name, uses] of components)
    for (const { url, namespace, line } of uses) {
      if (namespace === '*') {
        if (starred.has(url)) continue
        starred.add(url)
      } else {
        const taken = claimed.get(namespace)
        if (taken?.url === url) continue
        if (taken) {
          problems.push(
            `${name} scss: line ${line}: "${namespace}" is already ${taken.from === 'the theme' ? "the theme's" : `${taken.from}'s`} name for ${taken.url}; give one of them another name with "as"`
          )
          continue
        }
        claimed.set(namespace, { url, from: name })
      }
      const as =
        namespace === '*'
          ? ' as *'
          : namespace === defaultNamespace(url)
            ? ''
            : ` as ${namespace}`
      lines.push({ text: `@use '${url}'${as};`, component: name, line })
    }
  return { lines, problems }
}

/**
 * Where a compile error points in the file that was compiled, from 1: the
 * innermost frame of Sass's stack that is in that file (the root stylesheet's),
 * so an error inside a mixin call in a component's body points at the call.
 */
export const errorLine = (error: unknown): number | undefined => {
  const stack = (error as { sassStack?: string }).sassStack ?? ''
  const frames = stack
    .split('\n')
    .map((line) => /^(.*?)\s+(\d+):\d+\s+(.*)$/.exec(line.trim()))
    .filter((m): m is RegExpExecArray => !!m)
  const root = frames.find((m) => m[3] === 'root stylesheet')
  const own = root && frames.find((m) => m[1] === root[1])
  return own ? Number(own[2]) : undefined
}

/** A compile error in a component's SCSS: which box, which line, and what Sass said. */
export interface ErrorAt {
  component: string
  line: number
  message: string
}

/**
 * The text with `url` imported or not, for the imports menu. Adding writes
 * `@use` after the last import (the kit as `greese`, as the theme file names
 * it); removing deletes every `@use` of it. The rest is untouched.
 */
export const toggleImport = (text: string, url: string, on: boolean): string => {
  const { uses } = splitScss(text)
  const present = uses.some((u) => u.url === url)
  if (on === present) return text
  const lines = text.split('\n')
  if (!on) {
    const drop = new Set(uses.filter((u) => u.url === url).map((u) => u.line - 1))
    return lines.filter((_, i) => !drop.has(i)).join('\n')
  }
  const statement = `@use '${url}'${url === 'pkg:@greese/ui/scss/kit' ? ' as greese' : ''};`
  const after = uses.at(-1)?.line ?? 0
  if (!after) return text.trim() ? `${statement}\n\n${text}` : `${statement}\n`
  lines.splice(after, 0, statement)
  return lines.join('\n')
}
