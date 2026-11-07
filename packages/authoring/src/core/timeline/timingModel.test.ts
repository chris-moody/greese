import { describe, expect, it } from 'vitest'
import { createTimingModel } from './timingModel.ts'
import { TimingMode } from '../types/timing.types.ts'

describe('createTimingModel', () => {
  it('FPS converts frames <-> time, labels, and counts', () => {
    const model = createTimingModel({
      mode: TimingMode.FPS,
      fps: 24,
      frameCount: 48,
      loop: false,
      playbackSpeed: 1,
    })
    expect(model.frameToTime(24)).toBeCloseTo(1)
    expect(model.timeToFrame(1)).toBe(24)
    expect(model.labelFor(5)).toBe('5')
    expect(model.frameCount()).toBe(48)
  })

  it('UNITS mode is an identity mapping', () => {
    const model = createTimingModel({
      mode: TimingMode.UNITS,
      frameCount: 10,
      loop: false,
      playbackSpeed: 1,
    })
    expect(model.frameToTime(7)).toBe(7)
    expect(model.timeToFrame(7)).toBe(7)
  })

  it('BPM labels as bar:beat:step (4 steps/beat, 4 beats/bar)', () => {
    const model = createTimingModel({
      mode: TimingMode.BPM,
      bpm: 120,
      frameCount: 64,
      loop: false,
      playbackSpeed: 1,
    })
    expect(model.labelFor(0)).toBe('1:1:1')
    expect(model.labelFor(4)).toBe('1:2:1')
    expect(model.labelFor(16)).toBe('2:1:1')
  })
})
