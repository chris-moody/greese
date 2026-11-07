import {
  combineReducers,
  configureStore,
  type Reducer,
  type UnknownAction,
} from '@reduxjs/toolkit'
import { enableMapSet } from 'immer'
import type { LayerStoreState } from '../core/types/layer.types.ts'
import type { LibraryStoreState } from '../core/types/library.types.ts'
import type { PlaybackState } from '../core/types/playback.types.ts'
import { createCommandsMiddleware, RESTORE_STATE } from './commandsMiddleware.ts'
import { guidesReducer, type GuidesState } from './guides.slice.ts'
import { historyReducer, type HistoryState } from './history.slice.ts'
import { keyframeModeReducer, type KeyframeModeState } from './keyframeMode.slice.ts'
import { layersReducer } from './layers.slice.ts'
import { libraryReducer } from './library.slice.ts'
import { navigationReducer, type NavigationState } from './navigation.slice.ts'
import { panelsReducer, type PanelsState } from './panels.slice.ts'
import { playbackReducer } from './playback.slice.ts'
import {
  playbackBoundsReducer,
  type PlaybackBoundsState,
} from './playbackBounds.slice.ts'
import { rateCurveReducer, type RateCurveState } from './rateCurve.slice.ts'
import { recordingReducer, type RecordingState } from './recording.slice.ts'
import { temporalGuideReducer, type TemporalGuideState } from './temporalGuide.slice.ts'
import { timelineReducer, type TimelineState } from './timeline.slice.ts'
import { timelineScopeReducer, type TimelineScopeState } from './timelineScope.slice.ts'
import { timelineToolsReducer, type TimelineToolsState } from './timelineTools.slice.ts'
import { timeModeReducer, type TimeModeState } from './timeMode.slice.ts'
import { timeSignatureReducer, type TimeSignatureState } from './timeSignature.slice.ts'

/**
 * The slices every authoring store has. An editor's own slices extend it
 * (`AuthoringRootState & TState`). Graphics' swatches and text styles are a
 * media's, not the framework's: Glop's graphics editors add them as their own
 * reducers (ADR 0035).
 */
export interface AuthoringRootState {
  layers: LayerStoreState
  library: LibraryStoreState
  playback: PlaybackState
  panels: PanelsState
  history: HistoryState
  timeline: TimelineState
  navigation: NavigationState
  guides: GuidesState
  timelineScope: TimelineScopeState
  timelineTools: TimelineToolsState
  timeMode: TimeModeState
  playbackBounds: PlaybackBoundsState
  rateCurve: RateCurveState
  timeSignature: TimeSignatureState
  recording: RecordingState
  temporalGuide: TemporalGuideState
  keyframeMode: KeyframeModeState
}

// Slices hold Maps and Sets; Immer needs telling once (idempotent).
enableMapSet()

/** The framework's reducers, which every store includes. */
export const frameworkReducers = {
  layers: layersReducer,
  library: libraryReducer,
  playback: playbackReducer,
  panels: panelsReducer,
  history: historyReducer,
  timeline: timelineReducer,
  navigation: navigationReducer,
  guides: guidesReducer,
  timelineScope: timelineScopeReducer,
  timelineTools: timelineToolsReducer,
  timeMode: timeModeReducer,
  playbackBounds: playbackBoundsReducer,
  rateCurve: rateCurveReducer,
  timeSignature: timeSignatureReducer,
  recording: recordingReducer,
  temporalGuide: temporalGuideReducer,
  keyframeMode: keyframeModeReducer,
}

/** The state an editor's own reducers add. */
export type StateOfReducers<M extends Record<string, Reducer>> = {
  [K in keyof M]: ReturnType<M[K]>
}

/**
 * View state: what undo and redo keep as it is while they restore the
 * document. Guides travel with the document's snapshots.
 */
const VIEW_SLICES = [
  'playback',
  'panels',
  'history',
  'timeline',
  'navigation',
  'timelineScope',
  'timelineTools',
  'timeMode',
  'playbackBounds',
  'rateCurve',
  'timeSignature',
  'recording',
  'temporalGuide',
  'keyframeMode',
] as const satisfies readonly (keyof AuthoringRootState)[]

/**
 * A store for one editor. Each editor instance gets its own, so several can
 * share a page and one can nest inside another (Rigatron hosts Pixels). An
 * editor adds its own slices with `reducers`. Undo and redo restore the
 * document (layers, the library, the editor's own slices) from a snapshot
 * and keep the view: the playhead, the panel layout, the layer tree's
 * selection and collapsed folders.
 *
 * ```ts
 * const store = createAuthoringStore({ shaper: shaperReducer })
 * store.getState().panels.workspace
 * ```
 */
export const createAuthoringStore = <
  M extends Record<string, Reducer> = Record<string, never>,
>(
  reducers?: M
) => {
  type State = AuthoringRootState & StateOfReducers<M>
  // A plain reducer function: a generic reducer map defeats RTK's
  // preloaded-state inference.
  const combined = combineReducers({
    ...frameworkReducers,
    ...reducers,
  }) as Reducer<State>

  const reducer: Reducer<State> = (state, action: UnknownAction) => {
    if (action.type !== RESTORE_STATE || !state) return combined(state, action)
    const snapshot = (action as UnknownAction & { payload: State }).payload
    const view = Object.fromEntries(VIEW_SLICES.map((key) => [key, state[key]]))
    return {
      ...snapshot,
      ...view,
      layers: {
        ...snapshot.layers,
        selection: state.layers.selection,
        collapsed: state.layers.collapsed,
      },
    } as State
  }

  return configureStore({
    reducer,
    // Maps and Sets live in the state by design, converted at the
    // serialization boundary, so RTK's runtime checks are off.
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(
        createCommandsMiddleware()
      ),
  })
}

/** An authoring store whose state includes `TState`, an editor's own slices. */
export type AuthoringStore<TState = Record<string, never>> = ReturnType<
  typeof createAuthoringStore
> & {
  getState(): AuthoringRootState & TState
}

/** A store's whole state, framework slices and the editor's own. */
export type AuthoringState<TState = Record<string, never>> = AuthoringRootState & TState
