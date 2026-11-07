/**
 * Syntax highlighting for code boxes, with no dependency: a small tokenizer
 * for CSS, SCSS, JavaScript (and JSON), TypeScript, and XML (SVG markup). It
 * splits text into runs, each with a kind the stylesheet colours
 * (`.greese-CodeToken--<kind>`); the runs always join back into the exact
 * text.
 */

export type CodeTokenKind =
  | 'comment'
  | 'string'
  | 'number'
  | 'selector'
  | 'tag'
  | 'pseudo'
  | 'attribute'
  | 'property'
  | 'variable'
  | 'function'
  | 'at'
  | 'keyword'
  | 'punctuation'

/** A run of text, and what it is. */
export interface CodeToken {
  text: string
  kind?: CodeTokenKind
}

/** The languages `highlightCode` reads. */
export type CodeLanguage = 'css' | 'scss' | 'js' | 'ts' | 'xml'

/** Splits `text` with a prioritised list of patterns; what none match is plain. */
const split = (
  text: string,
  rules: ReadonlyArray<readonly [RegExp, CodeTokenKind | undefined]>
): CodeToken[] => {
  const out: CodeToken[] = []
  const push = (chunk: string, kind?: CodeTokenKind) => {
    if (!chunk) return
    const last = out.at(-1)
    if (last && last.kind === kind) last.text += chunk
    else out.push({ text: chunk, kind })
  }
  let i = 0
  scan: while (i < text.length) {
    for (const [pattern, kind] of rules) {
      pattern.lastIndex = i
      const match = pattern.exec(text)
      if (match && match.index === i && match[0]) {
        push(match[0], kind)
        i += match[0].length
        continue scan
      }
    }
    push(text[i]!)
    i++
  }
  return out
}

const sticky = (source: string): RegExp => new RegExp(source, 'y')

const STRING = sticky(`"(?:\\\\.|[^"\\\\\\n])*"?|'(?:\\\\.|[^'\\\\\\n])*'?`)
const BLOCK_COMMENT = sticky('/\\*[\\s\\S]*?(?:\\*/|$)')
const LINE_COMMENT = sticky('(?<![:\\w])//[^\\n]*')

const selectorTokens = (text: string): CodeToken[] =>
  split(text, [
    [BLOCK_COMMENT, 'comment'],
    [LINE_COMMENT, 'comment'],
    [STRING, 'string'],
    [sticky('\\.[\\w-]+'), 'selector'],
    [sticky('#(?!\\{)[\\w-]+'), 'selector'],
    [sticky('%[\\w-]+'), 'selector'],
    [sticky('::?[\\w-]+(?:\\([^)]*\\))?'), 'pseudo'],
    [sticky('\\[[^\\]]*\\]'), 'attribute'],
    [sticky('&'), 'keyword'],
    [sticky('[>+~,*]'), 'punctuation'],
    [sticky('[a-zA-Z][\\w-]*'), 'tag'],
  ])

const valueTokens = (text: string, scss: boolean): CodeToken[] =>
  split(text, [
    [BLOCK_COMMENT, 'comment'],
    ...(scss ? ([[LINE_COMMENT, 'comment']] as const) : []),
    [STRING, 'string'],
    [sticky('#[0-9a-fA-F]{3,8}\\b'), 'number'],
    [sticky('[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:%|[a-zA-Z]+)?'), 'number'],
    [sticky('--[\\w-]+'), 'variable'],
    ...(scss ? ([[sticky('\\$[\\w-]+'), 'variable']] as const) : []),
    [sticky('!important\\b'), 'keyword'],
    [sticky('[a-zA-Z_-][\\w-]*(?=\\()'), 'function'],
    [sticky('[(),/:]'), 'punctuation'],
  ])

/** Where a statement ends: the next `{`, `;` or `}` outside strings, comments, parentheses and `#{}`. */
const statementEnd = (text: string, from: number, scss: boolean): number => {
  let depth = 0
  for (let i = from; i < text.length; i++) {
    const c = text[i]!
    if (c === '"' || c === "'") {
      STRING.lastIndex = i
      i += (STRING.exec(text)?.[0].length ?? 1) - 1
    } else if (text.startsWith('/*', i)) {
      const end = text.indexOf('*/', i + 2)
      i = end < 0 ? text.length : end + 1
    } else if (scss && text.startsWith('//', i) && text[i - 1] !== ':') {
      const end = text.indexOf('\n', i)
      i = end < 0 ? text.length : end - 1
    } else if (c === '(' || c === '[' || (c === '{' && text[i - 1] === '#')) depth++
    else if (c === ')' || c === ']') depth--
    else if (depth > 0 && c === '}') depth--
    else if (depth <= 0 && (c === '{' || c === ';' || c === '}')) return i
  }
  return text.length
}

const highlightCss = (text: string, scss: boolean): CodeToken[] => {
  const out: CodeToken[] = []
  const add = (tokens: CodeToken[]) => out.push(...tokens)
  let i = 0
  while (i < text.length) {
    const rest = text.slice(i)
    const space = /^\s+/.exec(rest)
    if (space) {
      out.push({ text: space[0] })
      i += space[0].length
      continue
    }
    const comment =
      /^\/\*[\s\S]*?(?:\*\/|$)/.exec(rest) ?? (scss ? /^\/\/[^\n]*/.exec(rest) : null)
    if (comment) {
      out.push({ text: comment[0], kind: 'comment' })
      i += comment[0].length
      continue
    }
    if (/^[;{}]/.test(rest)) {
      out.push({ text: rest[0]!, kind: 'punctuation' })
      i++
      continue
    }
    const end = statementEnd(text, i, scss)
    const statement = text.slice(i, end)
    const terminator = text[end]
    if (statement.startsWith('@')) {
      const name = /^@[\w-]+/.exec(statement)![0]
      out.push({ text: name, kind: 'at' })
      const tail = statement.slice(name.length)
      add(valueTokens(tail, scss))
    } else if (terminator === '{') {
      add(selectorTokens(statement))
    } else {
      const colon = statement.indexOf(':')
      if (colon < 0) add(valueTokens(statement, scss))
      else {
        const property = statement.slice(0, colon)
        const name = property.trimEnd()
        out.push({
          text: name,
          kind: name.startsWith('--')
            ? 'variable'
            : name.startsWith('$')
              ? 'variable'
              : 'property',
        })
        out.push({ text: property.slice(name.length) })
        out.push({ text: ':', kind: 'punctuation' })
        add(valueTokens(statement.slice(colon + 1), scss))
      }
    }
    i = end
  }
  return out
}

const JS_KEYWORDS =
  'true|false|null|undefined|return|const|let|var|function|new|this|if|else|for|of|in|while|do|switch|case|break|continue|default|throw|try|catch|finally|typeof|instanceof|void|delete|async|await|yield|class|extends|import|export|from|as'

/** What TypeScript adds to JavaScript's keywords. */
const TS_KEYWORDS =
  'type|interface|enum|declare|namespace|module|implements|readonly|keyof|infer|is|asserts|satisfies|abstract|private|protected|public|override|unique|never|unknown|any|string|number|boolean|bigint|symbol|object'

const highlightJs = (text: string, ts = false): CodeToken[] =>
  split(text, [
    [BLOCK_COMMENT, 'comment'],
    [LINE_COMMENT, 'comment'],
    [sticky('`(?:\\\\.|[^`\\\\])*`?'), 'string'],
    [STRING, 'string'],
    [sticky('-?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?'), 'number'],
    [sticky(`(?:${JS_KEYWORDS}${ts ? `|${TS_KEYWORDS}` : ''})\\b(?![$])`), 'keyword'],
    // A decorator, or a type's name: capitalised, as types and classes are.
    ...(ts
      ? ([
          [sticky('@[a-zA-Z_$][\\w$]*'), 'at'],
          [sticky('[A-Z][\\w$]*'), 'function'],
        ] as const)
      : []),
    [sticky('[a-zA-Z_$][\\w$]*(?=\\??\\s*:)'), 'property'],
    [sticky('[a-zA-Z_$][\\w$]*(?=\\s*(?:<[^<>()]*>)?\\()'), 'function'],
    [sticky('[a-zA-Z_$][\\w$]*'), undefined],
    [sticky('[{}[\\](),:;=>]'), 'punctuation'],
  ])

/** Where `close` ends, from `from`, or the text's end: what an unclosed construct runs to. */
const through = (text: string, from: number, close: string): number => {
  const end = text.indexOf(close, from)
  return end < 0 ? text.length : end + close.length
}

/**
 * XML: comments, CDATA, declarations and processing instructions, then tags
 * (their names, attributes and quoted values) and entities. Text between
 * tags is plain.
 */
const highlightXml = (text: string): CodeToken[] => {
  const out: CodeToken[] = []
  const push = (chunk: string, kind?: CodeTokenKind) => {
    if (!chunk) return
    const last = out.at(-1)
    if (last && last.kind === kind) last.text += chunk
    else out.push({ text: chunk, kind })
  }
  let i = 0
  while (i < text.length) {
    const at = (prefix: string) => text.startsWith(prefix, i)
    let end: number
    if (at('<!--')) {
      end = through(text, i + 4, '-->')
      push(text.slice(i, end), 'comment')
    } else if (at('<![CDATA[')) {
      end = through(text, i + 9, ']]>')
      push(text.slice(i, end), 'string')
    } else if (at('<?') || at('<!')) {
      end = through(text, i + 2, '>')
      push(text.slice(i, end), 'at')
    } else if (text[i] === '<' && /[\w/:]/.test(text[i + 1] ?? '')) {
      const open = text[i + 1] === '/' ? '</' : '<'
      push(open, 'punctuation')
      end = i + open.length
      const name = /^[\w:.-]+/.exec(text.slice(end))?.[0] ?? ''
      push(name, 'tag')
      end += name.length
      // The attributes, to the tag's end.
      while (end < text.length && text[end] !== '>') {
        const rest = text.slice(end)
        const piece =
          /^\s+/.exec(rest) ??
          /^[\w:.-]+/.exec(rest) ??
          /^"[^"]*"?|^'[^']*'?/.exec(rest) ??
          /^\/(?=>)|^=/.exec(rest)
        if (!piece) {
          push(rest[0]!)
          end++
          continue
        }
        const chunk = piece[0]
        push(
          chunk,
          /^\s/.test(chunk)
            ? undefined
            : /^["']/.test(chunk)
              ? 'string'
              : /^[/=]$/.test(chunk)
                ? 'punctuation'
                : 'attribute'
        )
        end += chunk.length
      }
      if (text[end] === '>') {
        push('>', 'punctuation')
        end++
      }
    } else if (text[i] === '&') {
      const entity = /^&(?:#x?[\da-fA-F]+|\w+);/.exec(text.slice(i))?.[0]
      end = i + (entity?.length ?? 1)
      push(text.slice(i, end), entity ? 'number' : undefined)
    } else {
      const next = text.slice(i + 1).search(/[<&]/)
      end = next < 0 ? text.length : i + 1 + next
      push(text.slice(i, end))
    }
    i = end
  }
  return out
}

/**
 * Splits `text` into runs a stylesheet colours by kind. They always join back
 * into the text, so a highlighted layer lines up with what was typed.
 */
export const highlightCode = (text: string, language: CodeLanguage): CodeToken[] =>
  language === 'xml'
    ? highlightXml(text)
    : language === 'js' || language === 'ts'
      ? highlightJs(text, language === 'ts')
      : highlightCss(text, language === 'scss')

/** A span of text by character offsets: `start` in, `end` out. */
export interface CodeRange {
  start: number
  end: number
}

/**
 * Tokens cut at a range's edges: those before it, inside it and after it,
 * each list still joining into its part of the text. A range past the text
 * is clamped to it.
 */
export const splitTokens = (
  tokens: readonly CodeToken[],
  { start, end }: CodeRange
): [CodeToken[], CodeToken[], CodeToken[]] => {
  const parts: [CodeToken[], CodeToken[], CodeToken[]] = [[], [], []]
  let at = 0
  for (const token of tokens) {
    const from = at
    at += token.text.length
    const cuts = [
      from,
      Math.max(from, Math.min(start, at)),
      Math.max(from, Math.min(end, at)),
      at,
    ]
    for (let part = 0; part < 3; part++) {
      const text = token.text.slice(cuts[part]! - from, cuts[part + 1]! - from)
      if (text) parts[part]!.push({ text, kind: token.kind })
    }
  }
  return parts
}
