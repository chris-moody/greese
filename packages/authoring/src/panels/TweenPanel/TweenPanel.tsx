import type { JSX } from 'react'
import { Button, Divider } from '@greese/react'
import { EditableField, type EditableFieldOption as Option } from '@greese/react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { layersActions } from '../../state/layers.slice.ts'
import { timelineActions } from '../../state/timeline.slice.ts'
import { coalesce } from '../../state/commandsMiddleware.ts'
import { selectSelectedTweenRefs, selectVisibleGuides } from '../../state/selectors.ts'
import { resolveBoundRef, isValidAxisBounds } from '../../core/timeline/tween.ts'
import {
  DEFAULT_BEZIER,
  TweenType,
  type BezierControls,
  type TweenBoundRef,
} from '../../core/types/tween.types.ts'
import { EmptyState, FieldLabel } from '../panelParts.tsx'
import { PanelBody } from '../panelParts.tsx'
import { BezierEditor } from './BezierEditor.tsx'
import { BoundField } from './BoundField.tsx'
import { BEZIER_PRESETS } from '../../core/timeline/bezierPresets.ts'

const TWEEN_TYPE_OPTIONS: Option[] = Object.values(TweenType).map((type) => ({
  value: type,
  label: type,
}))

/** Interpolation dropdown options: every plain `TweenType`, plus a visually separated "Bezier Presets" group. */
const INTERPOLATION_OPTIONS: Option[] = [
  ...TWEEN_TYPE_OPTIONS,
  ...BEZIER_PRESETS.map((preset) => ({
    value: preset.id,
    label: preset.label,
    group: 'Bezier Presets',
  })),
]

/** A preset id chosen from the Interpolation dropdown is distinct from any `TweenType` value. */
const bezierPresetFor = (value: string) =>
  BEZIER_PRESETS.find((preset) => preset.id === value)

/** The preset (if any) whose exact control points match a tween's current bezier — for the dropdown's displayed value. */
const matchingPreset = (bezier: BezierControls) =>
  BEZIER_PRESETS.find((preset) => preset.bezier.every((v, i) => v === bezier[i]))

/**
 * Tween panel — edits the selected tween(s): interpolation type, enabled flag,
 * shortest-rotation, and bézier controls. When several tweens are selected the
 * controls reflect the first and edits apply to all. Only affects tweens (§20c).
 */
export const TweenPanel = (): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const refs = useAuthoringSelector(selectSelectedTweenRefs)
  const visibleGuides = useAuthoringSelector(selectVisibleGuides)

  if (refs.length === 0) return <EmptyState>No tween selected</EmptyState>

  const primary = refs[0]!.tween
  const key = `tween-edit-${refs.map((r) => r.tween.id).join(',')}`

  /** Apply a partial update to every selected tween (batched into one undo step). */
  const applyToAll = (make: (layerId: string, tweenId: string) => void) =>
    refs.forEach((ref) => make(ref.layerId, ref.tween.id))

  const guidePositionFor = (guideId: string) =>
    visibleGuides.find((g) => g.id === guideId)?.pos
  // x bounds are set by vertical guide lines (fixed x); y bounds by horizontal ones (fixed y).
  const verticalGuides = visibleGuides.filter((g) => g.axis === 'v')
  const horizontalGuides = visibleGuides.filter((g) => g.axis === 'h')

  /** Writes one edge of the x-axis bounds, rejecting the change if it would make `keepBehind <= keepBefore`. */
  const setXBound = (edge: 'keepBefore' | 'keepBehind', ref: TweenBoundRef | null) => {
    const before =
      edge === 'keepBefore' ? (ref ?? undefined) : primary.bounds?.x?.keepBefore
    const behind =
      edge === 'keepBehind' ? (ref ?? undefined) : primary.bounds?.x?.keepBehind
    if (
      !isValidAxisBounds(
        resolveBoundRef(before, guidePositionFor),
        resolveBoundRef(behind, guidePositionFor)
      )
    )
      return
    applyToAll((layerId, tweenId) =>
      dispatch(
        coalesce(
          layersActions.setTweenBound({ layerId, tweenId, axis: 'x', edge, ref }),
          key
        )
      )
    )
  }

  /** Writes one edge of the y-axis bounds, rejecting the change if it would make `keepAbove <= keepBelow`. */
  const setYBound = (edge: 'keepBelow' | 'keepAbove', ref: TweenBoundRef | null) => {
    const below = edge === 'keepBelow' ? (ref ?? undefined) : primary.bounds?.y?.keepBelow
    const above = edge === 'keepAbove' ? (ref ?? undefined) : primary.bounds?.y?.keepAbove
    if (
      !isValidAxisBounds(
        resolveBoundRef(below, guidePositionFor),
        resolveBoundRef(above, guidePositionFor)
      )
    )
      return
    applyToAll((layerId, tweenId) =>
      dispatch(
        coalesce(
          layersActions.setTweenBound({ layerId, tweenId, axis: 'y', edge, ref }),
          key
        )
      )
    )
  }

  return (
    <PanelBody>
      {refs.length > 1 && <FieldLabel>{refs.length} tweens selected</FieldLabel>}
      <EditableField
        type="select"
        label="Interpolation"
        options={INTERPOLATION_OPTIONS}
        value={
          primary.type === TweenType.BEZIER
            ? (matchingPreset(primary.bezier ?? DEFAULT_BEZIER)?.id ?? primary.type)
            : primary.type
        }
        onValueChange={(value) => {
          const preset = bezierPresetFor(value as string)
          applyToAll((layerId, tweenId) => {
            if (preset) {
              dispatch(
                coalesce(
                  layersActions.setTweenType({
                    layerId,
                    tweenId,
                    type: TweenType.BEZIER,
                  }),
                  key
                )
              )
              dispatch(
                coalesce(
                  layersActions.setTweenBezier({
                    layerId,
                    tweenId,
                    bezier: preset.bezier,
                  }),
                  key
                )
              )
              return
            }
            dispatch(
              coalesce(
                layersActions.setTweenType({
                  layerId,
                  tweenId,
                  type: value as TweenType,
                }),
                key
              )
            )
          })
        }}
      />
      <EditableField
        type="switch"
        label="Enabled"
        value={primary.enabled}
        onValueChange={() =>
          applyToAll((layerId, tweenId) =>
            dispatch(
              coalesce(
                layersActions.setTweenEnabled({
                  layerId,
                  tweenId,
                  enabled: !primary.enabled,
                }),
                key
              )
            )
          )
        }
      />
      <EditableField
        type="switch"
        label="Shortest rotation"
        value={primary.shortestRotation !== false}
        onValueChange={() =>
          applyToAll((layerId, tweenId) =>
            dispatch(
              coalesce(
                layersActions.setTweenShortestRotation({
                  layerId,
                  tweenId,
                  shortestRotation: primary.shortestRotation === false,
                }),
                key
              )
            )
          )
        }
      />
      {primary.type === TweenType.BEZIER && (
        <BezierEditor
          value={primary.bezier ?? DEFAULT_BEZIER}
          onChange={(bezier: BezierControls) =>
            applyToAll((layerId, tweenId) =>
              dispatch(
                coalesce(
                  layersActions.setTweenBezier({ layerId, tweenId, bezier }),
                  `bezier-${key}`
                )
              )
            )
          }
        />
      )}

      <Divider />
      <FieldLabel>X bounds</FieldLabel>
      <BoundField
        label="Keep Before"
        value={primary.bounds?.x?.keepBefore}
        guides={verticalGuides}
        onChange={(ref) => setXBound('keepBefore', ref)}
      />
      <BoundField
        label="Keep Behind"
        value={primary.bounds?.x?.keepBehind}
        guides={verticalGuides}
        onChange={(ref) => setXBound('keepBehind', ref)}
      />

      <FieldLabel>Y bounds</FieldLabel>
      <BoundField
        label="Keep Below"
        value={primary.bounds?.y?.keepBelow}
        guides={horizontalGuides}
        onChange={(ref) => setYBound('keepBelow', ref)}
      />
      <BoundField
        label="Keep Above"
        value={primary.bounds?.y?.keepAbove}
        guides={horizontalGuides}
        onChange={(ref) => setYBound('keepAbove', ref)}
      />
      <Divider />

      <Button
        size="sm"
        tone="negative"
        onClick={() => {
          applyToAll((layerId, tweenId) =>
            dispatch(coalesce(layersActions.removeTween({ layerId, tweenId }), key))
          )
          dispatch(timelineActions.clearTween())
        }}
      >
        Remove Tween{refs.length > 1 ? 's' : ''}
      </Button>
    </PanelBody>
  )
}
