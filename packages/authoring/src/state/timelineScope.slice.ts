/**
 * Shared scope tracker — the single source of "which view/subview am I in" for
 * every scope-keyed map introduced by the timeline tool system
 * (`timelineTools.slice.ts`, `playbackBounds.slice.ts`, `rateCurve.slice.ts`,
 * `timeSignature.slice.ts`), mirroring the existing `fpsByScope`/guide-scope
 * pattern instead of re-deriving scope independently for each concern.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { ROOT_GUIDE_SCOPE } from './guides.slice.ts'

export interface TimelineScopeState {
  activeScope: string
}

const initialState: TimelineScopeState = {
  activeScope: ROOT_GUIDE_SCOPE,
}

export const timelineScopeSlice = createSlice({
  name: 'timelineScope',
  initialState,
  reducers: {
    /** Switch the active scope — every `*ByScope` map in this plan keys off it. */
    setActiveScope: (state, action: PayloadAction<string>) => {
      state.activeScope = action.payload
    },
  },
})

export const timelineScopeActions = timelineScopeSlice.actions
export const timelineScopeReducer = timelineScopeSlice.reducer
