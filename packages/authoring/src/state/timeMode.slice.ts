/**
 * Per-scope display mode for tick positions in the ruler and readout —
 * independent of the shell's document unit. Scoped like every other
 * `*ByScope` map in this plan, keyed off `timelineScope.slice.ts`'s `activeScope`.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { TimeMode } from '../core/types/resolution.types.ts'

export interface TimeModeState {
  modeByScope: Record<string, TimeMode>
}

const initialState: TimeModeState = {
  modeByScope: {},
}

export const timeModeSlice = createSlice({
  name: 'timeMode',
  initialState,
  reducers: {
    setTimeMode: (state, action: PayloadAction<{ scope: string; mode: TimeMode }>) => {
      state.modeByScope[action.payload.scope] = action.payload.mode
    },
    /** Replace the whole map — used to load persisted `modeByScope` from a document. */
    hydrate: (state, action: PayloadAction<Record<string, TimeMode>>) => {
      state.modeByScope = action.payload
    },
  },
})

export const timeModeActions = timeModeSlice.actions
export const timeModeReducer = timeModeSlice.reducer
