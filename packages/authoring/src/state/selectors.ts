import type { AuthoringRootState } from './createAuthoringStore.ts'

export const selectPanelsState = (state: AuthoringRootState) => state.panels
export const selectPanelWorkspace = (state: AuthoringRootState) => state.panels.workspace
export const selectPanelFloating = (state: AuthoringRootState) => state.panels.floating
export const selectShowRulers = (state: AuthoringRootState) => state.panels.showRulers
