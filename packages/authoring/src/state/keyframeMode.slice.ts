/**
 * Global keyframing philosophy toggle, shown in `TimelineHeader`. View state:
 * preserved across undo/redo, not persisted to documents (mirrors
 * `recording.slice.ts`'s framing).
 *
 * - `automatic` (default) — a change to a keyframe-able stage object property
 *   creates a keyframe at the current frame (or overwrites one already there).
 * - `manual` — the same change instead updates whichever keyframe is nearest
 *   at or before the current frame, in place; if there is no such keyframe,
 *   the change isn't recorded at all. Keyframes themselves must still be
 *   created explicitly (double-click, context menu, etc. — see
 *   `useFrameInteractions.ts`/`TimelineContextMenu.tsx`), which is unaffected
 *   by this mode. See `autoKeyframe.helpers.ts` for the shared dispatch this
 *   mode gates.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export enum KeyframeMode {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export interface KeyframeModeState {
  mode: KeyframeMode
}

const initialState: KeyframeModeState = {
  mode: KeyframeMode.AUTOMATIC,
}

export const keyframeModeSlice = createSlice({
  name: 'keyframeMode',
  initialState,
  reducers: {
    setKeyframeMode: (state, action: PayloadAction<KeyframeMode>) => {
      state.mode = action.payload
    },
  },
})

export const keyframeModeActions = keyframeModeSlice.actions
export const keyframeModeReducer = keyframeModeSlice.reducer
