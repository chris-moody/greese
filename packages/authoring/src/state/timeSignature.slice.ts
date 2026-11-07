/**
 * Time-signature changes (Sound Studio only) — per-scope list, keyed off
 * `timelineScope.slice.ts`'s `activeScope`. An absent/empty list means today's
 * hardcoded 4/4 (`DEFAULT_TIME_SIGNATURE_CHANGE`), resolved at the selector.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { uid } from '../core/uid.ts'
import type { TimeSignatureChange } from '../core/timeline/resolutions/timeSignature.helpers.ts'

/**
 * A stored time-signature change — the resolution-facing `TimeSignatureChange`
 * shape plus an id for editing/removal. Named distinctly from that type since
 * both are re-exported through the top-level authoring barrel.
 */
export interface StoredTimeSignatureChange extends TimeSignatureChange {
  id: string
}

export const DEFAULT_TIME_SIGNATURE_CHANGE: StoredTimeSignatureChange = {
  id: 'default',
  tick: 0,
  numerator: 4,
  denominator: 4,
}

export interface TimeSignatureState {
  changesByScope: Record<string, StoredTimeSignatureChange[]>
}

const initialState: TimeSignatureState = {
  changesByScope: {},
}

export const timeSignatureSlice = createSlice({
  name: 'timeSignature',
  initialState,
  reducers: {
    /** Add (or replace, if one already exists at this tick) a change at `tick`. */
    addChange: (
      state,
      action: PayloadAction<{
        scope: string
        tick: number
        numerator: number
        denominator: number
      }>
    ) => {
      const { scope, tick, numerator, denominator } = action.payload
      const list = state.changesByScope[scope] ?? []
      const next = [
        ...list.filter((c) => c.tick !== tick),
        { id: uid(), tick, numerator, denominator },
      ]
      next.sort((a, b) => a.tick - b.tick)
      state.changesByScope[scope] = next
    },
    updateChange: (
      state,
      action: PayloadAction<{
        scope: string
        id: string
        numerator: number
        denominator: number
      }>
    ) => {
      const change = state.changesByScope[action.payload.scope]?.find(
        (c) => c.id === action.payload.id
      )
      if (change) {
        change.numerator = action.payload.numerator
        change.denominator = action.payload.denominator
      }
    },
    removeChange: (state, action: PayloadAction<{ scope: string; id: string }>) => {
      const list = state.changesByScope[action.payload.scope]
      if (list)
        state.changesByScope[action.payload.scope] = list.filter(
          (c) => c.id !== action.payload.id
        )
    },
    /** Replace the whole map — used to load persisted `changesByScope` from a document. */
    hydrate: (
      state,
      action: PayloadAction<Record<string, StoredTimeSignatureChange[]>>
    ) => {
      state.changesByScope = action.payload
    },
  },
})

export const timeSignatureActions = timeSignatureSlice.actions
export const timeSignatureReducer = timeSignatureSlice.reducer
