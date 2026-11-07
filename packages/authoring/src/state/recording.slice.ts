/**
 * Recording modes for shells whose stage plays notes onto the timeline (Sound
 * Studio's keyboard roll). View state: preserved across undo/redo, not
 * persisted to documents. Shells opt the header toggles in via
 * `MediaConfig.timelineTools.showRecording`.
 *
 * Three note-authoring philosophies, differing only in how the playhead advances:
 * - `live` — the real transport clock runs; respects loop bounds.
 * - `continuous` — ignores loop toggle; auto-extends the timeline as needed to
 *   fit recorded notes; advances the playhead to each note's end.
 * - `compose` — nothing moves until the user explicitly advances time (e.g.
 *   holding Space), and a placed note never forces the playhead forward.
 *
 * `auditionOnPlace` is a boolean refinement of Compose, not a fourth mode: it
 * only changes what happens after a note is committed (an audio sweep from the
 * loop start through the note), not how the playhead advances.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { MusicalStepDivision } from '../core/timeline/resolutions/index.ts'

export enum RecordMode {
  live = 'live',
  continuous = 'continuous',
  compose = 'compose',
}

export interface RecordingState {
  /** When true (default), notes played on the stage are written onto the timeline. */
  enabled: boolean
  /** When true, recorded note durations snap to the nearest standard note length. */
  autoTrim: boolean
  /** How the playhead advances while recording. */
  mode: RecordMode
  /** Grid resolution for Compose's quantized Space-advance (deprecated for Continuous). */
  stepDivision: MusicalStepDivision
  /** Compose only: sweep-audition every placed note in context immediately after commit. */
  auditionOnPlace: boolean
  /**
   * Mirrors Compose mode's Space-hold scrub-in-progress ref
   * (`useTimelineKeymap.ts`'s `composeScrubRef`) into redux so other consumers
   * (e.g. the metronome's `'recording'` enable mode) can subscribe to it — Compose
   * scrubbing never sets `playback.playing`, so `enabled && playback.playing` alone
   * doesn't capture "recording is active" for that mode.
   */
  composeScrubActive: boolean
}

const initialState: RecordingState = {
  enabled: false,
  autoTrim: false,
  mode: RecordMode.live,
  stepDivision: MusicalStepDivision.sixteenth,
  auditionOnPlace: false,
  composeScrubActive: false,
}

export const recordingSlice = createSlice({
  name: 'recording',
  initialState,
  reducers: {
    setRecordingEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload
    },
    setAutoTrim: (state, action: PayloadAction<boolean>) => {
      state.autoTrim = action.payload
    },
    setRecordMode: (state, action: PayloadAction<RecordMode>) => {
      state.mode = action.payload
    },
    setStepDivision: (state, action: PayloadAction<MusicalStepDivision>) => {
      state.stepDivision = action.payload
    },
    setAuditionOnPlace: (state, action: PayloadAction<boolean>) => {
      state.auditionOnPlace = action.payload
    },
    setComposeScrubActive: (state, action: PayloadAction<boolean>) => {
      state.composeScrubActive = action.payload
    },
  },
})

export const recordingActions = recordingSlice.actions
export const recordingReducer = recordingSlice.reducer
