/**
 * Navigation slice — the breadcrumb stack for nested authoring subviews. Opening
 * a library asset pushes a frame that remembers the *parent* layer state, so
 * navigating back restores the enclosing scene. Root is the empty stack.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { LayerStoreState } from '../core/types/layer.types.ts'
import type { Matrix2D } from '../core/stage/renderObject.types.ts'

/** How a nested subview was entered. */
export enum NavMode {
  /** Opened from the Library panel — a clean subview; the parent is not shown. */
  ISOLATED = 'isolated',
  /** Opened by double-clicking an on-stage instance — the parent is ghosted behind. */
  EDIT_IN_PLACE = 'edit-in-place',
}

export interface NavFrame {
  assetId: string
  name: string
  mode: NavMode
  /** Layer state of the enclosing scene, captured when this asset was opened. */
  parentLayers: LayerStoreState
  /**
   * World transform this scene should render at, composed from the
   * double-clicked instance's own local transform plus whatever transform was
   * already in effect (for a drill-in from an already-`EDIT_IN_PLACE` frame).
   * `null` for every `ISOLATED` frame and for root — those render at identity.
   */
  stageTransform: Matrix2D | null
}

export interface NavigationState {
  stack: NavFrame[]
}

const initialState: NavigationState = {
  stack: [],
}

export const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    pushFrame: (state, action: PayloadAction<NavFrame>) => {
      state.stack.push(action.payload)
    },
    /**
     * Swaps the top frame for a new one instead of nesting — used when opening
     * a sibling subview from within the same hierarchy level (e.g. switching
     * skin slots from the skin library) so breadcrumbs don't stack duplicate levels.
     */
    replaceTop: (state, action: PayloadAction<NavFrame>) => {
      if (state.stack.length === 0) {
        state.stack.push(action.payload)
      } else {
        state.stack[state.stack.length - 1] = action.payload
      }
    },
    setStack: (state, action: PayloadAction<NavFrame[]>) => {
      state.stack = action.payload
    },
  },
})

export const navigationActions = navigationSlice.actions
export const navigationReducer = navigationSlice.reducer
