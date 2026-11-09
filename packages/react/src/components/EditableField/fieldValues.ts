/**
 * What an EditableField's value can be, and the arithmetic over it:
 * EditableField's pure parts, in a file of their own so they stay out of the
 * client boundary and can be tested directly (ADR 0027).
 */

/** Which control an EditableField renders. */
export type EditableFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'range'
  | 'color'
  | 'knob'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'select'
  | 'choice'
  | 'segmented'

/** One selectable option for the `radio`, `select`, `choice` and `segmented` types. */
export interface EditableFieldOption {
  /** Reported to `onValueChange` when chosen. */
  value: string | number
  /** What the reader sees. */
  label: string
  /**
   * Puts the option under a heading in a `select`, started wherever `group`
   * differs from the previous option's — so a flat list renders flat.
   */
  group?: string
}

/** Every value an EditableField can hold. */
export type EditableFieldValue = string | number | boolean | null

/** How many decimal places a number field keeps when `numDecimals` is left out. */
export const DEFAULT_NUM_DECIMALS = 2

/**
 * The control a value asks for when no `type` is given: a boolean is a
 * checkbox, a number is a number field, and a string is text — unless it reads
 * as a hex color, which is what a color field holds.
 *
 * `null` has no type of its own, so it falls back to a number field; an empty
 * field of another type needs its `type` naming it.
 */
export const inferEditableFieldType = (value: EditableFieldValue): EditableFieldType => {
  if (typeof value === 'boolean') return 'checkbox'
  if (typeof value === 'number' || value === null) return 'number'
  return /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(value) ? 'color' : 'text'
}

/** The types that need `options`, and render nothing without them. */
export const OPTION_TYPES: readonly EditableFieldType[] = [
  'radio',
  'select',
  'choice',
  'segmented',
]

const decimalsOf = (value: number): number => {
  if (!Number.isFinite(value)) return 0
  const text = String(value)
  const exponent = text.split('e-')[1]
  if (exponent !== undefined) return Number(exponent)
  const point = text.indexOf('.')
  return point === -1 ? 0 : text.length - point - 1
}

/** `value` with everything past `decimals` places dropped. */
export const roundTo = (value: number, decimals: number): number => {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * How many decimals a field keeps. A `step` finer than `numDecimals` would be
 * rounded away on every commit — the field would refuse the values its own
 * arrows produce — so the limit widens to fit the step instead.
 */
export const resolveDecimals = (
  step: number | undefined,
  numDecimals: number = DEFAULT_NUM_DECIMALS
): number => (step === undefined ? numDecimals : Math.max(numDecimals, decimalsOf(step)))

/** `degrees` brought into `0`–`359.99…`, so a dial wraps instead of running on. */
export const wrapDegrees = (degrees: number): number => ((degrees % 360) + 360) % 360
