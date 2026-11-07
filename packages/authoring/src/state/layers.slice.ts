/**
 * Layers slice — normalized, hierarchy-aware layer store plus the shared
 * selection set. Generalized from the legacy `packages/pixels` (since removed)
 * `layers.reducer.ts`, promoted
 * from a flat order array to a true tree (`rootOrder` + `layer.children`).
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { uid } from '../core/uid.ts'
import { type AuthoringLayer, type LayerStoreState } from '../core/types/layer.types.ts'
import { FrameKind } from '../core/types/frame.types.ts'
import {
  TweenType,
  type BezierControls,
  type TweenBoundRef,
} from '../core/types/tween.types.ts'
import {
  applyAddKeyframe,
  applyUpdateNearestKeyframe,
  dropTweensFor,
  getTween,
  nearestAncestorKeyframe,
  sortFrames,
  type AddKeyframePayload,
} from './layers.slice.helpers.ts'
import { enableMapSet } from 'immer'

// This slice holds Sets or Maps; Immer drafts them only with its MapSet
// plugin, whichever way the reducer is reached (idempotent).
enableMapSet()

// Re-exported so existing imports of `AddKeyframePayload`/`nearestAncestorKeyframe`
// from this module (e.g. `timeline/autoKeyframe.helpers.ts`) keep working — the
// mutation logic itself lives in `layers.slice.helpers.ts`, see that file's header.
export { nearestAncestorKeyframe, type AddKeyframePayload }

const initialState: LayerStoreState = {
  layers: new Map(),
  rootOrder: [],
  selection: new Set(),
  collapsed: new Set(),
}

export const layersSlice = createSlice({
  name: 'layers',
  initialState,
  reducers: {
    addLayer: (
      state,
      action: PayloadAction<{ layer: AuthoringLayer; parentId?: string }>
    ) => {
      const { layer, parentId } = action.payload
      state.layers.set(layer.id, layer)
      if (parentId) {
        const parent = state.layers.get(parentId)
        if (parent) {
          parent.children = [...(parent.children ?? []), layer.id]
          layer.parent = parentId
          return
        }
      }
      if (!state.rootOrder.includes(layer.id)) state.rootOrder.push(layer.id)
    },
    /**
     * Place a library-asset instance: one opaque layer (its concrete
     * `layerType` is the caller's concern — this slice has no media-specific
     * layer types to import, matching every other reducer here) tagged
     * `properties.assetId`. The stage backend composites the referenced
     * asset's *current* scene live into it (see
     * `NeoPixelsPixiBackend.compositeInstance`), so there's no clone to make
     * or keep in sync here; editing the base asset shows up in every placed
     * instance automatically, for free.
     */
    createInstance: (
      state,
      action: PayloadAction<{
        assetId: string
        layerType: string
        x: number
        y: number
        parentId?: string
        name?: string
      }>
    ) => {
      const { assetId, layerType, x, y, parentId, name } = action.payload
      const id = uid()
      const layer: AuthoringLayer = {
        id,
        name: name ?? 'Instance',
        layerType,
        hidden: false,
        locked: false,
        timeline: { frames: [], tweens: [] },
        properties: { assetId, x, y, rotation: 0, scaleX: 1, scaleY: 1 },
      }
      state.layers.set(id, layer)

      if (parentId && state.layers.has(parentId)) {
        const parent = state.layers.get(parentId)!
        parent.children = [...(parent.children ?? []), id]
        layer.parent = parentId
      } else {
        state.rootOrder.push(id)
      }
      state.selection = new Set([id])
    },
    updateLayer: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<AuthoringLayer> }>
    ) => {
      const layer = state.layers.get(action.payload.id)
      if (layer) state.layers.set(layer.id, { ...layer, ...action.payload.updates })
    },
    updateLayers: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<AuthoringLayer> }[]>
    ) => {
      action.payload.forEach(({ id, updates }) => {
        const layer = state.layers.get(id)
        if (layer) state.layers.set(id, { ...layer, ...updates })
      })
    },
    /**
     * Set or clear a layer's mask source (property-level default).
     *
     * When maskLayerId is non-null, sets layer.properties.maskedByLayerId = maskLayerId.
     * When maskLayerId is null, clears the mask (sets to undefined).
     */
    setLayerMask: (
      state,
      action: PayloadAction<{ layerId: string; maskLayerId: string | null }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      const properties = { ...layer.properties }
      if (action.payload.maskLayerId === null) {
        delete properties.maskedByLayerId
      } else {
        properties.maskedByLayerId = action.payload.maskLayerId
      }
      state.layers.set(layer.id, { ...layer, properties })
    },
    removeLayer: (state, action: PayloadAction<string>) => {
      const id = action.payload
      const layer = state.layers.get(id)
      if (layer?.parent) {
        const parent = state.layers.get(layer.parent)
        if (parent?.children) parent.children = parent.children.filter((c) => c !== id)
      }
      // Clean up stale maskedByLayerId references before deleting
      for (const [, otherLayer] of state.layers) {
        if (otherLayer.properties.maskedByLayerId === id) {
          const properties = { ...otherLayer.properties }
          delete properties.maskedByLayerId
          state.layers.set(otherLayer.id, { ...otherLayer, properties })
        }
      }
      state.rootOrder = state.rootOrder.filter((x) => x !== id)
      state.layers.delete(id)
      state.selection.delete(id)
    },
    setRootOrder: (state, action: PayloadAction<string[]>) => {
      state.rootOrder = action.payload
    },
    setSelection: (state, action: PayloadAction<string[]>) => {
      state.selection = new Set(action.payload)
    },
    toggleLayerCollapsed: (state, action: PayloadAction<string>) => {
      if (state.collapsed.has(action.payload)) state.collapsed.delete(action.payload)
      else state.collapsed.add(action.payload)
    },
    clearLayers: (state) => {
      state.layers.clear()
      state.rootOrder = []
      state.selection.clear()
      state.collapsed.clear()
    },
    /** Replace the whole layer store (used to swap scenes for nested subviews). */
    loadLayerState: (state, action: PayloadAction<LayerStoreState>) => {
      state.layers = new Map(action.payload.layers)
      state.rootOrder = [...action.payload.rootOrder]
      state.selection = new Set(action.payload.selection)
      state.collapsed = new Set(action.payload.collapsed)
    },

    // --- Timeline / keyframes ---
    addKeyframe: (state, action: PayloadAction<AddKeyframePayload>) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      applyAddKeyframe(layer, action.payload)
    },
    /**
     * Batched `addKeyframe`: applies every item in one dispatch/Immer
     * transaction. Used for multi-joint autokey (e.g. rotating or IK-dragging
     * several selected joints at once) so the framework render driver's
     * store-subscribe cascade (`useStageDriver`'s `sampleLayers`, which
     * re-samples every layer in the scene whenever the `layers` reference
     * changes) only runs once per flush instead of once per joint — see
     * `armaturePixiBackend.ts`'s `autokey()`.
     */
    addKeyframes: (state, action: PayloadAction<AddKeyframePayload[]>) => {
      for (const item of action.payload) {
        const layer = state.layers.get(item.layerId)
        if (layer) applyAddKeyframe(layer, item)
      }
    },
    /**
     * Manual-keyframing-mode counterpart to `addKeyframe`: instead of creating or
     * overwriting a keyframe at `frame`, updates whichever keyframe is nearest at
     * or before `frame` in place — a no-op if none exists. See
     * `keyframeMode.slice.ts` and `autoKeyframe.helpers.ts`, which choose between
     * this and `addKeyframe` based on the active mode.
     */
    updateNearestKeyframe: (state, action: PayloadAction<AddKeyframePayload>) => {
      const layer = state.layers.get(action.payload.layerId)
      if (layer) applyUpdateNearestKeyframe(layer, action.payload)
    },
    /** Batched `updateNearestKeyframe` — see `addKeyframes`' doc comment for why. */
    updateNearestKeyframes: (state, action: PayloadAction<AddKeyframePayload[]>) => {
      for (const item of action.payload) {
        const layer = state.layers.get(item.layerId)
        if (layer) applyUpdateNearestKeyframe(layer, item)
      }
    },
    /**
     * Convert the keyframe at (layer, frame) into an *empty* keyframe: the key
     * stays on the timeline but holds nothing, so the layer stops rendering from
     * this frame until the next keyframe. Authored data and tweens touching the
     * key are dropped (a tween into/out of nothing is meaningless).
     */
    clearKeyframe: (state, action: PayloadAction<{ layerId: string; frame: number }>) => {
      const layer = state.layers.get(action.payload.layerId)
      const frame = layer?.timeline.frames.find(
        (f) => f.frame === action.payload.frame && f.kind !== FrameKind.SPAN
      )
      if (!layer || !frame) return
      frame.kind = FrameKind.EMPTY
      delete frame.value
      delete frame.values
      delete frame.ref
      dropTweensFor(layer, frame.id)
    },
    removeKeyframe: (
      state,
      action: PayloadAction<{ layerId: string; frame: number }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      const removed = layer.timeline.frames.find((f) => f.frame === action.payload.frame)
      layer.timeline.frames = layer.timeline.frames.filter(
        (f) => f.frame !== action.payload.frame
      )
      if (removed) dropTweensFor(layer, removed.id)
    },
    moveKeyframe: (
      state,
      action: PayloadAction<{ layerId: string; from: number; to: number }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      const frame = layer.timeline.frames.find((f) => f.frame === action.payload.from)
      if (!frame) return
      const overwritten = layer.timeline.frames.find(
        (f) => f.frame === action.payload.to && f.id !== frame.id
      )
      if (overwritten) dropTweensFor(layer, overwritten.id)
      layer.timeline.frames = layer.timeline.frames.filter(
        (f) => f.frame !== action.payload.to || f.id === frame.id
      )
      frame.frame = action.payload.to
      sortFrames(layer)
    },

    // --- Spans (held/tween/clip; durations) ---
    addSpan: (
      state,
      action: PayloadAction<{
        layerId: string
        frame: number
        duration: number
        value?: number
      }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      layer.timeline.frames.push({
        id: uid(),
        frame: Math.max(0, action.payload.frame),
        kind: FrameKind.SPAN,
        duration: Math.max(1, action.payload.duration),
        value: action.payload.value,
      })
      sortFrames(layer)
    },
    /** Remove a span (or any frame) by id — used by span-only delete. */
    removeSpan: (state, action: PayloadAction<{ layerId: string; spanId: string }>) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      layer.timeline.frames = layer.timeline.frames.filter(
        (f) => f.id !== action.payload.spanId
      )
      dropTweensFor(layer, action.payload.spanId)
    },
    resizeSpan: (
      state,
      action: PayloadAction<{
        layerId: string
        spanId: string
        frame: number
        duration: number
      }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      const span = layer?.timeline.frames.find((f) => f.id === action.payload.spanId)
      if (!span) return
      span.frame = Math.max(0, action.payload.frame)
      // Allow sub-frame (partial) lengths so notes can hold for non-integer steps.
      span.duration = Math.max(1 / 16, action.payload.duration)
      if (layer) sortFrames(layer)
    },
    splitSpan: (
      state,
      action: PayloadAction<{ layerId: string; spanId: string; at: number }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      const span = layer?.timeline.frames.find((f) => f.id === action.payload.spanId)
      if (!layer || !span || span.duration == null) return
      const start = span.frame
      const end = span.frame + span.duration
      const at = action.payload.at
      if (at <= start || at >= end) return
      span.duration = at - start
      layer.timeline.frames.push({
        id: uid(),
        frame: at,
        kind: FrameKind.SPAN,
        duration: end - at,
      })
      sortFrames(layer)
    },
    joinSpans: (state, action: PayloadAction<{ layerId: string; spanIds: string[] }>) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      const ids = new Set(action.payload.spanIds)
      const spans = layer.timeline.frames.filter(
        (f) => ids.has(f.id) && f.kind === FrameKind.SPAN && f.duration != null
      )
      if (spans.length < 2) return
      const start = Math.min(...spans.map((s) => s.frame))
      const end = Math.max(...spans.map((s) => s.frame + (s.duration ?? 0)))
      layer.timeline.frames = layer.timeline.frames.filter((f) => !ids.has(f.id))
      layer.timeline.frames.push({
        id: uid(),
        frame: start,
        kind: FrameKind.SPAN,
        duration: end - start,
      })
      sortFrames(layer)
    },

    // --- Frame-range editing (shift the whole timeline) ---
    insertFrames: (state, action: PayloadAction<{ at: number; count: number }>) => {
      const { at, count } = action.payload
      if (count <= 0) return
      state.layers.forEach((layer) => {
        layer.timeline.frames.forEach((frame) => {
          if (frame.frame >= at) frame.frame += count
        })
        sortFrames(layer)
      })
    },
    removeFrames: (state, action: PayloadAction<{ at: number; count: number }>) => {
      const { at, count } = action.payload
      if (count <= 0) return
      const end = at + count
      state.layers.forEach((layer) => {
        layer.timeline.frames = layer.timeline.frames.filter(
          (f) => f.frame < at || f.frame >= end
        )
        layer.timeline.frames.forEach((frame) => {
          if (frame.frame >= end) frame.frame -= count
        })
        sortFrames(layer)
      })
    },
    rippleDeleteFrames: (
      state,
      action: PayloadAction<{ layerId: string; frames: number[] }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      const removed = new Set(action.payload.frames)
      const sortedRemoved = [...action.payload.frames].sort((a, b) => a - b)
      layer.timeline.frames = layer.timeline.frames.filter((f) => !removed.has(f.frame))
      layer.timeline.frames.forEach((frame) => {
        frame.frame -= sortedRemoved.filter((r) => r < frame.frame).length
      })
      sortFrames(layer)
    },

    // --- Tweens (§20c) ---
    createTween: (
      state,
      action: PayloadAction<{
        layerId: string
        startKeyframeId: string
        endKeyframeId: string
        type?: TweenType
      }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      const { startKeyframeId, endKeyframeId } = action.payload
      const start = layer.timeline.frames.find((f) => f.id === startKeyframeId)
      const end = layer.timeline.frames.find((f) => f.id === endKeyframeId)
      if (!start || !end || start.frame >= end.frame) return
      // Empty keyframes hold nothing — there is no value to interpolate from/to.
      if (start.kind === FrameKind.EMPTY || end.kind === FrameKind.EMPTY) return
      if (
        layer.timeline.tweens.some(
          (t) =>
            t.startKeyframeId === startKeyframeId && t.endKeyframeId === endKeyframeId
        )
      ) {
        return
      }
      layer.timeline.tweens.push({
        id: uid(),
        startKeyframeId,
        endKeyframeId,
        type: action.payload.type ?? TweenType.LINEAR,
        enabled: true,
      })
    },
    removeTween: (state, action: PayloadAction<{ layerId: string; tweenId: string }>) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      layer.timeline.tweens = layer.timeline.tweens.filter(
        (t) => t.id !== action.payload.tweenId
      )
    },
    setTweenType: (
      state,
      action: PayloadAction<{ layerId: string; tweenId: string; type: TweenType }>
    ) => {
      const tween = getTween(state, action.payload.layerId, action.payload.tweenId)
      if (tween) tween.type = action.payload.type
    },
    setTweenEnabled: (
      state,
      action: PayloadAction<{ layerId: string; tweenId: string; enabled: boolean }>
    ) => {
      const tween = getTween(state, action.payload.layerId, action.payload.tweenId)
      if (tween) tween.enabled = action.payload.enabled
    },
    setTweenBezier: (
      state,
      action: PayloadAction<{ layerId: string; tweenId: string; bezier: BezierControls }>
    ) => {
      const tween = getTween(state, action.payload.layerId, action.payload.tweenId)
      if (tween) tween.bezier = action.payload.bezier
    },
    setTweenShortestRotation: (
      state,
      action: PayloadAction<{
        layerId: string
        tweenId: string
        shortestRotation: boolean
      }>
    ) => {
      const tween = getTween(state, action.payload.layerId, action.payload.tweenId)
      if (tween) tween.shortestRotation = action.payload.shortestRotation
    },
    /** Set or clear (`ref: null`) one edge of a tween's x/y bounds — see {@link TweenBounds}. */
    setTweenBound: (
      state,
      action: PayloadAction<{
        layerId: string
        tweenId: string
        axis: 'x' | 'y'
        edge: 'keepBefore' | 'keepBehind' | 'keepBelow' | 'keepAbove'
        ref: TweenBoundRef | null
      }>
    ) => {
      const tween = getTween(state, action.payload.layerId, action.payload.tweenId)
      if (!tween) return
      const { axis, edge, ref } = action.payload
      const bounds = { ...tween.bounds }
      const axisBounds = { ...bounds[axis] }
      if (ref) (axisBounds as Record<string, TweenBoundRef>)[edge] = ref
      else delete (axisBounds as Record<string, TweenBoundRef | undefined>)[edge]
      bounds[axis] = axisBounds
      tween.bounds = bounds
    },
    /** Swap the values of a tween's two endpoint keyframes and flip the easing curve. */
    reverseTween: (
      state,
      action: PayloadAction<{ layerId: string; tweenId: string }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      const tween = getTween(state, action.payload.layerId, action.payload.tweenId)
      if (!layer || !tween) return
      const a = layer.timeline.frames.find((f) => f.id === tween.startKeyframeId)
      const b = layer.timeline.frames.find((f) => f.id === tween.endKeyframeId)
      if (a && b) {
        const tmp = a.value
        a.value = b.value
        b.value = tmp
      }
      // Flip directional easing so the timing curve also reverses correctly.
      if (tween.type === TweenType.EASE_IN) tween.type = TweenType.EASE_OUT
      else if (tween.type === TweenType.EASE_OUT) tween.type = TweenType.EASE_IN
      else if (tween.type === TweenType.BEZIER && tween.bezier) {
        const [x1, y1, x2, y2] = tween.bezier
        tween.bezier = [1 - x2, 1 - y2, 1 - x1, 1 - y1] as BezierControls
      }
    },
    mergeTweens: (
      state,
      action: PayloadAction<{ layerId: string; tweenIds: string[] }>
    ) => {
      const layer = state.layers.get(action.payload.layerId)
      if (!layer) return
      const ids = new Set(action.payload.tweenIds)
      const selected = layer.timeline.tweens.filter((t) => ids.has(t.id))
      if (selected.length < 2) return
      const byId = new Map(layer.timeline.frames.map((f) => [f.id, f]))
      let startKeyframeId = selected[0]!.startKeyframeId
      let endKeyframeId = selected[0]!.endKeyframeId
      let minFrame = byId.get(startKeyframeId)?.frame ?? 0
      let maxFrame = byId.get(endKeyframeId)?.frame ?? 0
      selected.forEach((t) => {
        const a = byId.get(t.startKeyframeId)
        const b = byId.get(t.endKeyframeId)
        if (a && a.frame < minFrame) {
          minFrame = a.frame
          startKeyframeId = t.startKeyframeId
        }
        if (b && b.frame > maxFrame) {
          maxFrame = b.frame
          endKeyframeId = t.endKeyframeId
        }
      })
      layer.timeline.tweens = layer.timeline.tweens.filter((t) => !ids.has(t.id))
      layer.timeline.tweens.push({
        id: uid(),
        startKeyframeId,
        endKeyframeId,
        type: selected[0]!.type,
        enabled: true,
      })
    },
  },
})

export const layersActions = layersSlice.actions
export const layersReducer = layersSlice.reducer
