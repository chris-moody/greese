/**
 * Rate curve — per-scope automation on top of the existing flat fps/tempo
 * scalar, keyed off `timelineScope.slice.ts`'s `activeScope`. An empty/absent
 * array means today's flat behavior (the shell's existing `fpsByScope`/`bpm`
 * value is the implicit single point) — strictly additive, never a
 * replacement for the flat control.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { LevelPoint } from '../core/timeline/levelEditor.types.ts'

export interface RateCurveState {
  curveByScope: Record<string, LevelPoint[]>
}

const initialState: RateCurveState = {
  curveByScope: {},
}

export const rateCurveSlice = createSlice({
  name: 'rateCurve',
  initialState,
  reducers: {
    setRateCurve: (
      state,
      action: PayloadAction<{ scope: string; points: LevelPoint[] }>
    ) => {
      state.curveByScope[action.payload.scope] = action.payload.points
    },
    clearRateCurve: (state, action: PayloadAction<{ scope: string }>) => {
      delete state.curveByScope[action.payload.scope]
    },
    /** Replace the whole map — used to load persisted `curveByScope` from a document. */
    hydrate: (state, action: PayloadAction<Record<string, LevelPoint[]>>) => {
      state.curveByScope = action.payload
    },
  },
})

export const rateCurveActions = rateCurveSlice.actions
export const rateCurveReducer = rateCurveSlice.reducer
