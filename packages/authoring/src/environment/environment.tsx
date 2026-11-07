'use client'
import { createContext, useContext, type JSX, type ReactNode } from 'react'
import { Provider as ReduxProvider, useDispatch, useSelector } from 'react-redux'
import type { Reducer } from '@reduxjs/toolkit'
import {
  createAuthoringStore,
  type AuthoringRootState,
  type AuthoringStore,
  type StateOfReducers,
} from '../state/createAuthoringStore.ts'
import type { AuthoringProject } from '../core/types/project.types.ts'
import { TimingMode } from '../core/types/timing.types.ts'
import { uid } from '../core/uid.ts'
import { silent } from '../state/commandsMiddleware.ts'
import { playbackActions } from '../state/playback.slice.ts'
import type { MediaConfig } from './media.types.ts'
import { deserializeProject, serializeProject } from './serialize.ts'
import { DEFAULT_LAYER_TYPE } from '../core/layers/layers.ts'

/** One editor instance: its store and the provider that puts it in context. */
export interface AuthoringEnvironment<TState = Record<string, never>> {
  readonly store: AuthoringStore<TState>
  /** The editor's configuration: its media, timing, layer types and stage. */
  readonly config: MediaConfig
  /** The editor's document: layers, library and playhead, as a project. */
  serialize(): AuthoringProject
  /** Loads a project into the store, replacing the document. */
  deserialize(project: AuthoringProject): void
  /** Wrap the editor in this: it provides the store to every panel, hook and the stage. */
  readonly Provider: (props: { children?: ReactNode }) => JSX.Element
}

export interface AuthoringEnvironmentOptions<M extends Record<string, Reducer>> {
  /** The editor's own slices, merged with the framework's. */
  reducers?: M
  /**
   * The editor's configuration, over the defaults: a generic media type, one
   * layer type, and a 24 fps timeline of one frame.
   */
  config?: Partial<MediaConfig>
  /** The project's id and name, for `serialize`. */
  meta?: { id?: string; name?: string }
}

const DEFAULT_CONFIG: MediaConfig = {
  mediaType: 'generic',
  timing: { mode: TimingMode.FPS, fps: 24, frameCount: 1, loop: false, playbackSpeed: 1 },
  layerTypes: [{ layerType: DEFAULT_LAYER_TYPE, label: 'Layer' }],
}

const EnvironmentContext = createContext<AuthoringEnvironment<unknown> | null>(null)

/**
 * Stands up one editor: a store of its own and a provider bound to it. Call it
 * once per editor instance (in a `useMemo`, or at module level for an app
 * with one editor), so editors on one page, or one nested in another, never
 * share state.
 *
 * ```tsx
 * const env = createAuthoringEnvironment({ reducers: { shaper: shaperReducer } })
 *
 * <env.Provider>
 *   <PanelDock panels={panels} initialWorkspace={workspace} renderReserved={renderStage} />
 * </env.Provider>
 * ```
 */
export const createAuthoringEnvironment = <
  M extends Record<string, Reducer> = Record<string, never>,
>({
  reducers,
  config: options,
  meta: { id = uid(), name = 'Untitled' } = {},
}: AuthoringEnvironmentOptions<M> = {}): AuthoringEnvironment<StateOfReducers<M>> => {
  const store = createAuthoringStore(reducers) as unknown as AuthoringStore<
    StateOfReducers<M>
  >
  const config: MediaConfig = { ...DEFAULT_CONFIG, ...options }
  // The timeline's length comes from the config; not an undoable edit.
  store.dispatch(silent(playbackActions.setFrameCount(config.timing.frameCount)))
  const environment: AuthoringEnvironment<StateOfReducers<M>> = {
    store,
    config,
    serialize: () => serializeProject(store as AuthoringStore, config, { id, name }),
    deserialize: (project) => deserializeProject(store as AuthoringStore, project),
    Provider: function AuthoringProvider({ children }: { children?: ReactNode }) {
      return (
        <ReduxProvider store={store}>
          <EnvironmentContext value={environment as AuthoringEnvironment<unknown>}>
            {children}
          </EnvironmentContext>
        </ReduxProvider>
      )
    },
  }
  return environment
}

/** The editor environment around this component. Throws outside a `Provider`. */
export const useAuthoringEnvironment = <
  TState = Record<string, never>,
>(): AuthoringEnvironment<TState> => {
  const environment = useContext(EnvironmentContext)
  if (!environment) {
    throw new Error(
      "useAuthoringEnvironment needs an authoring environment's <Provider> around it"
    )
  }
  return environment as AuthoringEnvironment<TState>
}

/**
 * Reads the editor's store. Keep the result stable (a primitive, or an object
 * the store already holds): the selector reruns on every dispatch.
 */
export const useAuthoringSelector = <TSelected, TState = Record<string, never>>(
  selector: (state: AuthoringRootState & TState) => TSelected
): TSelected => useSelector(selector)

/** The editor store's `dispatch`. */
export const useAuthoringDispatch = (): AuthoringStore['dispatch'] => useDispatch()
