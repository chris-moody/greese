/**
 * Pure helpers for `layers.slice.ts`'s case reducers — the mutation logic for
 * keyframe/tween editing factored out so the slice file itself stays a map of
 * thin case reducers. Every function here is called with an Immer draft (a
 * `LayerStoreState`/`AuthoringLayer`/`Tween` in the middle of a `produce`
 * call) and mutates it directly, same as if the logic were still inline.
 */
import { uid } from '../core/uid.ts'
import { type AuthoringLayer, type LayerStoreState } from '../core/types/layer.types.ts'
import { FrameKind, type FrameRef } from '../core/types/frame.types.ts'
import { type Tween } from '../core/types/tween.types.ts'

export const sortFrames = (layer: AuthoringLayer) => {
  layer.timeline.frames.sort((a, b) => a.frame - b.frame)
}

export interface AddKeyframePayload {
  layerId: string
  frame: number
  value?: number
  values?: Record<string, number>
  /** Frame kind (defaults to KEYFRAME); e.g. a media 'poseFrame'. */
  kind?: FrameKind | string
  /** Reference for kinds that derive their value (e.g. a pose name). */
  ref?: FrameRef
}

/**
 * Core of `addKeyframe` — factored out so `addKeyframes` (the batched form,
 * used by multi-joint autokey) can apply several items within one Immer
 * transaction/dispatch instead of duplicating this logic per item.
 */
export const applyAddKeyframe = (
  layer: AuthoringLayer,
  payload: Omit<AddKeyframePayload, 'layerId'>
) => {
  const existing = layer.timeline.frames.find((f) => f.frame === payload.frame)
  if (existing) {
    existing.value = payload.value
    if (payload.values) existing.values = payload.values
    if (payload.kind) existing.kind = payload.kind
    // Authoring data onto an empty keyframe promotes it to a real keyframe.
    else if (existing.kind === FrameKind.EMPTY) existing.kind = FrameKind.KEYFRAME
    // Conditional, mirroring `applyUpdateNearestKeyframe`'s own `if (payload.ref) nearest.ref = ...`
    // just below — an unconditional `existing.ref = payload.ref` here silently
    // stripped an existing keyframe's `ref` (e.g. a pose-frame's `{pose}` link)
    // whenever ANY later plain value-only write (autokey capturing a joint's
    // current transform, an unrelated channel update, etc.) touched the same
    // frame without supplying its own `ref` — the frame's `kind` stayed
    // POSE_FRAME_KIND (only overwritten when `payload.kind` is truthy, same as
    // here) but its now-missing `ref.pose` made `commitAnimation`'s
    // `f.kind === POSE_FRAME_KIND && f.ref?.pose` filter silently reclassify it
    // as a plain keyframe on the next commit — reported as "pose frames
    // converted to keyframes." Ease/bezier tween info lives only on a
    // channel's own keyframes (not on `PoseKeyRef`), so a poseframe demoted
    // this way also loses whatever tween was authored on it — the same
    // underlying bug also explains "tweens dropped," especially on joints
    // whose resolved value happens to match across poses (more likely to
    // pick up an incidental same-frame write from a batched/all-joints
    // autokey without ever looking visually different).
    if (payload.ref) existing.ref = payload.ref
    return
  }
  const id = uid()
  layer.timeline.frames.push({
    id,
    frame: payload.frame,
    kind: payload.kind ?? FrameKind.KEYFRAME,
    value: payload.value,
    values: payload.values,
    ref: payload.ref,
  })
  sortFrames(layer)

  // Inserting a keyframe inside a tween splits it in two (§20c); inserting an
  // *empty* keyframe cuts the tween instead — nothing can interpolate through it.
  const byId = new Map(layer.timeline.frames.map((f) => [f.id, f]))
  const containing = layer.timeline.tweens.find((t) => {
    const a = byId.get(t.startKeyframeId)
    const b = byId.get(t.endKeyframeId)
    return a && b && a.frame < payload.frame && b.frame > payload.frame
  })
  if (containing) {
    if (payload.kind === FrameKind.EMPTY) {
      layer.timeline.tweens = layer.timeline.tweens.filter((t) => t.id !== containing.id)
    } else {
      layer.timeline.tweens.push({
        id: uid(),
        startKeyframeId: id,
        endKeyframeId: containing.endKeyframeId,
        type: containing.type,
        enabled: containing.enabled,
      })
      containing.endKeyframeId = id
    }
  }
}

/**
 * The keyframe (or empty keyframe) nearest at-or-before `frame` — the "ancestor" a
 * Manual-keyframing-mode edit updates in place instead of writing at `frame` itself
 * (see `keyframeMode.slice.ts`). Spans are never candidates: they hold a duration,
 * not a per-frame value. Exported for `autoKeyframe.helpers.ts`, which call sites
 * use to read the right merge base for a `values` patch before dispatching.
 */
export const nearestAncestorKeyframe = (layer: AuthoringLayer, frame: number) => {
  let nearest: AuthoringLayer['timeline']['frames'][number] | undefined
  for (const f of layer.timeline.frames) {
    if (f.kind === FrameKind.SPAN) continue
    if (f.frame <= frame && (!nearest || f.frame > nearest.frame)) nearest = f
  }
  return nearest
}

/**
 * Core of `updateNearestKeyframe` — factored out so `updateNearestKeyframes` (the
 * batched form, used by multi-joint Manual-mode autokey) can apply several items
 * within one Immer transaction, mirroring `applyAddKeyframe`/`addKeyframes` above.
 * A no-op when there's no keyframe at or before `payload.frame` — Manual mode never
 * creates one (see `keyframeMode.slice.ts`'s doc comment).
 */
export const applyUpdateNearestKeyframe = (
  layer: AuthoringLayer,
  payload: Omit<AddKeyframePayload, 'layerId'>
) => {
  const nearest = nearestAncestorKeyframe(layer, payload.frame)
  if (!nearest) return
  if (payload.value !== undefined) nearest.value = payload.value
  if (payload.values) nearest.values = payload.values
  if (payload.ref) nearest.ref = payload.ref
  // Authoring real data onto an empty keyframe promotes it to a real keyframe,
  // same as `applyAddKeyframe`.
  if (
    (payload.value !== undefined || payload.values) &&
    nearest.kind === FrameKind.EMPTY
  ) {
    nearest.kind = FrameKind.KEYFRAME
  }
}

/** Drop any tweens that reference a removed keyframe id. */
export const dropTweensFor = (layer: AuthoringLayer, keyframeId: string) => {
  layer.timeline.tweens = layer.timeline.tweens.filter(
    (t) => t.startKeyframeId !== keyframeId && t.endKeyframeId !== keyframeId
  )
}

/** Find a tween by (layerId, tweenId) — shared lookup for the tween-property reducers. */
export const getTween = (
  state: LayerStoreState,
  layerId: string,
  tweenId: string
): Tween | undefined =>
  state.layers.get(layerId)?.timeline.tweens.find((t) => t.id === tweenId)
