/** Playback — the transport state shared by the timeline, stage, and header. */
export interface PlaybackState {
  /** The frame currently displayed on the stage. */
  currentFrame: number
  playing: boolean
  loop: boolean
  /** Playback rate multiplier (1 = realtime). */
  speed: number
  /**
   * Base timeline length (minimum number of frames). The effective length grows
   * past this to include any content (see `selectFrameCount`).
   */
  frameCount: number
}
