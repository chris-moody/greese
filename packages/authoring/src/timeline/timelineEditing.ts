import { layersActions } from '../state/layers.slice.ts'
import { type ClipboardKeyframe, type ClipboardTween } from '../state/timeline.slice.ts'
import type { AuthoringStore } from '../state/createAuthoringStore.ts'
import { coalesce } from '../state/commandsMiddleware.ts'
import { FrameKind } from '../core/types/frame.types.ts'
import { TweenType, type Tween } from '../core/types/tween.types.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import type { MediaConfig } from '../environment/media.types.ts'

/** Per-missing-layer paste decision: skip it, create a new layer, or an existing id. */
export type PasteDecision = 'skip' | 'create' | string

/**
 * Shared inputs every `useTimelineEditing` command-group hook (clipboard,
 * keyframe, span, tween, marker) needs: the store, its dispatch, and the
 * active media config. Passed as one params object so every group stays in
 * sync with the same store/config identity without re-deriving it.
 */
export interface TimelineEditingContext {
  store: AuthoringStore
  dispatch: AuthoringStore['dispatch']
  config: MediaConfig
}

export interface SelectedKeyframe {
  layerId: string
  frame: number
  kind: string
  value?: number
  values?: Record<string, number>
  /** Span length (SPAN frames only). */
  duration?: number
}

export interface SelectedSpan {
  layerId: string
  spanId: string
  frame: number
  duration: number
}

export interface SelectedTweenRow {
  layerId: string
  startFrame: number
  endFrame: number
  tween: Tween
}

/** Resolve the selected keyframe ids into concrete (layer, frame, value) rows. */
export const gatherSelected = (state: AuthoringRootState): SelectedKeyframe[] => {
  const selection = state.timeline.selection
  const rows: SelectedKeyframe[] = []
  state.layers.layers.forEach((layer) => {
    layer.timeline.frames.forEach((frame) => {
      if (selection.has(frame.id)) {
        rows.push({
          layerId: layer.id,
          frame: frame.frame,
          kind: String(frame.kind),
          value: frame.value,
          values: frame.values,
          duration: frame.duration,
        })
      }
    })
  })
  return rows
}

/** Selected tweens resolved to their owning layer + endpoint frames. */
export const gatherSelectedTweens = (state: AuthoringRootState): SelectedTweenRow[] => {
  const ids = state.timeline.selectedTweens
  const rows: SelectedTweenRow[] = []
  state.layers.layers.forEach((layer) => {
    const byId = new Map(layer.timeline.frames.map((f) => [f.id, f]))
    layer.timeline.tweens.forEach((tween) => {
      if (!ids.has(tween.id)) return
      const a = byId.get(tween.startKeyframeId)
      const b = byId.get(tween.endKeyframeId)
      if (a && b)
        rows.push({ layerId: layer.id, startFrame: a.frame, endFrame: b.frame, tween })
    })
  })
  return rows
}

/**
 * Recreate pasted tweens: for each clipboard tween, find the keyframes just pasted
 * at its endpoints on the resolved target layer and connect them, restoring the
 * tween's type/enabled/shortest-rotation/bézier.
 */
export const recreateTweens = (
  store: AuthoringStore,
  dispatch: AuthoringStore['dispatch'],
  tweens: ClipboardTween[],
  resolveLayer: (sourceLayerId: string) => string | null,
  origin: number,
  key: string
): void => {
  tweens.forEach((t) => {
    const target = resolveLayer(t.layerId)
    if (!target) return
    const layer = (store.getState() as AuthoringRootState).layers.layers.get(target)
    const a = layer?.timeline.frames.find((f) => f.frame === origin + t.startOffset)
    const b = layer?.timeline.frames.find((f) => f.frame === origin + t.endOffset)
    if (!a || !b) return
    dispatch(
      coalesce(
        layersActions.createTween({
          layerId: target,
          startKeyframeId: a.id,
          endKeyframeId: b.id,
          type: t.type,
        }),
        key
      )
    )
    const created = (store.getState() as AuthoringRootState).layers.layers
      .get(target)
      ?.timeline.tweens.find(
        (tw) => tw.startKeyframeId === a.id && tw.endKeyframeId === b.id
      )
    if (!created) return
    if (!t.enabled)
      dispatch(
        coalesce(
          layersActions.setTweenEnabled({
            layerId: target,
            tweenId: created.id,
            enabled: false,
          }),
          key
        )
      )
    if (t.shortestRotation === false) {
      dispatch(
        coalesce(
          layersActions.setTweenShortestRotation({
            layerId: target,
            tweenId: created.id,
            shortestRotation: false,
          }),
          key
        )
      )
    }
    if (t.type === TweenType.BEZIER && t.bezier) {
      dispatch(
        coalesce(
          layersActions.setTweenBezier({
            layerId: target,
            tweenId: created.id,
            bezier: t.bezier,
          }),
          key
        )
      )
    }
  })
}

/** Selected spans (for split/join). */
export const gatherSelectedSpans = (state: AuthoringRootState): SelectedSpan[] => {
  const selection = state.timeline.selection
  const spans: SelectedSpan[] = []
  state.layers.layers.forEach((layer) =>
    layer.timeline.frames.forEach((frame) => {
      if (selection.has(frame.id) && frame.kind === FrameKind.SPAN) {
        spans.push({
          layerId: layer.id,
          spanId: frame.id,
          frame: frame.frame,
          duration: frame.duration ?? 1,
        })
      }
    })
  )
  return spans
}

/** Selected markers, resolved from `timeline.selectedMarkers`. */
export const gatherSelectedMarkers = (state: AuthoringRootState) =>
  state.timeline.markers.filter((m) => state.timeline.selectedMarkers.has(m.id))

/** Resolve `"layerId:frame"` cell keys into { layerId, frame } rows. */
export const cellsToRows = (
  cells: Iterable<string>
): { layerId: string; frame: number }[] =>
  [...cells].map((cell) => {
    const sep = cell.lastIndexOf(':')
    return { layerId: cell.slice(0, sep), frame: Number(cell.slice(sep + 1)) }
  })

/**
 * The action that recreates one clipboard item on paste: spans keep their length
 * via `addSpan`, empty keyframes stay empty, everything else pastes as a keyframe.
 */
export const pasteItemAction = (
  layerId: string,
  frame: number,
  item: ClipboardKeyframe
) => {
  if (item.kind === FrameKind.SPAN)
    return layersActions.addSpan({
      layerId,
      frame,
      duration: item.duration ?? 1,
      value: item.value,
    })
  if (item.kind === FrameKind.EMPTY)
    return layersActions.addKeyframe({ layerId, frame, kind: FrameKind.EMPTY })
  return layersActions.addKeyframe({
    layerId,
    frame,
    value: item.value,
    values: item.values,
  })
}
