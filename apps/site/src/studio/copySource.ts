import {
  defaultNamespace,
  rewriteLibraryUrls,
  splitScss,
  topLevelItems,
} from './scssModule.ts'

/**
 * A library component's own SCSS, made into something a theme can hold in that
 * component's box (ADR 0021). The theme writes the box inside `component(Name)
 * { }`, so:
 *
 * - library paths become `pkg:` URLs (`../../styles/mixins`);
 * - the `@layer … { }` wrappers go, since the box is already in the overrides
 *   layer (left in, they would nest as a sublayer);
 * - the component's own class becomes `&` (`.greese-Accordion` → `&`, its
 *   modifiers `&.greese-Accordion--x`, a doubled class one `&`), since a nested `.greese-Accordion`
 *   would mean an Accordion inside an Accordion. Only in the selectors of rules
 *   that aren't inside another rule: there, as in `.greese-AvatarGroup-item {
 *   > .greese-Avatar { } }`, the class is another element, and `&` would be the
 *   rule around it;
 * - what writes the library's own classes (`mixins.responsive-prop`,
 *   `tones.classes`, hidden from the entry points) is left out, with a note.
 *
 * The copy is yours from then on: it doesn't follow later library changes.
 */
export const copySource = (
  source: string,
  rootClass: string,
  /** The family's root classes (`greese-Collapsible`…): a rule about another component's class is left out. */
  family?: readonly string[]
): string => {
  let text = rewriteLibraryUrls(source).text
  text = removeCalls(text, /@include\s+(mixins\.responsive-prop|tones\.classes)\s*\(/g)
  // The layout components' responsive props (Stack, Grid, AutoLayout) are the
  // same kind of call, taking no arguments, from a partial with no `pkg:` entry.
  text = text
    .replace(/^@use\s+(['"])(?:\.\.\/)+styles\/layout-props\1\s*;\n?/m, '')
    .replace(
      /@include\s+(layout-props\.[\w-]+)\s*;/g,
      "// $1 left out: it writes the library's own classes"
    )
  text = unwrapLayers(text)
  if (family) text = keepFamily(text, family)
  const escaped = rootClass.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const own = (selector: string) =>
    selector
      .replace(new RegExp(`\\.${escaped}(--[\\w-]+)`, 'g'), `&.${rootClass}$1`)
      .replace(new RegExp(`\\.${escaped}(?![\\w-])`, 'g'), '&')
      // A doubled root class (`.greese-Input.greese-Input--measured`, there
      // for specificity) is the one element: `&&` isn't a selector.
      .replace(/&{2,}/g, '&')
  return outerSelectors(text, own)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * The text with `rewrite` applied to the selector of every style rule that
 * isn't inside another style rule. At-rules and control flow (`@media`,
 * `@include … { }`, `@each`) don't count as a rule around it; strings,
 * comments and `#{…}` are skipped.
 */
const outerSelectors = (text: string, rewrite: (selector: string) => string): string => {
  /** For each open brace, whether it opens a style rule. */
  const stack: boolean[] = []
  const edits: Array<[start: number, end: number]> = []
  let prelude = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    const blank = !text.slice(prelude, i).trim()
    if (ch === '"' || ch === "'") {
      const end = text.indexOf(ch, i + 1)
      i = end < 0 ? text.length : end
    } else if (text.startsWith('//', i) || text.startsWith('/*', i)) {
      const end = text.startsWith('//', i)
        ? text.indexOf('\n', i)
        : text.indexOf('*/', i) + 1
      i = end <= 0 ? text.length : end
      // A comment before a rule isn't part of its selector.
      if (blank) prelude = i + 1
    } else if (text.startsWith('#{', i)) {
      i = closing(text, i + 1)
    } else if (ch === '{') {
      const rule = !text.slice(prelude, i).trimStart().startsWith('@')
      if (rule && !stack.includes(true)) edits.push([prelude, i])
      stack.push(rule)
      prelude = i + 1
    } else if (ch === '}' || ch === ';') {
      if (ch === '}') stack.pop()
      prelude = i + 1
    }
  }
  let out = text
  for (const [start, end] of edits.reverse())
    out = out.slice(0, start) + rewrite(out.slice(start, end)) + out.slice(end)
  return out
}

/**
 * The text without its top-level rules about components outside the family:
 * Accordion.scss also styles `.greese-Accordion`, which means nothing inside an
 * AccordionItem. A rule is judged by the first component class it names.
 */
const keepFamily = (text: string, family: readonly string[]): string => {
  const offset = bodyStart(text)
  let out = text
  for (const { start, end } of topLevelItems(text.slice(offset)).reverse()) {
    const item = text.slice(offset + start, offset + end)
    if (item.startsWith('@') || item.startsWith('$') || !item.trimEnd().endsWith('}'))
      continue
    const first = /\.(greese-[A-Z][A-Za-z]*)/.exec(item.slice(0, item.indexOf('{')))?.[1]
    if (first && !family.includes(first))
      out = out.slice(0, offset + start) + out.slice(offset + end)
  }
  return out
}

/** Where the text after the leading `@use` lines starts. */
const bodyStart = (text: string): number => {
  const { bodyLine } = splitScss(text)
  let i = 0
  for (let line = 1; line < bodyLine; line++) i = text.indexOf('\n', i) + 1
  return i
}

/**
 * The SCSS the box starts with: the library's own SCSS for every stylesheet of
 * the family, made to fit (`copySource`), the imports once at the top, each
 * stylesheet's part under a comment naming its file.
 */
export const familySource = (
  sheets: ReadonlyArray<[path: string, text: string]>,
  rootClass: string,
  family: readonly string[]
): string => {
  const copies = sheets.map(
    ([path, text]) => [path, copySource(text, rootClass, family)] as const
  )
  const uses = [
    ...new Set(copies.flatMap(([, text]) => splitScss(text).uses.map(useStatement))),
  ]
  const bodies = copies
    .map(([path, text]) => {
      const body = text.slice(bodyStart(text)).trim()
      return body ? `// ${path}\n${body}` : ''
    })
    .filter(Boolean)
  return `${[uses.join('\n'), bodies.join('\n\n')].filter(Boolean).join('\n\n')}\n`
}

const useStatement = (u: { url: string; namespace: string }) =>
  `@use '${u.url}'${u.namespace === '*' ? ' as *' : u.namespace === defaultNamespace(u.url) ? '' : ` as ${u.namespace}`};`

/** Where the bracket that closes the one at `open` is: `(`/`)` or `{`/`}`, outside strings and comments. */
const closing = (text: string, open: number): number => {
  const [o, c] = text[open] === '(' ? ['(', ')'] : ['{', '}']
  let depth = 0
  let quote = ''
  for (let i = open; i < text.length; i++) {
    const ch = text[i]!
    if (quote) {
      if (ch === quote) quote = ''
    } else if (ch === '"' || ch === "'") quote = ch
    else if (text.startsWith('//', i))
      i = text.indexOf('\n', i) < 0 ? text.length : text.indexOf('\n', i)
    else if (text.startsWith('/*', i))
      i = text.indexOf('*/', i) < 0 ? text.length : text.indexOf('*/', i) + 1
    else if (ch === o) depth++
    else if (ch === c && --depth === 0) return i
  }
  return text.length - 1
}

/** Every `@include name(…);` matching `call` replaced by a comment saying why. */
const removeCalls = (text: string, call: RegExp): string => {
  let out = text
  for (;;) {
    call.lastIndex = 0
    const found = call.exec(out)
    if (!found) return out
    const end = closing(out, found.index + found[0].length - 1)
    const semicolon = /^\s*;/.exec(out.slice(end + 1))?.[0].length ?? 0
    out = `${out.slice(0, found.index)}// ${found[1]}(…) left out: it writes the library's own classes${out.slice(end + 1 + semicolon)}`
  }
}

/** `@layer name { … }` replaced by what it holds, one level less indented. */
const unwrapLayers = (text: string): string => {
  let out = text
  for (;;) {
    const found = /@layer\s+[\w.-]+\s*\{/.exec(out)
    if (!found) return out
    const open = found.index + found[0].length - 1
    const end = closing(out, open)
    const inner = out
      .slice(open + 1, end)
      .replace(/^\n/, '')
      .split('\n')
      .map((line) => line.replace(/^ {2}/, ''))
      .join('\n')
    out = `${out.slice(0, found.index)}${inner.trimEnd()}${out.slice(end + 1)}`
  }
}
