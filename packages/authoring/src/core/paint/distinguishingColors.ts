/**
 * Thirty colours told apart at a glance, for marking things that sit side by
 * side: a path's nodes, its segments. The hues sweep the whole wheel (32
 * slots of 11.25°), at a saturation and brightness that read on a dark stage
 * and on light chrome alike.
 *
 * Indices take the slots in bit-reversed order (0°, 180°, 90°, 270°, 45° …),
 * not around the wheel: neighbouring indices are usually neighbouring items,
 * and a straight sweep gave them nearly the same hue. Each new index lands in
 * the largest gap left, so neighbours differ most. Pixels' node colours.
 */

const COUNT = 30
const SLOT_BITS = 5
const SLOT_DEGREES = 360 / 2 ** SLOT_BITS
const SATURATION = 0.75
const BRIGHTNESS = 0.95

/** The low `bits` bits of `value`, reversed: `bitReverse(0b00001, 5)` is `0b10000`. */
const bitReverse = (value: number, bits: number): number => {
  let result = 0
  for (let i = 0; i < bits; i++) result = (result << 1) | ((value >> i) & 1)
  return result
}

/** A hue at the set saturation and brightness (HSB), as `#rrggbb`. */
const hsbHex = (hue: number): string => {
  const channel = (n: number) => {
    const k = (n + hue / 60) % 6
    const v = BRIGHTNESS - BRIGHTNESS * SATURATION * Math.max(0, Math.min(k, 4 - k, 1))
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${channel(5)}${channel(3)}${channel(1)}`
}

/** The thirty colours, in the order indices take them. */
export const DISTINGUISHING_COLORS: readonly string[] = Array.from(
  { length: COUNT },
  (_, index) => hsbHex(bitReverse(index, SLOT_BITS) * SLOT_DEGREES)
)

/**
 * The colour for an item at `index`, wrapping past thirty (and below zero).
 *
 * ```ts
 * nodes.map((node, i) => node.color ?? distinguishingColor(i))
 * ```
 */
export const distinguishingColor = (index: number): string =>
  DISTINGUISHING_COLORS[((index % COUNT) + COUNT) % COUNT]!
