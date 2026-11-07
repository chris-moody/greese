'use client'
import { useCallback } from 'react'
import { layersActions } from '../state/layers.slice.ts'
import {
  timelineActions,
  type ClipboardKeyframe,
  type ClipboardTween,
} from '../state/timeline.slice.ts'
import { coalesce } from '../state/commandsMiddleware.ts'
import { makeLayer, DEFAULT_LAYER_TYPE } from '../core/layers/layers.ts'
import { FrameKind } from '../core/types/frame.types.ts'
import type { AuthoringRootState } from '../state/createAuthoringStore.ts'
import {
  gatherSelected,
  gatherSelectedSpans,
  gatherSelectedTweens,
  recreateTweens,
  pasteItemAction,
  type PasteDecision,
  type SelectedKeyframe,
  type TimelineEditingContext,
} from './timelineEditing.ts'

/**
 * Clipboard command group: delete/copy/cut/paste/duplicate for the current
 * timeline selection (keyframes, spans, and tweens together). Selection stays
 * id-based and the clipboard stores relative offsets + layer ids, so paste and
 * duplicate preserve layer mapping and relative spacing (§20b). Each op is an
 * undoable command (batched into a single history entry via `coalesce`).
 */
export const useClipboardEditing = ({
  store,
  dispatch,
  config,
}: TimelineEditingContext) => {
  const deleteSelected = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const rows = gatherSelected(state)
    const spanRows = gatherSelectedSpans(state)
    const tweenRows = gatherSelectedTweens(state)
    if (rows.length === 0 && tweenRows.length === 0) return
    const key = `delete-${Date.now()}`
    // Remove selected tweens first, then keyframes (removing a key drops its tweens too).
    tweenRows.forEach((r) =>
      dispatch(
        coalesce(
          layersActions.removeTween({ layerId: r.layerId, tweenId: r.tween.id }),
          key
        )
      )
    )
    // Spans are removed by id (several may share a frame index); keyframes by frame.
    spanRows.forEach((span) =>
      dispatch(
        coalesce(
          layersActions.removeSpan({ layerId: span.layerId, spanId: span.spanId }),
          key
        )
      )
    )
    rows
      .filter((row) => row.kind !== FrameKind.SPAN)
      .forEach((row) =>
        dispatch(
          coalesce(
            layersActions.removeKeyframe({ layerId: row.layerId, frame: row.frame }),
            key
          )
        )
      )
    dispatch(timelineActions.clearTimelineSelection())
  }, [store, dispatch])

  const copy = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const tweenRows = gatherSelectedTweens(state)
    // Gather copied keyframes: the selected ones plus every selected tween's
    // endpoints (so paste can rebuild the tween), deduped by (layer, frame).
    const kfMap = new Map<string, SelectedKeyframe>()
    gatherSelected(state).forEach((r) => kfMap.set(`${r.layerId}:${r.frame}`, r))
    tweenRows.forEach((t) => {
      const layer = state.layers.layers.get(t.layerId)
      ;[t.startFrame, t.endFrame].forEach((fr) => {
        const mapKey = `${t.layerId}:${fr}`
        if (kfMap.has(mapKey)) return
        const frame = layer?.timeline.frames.find((f) => f.frame === fr)
        if (frame)
          kfMap.set(mapKey, {
            layerId: t.layerId,
            frame: fr,
            kind: String(frame.kind),
            value: frame.value,
            values: frame.values,
          })
      })
    })
    const rows = [...kfMap.values()]
    if (rows.length === 0) return

    const anchor = Math.min(...rows.map((r) => r.frame))
    const items: ClipboardKeyframe[] = rows.map((r) => ({
      layerId: r.layerId,
      frameOffset: r.frame - anchor,
      kind: r.kind,
      value: r.value,
      values: r.values,
      duration: r.duration,
    }))
    const tweens: ClipboardTween[] = tweenRows.map((t) => ({
      layerId: t.layerId,
      startOffset: t.startFrame - anchor,
      endOffset: t.endFrame - anchor,
      type: t.tween.type,
      enabled: t.tween.enabled,
      bezier: t.tween.bezier,
      shortestRotation: t.tween.shortestRotation,
    }))
    dispatch(
      timelineActions.setClipboard({
        items,
        tweens,
        mediaType: state.timeline.clipboard?.mediaType ?? 'unknown',
        version: 1,
      })
    )
  }, [store, dispatch])

  /** Apply the clipboard, resolving each source layer through `decisions`. */
  const pasteWithMapping = useCallback(
    (decisions: Record<string, PasteDecision>) => {
      const state = store.getState() as AuthoringRootState
      const clip = state.timeline.clipboard
      if (!clip || clip.items.length === 0) return
      const origin = state.playback.currentFrame
      const key = `paste-${Date.now()}`
      const layerType = config.layerTypes?.[0]?.layerType ?? DEFAULT_LAYER_TYPE

      // Resolve a target layer id for each source: itself if present, else the decision.
      const resolved = new Map<string, string | null>()
      const sources = new Set(clip.items.map((i) => i.layerId))
      sources.forEach((source) => {
        if (state.layers.layers.has(source)) {
          resolved.set(source, source)
          return
        }
        const decision = decisions[source]
        if (decision === 'create') {
          const layer = makeLayer({ name: 'Pasted Layer', layerType })
          dispatch(coalesce(layersActions.addLayer({ layer }), key))
          resolved.set(source, layer.id)
        } else if (decision && decision !== 'skip') {
          resolved.set(source, decision)
        } else {
          resolved.set(source, null)
        }
      })

      clip.items.forEach((item) => {
        const target = resolved.get(item.layerId)
        if (!target) return
        dispatch(coalesce(pasteItemAction(target, origin + item.frameOffset, item), key))
      })
      recreateTweens(
        store,
        dispatch,
        clip.tweens ?? [],
        (src) => resolved.get(src) ?? null,
        origin,
        key
      )
      dispatch(timelineActions.clearPendingPaste())
    },
    [store, dispatch, config]
  )

  const paste = useCallback(() => {
    const state = store.getState() as AuthoringRootState
    const clip = state.timeline.clipboard
    if (!clip || clip.items.length === 0) return
    const missing = [...new Set(clip.items.map((i) => i.layerId))].filter(
      (id) => !state.layers.layers.has(id)
    )
    if (missing.length === 0) pasteWithMapping({})
    else dispatch(timelineActions.setPendingPaste({ missingLayers: missing }))
  }, [store, dispatch, pasteWithMapping])

  /** Paste every clipboard item into one layer (ignoring source layers). */
  const pasteIntoLayer = useCallback(
    (layerId: string) => {
      const state = store.getState() as AuthoringRootState
      const clip = state.timeline.clipboard
      if (!clip || clip.items.length === 0 || !state.layers.layers.has(layerId)) return
      const origin = state.playback.currentFrame
      const key = `paste-${Date.now()}`
      clip.items.forEach((item) =>
        dispatch(coalesce(pasteItemAction(layerId, origin + item.frameOffset, item), key))
      )
      recreateTweens(store, dispatch, clip.tweens ?? [], () => layerId, origin, key)
    },
    [store, dispatch]
  )

  const cut = useCallback(() => {
    copy()
    deleteSelected()
  }, [copy, deleteSelected])

  const duplicate = useCallback(() => {
    const rows = gatherSelected(store.getState() as AuthoringRootState)
    if (rows.length === 0) return
    const min = Math.min(...rows.map((r) => r.frame))
    const max = Math.max(...rows.map((r) => r.frame))
    const offset = max - min + 1
    const key = `duplicate-${Date.now()}`
    rows.forEach((row) =>
      dispatch(
        coalesce(
          pasteItemAction(row.layerId, row.frame + offset, {
            layerId: row.layerId,
            frameOffset: 0,
            kind: row.kind,
            value: row.value,
            values: row.values,
            duration: row.duration,
          }),
          key
        )
      )
    )
  }, [store, dispatch])

  return { deleteSelected, copy, cut, paste, pasteWithMapping, pasteIntoLayer, duplicate }
}
