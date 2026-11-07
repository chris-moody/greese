/**
 * Timeline tool ids + per-scope active tool. Mirrors the legacy
 * `packages/pixels` (since removed) `tools.reducer.ts`'s `{ tools, current }`
 * shape but scoped like `pixels.slice.ts`'s `fpsByScope` — each scope (see
 * `timelineScope.slice.ts`) remembers its own active tool.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export enum TimelineToolId {
  frame = 'frame',
  rate = 'rate',
  marker = 'marker',
  timeSignature = 'timeSignature',
}

export interface TimelineToolsState {
  toolByScope: Record<string, TimelineToolId>
}

const initialState: TimelineToolsState = {
  toolByScope: {},
}

export const timelineToolsSlice = createSlice({
  name: 'timelineTools',
  initialState,
  reducers: {
    setTool: (state, action: PayloadAction<{ scope: string; tool: TimelineToolId }>) => {
      state.toolByScope[action.payload.scope] = action.payload.tool
    },
    /** Replace the whole map — used to load persisted `toolByScope` from a document. */
    hydrate: (state, action: PayloadAction<Record<string, TimelineToolId>>) => {
      state.toolByScope = action.payload
    },
  },
})

export const timelineToolsActions = timelineToolsSlice.actions
export const timelineToolsReducer = timelineToolsSlice.reducer
