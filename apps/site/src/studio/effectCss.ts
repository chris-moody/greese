import type { Keyframes } from '@greese/js'

/** One step of CSS keyframes: `from`, `to` or a percentage, and its declarations. */
export type CssStep = [at: string, declarations: Record<string, string>]

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

const length = (v: unknown) => (typeof v === 'number' ? `${v}px` : String(v))

/**
 * greese.js keyframes as CSS keyframes, for retuning an entrance preset's
 * `@keyframes`. `x` and `y` become `translate`, `scaleX`/`scaleY` `scale`,
 * `rotate` degrees; other properties pass through, kebab-cased. An object
 * is property → values spread evenly from 0 to 100% (a lone value is the
 * end); a list is one object per frame, at its `offset` or evenly spaced.
 */
export const toCssSteps = (frames: Keyframes): CssStep[] => {
  const steps = new Map<number, Record<string, unknown>>()
  const at = (offset: number) => {
    const key = Math.round(offset * 10_000) / 10_000
    if (!steps.has(key)) steps.set(key, {})
    return steps.get(key)!
  }
  if (Array.isArray(frames)) {
    frames.forEach((frame, i) => {
      const { offset, ease: _ease, ...values } = frame as Record<string, unknown>
      Object.assign(
        at(
          typeof offset === 'number'
            ? offset
            : frames.length > 1
              ? i / (frames.length - 1)
              : 1
        ),
        values
      )
    })
  } else {
    for (const [prop, value] of Object.entries(frames)) {
      const list = Array.isArray(value) ? value : [value]
      list.forEach((v, i) => {
        at(list.length > 1 ? i / (list.length - 1) : 1)[prop] = v
      })
    }
  }
  return [...steps]
    .sort(([a], [b]) => a - b)
    .map(([offset, values]) => {
      const out: Record<string, string> = {}
      const { x, y, scaleX, scaleY, rotate, ...rest } = values
      if (x !== undefined || y !== undefined)
        out.translate = `${x === undefined ? '0px' : length(x)} ${y === undefined ? '0px' : length(y)}`
      if (scaleX !== undefined || scaleY !== undefined)
        out.scale = `${scaleX ?? 1} ${scaleY ?? 1}`
      if (rotate !== undefined)
        out.rotate = typeof rotate === 'number' ? `${rotate}deg` : String(rotate)
      for (const [prop, v] of Object.entries(rest)) out[kebab(prop)] = String(v)
      return [offset === 0 ? 'from' : offset === 1 ? 'to' : `${offset * 100}%`, out]
    })
}

/** A full `@keyframes` rule as CSS text, for the page that wears the theme. */
export const keyframesCss = (name: string, frames: Keyframes): string =>
  `@keyframes ${name} {\n${toCssSteps(frames)
    .map(
      ([at, decls]) =>
        `  ${at} {\n${Object.entries(decls)
          .map(([p, v]) => `    ${p}: ${v};`)
          .join('\n')}\n  }`
    )
    .join('\n')}\n}`
