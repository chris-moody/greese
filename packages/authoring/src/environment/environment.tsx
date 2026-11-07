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

/** One editor instance: its store and the provider that puts it in context. */
export interface AuthoringEnvironment<TState = Record<string, never>> {
  readonly store: AuthoringStore<TState>
  /** Wrap the editor in this: it provides the store to every panel, hook and the stage. */
  readonly Provider: (props: { children?: ReactNode }) => JSX.Element
}

export interface AuthoringEnvironmentOptions<M extends Record<string, Reducer>> {
  /** The editor's own slices, merged with the framework's. */
  reducers?: M
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
>({ reducers }: AuthoringEnvironmentOptions<M> = {}): AuthoringEnvironment<
  StateOfReducers<M>
> => {
  const store = createAuthoringStore(reducers) as unknown as AuthoringStore<
    StateOfReducers<M>
  >
  const environment: AuthoringEnvironment<StateOfReducers<M>> = {
    store,
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
