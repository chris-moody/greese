import { combineReducers, configureStore, type Reducer } from '@reduxjs/toolkit'
import { panelsReducer, type PanelsState } from './panels.slice.ts'

/**
 * The slices every authoring store has. It grows as the framework's slices
 * move here from Glop (layers, library, timeline, history…).
 */
export interface AuthoringRootState {
  panels: PanelsState
}

/** The framework's reducers, which every store includes. */
export const frameworkReducers = {
  panels: panelsReducer,
}

/** The state an editor's own reducers add. */
export type StateOfReducers<M extends Record<string, Reducer>> = {
  [K in keyof M]: ReturnType<M[K]>
}

/**
 * A store for one editor. Each editor instance gets its own, so several can
 * share a page and one can nest inside another (Rigatron hosts Pixels). An
 * editor adds its own slices with `reducers`.
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
  // A plain reducer function: a generic reducer map defeats RTK's
  // preloaded-state inference.
  const reducer = combineReducers({ ...frameworkReducers, ...reducers }) as Reducer<
    AuthoringRootState & StateOfReducers<M>
  >
  return configureStore({ reducer })
}

/** An authoring store whose state includes `TState`, an editor's own slices. */
export type AuthoringStore<TState = Record<string, never>> = ReturnType<
  typeof createAuthoringStore
> & {
  getState(): AuthoringRootState & TState
}

/** A store's whole state, framework slices and the editor's own. */
export type AuthoringState<TState = Record<string, never>> = AuthoringRootState & TState
