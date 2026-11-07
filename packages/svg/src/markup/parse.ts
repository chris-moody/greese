/** A span of the source, by character offsets: `start` in, `end` out. */
export interface SourceRange {
  start: number
  end: number
}

/**
 * One node of an SVG document: an element, or text (`#text`), a comment
 * (`#comment`) or CDATA (`#cdata`), whose content is `text`. `id` is an
 * editor's identity for the node, stable across edits, never written out; the
 * element's own `id` attribute is in `attrs`. Plain data, so it can live in a
 * store and an undo history as is.
 */
export interface MarkupNode {
  /** The editor's identity for the node: not the `id` attribute. */
  id: string
  /** The element's name as written (`linearGradient`, `svg:path`), or `#text`, `#comment`, `#cdata`. */
  tag: string
  /** Attributes in source order, values decoded. */
  attrs: Record<string, string>
  /** Child nodes, in order. */
  children: MarkupNode[]
  /** A text, comment or CDATA node's content. */
  text?: string
  /** Where the node is in the source it was parsed from: start tag to end tag. */
  range?: SourceRange
  /** Where each attribute is in that source, name to closing quote. */
  attrRanges?: Record<string, SourceRange>
}

/** Markup that isn't well-formed, with where. */
export class MarkupError extends SyntaxError {
  /** The character offset of the problem. */
  readonly offset: number
  /** Its line, from 1. */
  readonly line: number
  /** Its column, from 1. */
  readonly column: number

  constructor(message: string, source: string, offset: number) {
    const before = source.slice(0, offset).split('\n')
    const line = before.length
    const column = before.at(-1)!.length + 1
    super(`${message} (line ${line}, column ${column})`)
    this.name = 'MarkupError'
    this.offset = offset
    this.line = line
    this.column = column
  }
}

export interface ParseMarkupOptions {
  /** Makes each node's editor id. @default `n1`, `n2`… in document order */
  nextId?: () => string
  /** Keeps comments as `#comment` nodes. @default true */
  comments?: boolean
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

/** Decodes XML's five named entities and numeric references; anything else stays as written. */
export const decodeEntities = (text: string): string =>
  text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, name: string) => {
    if (name[0] !== '#') return ENTITIES[name] ?? whole
    const code =
      name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : +name.slice(1)
    return Number.isFinite(code) && code <= 0x10ffff ? String.fromCodePoint(code) : whole
  })

/** Elements whose whitespace is content: it's kept, and written back as is. */
export const TEXT_CONTENT = new Set([
  'text',
  'tspan',
  'textPath',
  'title',
  'desc',
  'style',
  'script',
])

const NAME = /[A-Za-z_:][\w:.-]*/y

/**
 * Parses SVG (or any XML) into a `MarkupNode` tree, recording where every
 * node and attribute is in the source: what keeps a code view and a canvas in
 * step, which `DOMParser` can't. The XML declaration, doctype and processing
 * instructions are read and dropped. Whitespace between elements is dropped,
 * except inside text content (`text`, `tspan`, `style`…). Throws a
 * `MarkupError`, with the line and column, on markup that isn't well-formed.
 *
 * ```ts
 * const root = parseMarkup('<svg viewBox="0 0 24 24"><path d="M0 0h24"/></svg>')
 * root.children[0].attrs.d // 'M0 0h24'
 * ```
 */
export const parseMarkup = (
  source: string,
  options: ParseMarkupOptions = {}
): MarkupNode => {
  let count = 0
  const nextId = options.nextId ?? (() => `n${++count}`)
  const keepComments = options.comments !== false
  let i = 0
  const fail = (message: string, at = i): never => {
    throw new MarkupError(message, source, at)
  }
  const at = (prefix: string) => source.startsWith(prefix, i)
  const skipSpace = () => {
    while (i < source.length && /\s/.test(source[i]!)) i++
  }
  const through = (close: string, what: string): number => {
    const end = source.indexOf(close, i)
    if (end < 0) fail(`Unclosed ${what}`)
    return end
  }
  const name = (): string => {
    NAME.lastIndex = i
    const match = NAME.exec(source)
    if (!match) fail('Expected a name')
    i += match![0].length
    return match![0]
  }

  /** The prolog, between elements: declarations, doctype, comments, whitespace. */
  const misc = (into: MarkupNode[] | null) => {
    for (;;) {
      skipSpace()
      if (at('<?')) i = through('?>', 'processing instruction') + 2
      else if (at('<!--')) comment(into)
      else if (at('<!DOCTYPE') || at('<!doctype')) {
        // A doctype may hold an internal subset in brackets.
        const bracket = source.indexOf('[', i)
        const close = source.indexOf('>', i)
        i =
          bracket >= 0 && bracket < close
            ? source.indexOf('>', through(']', 'doctype')) + 1
            : through('>', 'doctype') + 1
      } else return
    }
  }

  const comment = (into: MarkupNode[] | null) => {
    const start = i
    i += 4
    const end = through('-->', 'comment')
    i = end + 3
    if (into && keepComments)
      into.push({
        id: nextId(),
        tag: '#comment',
        attrs: {},
        children: [],
        text: source.slice(start + 4, end),
        range: { start, end: i },
      })
  }

  const element = (): MarkupNode => {
    const start = i
    i++ // <
    const tag = name()
    const node: MarkupNode = {
      id: nextId(),
      tag,
      attrs: {},
      children: [],
      range: { start, end: start },
      attrRanges: {},
    }
    for (;;) {
      const before = i
      skipSpace()
      if (at('/>')) {
        i += 2
        node.range!.end = i
        return node
      }
      if (at('>')) {
        i++
        break
      }
      if (i === before) fail(`Expected whitespace, ">" or "/>" in <${tag}>`)
      const attrStart = i
      const attr = name()
      skipSpace()
      if (source[i] !== '=') fail(`Expected "=" after ${attr}`)
      i++
      skipSpace()
      const quote = source[i]
      if (quote !== '"' && quote !== "'") fail(`Expected a quoted value for ${attr}`)
      const close = source.indexOf(quote!, i + 1)
      if (close < 0) fail(`Unclosed value for ${attr}`)
      if (attr in node.attrs) fail(`Duplicate attribute ${attr}`, attrStart)
      node.attrs[attr] = decodeEntities(source.slice(i + 1, close))
      i = close + 1
      node.attrRanges![attr] = { start: attrStart, end: i }
    }

    const keepSpace = TEXT_CONTENT.has(tag)
    for (;;) {
      if (i >= source.length) fail(`Unclosed <${tag}>`, start)
      if (at('</')) {
        const closeAt = i
        i += 2
        const closing = name()
        if (closing !== tag) fail(`Expected </${tag}>, found </${closing}>`, closeAt)
        skipSpace()
        if (source[i] !== '>') fail(`Expected ">" to close </${tag}>`)
        i++
        node.range!.end = i
        return node
      }
      if (at('<!--')) comment(node.children)
      else if (at('<![CDATA[')) {
        const cdataStart = i
        i += 9
        const end = through(']]>', 'CDATA')
        node.children.push({
          id: nextId(),
          tag: '#cdata',
          attrs: {},
          children: [],
          text: source.slice(i, end),
          range: { start: cdataStart, end: end + 3 },
        })
        i = end + 3
      } else if (at('<?')) i = through('?>', 'processing instruction') + 2
      else if (source[i] === '<') node.children.push(element())
      else {
        const textStart = i
        const end = source.indexOf('<', i)
        i = end < 0 ? source.length : end
        const raw = source.slice(textStart, i)
        if (keepSpace || raw.trim())
          node.children.push({
            id: nextId(),
            tag: '#text',
            attrs: {},
            children: [],
            text: decodeEntities(raw),
            range: { start: textStart, end: i },
          })
      }
    }
  }

  misc(null)
  if (source[i] !== '<') fail('Expected the root element')
  const root = element()
  misc(null)
  if (i < source.length) fail('Content after the root element')
  return root
}

/** Every node, depth first, in document order. */
export const walkMarkup = function* (node: MarkupNode): Generator<MarkupNode> {
  yield node
  for (const child of node.children) yield* walkMarkup(child)
}

/**
 * The deepest element whose source range holds `offset`: the element a
 * caret in the code is in, for the canvas to select.
 */
export const nodeAtOffset = (
  root: MarkupNode,
  offset: number
): MarkupNode | undefined => {
  const inside = (node: MarkupNode) =>
    !!node.range && offset >= node.range.start && offset < node.range.end
  if (!inside(root)) return undefined
  let found = root
  for (;;) {
    const child = found.children.find((c) => c.tag[0] !== '#' && inside(c))
    if (!child) return found
    found = child
  }
}
