/**
 * Shared "a keyframe-able stage object property changed" dispatch helper —
 * chooses between creating/overwriting a keyframe at the current frame
 * (Automatic mode) and updating the keyframe nearest at-or-before that frame
 * in place (Manual mode), per `keyframeMode.slice.ts`. Every studio's
 * autokey/property-panel-edit call site should route its keyframe write
 * through {@link autoKeyframeAction}/{@link autoKeyframesAction} (reading its
 * `values` merge base via {@link autoKeyframeSource}) instead of dispatching
 * `layersActions.addKeyframe`/`addKeyframes` directly, so both modes stay in
 * sync without duplicating the mode check at each call site.
 */
import {
  layersActions,
  nearestAncestorKeyframe,
  type AddKeyframePayload,
} from '../state/layers.slice.ts'
import { KeyframeMode } from '../state/keyframeMode.slice.ts'
import type { AuthoringLayer } from '../core/types/layer.types.ts'

/**
 * The keyframe a `values`/`value` patch at `frame` should merge onto, given
 * the active mode — the exact-frame keyframe (if any) in Automatic mode, or
 * the same nearest-ancestor keyframe {@link autoKeyframeAction} will write to
 * in Manual mode.
 */
export const autoKeyframeSource = (
  layer: AuthoringLayer,
  mode: KeyframeMode,
  frame: number
) =>
  mode === KeyframeMode.MANUAL
    ? nearestAncestorKeyframe(layer, frame)
    : layer.timeline.frames.find((f) => f.frame === frame)

/** The `layersActions` write for "a stage-object property changed", gated by keyframe mode. */
export const autoKeyframeAction = (mode: KeyframeMode, payload: AddKeyframePayload) =>
  mode === KeyframeMode.MANUAL
    ? layersActions.updateNearestKeyframe(payload)
    : layersActions.addKeyframe(payload)

/** Batched form of {@link autoKeyframeAction} — see `addKeyframes`/`updateNearestKeyframes`. */
export const autoKeyframesAction = (mode: KeyframeMode, payload: AddKeyframePayload[]) =>
  mode === KeyframeMode.MANUAL
    ? layersActions.updateNearestKeyframes(payload)
    : layersActions.addKeyframes(payload)
