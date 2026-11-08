import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { nextGuideName } from './guideNaming.ts'

/** Scope for guides created while no subview/scope has been set (the root document). */
export const ROOT_GUIDE_SCOPE = '__root__'

export interface AuthoringGuide {
  id: string
  /** 'h' = horizontal line (fixed Y); 'v' = vertical line (fixed X). */
  axis: 'h' | 'v'
  /** Position in stage-space units. */
  pos: number
  /**
   * The subview/scope this guide belongs to (e.g. the root document, a symbol
   * being edited, an armature pose/animation). Guides are only shown while
   * their scope is the active one — see {@link GuidesState.activeScope}, unless
   * `isGlobal` is set (see below).
   */
  scope: string
  /**
   * Display name, auto-assigned on creation (`Guide 0`, `Guide 1`, …, numbered
   * globally across every scope — see `guideNaming.helpers.ts`) and editable
   * via the guide-properties dialog. Optional only so legacy persisted guides
   * (saved before this field existed) still deserialize; display code should
   * fall back to a default when absent.
   */
  name?: string
  /**
   * When true, this guide is visible/adjustable from every scope, not just its
   * own `scope` — see `selectVisibleGuides`. Rendered in a distinct color from
   * scoped guides (see `GuidesOverlay`).
   */
  isGlobal?: boolean
}

export interface GuidesState {
  guides: AuthoringGuide[]
  /**
   * Guide being actively dragged (live position updated every pointer frame).
   * Used by GuidesOverlay to show the tooltip and update the line in real time.
   */
  dragging: { id: string; pos: number } | null
  /**
   * Live guide preview while dragging from a ruler — not yet committed.
   * Cleared when the ruler drag is committed or cancelled.
   */
  pendingGuide: { axis: 'h' | 'v'; pos: number } | null
  /**
   * The currently active subview/scope. New guides (`addGuide`) are tagged
   * with this; `selectGuides` filters the full list down to it. The media
   * shell updates this whenever navigation enters/leaves a subview (e.g. a
   * symbol, a pose, an animation) so guides never leak across contexts.
   */
  activeScope: string
  /** Whether the guides are hidden: kept, but not drawn (the stage bar's Guides toggle). */
  hidden?: boolean
}

const initialState: GuidesState = {
  guides: [],
  dragging: null,
  pendingGuide: null,
  activeScope: ROOT_GUIDE_SCOPE,
  hidden: false,
}

export const guidesSlice = createSlice({
  name: 'guides',
  initialState,
  reducers: {
    /** Replace the full guide list (e.g. on document load). */
    setGuides: (state, action: PayloadAction<AuthoringGuide[]>) => {
      state.guides = action.payload
      state.dragging = null
    },

    /** Switch the active scope — new guides are tagged with it; `selectGuides` filters to it. */
    setActiveScope: (state, action: PayloadAction<string>) => {
      state.activeScope = action.payload
    },

    addGuide: (
      state,
      action: PayloadAction<Omit<AuthoringGuide, 'id' | 'scope' | 'name'>>
    ) => {
      const id = `g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
      const name = nextGuideName(state.guides.map((g) => g.name ?? ''))
      state.guides.push({ id, scope: state.activeScope, name, ...action.payload })
      state.pendingGuide = null
      // A new guide is one you want to see.
      state.hidden = false
    },

    /** Rename a guide — set via the guide-properties dialog (double-click on a guide). */
    renameGuide: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const g = state.guides.find((g) => g.id === action.payload.id)
      if (g) g.name = action.payload.name
    },

    /** Toggle a guide's global visibility — set via the guide-properties dialog. */
    setGuideGlobal: (state, action: PayloadAction<{ id: string; isGlobal: boolean }>) => {
      const g = state.guides.find((g) => g.id === action.payload.id)
      if (g) g.isGlobal = action.payload.isGlobal
    },

    /** Set/clear the live ruler-drag preview (not yet committed). */
    setPendingGuide: (
      state,
      action: PayloadAction<{ axis: 'h' | 'v'; pos: number } | null>
    ) => {
      state.pendingGuide = action.payload
    },

    removeGuide: (state, action: PayloadAction<string>) => {
      state.guides = state.guides.filter((g) => g.id !== action.payload)
      if (state.dragging?.id === action.payload) state.dragging = null
    },

    moveGuide: (state, action: PayloadAction<{ id: string; pos: number }>) => {
      const g = state.guides.find((g) => g.id === action.payload.id)
      if (g) g.pos = action.payload.pos
    },

    /** Show or hide the guides; hidden ones are kept. */
    setGuidesHidden: (state, action: PayloadAction<boolean>) => {
      state.hidden = action.payload
    },

    /** Set the live drag state (id + current position) while dragging. */
    setDragging: (state, action: PayloadAction<{ id: string; pos: number } | null>) => {
      state.dragging = action.payload
    },
  },
})

export const guidesActions = guidesSlice.actions
export const guidesReducer = guidesSlice.reducer
