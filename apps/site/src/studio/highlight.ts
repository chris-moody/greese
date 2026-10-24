/**
 * Syntax highlighting for the studio's code boxes, with no dependency: a small
 * tokenizer for CSS, SCSS and the JavaScript object literals effects are
 * written in. It splits text into runs, each with a kind that the stylesheet
 * colours (`.tok-<kind>`); the runs always join back into the exact text.
 */

export type TokenKind =
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

export interface Token {
  text: string
  kind?: TokenKind
}

export type Language = 'css' | 'scss' | 'js'

/** Splits `text` with a prioritised list of patterns; what none match is plain. */
const split = (
  text: string,
  rules: ReadonlyArray<readonly [RegExp, TokenKind | undefined]>
): Token[] => {
  const out: Token[] = []
  const push = (chunk: string, kind?: TokenKind) => {
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

const selectorTokens = (text: string): Token[] =>
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

const valueTokens = (text: string, scss: boolean): Token[] =>
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

const highlightCss = (text: string, scss: boolean): Token[] => {
  const out: Token[] = []
  const add = (tokens: Token[]) => out.push(...tokens)
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

const highlightJs = (text: string): Token[] =>
  split(text, [
    [BLOCK_COMMENT, 'comment'],
    [LINE_COMMENT, 'comment'],
    [sticky('`(?:\\\\.|[^`\\\\])*`?'), 'string'],
    [STRING, 'string'],
    [sticky('-?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?'), 'number'],
    [sticky('(?:true|false|null|undefined|return|const|let|var|function)\\b'), 'keyword'],
    [sticky('[a-zA-Z_$][\\w$]*(?=\\s*:)'), 'property'],
    [sticky('[a-zA-Z_$][\\w$]*(?=\\()'), 'function'],
    [sticky('[{}[\\](),:;=>]'), 'punctuation'],
  ])

export const highlight = (text: string, language: Language): Token[] =>
  language === 'js' ? highlightJs(text) : highlightCss(text, language === 'scss')
