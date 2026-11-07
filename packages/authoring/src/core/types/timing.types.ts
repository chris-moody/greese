/**
 * Timing — media-agnostic time model for the authoring timeline.
 *
 * The timeline UI depends only on the {@link TimingModel} interface, so switching
 * between frames-per-second, beats-per-minute, or arbitrary units never branches
 * inside the view layer. A new timing system is a new `TimingModel` implementation.
 */

/** How a timeline maps abstract frames onto real time and labels. */
export enum TimingMode {
  FPS = 'fps',
  BPM = 'bpm',
  UNITS = 'units',
}

/** Serializable timing configuration stored on the project. */
export interface TimingConfig {
  mode: TimingMode
  /** Frames per second — FPS mode. */
  fps?: number
  /** Beats per minute — BPM mode. */
  bpm?: number
  /** Total number of frames in the timeline. */
  frameCount: number
  /** Whether playback loops at the end. */
  loop: boolean
  /** Playback rate multiplier (1 = realtime). */
  playbackSpeed: number
}

/**
 * Runtime strategy derived from a {@link TimingConfig}. The timeline header,
 * frame grid, and playhead read only this contract.
 */
export interface TimingModel {
  readonly mode: TimingMode
  /** Convert a frame index to seconds. */
  frameToTime(frame: number): number
  /** Convert a time in seconds to the nearest frame index. */
  timeToFrame(time: number): number
  /** Human-readable label for a frame (e.g. "24", "00:12", "1:2:03"). */
  labelFor(frame: number): string
  /** Total frame count. */
  frameCount(): number
}
