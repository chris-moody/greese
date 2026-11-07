/**
 * Memoized selectors over the framework root state. Media modules add their own
 * selectors for merged slices; these cover layers, selection, and playback.
 */
import { createSelector } from '@reduxjs/toolkit'
import type { AuthoringRootState } from './createAuthoringStore.ts'
import type { AuthoringLayer } from '../core/types/layer.types.ts'
import type { Tween } from '../core/types/tween.types.ts'
import { TimelineToolId } from './timelineTools.slice.ts'
import type { TimeMode } from '../core/types/resolution.types.ts'
import type { PlaybackBounds } from './playbackBounds.slice.ts'
import type { LevelPoint } from '../core/timeline/levelEditor.types.ts'
import {
  DEFAULT_TIME_SIGNATURE_CHANGE,
  type StoredTimeSignatureChange,
} from './timeSignature.slice.ts'
import { PulseLayerId } from '../core/timeline/resolutions/pulseBoundaries.helpers.ts'
import { flattenItemOrder, flattenVisibleOrder } from '../core/tree/hierarchicalList.ts'

export const selectLayersState = (state: AuthoringRootState) => state.layers
export const selectLayers = (state: AuthoringRootState) => state.layers.layers
export const selectRootOrder = (state: AuthoringRootState) => state.layers.rootOrder
export const selectLayerSelection = (state: AuthoringRootState) => state.layers.selection
export const selectCollapsed = (state: AuthoringRootState) => state.layers.collapsed

/**
 * Read a layer's mask source (property-level default).
 *
 * Returns the ID of the layer masking the specified layer, or null if no mask is set.
 * This reads the property-level default, not the timeline-sampled value.
 */
export const selectLayerMaskSource = (
  state: AuthoringRootState,
  layerId: string
): string | null => {
  const layer = state.layers.layers.get(layerId)
  if (!layer) return null
  const maskId = layer.properties.maskedByLayerId
  return typeof maskId === 'string' ? maskId : null
}

export const selectPlayback = (state: AuthoringRootState) => state.playback
export const selectPlaying = (state: AuthoringRootState) => state.playback.playing
export const selectBaseFrameCount = (state: AuthoringRootState) =>
  state.playback.frameCount
export const selectPanelsState = (state: AuthoringRootState) => state.panels
export const selectPanelWorkspace = (state: AuthoringRootState) => state.panels.workspace
export const selectPanelFloating = (state: AuthoringRootState) => state.panels.floating
export const selectShowRulers = (state: AuthoringRootState) => state.panels.showRulers
export const selectTimelineSelection = (state: AuthoringRootState) =>
  state.timeline.selection
export const selectTimelineClipboard = (state: AuthoringRootState) =>
  state.timeline.clipboard
export const selectSnapping = (state: AuthoringRootState) => state.timeline.snapping
export const selectPendingPaste = (state: AuthoringRootState) =>
  state.timeline.pendingPaste
/** The full, unfiltered marker list — every scope. Used for doc save/load, not display. */
export const selectAllMarkers = (state: AuthoringRootState) => state.timeline.markers
export const selectMarkerSelection = (state: AuthoringRootState) =>
  state.timeline.selectedMarkers
export const selectLevelPointSelection = (state: AuthoringRootState) =>
  state.timeline.levelPointSelection
export const selectSelectedTweens = (state: AuthoringRootState) =>
  state.timeline.selectedTweens
export const selectCellSelection = (state: AuthoringRootState) =>
  state.timeline.cellSelection
export const selectCellAnchor = (state: AuthoringRootState) => state.timeline.cellAnchor

/** Selected tweens resolved to their owning layer (memoized). */
export const selectSelectedTweenRefs = createSelector(
  [selectLayers, selectSelectedTweens],
  (layers, ids): { layerId: string; tween: Tween }[] => {
    const refs: { layerId: string; tween: Tween }[] = []
    layers.forEach((layer) =>
      layer.timeline.tweens.forEach((tween) => {
        if (ids.has(tween.id)) refs.push({ layerId: layer.id, tween })
      })
    )
    return refs
  }
)
export const selectAssets = (state: AuthoringRootState) => state.library.assets
export const selectAssetOrder = (state: AuthoringRootState) => state.library.itemOrder
export const selectLibrarySelection = (state: AuthoringRootState) =>
  state.library.selection
export const selectNavigationStack = (state: AuthoringRootState) => state.navigation.stack
export const selectAllGuides = (state: AuthoringRootState) => state.guides.guides
export const selectActiveGuideScope = (state: AuthoringRootState) =>
  state.guides.activeScope
export const selectDraggingGuide = (state: AuthoringRootState) => state.guides.dragging
export const selectPendingGuide = (state: AuthoringRootState) => state.guides.pendingGuide
export const selectActiveTimelineScope = (state: AuthoringRootState) =>
  state.timelineScope.activeScope
export const selectTimelineToolByScope = (state: AuthoringRootState) =>
  state.timelineTools.toolByScope
export const selectPlaybackBoundsByScope = (state: AuthoringRootState) =>
  state.playbackBounds.boundsByScope

/** The raw stored bounds override for the current scope, if any (`undefined` = full range). */
export const selectRawPlaybackBounds = createSelector(
  [selectPlaybackBoundsByScope, selectActiveTimelineScope],
  (boundsByScope, scope): PlaybackBounds | undefined => boundsByScope[scope]
)
export const selectRateCurveByScope = (state: AuthoringRootState) =>
  state.rateCurve.curveByScope

/** The active scope's rate curve — empty when unset (today's flat scalar behavior). */
export const selectActiveRateCurve = createSelector(
  [selectRateCurveByScope, selectActiveTimelineScope],
  (curveByScope, scope): LevelPoint[] => curveByScope[scope] ?? []
)
export const selectTimeSignatureChangesByScope = (state: AuthoringRootState) =>
  state.timeSignature.changesByScope

/** The active scope's time-signature changes — a fixed 4/4 at tick 0 when unset. */
export const selectActiveTimeSignatureChanges = createSelector(
  [selectTimeSignatureChangesByScope, selectActiveTimelineScope],
  (changesByScope, scope): StoredTimeSignatureChange[] => {
    const list = changesByScope[scope]
    return list && list.length > 0 ? list : [DEFAULT_TIME_SIGNATURE_CHANGE]
  }
)

/** The active tool for the current timeline scope, defaulting to the Frame tool. */
export const selectActiveTimelineTool = createSelector(
  [selectTimelineToolByScope, selectActiveTimelineScope],
  (toolByScope, scope): TimelineToolId => toolByScope[scope] ?? TimelineToolId.frame
)
export const selectTimeModeByScope = (state: AuthoringRootState) =>
  state.timeMode.modeByScope
export const selectRecording = (state: AuthoringRootState) => state.recording
export const selectRecordingEnabled = (state: AuthoringRootState) =>
  state.recording.enabled
export const selectComposeScrubActive = (state: AuthoringRootState) =>
  state.recording.composeScrubActive
export const selectKeyframeMode = (state: AuthoringRootState) => state.keyframeMode.mode

/**
 * The stored display-mode override for the current scope, if any. `undefined`
 * means "use the resolution's native mode" — resolved at the call site (e.g.
 * `Timeline.tsx`) since the resolution itself isn't part of redux state.
 */
export const selectActiveTimeMode = createSelector(
  [selectTimeModeByScope, selectActiveTimelineScope],
  (modeByScope, scope): TimeMode | undefined => modeByScope[scope]
)

export const selectTemporalGuideLayersByScope = (state: AuthoringRootState) =>
  state.temporalGuide.enabledLayersByScope

/** The active scope's enabled Temporal Guide pulse layers — empty (guide off) when unset. */
export const selectActiveTemporalGuideLayers = createSelector(
  [selectTemporalGuideLayersByScope, selectActiveTimelineScope],
  (layersByScope, scope): PulseLayerId[] => layersByScope[scope] ?? []
)

/** Guides belonging to the currently active scope only — see {@link GuidesState.activeScope}. */
export const selectGuides = createSelector(
  [selectAllGuides, selectActiveGuideScope],
  (guides, scope) => guides.filter((g) => g.scope === scope)
)

/**
 * Guides visible from the current scope: the scope's own guides plus every
 * `isGlobal` guide regardless of scope. This is what guide-rendering
 * (`GuidesOverlay`) and guide-referencing UI (tween bound pickers, joint
 * snapping) should read — `selectGuides` remains for call sites that
 * intentionally want strictly-scoped guides only.
 */
export const selectVisibleGuides = createSelector(
  [selectAllGuides, selectActiveGuideScope],
  (guides, scope) => guides.filter((g) => g.scope === scope || g.isGlobal)
)

/** Markers belonging to the currently active scope only — see {@link selectAllMarkers}. */
export const selectMarkers = createSelector(
  [selectAllMarkers, selectActiveTimelineScope],
  (markers, scope) => markers.filter((m) => m.scope === scope)
)

/** Layers in full pre-order (ignores collapse) — used for sampling every layer. */
export const selectFlattenedLayers = createSelector(
  [selectLayers, selectRootOrder],
  (layers, rootOrder): AuthoringLayer[] =>
    flattenItemOrder(layers, rootOrder).flatMap((id) => {
      const layer = layers.get(id)
      return layer ? [layer] : []
    })
)

/** Layers in *visible* order (respects collapsed folders) — timeline rows. */
export const selectVisibleLayers = createSelector(
  [selectLayers, selectRootOrder, selectCollapsed],
  (layers, rootOrder, collapsed): AuthoringLayer[] =>
    flattenVisibleOrder(layers, rootOrder, collapsed).flatMap((id) => {
      const layer = layers.get(id)
      return layer ? [layer] : []
    })
)

/**
 * Effective timeline length: the base length extended to include any content, so
 * adding a keyframe/span past the end grows the timeline automatically.
 */
export const selectFrameCount = createSelector(
  [selectBaseFrameCount, selectLayers],
  (base, layers): number => {
    let lastIndex = base - 1
    layers.forEach((layer) =>
      layer.timeline.frames.forEach((frame) => {
        const index = frame.frame + (frame.duration ? frame.duration - 1 : 0)
        if (index > lastIndex) lastIndex = index
      })
    )
    return lastIndex + 1
  }
)

/** Resolved playback bounds for the active scope — an absent override defaults to `[0, frameCount - 1]`. */
export const selectPlaybackBounds = createSelector(
  [selectRawPlaybackBounds, selectFrameCount],
  (bounds, frameCount): PlaybackBounds => {
    const last = Math.max(0, frameCount - 1)
    if (!bounds) return { start: 0, end: last }
    // Stored bounds are clamped into the live timeline range so a shrunken
    // frame count can never leave the end bound (or the clock's loop target)
    // stranded past the last playable frame.
    const end = Math.min(bounds.end, last)
    return { start: Math.max(0, Math.min(bounds.start, end)), end }
  }
)

/** The currently selected layers. */
export const selectSelectedLayers = createSelector(
  [selectLayers, selectLayerSelection],
  (layers, selection): AuthoringLayer[] =>
    [...selection].flatMap((id) => {
      const layer = layers.get(id)
      return layer ? [layer] : []
    })
)
