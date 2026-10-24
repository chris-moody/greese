import type { Keyframes } from '@greese/js'

/** Escapes that end a single-quoted string or a line, and their JavaScript forms. */
const ESCAPES: Record<string, string> = {
  '\\': '\\\\',
  "'": "\\'",
  '\n': '\\n',
  '\r': '\\r',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
}

/**
 * A value as a short JavaScript literal: single quotes, bare keys, one line.
 * Strings are escaped whole (backslashes first among them): this text is
 * written into a module the app imports, so no value may end its string.
 */
const lit = (value: unknown): string => {
  if (typeof value === 'string')
    return `'${value.replace(/[\\'\n\r\u2028\u2029]/g, (c) => ESCAPES[c]!)}'`
  if (Array.isArray(value)) return `[${value.map(lit).join(', ')}]`
  if (value && typeof value === 'object')
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${key(k)}: ${lit(v)}`)
      .join(', ')} }`
  return String(value)
}

const key = (name: string): string => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : lit(name))

/**
 * An effect's keyframes as the code you'd write for `defineGreeseEffect`: an
 * object of property → [from, to], or a list of frames, one per line.
 */
export const formatKeyframes = (frames: Keyframes): string =>
  Array.isArray(frames)
    ? `[\n${frames.map((f) => `  ${lit(f)},`).join('\n')}\n]`
    : `{\n${Object.entries(frames)
        .map(([k, v]) => `  ${key(k)}: ${lit(v)},`)
        .join('\n')}\n}`

/** A single-quoted string's text, with its escapes (quote, backslash, line breaks) undone. */
const unquote = (text: string): string =>
  text.replace(/\\(u[\da-fA-F]{4}|.)/g, (_, c: string) =>
    c.length === 5
      ? String.fromCharCode(parseInt(c.slice(1), 16))
      : (({ n: '\n', r: '\r', t: '\t' } as Record<string, string>)[c] ?? c)
  )

/**
 * Reads that code back: JSON with the usual JavaScript relaxations (bare
 * keys, single quotes, trailing commas, comments). Deliberately not
 * `eval`: only data goes in. Returns the keyframes, or what's wrong.
 */
export const parseKeyframes = (
  code: string
): { frames: Keyframes } | { error: string } => {
  const json = code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_, s: string) => JSON.stringify(unquote(s)))
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, '$1')
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch (error) {
    return { error: (error as Error).message.replace(/^JSON\.parse: /, '') }
  }
  const isFrame = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v)
  if (Array.isArray(value)) {
    if (!value.length || !value.every(isFrame))
      return { error: 'A list of frames is objects: [{ opacity: 0 }, { opacity: 1 }].' }
    return { frames: value as Keyframes }
  }
  if (!isFrame(value))
    return { error: 'Expected an object, like { opacity: [0, 1], y: [8, 0] }.' }
  const entries = Object.entries(value as Record<string, unknown>)
  if (!entries.length) return { error: 'Animate at least one property.' }
  return { frames: value as Keyframes }
}
