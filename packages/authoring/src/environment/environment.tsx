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
import type { AuthoringLayer } from '../core/types/layer.types.ts'
import type { FrameBase } from '../core/types/frame.types.ts'
import { deserializeProject, serializeProject } from './serialize.ts'
import { DEFAULT_LAYER_TYPE } from '../core/layers/layers.ts'

/** One editor instance: its store and the provider that puts it in context. */
export interface AuthoringEnvironment<
  TState extends object = object,
  L extends AuthoringLayer = AuthoringLayer,
  F extends FrameBase = FrameBase,
  P extends object = Record<string, unknown>,
> {
  readonly store: AuthoringStore<TState>
  /** The editor's configuration: its media, timing, layer types and stage. */
  readonly config: MediaConfig<L, F, P>
  /** The editor's document: layers, library and playhead, as a project. */
  serialize(): AuthoringProject
  /** Loads a project into the store, replacing the document. */
  deserialize(project: AuthoringProject): void
  /** Wrap the editor in this: it provides the store to every panel, hook and the stage. */
  readonly Provider: (props: { children?: ReactNode }) => JSX.Element
}

export interface AuthoringEnvironmentOptions<
  M extends Record<string, Reducer>,
  L extends AuthoringLayer = AuthoringLayer,
  F extends FrameBase = FrameBase,
  P extends object = Record<string, unknown>,
> {
  /** The editor's own slices, merged with the framework's. */
  reducers?: M
  /**
   * The editor's configuration, over the defaults: a generic media type, one
   * layer type, and a 24 fps timeline of one frame.
   */
  config?: Partial<MediaConfig<L, F, P>>
  /** The project's id and name, for `serialize`. */
  meta?: { id?: string; name?: string }
  /**
   * The editor's own slices that hold view state (a tool, a zoom, a
   * selection): undo and redo keep them, restoring only the document.
   */
  viewSlices?: readonly (keyof M & string)[]
}

const DEFAULT_CONFIG: MediaConfig = {
  mediaType: 'generic',
  timing: { mode: TimingMode.FPS, fps: 24, frameCount: 1, loop: false, playbackSpeed: 1 },
  layerTypes: [{ layerType: DEFAULT_LAYER_TYPE, label: 'Layer' }],
}

const EnvironmentContext = createContext<AuthoringEnvironment | null>(null)

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
  L extends AuthoringLayer = AuthoringLayer,
  F extends FrameBase = FrameBase,
  P extends object = Record<string, unknown>,
>({
  reducers,
  config: options,
  meta: { id = uid(), name = 'Untitled' } = {},
  viewSlices,
}: AuthoringEnvironmentOptions<M, L, F, P> = {}): AuthoringEnvironment<
  StateOfReducers<M>,
  L,
  F,
  P
> => {
  const store = createAuthoringStore(reducers, viewSlices) as unknown as AuthoringStore<
    StateOfReducers<M>
  >
  const config = { ...DEFAULT_CONFIG, ...options } as MediaConfig<L, F, P>
  // The timeline's length comes from the config; not an undoable edit.
  store.dispatch(silent(playbackActions.setFrameCount(config.timing.frameCount)))
  const environment: AuthoringEnvironment<StateOfReducers<M>, L, F, P> = {
    store,
    config,
    serialize: () => serializeProject(store as AuthoringStore, config, { id, name }),
    deserialize: (project) => deserializeProject(store as AuthoringStore, project),
    Provider: function AuthoringProvider({ children }: { children?: ReactNode }) {
      return (
        <ReduxProvider store={store}>
          <EnvironmentContext value={environment as unknown as AuthoringEnvironment}>
            {children}
          </EnvironmentContext>
        </ReduxProvider>
      )
    },
  }
  // A minified build renames the function; tools that print the tree (the
  // docs' "Show code", React DevTools) read this instead.
  ;(environment.Provider as { displayName?: string }).displayName = 'AuthoringProvider'
  return environment
}

/** The editor environment around this component. Throws outside a `Provider`. */
export const useAuthoringEnvironment = <
  TState extends object = object,
>(): AuthoringEnvironment<TState> => {
  const environment = useContext(EnvironmentContext)
  if (!environment) {
    throw new Error(
      "useAuthoringEnvironment needs an authoring environment's <Provider> around it"
    )
  }
  return environment as unknown as AuthoringEnvironment<TState>
}

/**
 * Reads the editor's store. Keep the result stable (a primitive, or an object
 * the store already holds): the selector reruns on every dispatch.
 */
export const useAuthoringSelector = <TSelected, TState extends object = object>(
  selector: (state: AuthoringRootState & TState) => TSelected
): TSelected => useSelector(selector)

/** The editor store's `dispatch`. */
export const useAuthoringDispatch = (): AuthoringStore['dispatch'] => useDispatch()
