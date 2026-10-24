import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Keyframes } from '@greese/js'
import { describeGreeseEffects } from '@greese/react'
import { formatKeyframes, parseKeyframes } from './effectCode.ts'
import { effectPlan, endsHidden, isBuiltInEffect, parseSequence } from '@greese/ui'
import type { EffectSpec, ThemeSpec } from './spec.ts'

/** Effects the site defines itself (src/effects.ts), playable here too. */
const SITE_EFFECTS = ['wobble']

export const EXAMPLES = [
  'fadeIn+scaleIn,+1,wobble',
  'slideUp,-0.2,pop,rise+glow',
  'fadeStart+blurIn,+0.4,pop',
]

/** What an effect does, from where it ends: at rest (it arrives), hidden (it leaves), or away (it adds emphasis). */
const ends = (name: string): 'rest' | 'hidden' | 'away' =>
  !isBuiltInEffect(name) || effectPlan(name).enter
    ? 'rest'
    : endsHidden(name)
      ? 'hidden'
      : 'away'

/** Groups for the effect list, by where each ends. */
export const GROUPS: Array<[title: string, match: (name: string) => boolean]> = [
  ['Entrances', (n) => ends(n) === 'rest'],
  ['Leaving', (n) => ends(n) === 'hidden'],
  ['Interactions', (n) => ends(n) === 'away'],
]

const without = <T>(record: Record<string, T>, name: string): Record<string, T> =>
  Object.fromEntries(Object.entries(record).filter(([n]) => n !== name))

/** A name for a new effect: camelCase, not a built-in, not already there. */
export const effectNameError = (name: string, existing: string[]): string | undefined => {
  if (!/^[a-z][A-Za-z0-9]*$/.test(name))
    return 'Use camelCase letters and digits, starting with a lower-case letter.'
  if (isBuiltInEffect(name) || SITE_EFFECTS.includes(name))
    return `${name} is a built-in effect, which keeps its own keyframes: name yours differently.`
  if (existing.includes(name)) return `${name} is already one of the theme's effects.`
  return undefined
}

export interface GreeseLab {
  /** The built-in effects' own keyframes, once loaded. */
  defaults: Record<string, Keyframes> | undefined
  /** The built-in names. */
  names: string[]
  /** The theme's own new effects. */
  custom: string[]
  /** The theme's own effects: the spec's. Built-ins are never retuned (ADR 0025). */
  effects: Record<string, EffectSpec>
  /** Whether the theme defines this effect. */
  isSet: (name: string) => boolean
  /** The code to show: as typed, else the theme's, else the original. */
  codeOf: (name: string) => string
  /** Each effect's parse error; until it's fixed, the theme keeps the last valid code. */
  errors: Record<string, string>
  /** Code typed for an effect: valid code goes into the theme, invalid stays a draft. */
  edit: (name: string, code: string) => void
  /** Removes one of the theme's effects. */
  reset: (name: string) => void
  setDuration: (name: string, seconds: number | undefined) => void
  /** Adds a new effect; returns what's wrong, if anything. */
  add: (name: string, code: string) => string | undefined
  /** Adds a copy of a built-in under a free name, to change; returns the name. */
  copy: (name: string) => string
  sequence: string
  setSequence: (sequence: string) => void
  /** Names in the sequence that aren't effects. */
  unknown: string[]
  played: { key: number; sequence: string }
  play: (sequence?: string) => void
}

/**
 * The Motion tab's effects' state. The effects belong to the theme (`spec.effects`):
 * editing one changes the spec, which the studio saves, compiles into the
 * theme's CSS and effects module, and applies to the preview and the page.
 * What's being typed that doesn't parse yet is kept as a draft.
 */
export const useGreeseLab = (
  spec: ThemeSpec,
  onChange: (spec: ThemeSpec) => void
): GreeseLab => {
  const [defaults, setDefaults] = useState<Record<string, Keyframes>>()
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [sequence, setSequence] = useState(EXAMPLES[0]!)
  const [played, setPlayed] = useState({ key: 0, sequence: EXAMPLES[0]! })
  const effects = spec.effects ?? {}

  useEffect(() => {
    let live = true
    void describeGreeseEffects().then((frames) => live && setDefaults(frames))
    return () => {
      live = false
    }
  }, [])

  const names = useMemo(() => Object.keys(defaults ?? {}), [defaults])
  const custom = useMemo(
    () => Object.keys(effects).filter((n) => !isBuiltInEffect(n)),
    [effects]
  )
  /** The effects this tab last wrote: a different set arrived from outside (an import). */
  const written = useRef(JSON.stringify(spec.effects ?? {}))
  useEffect(() => {
    if (JSON.stringify(spec.effects ?? {}) !== written.current) {
      written.current = JSON.stringify(spec.effects ?? {})
      setDrafts({})
    }
  }, [spec.effects])
  const setEffects = useCallback(
    (next: Record<string, EffectSpec>) => {
      written.current = JSON.stringify(next)
      const { effects: _old, ...rest } = spec
      onChange(Object.keys(next).length ? { ...rest, effects: next } : rest)
    },
    [spec, onChange]
  )

  const codeOf = useCallback(
    (name: string) =>
      drafts[name] ??
      (effects[name]
        ? formatKeyframes(effects[name]!.keyframes)
        : defaults?.[name]
          ? formatKeyframes(defaults[name]!)
          : ''),
    [drafts, effects, defaults]
  )
  const errors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(drafts).flatMap(([n, code]) => {
          const r = parseKeyframes(code)
          return 'error' in r ? [[n, r.error]] : []
        })
      ),
    [drafts]
  )

  const edit = useCallback(
    (name: string, code: string) => {
      // A built-in always does what its name says: only the theme's own change.
      if (isBuiltInEffect(name)) return
      // What's typed is shown as typed (reformatting it under the cursor would
      // make editing impossible); valid code also goes into the theme.
      setDrafts((d) => ({ ...d, [name]: code }))
      const parsed = parseKeyframes(code)
      if ('error' in parsed) return
      setEffects({ ...effects, [name]: { ...effects[name], keyframes: parsed.frames } })
    },
    [effects, setEffects]
  )
  const reset = useCallback(
    (name: string) => {
      setDrafts((d) => without(d, name))
      setEffects(without(effects, name))
    },
    [effects, setEffects]
  )
  const setDuration = useCallback(
    (name: string, seconds: number | undefined) => {
      const effect = effects[name]
      if (!effect) return
      const { duration: _d, ...rest } = effect
      setEffects({ ...effects, [name]: seconds ? { ...rest, duration: seconds } : rest })
    },
    [effects, setEffects]
  )
  const add = useCallback(
    (name: string, code: string) => {
      const problem = effectNameError(name, Object.keys(effects))
      if (problem) return problem
      const parsed = parseKeyframes(code)
      if ('error' in parsed) return parsed.error
      setEffects({ ...effects, [name]: { keyframes: parsed.frames } })
      return undefined
    },
    [effects, setEffects]
  )
  const copy = useCallback(
    (name: string) => {
      let next = `${name}Copy`
      for (let i = 2; effectNameError(next, Object.keys(effects)); i++) next = `${name}Copy${i}`
      setEffects({ ...effects, [next]: { keyframes: defaults?.[name] ?? {} } })
      return next
    },
    [defaults, effects, setEffects]
  )

  const known = useMemo(
    () => new Set([...names, ...SITE_EFFECTS, ...Object.keys(effects)]),
    [names, effects]
  )
  const unknown = parseSequence(sequence)
    .flatMap((step) => (typeof step === 'number' ? [] : step.map((call) => call.name)))
    .filter((name) => !known.has(name))

  const play = useCallback(
    (next?: string) => {
      const text = next ?? sequence
      setSequence(text)
      setPlayed((p) => ({ key: p.key + 1, sequence: text }))
    },
    [sequence]
  )

  return {
    defaults,
    names,
    custom,
    effects,
    isSet: (name) => name in effects,
    codeOf,
    errors,
    edit,
    reset,
    setDuration,
    add,
    copy,
    sequence,
    setSequence,
    unknown,
    played,
    play,
  }
}
