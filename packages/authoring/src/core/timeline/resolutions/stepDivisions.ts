/**
 * Fixed-ratio musical grid tiers, extracted from {@link createMusicalResolution}'s
 * `getSnapPoints` so the zoom-adaptive snap tiers and the explicit "pick a step
 * resolution" controls (Step's fixed note length, Compose's quantized Space-advance)
 * agree by construction — one source of truth, no parallel grid concept. Bar
 * boundaries are excluded (they're signature-table-dependent, not a fixed
 * `ticksPerUnit` fraction).
 */

export enum MusicalStepDivision {
  beat = 'beat',
  eighth = 'eighth',
  eighthTriplet = 'eighthTriplet',
  sixteenth = 'sixteenth',
  thirtySecond = 'thirtySecond',
  /** No quantization — a continuous/no-quantization sentinel. */
  off = 'off',
}

export const MUSICAL_STEP_DIVISION_OPTIONS: { id: MusicalStepDivision; label: string }[] =
  [
    { id: MusicalStepDivision.beat, label: 'Beat' },
    { id: MusicalStepDivision.eighth, label: '1/8' },
    { id: MusicalStepDivision.eighthTriplet, label: '1/8 triplet' },
    { id: MusicalStepDivision.sixteenth, label: '1/16' },
    { id: MusicalStepDivision.thirtySecond, label: '1/32' },
    { id: MusicalStepDivision.off, label: 'Off' },
  ]

const DIVISOR: Record<Exclude<MusicalStepDivision, MusicalStepDivision.off>, number> = {
  [MusicalStepDivision.beat]: 1,
  [MusicalStepDivision.eighth]: 2,
  [MusicalStepDivision.eighthTriplet]: 3,
  [MusicalStepDivision.sixteenth]: 4,
  [MusicalStepDivision.thirtySecond]: 8,
}

/** Tick length of `division` at `ticksPerUnit` — `0` (no quantization) for `off`. */
export const ticksForStepDivision = (
  division: MusicalStepDivision,
  ticksPerUnit: number
): number => {
  if (division === MusicalStepDivision.off) return 0
  return ticksPerUnit / DIVISOR[division]
}
