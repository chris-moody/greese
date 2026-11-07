import { describe, expect, it } from 'vitest'
import { MusicalStepDivision, ticksForStepDivision } from './stepDivisions.ts'

describe('ticksForStepDivision', () => {
  const TPQ = 960

  it("divides the ticks-per-quarter-note constant by each division's ratio", () => {
    expect(ticksForStepDivision(MusicalStepDivision.beat, TPQ)).toBe(960)
    expect(ticksForStepDivision(MusicalStepDivision.eighth, TPQ)).toBe(480)
    expect(ticksForStepDivision(MusicalStepDivision.eighthTriplet, TPQ)).toBe(320)
    expect(ticksForStepDivision(MusicalStepDivision.sixteenth, TPQ)).toBe(240)
    expect(ticksForStepDivision(MusicalStepDivision.thirtySecond, TPQ)).toBe(120)
  })

  it('returns 0 (no quantization) for off', () => {
    expect(ticksForStepDivision(MusicalStepDivision.off, TPQ)).toBe(0)
  })

  it('scales with a different ticksPerUnit', () => {
    expect(ticksForStepDivision(MusicalStepDivision.sixteenth, 480)).toBe(120)
  })
})
