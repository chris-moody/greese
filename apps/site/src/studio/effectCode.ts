import type { Keyframes } from '@greese/js'

/** A value as a short JavaScript literal: single quotes, bare keys, one line. */
const lit = (value: unknown): string => {
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`
  if (Array.isArray(value)) return `[${value.map(lit).join(', ')}]`
  if (value && typeof value === 'object')
    return `{ ${Object.entries(value)
      .map(([k, v]) => `${key(k)}: ${lit(v)}`)
      .join(', ')} }`
  return String(value)
}

const key = (name: string) => (/^[A-Za-z_$][\w$]*$/.test(name) ? name : `'${name}'`)

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
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_, s: string) =>
      JSON.stringify(s.replace(/\\'/g, "'"))
    )
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
