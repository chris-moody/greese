/**
 * History slice — reactive undo/redo availability flags for the UI. The actual
 * snapshot stacks live in the commands middleware (closure), not in state; this
 * slice just mirrors whether undo/redo are available so components can react.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export interface HistoryState {
  canUndo: boolean
  canRedo: boolean
}

const initialState: HistoryState = {
  canUndo: false,
  canRedo: false,
}

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    setHistoryFlags: (state, action: PayloadAction<HistoryState>) => {
      state.canUndo = action.payload.canUndo
      state.canRedo = action.payload.canRedo
    },
  },
})

export const historyActions = historySlice.actions
export const historyReducer = historySlice.reducer
