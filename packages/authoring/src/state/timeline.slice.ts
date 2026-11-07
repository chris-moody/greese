/**
 * Timeline slice — id-based selection of timeline items (keyframes) plus a
 * relative, serializable clipboard. Selection is stored as explicit keyframe ids
 * (never coordinates), so copy/paste/duplicate/undo work independent of UI
 * geometry (§20b). This is view/edit state, not document data — undo/redo
 * preserve it rather than restoring it.
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { uid } from '../core/uid.ts'
import type { BezierControls, TweenType } from '../core/types/tween.types.ts'
import { enableMapSet } from 'immer'

// This slice holds Sets or Maps; Immer drafts them only with its MapSet
// plugin, whichever way the reducer is reached (idempotent).
enableMapSet()

/**
 * A named timeline position used for navigation and snapping. Scoped per
 * subview (mirrors `guides.slice.ts`'s `AuthoringGuide.scope`) so markers don't
 * leak between symbols/animations/loops — see `selectMarkers` (filtered) vs
 * `selectAllMarkers` (the full persisted list, e.g. for doc save/load).
 */
export interface Marker {
  id: string
  frame: number
  label?: string
  scope: string
}

/** One copied keyframe, positioned relative to the copy anchor + its layer. */
export interface ClipboardKeyframe {
  layerId: string
  frameOffset: number
  kind: string
  value?: number
  values?: Record<string, number>
  /** Span length in frames (SPAN clipboard items only). */
  duration?: number
}

/** One copied tween, positioned by its endpoints' offsets from the copy anchor. */
export interface ClipboardTween {
  layerId: string
  startOffset: number
  endOffset: number
  type: TweenType
  enabled: boolean
  bezier?: BezierControls
  shortestRotation?: boolean
}

/** One copied marker, positioned relative to the copy anchor. */
export interface ClipboardMarker {
  frameOffset: number
  label?: string
}

/** One copied level-editor point, positioned relative to the copy anchor (real ticks). */
export interface ClipboardLevelPoint {
  offsetTick: number
  value: number
}

export interface TimelineClipboard {
  items: ClipboardKeyframe[]
  tweens: ClipboardTween[]
  markers?: ClipboardMarker[]
  levelPoints?: ClipboardLevelPoint[]
  mediaType: string
  version: number
}

export interface TimelineState {
  /** Selected keyframe ids. */
  selection: Set<string>
  /** Selected tween ids (globally unique). Coexists with keyframe selection. */
  selectedTweens: Set<string>
  /**
   * Selected timeline *cells*, keyed `"layerId:frame"` — positions independent of
   * whether a keyframe exists there (empty cells included). Drives batch ops that
   * target specific frames (e.g. adding keyframes to a marquee of empty cells).
   */
  cellSelection: Set<string>
  /** Anchor cell (`"layerId:frame"`) for keyboard range extension. */
  cellAnchor: string | null
  clipboard: TimelineClipboard | null
  /** Whether dragged items snap to nearby keyframes / the playhead. */
  snapping: boolean
  /** Source layer ids from a paste that don't exist here (awaiting mapping). */
  pendingPaste: { missingLayers: string[] } | null
  markers: Marker[]
  /** Selected marker ids — a dimension independent of keyframe/tween/cell selection. */
  selectedMarkers: Set<string>
  /** Selected `TimelineLevelEditor` point ids — its own selection dimension. */
  levelPointSelection: Set<string>
}

const initialState: TimelineState = {
  selection: new Set(),
  selectedTweens: new Set(),
  cellSelection: new Set(),
  cellAnchor: null,
  clipboard: null,
  snapping: true,
  pendingPaste: null,
  markers: [],
  selectedMarkers: new Set(),
  levelPointSelection: new Set(),
}

export const timelineSlice = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    setTimelineSelection: (state, action: PayloadAction<string[]>) => {
      state.selection = new Set(action.payload)
      state.selectedTweens.clear()
    },
    /** Replace both keyframe and tween selection at once (marquee). */
    setCombinedSelection: (
      state,
      action: PayloadAction<{ keyframes: string[]; tweens: string[] }>
    ) => {
      state.selection = new Set(action.payload.keyframes)
      state.selectedTweens = new Set(action.payload.tweens)
    },
    selectTween: (state, action: PayloadAction<{ layerId: string; tweenId: string }>) => {
      state.selectedTweens = new Set([action.payload.tweenId])
      state.selection.clear()
    },
    toggleTween: (state, action: PayloadAction<{ tweenId: string }>) => {
      if (state.selectedTweens.has(action.payload.tweenId)) {
        state.selectedTweens.delete(action.payload.tweenId)
      } else state.selectedTweens.add(action.payload.tweenId)
    },
    clearTween: (state) => {
      state.selectedTweens.clear()
    },
    toggleTimelineItem: (state, action: PayloadAction<string>) => {
      if (state.selection.has(action.payload)) state.selection.delete(action.payload)
      else state.selection.add(action.payload)
    },
    /** Replace the selected cells ("layerId:frame"); the last becomes the anchor. */
    setCellSelection: (state, action: PayloadAction<string[]>) => {
      state.cellSelection = new Set(action.payload)
      state.cellAnchor = action.payload[action.payload.length - 1] ?? null
    },
    /** Add cells to the selection without clearing it. */
    addCells: (state, action: PayloadAction<string[]>) => {
      action.payload.forEach((cell) => state.cellSelection.add(cell))
      if (action.payload.length)
        state.cellAnchor = action.payload[action.payload.length - 1]!
    },
    /** Toggle one cell; it becomes the anchor when added. */
    toggleCell: (state, action: PayloadAction<string>) => {
      if (state.cellSelection.has(action.payload))
        state.cellSelection.delete(action.payload)
      else {
        state.cellSelection.add(action.payload)
        state.cellAnchor = action.payload
      }
    },
    clearCellSelection: (state) => {
      state.cellSelection.clear()
      state.cellAnchor = null
    },
    clearTimelineSelection: (state) => {
      state.selection.clear()
      state.selectedTweens.clear()
      state.cellSelection.clear()
      state.cellAnchor = null
    },
    setClipboard: (state, action: PayloadAction<TimelineClipboard>) => {
      state.clipboard = action.payload
    },
    toggleSnapping: (state) => {
      state.snapping = !state.snapping
    },
    setPendingPaste: (state, action: PayloadAction<{ missingLayers: string[] }>) => {
      state.pendingPaste = action.payload
    },
    clearPendingPaste: (state) => {
      state.pendingPaste = null
    },
    addMarker: (
      state,
      action: PayloadAction<{ scope: string; frame: number; label?: string }>
    ) => {
      const { scope, frame, label } = action.payload
      if (state.markers.some((m) => m.scope === scope && m.frame === frame)) return
      state.markers.push({ id: uid(), scope, frame, label })
      state.markers.sort((a, b) => a.frame - b.frame)
    },
    /** Replace the full marker list (e.g. on document load) — mirrors `guidesActions.setGuides`. */
    setMarkers: (state, action: PayloadAction<Marker[]>) => {
      state.markers = action.payload
    },
    removeMarker: (state, action: PayloadAction<string>) => {
      state.markers = state.markers.filter((m) => m.id !== action.payload)
      state.selectedMarkers.delete(action.payload)
    },
    /** Move an existing marker to a new frame (drag commit or the Marker panel's position field). */
    moveMarker: (state, action: PayloadAction<{ id: string; frame: number }>) => {
      const marker = state.markers.find((m) => m.id === action.payload.id)
      if (!marker) return
      marker.frame = action.payload.frame
      state.markers.sort((a, b) => a.frame - b.frame)
    },
    /** Shift several markers together by a frame delta (drag commit of a multi-selection). */
    moveMarkers: (state, action: PayloadAction<{ ids: string[]; delta: number }>) => {
      const ids = new Set(action.payload.ids)
      for (const marker of state.markers) {
        if (ids.has(marker.id))
          marker.frame = Math.max(0, marker.frame + action.payload.delta)
      }
      state.markers.sort((a, b) => a.frame - b.frame)
    },
    setMarkerLabel: (state, action: PayloadAction<{ id: string; label: string }>) => {
      const marker = state.markers.find((m) => m.id === action.payload.id)
      if (marker) marker.label = action.payload.label
    },
    setMarkerSelection: (state, action: PayloadAction<string[]>) => {
      state.selectedMarkers = new Set(action.payload)
    },
    toggleMarker: (state, action: PayloadAction<string>) => {
      if (state.selectedMarkers.has(action.payload))
        state.selectedMarkers.delete(action.payload)
      else state.selectedMarkers.add(action.payload)
    },
    clearMarkerSelection: (state) => {
      state.selectedMarkers.clear()
    },
    setLevelPointSelection: (state, action: PayloadAction<string[]>) => {
      state.levelPointSelection = new Set(action.payload)
    },
    toggleLevelPoint: (state, action: PayloadAction<string>) => {
      if (state.levelPointSelection.has(action.payload))
        state.levelPointSelection.delete(action.payload)
      else state.levelPointSelection.add(action.payload)
    },
    clearLevelPointSelection: (state) => {
      state.levelPointSelection.clear()
    },
  },
})

export const timelineActions = timelineSlice.actions
export const timelineReducer = timelineSlice.reducer
