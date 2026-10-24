/** Sequence strings (`'fadeIn+scaleIn,+1,pop'`): steps, calls and their arguments. */
import { type Timing, type Value } from './definitions.ts'
import { effectParamNames } from './frames.ts'

/** One effect in a sequence, with the arguments written for it. */
export interface EffectCall {
  name: string
  args: Record<string, Value>
}

/** A step of a sequence: effects that play together, or a pause in seconds. */
export type EffectStep = EffectCall[] | number

/** Splits at `separator` outside brackets, braces, parentheses and quotes. */
export const splitTop = (text: string, separator: string): string[] => {
  const parts: string[] = []
  let depth = 0
  let quote = ''
  let start = 0
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quote) {
      if (c === quote) quote = ''
    } else if (c === '"' || c === "'") quote = c
    else if ('([{'.includes(c)) depth++
    else if (')]}'.includes(c)) depth--
    else if (c === separator && depth === 0) {
      parts.push(text.slice(start, i))
      start = i + 1
    }
  }
  parts.push(text.slice(start))
  return parts
}

export const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)$/

export const valueOf = (text: string): Value => {
  const value = text.trim().replace(/^(['"])(.*)\1$/, '$2')
  return NUMBER.test(value) ? Number(value) : value
}

export const NAMED = /^([A-Za-z_$][\w$]*)\s*[:=]\s*([\s\S]+)$/

/**
 * `0.25, 0.8, { duration: 1 }`: positional values fill the effect's parameters
 * in order, `key: value` (or `key=value`) sets one by name, and an object sets
 * several. Only what is written is set.
 */
export const parseArgs = (name: string, text: string): Record<string, Value> => {
  const names = effectParamNames(name)
  const args: Record<string, Value> = {}
  let next = 0
  const set = (key: string, value: string) => {
    args[key] = valueOf(value)
  }
  for (const raw of splitTop(text, ',')) {
    const arg = raw.trim()
    if (!arg) continue
    if (arg.startsWith('{') && arg.endsWith('}')) {
      for (const entry of splitTop(arg.slice(1, -1), ',')) {
        const named = NAMED.exec(entry.trim())
        if (named) set(named[1]!, named[2]!)
      }
    } else {
      const named = NAMED.exec(arg)
      if (named) set(named[1]!, named[2]!)
      else if (names[next]) set(names[next++]!, arg)
    }
  }
  return args
}

export const CALL = /^([A-Za-z_$][\w$]*)\s*(?:\(([\s\S]*)\))?$/

/**
 * Parses `'fadeIn(0.25)+scaleIn,+2,fadeOut({ duration: 1 })'`: commas separate
 * steps that play in turn, `+` joins effects that play together, a number is a
 * pause, and a negative one (`-0.2`) backs the next step up, so it overlaps
 * the last. An effect may be followed by arguments in parentheses.
 */
export const parseSequence = (sequence: string): EffectStep[] => {
  const steps: EffectStep[] = []
  for (const raw of splitTop(sequence, ',')) {
    const step = raw.trim()
    if (NUMBER.test(step)) steps.push(Number(step))
    else if (step)
      steps.push(
        splitTop(step, '+')
          .map((call) => call.trim())
          .filter(Boolean)
          .map((call) => {
            const match = CALL.exec(call)
            return match
              ? { name: match[1]!, args: parseArgs(match[1]!, match[2] ?? '') }
              : { name: call, args: {} }
          })
      )
  }
  return steps
}

/** A call's timing keys, apart from the effect's own parameters. */
export const splitTiming = (
  args: Record<string, Value>
): { timing: Timing; params: Record<string, Value> } => {
  const { duration, offset, ease, ...params } = args
  const timing: Timing = {}
  if (duration !== undefined && Number.isFinite(Number(duration)))
    timing.duration = Number(duration)
  if (offset !== undefined && Number.isFinite(Number(offset)))
    timing.offset = Number(offset)
  if (ease !== undefined) timing.ease = String(ease)
  return { timing, params }
}
