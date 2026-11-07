/**
 * `@greese/authoring/state`: the editor framework's Redux state, with no
 * React. A store per editor (`createAuthoringStore`), its slices and
 * selectors, undo and redo. `@reduxjs/toolkit` is a peer dependency (ADR 0035).
 */
export {
  clearHistory,
  coalesce,
  createCommandsMiddleware,
  redo,
  silent,
  undo,
} from './commandsMiddleware.ts'
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
export * from './guides.slice.ts'
export * from './history.slice.ts'
export * from './keyframeMode.slice.ts'
export * from './layers.slice.ts'
export * from './library.slice.ts'
export * from './navigation.slice.ts'
export * from './playback.slice.ts'
export * from './playbackBounds.slice.ts'
export * from './rateCurve.slice.ts'
export * from './recording.slice.ts'
export * from './selectors.ts'
export * from './temporalGuide.slice.ts'
export * from './timeline.slice.ts'
export * from './timelineScope.slice.ts'
export * from './timelineTools.slice.ts'
export * from './timeMode.slice.ts'
export * from './timeSignature.slice.ts'
