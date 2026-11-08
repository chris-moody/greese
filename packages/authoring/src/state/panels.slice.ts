import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { EMPTY_TREE } from '../core/layoutTree.construction.ts'
import {
  insertAtContainerEdge,
  insertPanel,
  moveTab,
  removePanel,
  reorderTab,
  resizeSplitNode,
  setLeafActiveTab,
  setLeafCollapsed,
} from '../core/layoutTree.mutations.ts'
import type { DropZone, FloatingPanelState, ZoneTree } from '../core/layoutTree.types.ts'

/** The docking layout: one workspace tree (stage, timeline and panels) plus floating panels. */
export interface PanelsState {
  workspace: ZoneTree
  floating: FloatingPanelState[]
  showRulers: boolean
  /**
   * Which workspace this layout is (a `PanelDock`'s `layoutKey`), or null.
   * A dock with another key seeds its own layout rather than reconcile this
   * one, so a store shared by several workspaces never shows a foreign tree.
   */
  layoutKey: string | null
}

/** The JSON-safe form saved in layout presets and documents. */
export interface SerializedPanels {
  workspace: ZoneTree
  floating: FloatingPanelState[]
  showRulers?: boolean
  layoutKey?: string | null
}

const initialState: PanelsState = {
  workspace: EMPTY_TREE,
  floating: [],
  showRulers: false,
  layoutKey: null,
}

type Edge = 'top' | 'bottom' | 'left' | 'right'

export const panelsSlice = createSlice({
  name: 'panels',
  initialState,
  reducers: {
    /**
     * Drops a panel on a leaf: out of wherever it was, into the target's zone.
     * `headless` keeps a moved toolbar group chrome-less.
     */
    movePanel: (
      state,
      action: PayloadAction<{
        panelId: string
        targetLeafId: string
        zone: DropZone
        headless?: boolean
      }>
    ) => {
      const { panelId, targetLeafId, zone, headless } = action.payload
      const removed = removePanel(state.workspace, panelId)
      const { tree, changed } = insertPanel(
        removed,
        targetLeafId,
        panelId,
        zone,
        headless
      )
      // A refused drop (a tab drop on the stage) leaves the layout as it was,
      // rather than the panel taken out and put nowhere.
      if (!changed) return
      state.workspace = tree
      state.floating = state.floating.filter((fp) => fp.id !== panelId)
    },

    /** Puts a panel at a place in a group's tab row: a reorder, or a move into the group. */
    moveTab: (
      state,
      action: PayloadAction<{
        panelId: string
        targetLeafId: string
        index: number
        headless?: boolean
      }>
    ) => {
      const { panelId, targetLeafId, index, headless } = action.payload
      const { tree, changed } = moveTab(
        state.workspace,
        panelId,
        targetLeafId,
        index,
        headless
      )
      if (!changed) return
      state.workspace = tree
      state.floating = state.floating.filter((fp) => fp.id !== panelId)
    },

    /** Docks a panel along one outer edge of the workspace. */
    movePanelToContainerEdge: (
      state,
      action: PayloadAction<{ panelId: string; edge: Edge; headless?: boolean }>
    ) => {
      const { panelId, edge, headless } = action.payload
      state.workspace = removePanel(state.workspace, panelId)
      state.floating = state.floating.filter((fp) => fp.id !== panelId)
      state.workspace = insertAtContainerEdge(state.workspace, panelId, edge, headless)
    },

    /**
     * Floats a panel at `(x, y)` in workspace coordinates. One that was already
     * floating keeps its size.
     */
    floatPanel: (
      state,
      action: PayloadAction<{ panelId: string; x: number; y: number }>
    ) => {
      const { panelId, x, y } = action.payload
      state.workspace = removePanel(state.workspace, panelId)
      const existing = state.floating.find((fp) => fp.id === panelId)
      state.floating = state.floating.filter((fp) => fp.id !== panelId)
      state.floating.push({
        id: panelId,
        x,
        y,
        width: existing?.width,
        height: existing?.height,
      })
    },

    setFloatPosition: (
      state,
      action: PayloadAction<{ panelId: string; x: number; y: number }>
    ) => {
      const fp = state.floating.find((f) => f.id === action.payload.panelId)
      if (fp) {
        fp.x = action.payload.x
        fp.y = action.payload.y
      }
    },

    setFloatSize: (
      state,
      action: PayloadAction<{ panelId: string; width: number; height: number }>
    ) => {
      const fp = state.floating.find((f) => f.id === action.payload.panelId)
      if (fp) {
        fp.width = action.payload.width
        fp.height = action.payload.height
      }
    },

    setLeafActiveTab: (
      state,
      action: PayloadAction<{ leafId: string; tabId: string }>
    ) => {
      state.workspace = setLeafActiveTab(
        state.workspace,
        action.payload.leafId,
        action.payload.tabId
      )
    },

    setLeafCollapsed: (
      state,
      action: PayloadAction<{ leafId: string; collapsed: boolean }>
    ) => {
      const { leafId, collapsed } = action.payload
      state.workspace = setLeafCollapsed(state.workspace, leafId, collapsed)
    },

    setSplitSize: (
      state,
      action: PayloadAction<{ splitId: string; primarySize: number }>
    ) => {
      const { splitId, primarySize } = action.payload
      state.workspace = resizeSplitNode(
        state.workspace,
        splitId,
        Math.max(1, primarySize)
      )
    },

    reorderTab: (
      state,
      action: PayloadAction<{ leafId: string; panelId: string; index: number }>
    ) => {
      const { leafId, panelId, index } = action.payload
      state.workspace = reorderTab(state.workspace, leafId, panelId, index)
    },

    setShowRulers: (state, action: PayloadAction<boolean>) => {
      state.showRulers = action.payload
    },

    /** Replaces the layout, from a preset or a document. Fields it lacks stay as they are. */
    hydrate: (state, action: PayloadAction<SerializedPanels | undefined>) => {
      const next = action.payload
      if (!next) return
      if (next.workspace) state.workspace = { ...next.workspace }
      if (next.floating) state.floating = [...next.floating]
      if (next.showRulers !== undefined) state.showRulers = next.showRulers
      if (next.layoutKey !== undefined) state.layoutKey = next.layoutKey
    },
  },
})

/** The live layout in its JSON-safe preset form. */
export const serializePanels = (panels: PanelsState): SerializedPanels => ({
  workspace: { ...panels.workspace, nodes: { ...panels.workspace.nodes } },
  floating: [...panels.floating],
  showRulers: panels.showRulers,
  layoutKey: panels.layoutKey,
})

export const panelsActions = panelsSlice.actions
export const panelsReducer = panelsSlice.reducer
