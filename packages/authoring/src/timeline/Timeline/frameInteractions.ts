import { selectFrameCount, selectVisibleLayers } from '../../state/selectors.ts'
import { ROW_HEIGHT } from '../../core/constants.ts'
import { FrameKind } from '../../core/types/frame.types.ts'
import type { AuthoringRootState } from '../../state/createAuthoringStore.ts'

/**
 * Pixel threshold before a press becomes a drag — shared by every press-drag
 * gesture in the frame-interactions hook family (marquee select, span create).
 */
export const DRAG_THRESHOLD = 4

export interface MarqueeBox {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Keyframe ids whose centers fall inside the rect (frames-body coordinates).
 * Excludes SPAN frames — {@link spansInRect} handles those — so a mixed
 * timeline (span rows alongside keyframe rows, e.g. Sound Studio's note/
 * arrangement spans next to property-tween keyframe tracks) can union both
 * without double-hitting a span as a keyframe too.
 */
export const keyframesInRect = (
  state: AuthoringRootState,
  rect: MarqueeBox,
  frameWidth: number
): string[] => {
  const hits: string[] = []
  const x1 = rect.left + rect.width
  const y1 = rect.top + rect.height
  selectVisibleLayers(state).forEach((layer, index) => {
    const cy = index * ROW_HEIGHT + ROW_HEIGHT / 2
    if (cy < rect.top || cy > y1) return
    layer.timeline.frames.forEach((frame) => {
      if (frame.kind === FrameKind.SPAN) return
      const cx = frame.frame * frameWidth + frameWidth / 2
      if (cx >= rect.left && cx <= x1) hits.push(frame.id)
    })
  })
  return hits
}

/** Enabled tween ids whose bar overlaps the rect (frames-body coordinates). */
export const tweensInRect = (
  state: AuthoringRootState,
  rect: MarqueeBox,
  frameWidth: number
): string[] => {
  const hits: string[] = []
  const x1 = rect.left + rect.width
  const y1 = rect.top + rect.height
  selectVisibleLayers(state).forEach((layer, index) => {
    const top = index * ROW_HEIGHT
    if (top + ROW_HEIGHT < rect.top || top > y1) return
    const byId = new Map(layer.timeline.frames.map((f) => [f.id, f]))
    layer.timeline.tweens.forEach((tween) => {
      if (!tween.enabled) return
      const a = byId.get(tween.startKeyframeId)
      const b = byId.get(tween.endKeyframeId)
      if (!a || !b) return
      const sx = a.frame * frameWidth + frameWidth / 2
      const ex = b.frame * frameWidth + frameWidth / 2
      if (ex >= rect.left && sx <= x1) hits.push(tween.id)
    })
  })
  return hits
}

/** Cell keys ("layerId:frame") whose centers fall inside the rect. */
export const cellsInRect = (
  state: AuthoringRootState,
  rect: MarqueeBox,
  frameWidth: number
): string[] => {
  const hits: string[] = []
  const x1 = rect.left + rect.width
  const y1 = rect.top + rect.height
  const count = selectFrameCount(state)
  const fStart = Math.max(0, Math.floor(rect.left / frameWidth))
  const fEnd = Math.min(count - 1, Math.floor(x1 / frameWidth))
  selectVisibleLayers(state).forEach((layer, index) => {
    const top = index * ROW_HEIGHT
    if (top + ROW_HEIGHT < rect.top || top > y1) return
    for (let f = fStart; f <= fEnd; f++) {
      const cx = f * frameWidth + frameWidth / 2
      if (cx >= rect.left && cx <= x1) hits.push(`${layer.id}:${f}`)
    }
  })
  return hits
}

/** SPAN frame ids whose horizontal extent overlaps the rect (frames-body coords). */
export const spansInRect = (
  state: AuthoringRootState,
  rect: MarqueeBox,
  frameWidth: number
): string[] => {
  const hits: string[] = []
  const x1 = rect.left + rect.width
  const y1 = rect.top + rect.height
  selectVisibleLayers(state).forEach((layer, index) => {
    const top = index * ROW_HEIGHT
    if (top + ROW_HEIGHT < rect.top || top > y1) return
    layer.timeline.frames.forEach((frame) => {
      if (frame.kind !== FrameKind.SPAN) return
      const sx = frame.frame * frameWidth
      const ex = (frame.frame + (frame.duration ?? 1)) * frameWidth
      if (ex >= rect.left && sx <= x1) hits.push(frame.id)
    })
  })
  return hits
}
