/**
 * Timing models — concrete strategies behind the media-agnostic
 * {@link TimingModel}. The timeline UI reads only this interface, so FPS vs BPM
 * vs arbitrary units never branches in the view layer.
 */
import { TimingMode, type TimingConfig, type TimingModel } from '../types/timing.types.ts'

const clampFrame = (frame: number, count: number): number =>
  Math.max(0, Math.min(Math.round(frame), Math.max(0, count - 1)))

const fpsModel = (config: TimingConfig): TimingModel => {
  const fps = config.fps && config.fps > 0 ? config.fps : 24
  return {
    mode: TimingMode.FPS,
    frameToTime: (frame) => frame / fps,
    timeToFrame: (time) => Math.round(time * fps),
    labelFor: (frame) => String(frame),
    frameCount: () => config.frameCount,
  }
}

const bpmModel = (config: TimingConfig): TimingModel => {
  const bpm = config.bpm && config.bpm > 0 ? config.bpm : 120
  // One frame = one 1/16 step; 4 steps per beat, 4 beats per bar.
  const stepsPerBeat = 4
  const secondsPerStep = 60 / bpm / stepsPerBeat
  return {
    mode: TimingMode.BPM,
    frameToTime: (frame) => frame * secondsPerStep,
    timeToFrame: (time) => Math.round(time / secondsPerStep),
    labelFor: (frame) => {
      const bar = Math.floor(frame / (stepsPerBeat * 4)) + 1
      const beat = (Math.floor(frame / stepsPerBeat) % 4) + 1
      const step = (frame % stepsPerBeat) + 1
      return `${bar}:${beat}:${step}`
    },
    frameCount: () => config.frameCount,
  }
}

const unitsModel = (config: TimingConfig): TimingModel => ({
  mode: TimingMode.UNITS,
  frameToTime: (frame) => frame,
  timeToFrame: (time) => Math.round(time),
  labelFor: (frame) => String(frame),
  frameCount: () => config.frameCount,
})

/** Build the runtime {@link TimingModel} for a timing config. */
export const createTimingModel = (config: TimingConfig): TimingModel => {
  switch (config.mode) {
    case TimingMode.FPS:
      return fpsModel(config)
    case TimingMode.BPM:
      return bpmModel(config)
    case TimingMode.UNITS:
    default:
      return unitsModel(config)
  }
}

export { clampFrame }
