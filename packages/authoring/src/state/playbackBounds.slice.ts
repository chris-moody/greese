/**
 * Playback bounds — per-scope `[start, end]` in/out points (both inclusive —
 * `end` defaults to `selectFrameCount - 1`, the last playable frame) that
 * constrain looping/playback, keyed off `timelineScope.slice.ts`'s
 * `activeScope`. An absent entry means today's behavior: the full
 * `[0, frameCount - 1]` range.
 *
 * Positions are in the same raw frame-grid-unit space `FrameBase.frame` and
 * `playback.currentFrame` already use (not converted to literal resolution
 * ticks) so `usePlaybackClock` can compare them directly.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface PlaybackBounds {
  start: number
  end: number
}

export interface PlaybackBoundsState {
  boundsByScope: Record<string, PlaybackBounds | undefined>
}

const initialState: PlaybackBoundsState = {
  boundsByScope: {},
}

export const playbackBoundsSlice = createSlice({
  name: 'playbackBounds',
  initialState,
  reducers: {
    setBounds: (
      state,
      action: PayloadAction<{ scope: string; bounds: PlaybackBounds }>
    ) => {
      state.boundsByScope[action.payload.scope] = action.payload.bounds
    },
    clearBounds: (state, action: PayloadAction<{ scope: string }>) => {
      delete state.boundsByScope[action.payload.scope]
    },
    /** Replace the whole map — used to load persisted `boundsByScope` from a document. */
    hydrate: (
      state,
      action: PayloadAction<Record<string, PlaybackBounds | undefined>>
    ) => {
      state.boundsByScope = action.payload
    },
  },
})

export const playbackBoundsActions = playbackBoundsSlice.actions
export const playbackBoundsReducer = playbackBoundsSlice.reducer
