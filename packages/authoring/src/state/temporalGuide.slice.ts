/**
 * Temporal Guide — which pulse layers (see `timeline/resolutions/pulseBoundaries.helpers.ts`'s
 * `PulseLayerId`) are enabled per timeline scope. View state (like `timelineTools`/
 * `timeMode`/`playbackBounds`), not persisted to a document — preserved across
 * undo/redo, keyed off `timelineScope.slice.ts`'s `activeScope`. Default empty
 * per scope (the guide is off until a user opts in).
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { PulseLayerId } from '../core/timeline/resolutions/pulseBoundaries.helpers.ts'

export interface TemporalGuideState {
  enabledLayersByScope: Record<string, PulseLayerId[]>
}

const initialState: TemporalGuideState = {
  enabledLayersByScope: {},
}

export const temporalGuideSlice = createSlice({
  name: 'temporalGuide',
  initialState,
  reducers: {
    toggleLayer: (
      state,
      action: PayloadAction<{ scope: string; layer: PulseLayerId }>
    ) => {
      const { scope, layer } = action.payload
      const layers = state.enabledLayersByScope[scope] ?? []
      state.enabledLayersByScope[scope] = layers.includes(layer)
        ? layers.filter((l) => l !== layer)
        : [...layers, layer]
    },
  },
})

export const temporalGuideActions = temporalGuideSlice.actions
export const temporalGuideReducer = temporalGuideSlice.reducer
