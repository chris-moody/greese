/** An effect call as greese.js keyframes: its parts' tracks, resolved for a reach. */
import {
  baseEffects,
  builtInEffects,
  comboEffects,
  cssReach,
  isBase,
  isBuiltInEffect,
  jsReach,
  timingKeys,
  type BaseDefinition,
  type BuiltInEffect,
  type ComboDefinition,
  type EffectFrames,
  type Reach,
  type Stop,
  type Value,
} from './definitions.ts'

export type Track = { property: string; stops: Stop[] }

export const round = (offset: number): number => Math.round(offset * 10_000) / 10_000

export const tracksOf = (
  name: BuiltInEffect,
  args: Record<string, Value | undefined>,
  reach: Reach
): Track[] => {
  const definition = builtInEffects[name]
  const defaults = isBase(name)
    ? baseEffects[name].params
    : (definition as ComboDefinition).params(reach)
  const params: Record<string, Value> = { ...defaults }
  for (const key of Object.keys(defaults))
    if (args[key] !== undefined) params[key] = args[key]
  if (isBase(name)) {
    const { stops, format, property, fixed } = baseEffects[name] as BaseDefinition
    const at = stops
      ? stops(params)
      : ([
          [0, params.start!],
          [1, params.end!],
        ] as const)
    return [
      {
        property,
        stops: at.map(([offset, value]) => [offset, format ? format(value) : value]),
      },
      ...Object.entries(fixed ?? {}).map(([prop, value]) => ({
        property: prop,
        stops: [
          [0, value],
          [1, value],
        ] as Stop[],
      })),
    ]
  }
  return (definition as ComboDefinition).parts(params, reach).flatMap((p) =>
    tracksOf(p.effect, p.args, reach).map(({ property, stops }) => ({
      property,
      stops: stops.map(
        ([offset, value]) =>
          [round(p.at[0] + offset * (p.at[1] - p.at[0])), value] as const
      ),
    }))
  )
}

/** Properties with evenly spaced stops are written as `{ property: [values] }`, else as a list of frames. */
export const framesOf = (tracks: Track[]): EffectFrames => {
  const even = tracks.every(
    ({ stops }) =>
      stops.length > 1 &&
      stops.every(([offset], i) => round(offset) === round(i / (stops.length - 1)))
  )
  if (even)
    return Object.fromEntries(
      tracks.map(({ property, stops }) => [property, stops.map(([, value]) => value)])
    )
  const at = new Map<number, Record<string, Value>>()
  for (const { property, stops } of tracks)
    for (const [offset, value] of stops) {
      const key = round(offset)
      at.set(key, { ...at.get(key), [property]: value })
    }
  return [...at]
    .sort(([a], [b]) => a - b)
    .map(([offset, values]) => ({ ...values, offset }))
}

/**
 * An effect's keyframes for a reach and arguments (parameter names to values).
 * Defaults to a left-to-right `1rem` and every parameter's default, which is
 * what tools that show or edit the effects want.
 */
export const effectFrames = (
  name: BuiltInEffect,
  reach: Reach = jsReach('1rem', false),
  args: Record<string, Value | undefined> = {}
): EffectFrames => framesOf(tracksOf(name, args, reach))

/** The parameters an effect has, then the timing keys: the order positional arguments fill. */
export const effectParamNames = (name: string): string[] =>
  isBuiltInEffect(name)
    ? [
        ...Object.keys(
          isBase(name) ? baseEffects[name].params : comboEffects[name].params(cssReach)
        ),
        ...timingKeys,
      ]
    : [...timingKeys]
