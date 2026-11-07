/**
 * `@greese/authoring/state`: the editor framework's Redux state, with no
 * React. A store per editor (`createAuthoringStore`), its slices and
 * selectors. `@reduxjs/toolkit` is a peer dependency (ADR 0035).
 */
export {
  createAuthoringStore,
  frameworkReducers,
  type AuthoringRootState,
  type AuthoringState,
  type AuthoringStore,
  type StateOfReducers,
} from './createAuthoringStore.ts'
export {
  panelsActions,
  panelsReducer,
  panelsSlice,
  serializePanels,
  type PanelsState,
  type SerializedPanels,
} from './panels.slice.ts'
export {
  selectPanelFloating,
  selectPanelsState,
  selectPanelWorkspace,
  selectShowRulers,
} from './selectors.ts'
