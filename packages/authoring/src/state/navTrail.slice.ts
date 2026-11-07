/**
 * Chronological, session-scoped navigation history for a shell with more than
 * one workspace/environment concept (Armature Studio's pose/movement/
 * skin-slot/skin-clip/palette/mixer views, NeoPixels' graphics/animation
 * split) — extracted from Armature Studio's own `armatureNavTrail.slice.ts`
 * so a second shell doesn't reimplement the same push/truncate/reset
 * reducers and bounded-history logic. `createNavTrailSlice` is parameterized
 * by the shell's own environment type (`TEnv`) and navigation-target union
 * (`TTarget`, whatever a shell needs to re-open an entry via its own
 * `goToTarget`-style handler); `name` becomes the slice's Redux key.
 */
import { createSlice, nanoid, type PayloadAction } from '@reduxjs/toolkit'

export interface NavTrailEntry<TEnv, TTarget> {
  id: string
  /** The shell's own environment/workspace type, or `null` for a target with no environment of its own (e.g. a plain library symbol). */
  environment: TEnv | null
  label: string
  target: TTarget
  timestamp: number
}

export interface NavTrailState<TEnv, TTarget> {
  entries: NavTrailEntry<TEnv, TTarget>[]
}

/** Bounded history length — long enough for a real editing session without unbounded memory growth. */
export const NAV_TRAIL_LIMIT = 100

export const createNavTrailSlice = <TEnv, TTarget>(name: string) => {
  const initialState: NavTrailState<TEnv, TTarget> = { entries: [] }

  return createSlice({
    name,
    initialState,
    reducers: {
      // A plain reducer (not RTK's `{reducer, prepare}` form) — that form's
      // generated action-creator type doesn't resolve cleanly against a bare
      // generic `TEnv`/`TTarget` here. `nanoid`/`Date.now()` inside the
      // reducer body mirrors the framework's own `guides.slice.ts` `addGuide`
      // reducer, which does the same for its id.
      pushEntry: (
        state,
        action: PayloadAction<{
          environment: TEnv | null
          label: string
          target: TTarget
        }>
      ) => {
        const entries = state.entries as unknown as NavTrailEntry<TEnv, TTarget>[]
        entries.push({ id: nanoid(), timestamp: Date.now(), ...action.payload })
        if (entries.length > NAV_TRAIL_LIMIT) {
          entries.splice(0, entries.length - NAV_TRAIL_LIMIT)
        }
      },
      /** Keeps `entries[0..index]` inclusive; `index < 0` clears everything (jumping all the way back to the base view). */
      truncateTo: (state, action: PayloadAction<number>) => {
        state.entries =
          action.payload < 0 ? [] : state.entries.slice(0, action.payload + 1)
      },
      reset: (state) => {
        state.entries = []
      },
    },
  })
}
