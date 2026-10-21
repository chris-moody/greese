import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Keyframes } from '@greese/js'
import { defineGreeseEffect, describeGreeseEffects } from '@greese/react'
import { formatKeyframes, parseKeyframes } from './effectCode.ts'

/** Effects the site defines itself (src/effects.ts), playable here too. */
const SITE_EFFECTS = ['wobble']

export const EXAMPLES = [
  'fadeIn+scaleIn,+1,wobble',
  'slideUp,-0.2,popIn,+0.4,rise+glow',
  'fadeStart+blurIn,popIn',
]

/** Groups for the effect list, by what they're for. */
export const GROUPS: Array<[title: string, match: (name: string) => boolean]> = [
  ['Entrances', (n) => !/Out$/.test(n) && !INTERACTIONS.has(n)],
  ['Leaving', (n) => /Out$/.test(n)],
  ['Interactions', (n) => INTERACTIONS.has(n)],
]
const INTERACTIONS = new Set(['rise', 'fall', 'squish', 'tilt', 'glow'])

/** The effects a sequence may name that aren't the built-ins edited here. */
export const LEAVING = (name: string) => /Out$/.test(name)

export interface GreeseLab {
  /** The built-in effects' own keyframes, once loaded. */
  defaults: Record<string, Keyframes> | undefined
  names: string[]
  /** The code as edited, by effect; absent when untouched. */
  edits: Record<string, string>
  /** Each edit's parse error, when it has one. */
  errors: Record<string, string>
  /** The code to show for an effect: the edit, else the original. */
  codeOf: (name: string) => string
  edit: (name: string, code: string) => void
  reset: (name: string) => void
  sequence: string
  setSequence: (sequence: string) => void
  /** Names in the sequence that aren't effects. */
  unknown: string[]
  /** What the stage plays, with edited effects swapped for their edits. */
  played: { key: number; sequence: string; shown: string }
  play: (sequence?: string) => void
}

/**
 * The Greese tab's state: the effect list and its code, edits to it, and the
 * sequence the stage plays. Edited effects are defined under `studio:<name>`
 * (a built-in's own name can't be redefined) and swapped into the sequence
 * only when it plays.
 */
export const useGreeseLab = (): GreeseLab => {
  const [defaults, setDefaults] = useState<Record<string, Keyframes>>()
  const [edits, setEdits] = useState<Record<string, string>>({})
  const [sequence, setSequence] = useState(EXAMPLES[0]!)
  const [played, setPlayed] = useState({
    key: 0,
    sequence: EXAMPLES[0]!,
    shown: EXAMPLES[0]!,
  })

  useEffect(() => {
    let live = true
    void describeGreeseEffects().then((frames) => live && setDefaults(frames))
    return () => {
      live = false
    }
  }, [])

  const names = useMemo(() => Object.keys(defaults ?? {}), [defaults])
  const parsed = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(edits).map(([n, code]) => [n, parseKeyframes(code)])
      ),
    [edits]
  )
  const errors = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(parsed).flatMap(([n, r]) => ('error' in r ? [[n, r.error]] : []))
      ),
    [parsed]
  )

  const codeOf = useCallback(
    (name: string) =>
      edits[name] ?? (defaults?.[name] ? formatKeyframes(defaults[name]!) : ''),
    [edits, defaults]
  )
  const edit = useCallback(
    (name: string, code: string) =>
      setEdits((e) =>
        defaults?.[name] && code === formatKeyframes(defaults[name]!)
          ? Object.fromEntries(Object.entries(e).filter(([n]) => n !== name))
          : { ...e, [name]: code }
      ),
    [defaults]
  )
  const reset = useCallback(
    (name: string) =>
      setEdits((e) => Object.fromEntries(Object.entries(e).filter(([n]) => n !== name))),
    []
  )

  const known = useMemo(() => new Set([...names, ...SITE_EFFECTS]), [names])
  const unknown = sequence
    .split(/[,+]/)
    .map((s) => s.trim())
    .filter((s) => s && !/^[+-]?\d*\.?\d+$/.test(s) && !known.has(s))

  const play = useCallback(
    (next?: string) => {
      const text = next ?? sequence
      setSequence(text)
      // Valid edits become `studio:<name>` effects, swapped in for the names.
      const swapped = new Set<string>()
      for (const [name, result] of Object.entries(parsed)) {
        if ('frames' in result) {
          defineGreeseEffect(`studio:${name}`, result.frames)
          swapped.add(name)
        }
      }
      const shown = text
        .split(/([,+])/)
        .map((part) => (swapped.has(part.trim()) ? `studio:${part.trim()}` : part))
        .join('')
      setPlayed((p) => ({ key: p.key + 1, sequence: text, shown }))
    },
    [sequence, parsed]
  )

  return {
    defaults,
    names,
    edits,
    errors,
    codeOf,
    edit,
    reset,
    sequence,
    setSequence,
    unknown,
    played,
    play,
  }
}
