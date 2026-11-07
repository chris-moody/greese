import { describe, expect, it } from 'vitest'
import { formatClockTime } from './clockTime.helpers.ts'

describe('formatClockTime', () => {
  it('formats sub-minute durations', () => {
    expect(formatClockTime(0)).toBe('00:00.000')
    expect(formatClockTime(1.5)).toBe('00:01.500')
  })

  it('formats minutes and rolls seconds/ms correctly', () => {
    expect(formatClockTime(61.25)).toBe('01:01.250')
    expect(formatClockTime(0.9995)).toBe('00:01.000')
  })

  it('clamps negative input to zero', () => {
    expect(formatClockTime(-5)).toBe('00:00.000')
  })
})
