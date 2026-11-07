'use client'
import { ChevronRightIcon as ArrowRightIcon } from '@greese/icons'
import { useState, type MouseEvent, type JSX } from 'react'
import { ContextMenu, MenuItem, MenuSeparator } from '@greese/react'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { layersActions } from '../../../state/layers.slice.ts'
import { timelineActions } from '../../../state/timeline.slice.ts'
import {
  selectActiveTimelineScope,
  selectCellSelection,
  selectTimelineSelection,
} from '../../../state/selectors.ts'
import { FrameKind, type FrameBase } from '../../../core/types/frame.types.ts'
import { useTimelineEditing } from '../../useTimelineEditing.ts'
import { ApplyCurveDialog, type ApplyCurveMode } from './ApplyCurveDialog.tsx'

/** What was right-clicked: a keyframe, an empty frame cell, or a keyframe segment. */
export type ContextTarget =
  | { kind: 'keyframe'; layerId: string }
  | { kind: 'frame'; layerId: string; frame: number }
  | {
      kind: 'segment'
      layerId: string
      frame: number
      startKeyframeId: string
      /** Absent for the trailing hold after a layer's last keyframe — there's no next keyframe to tween into. */
      endKeyframeId?: string
      tweenId?: string
    }

export interface TimelineContextMenuProps {
  position: { top: number; left: number } | null
  target: ContextTarget | null
  /** Tick under the right-clicked point — what "Tween All" operates on (see `MediaConfig.timelineTools.showTweenAll`). */
  frame: number
  onClose: () => void
}

/** A keyframe that "Clear Keyframe" applies to: real content (not a span, not already empty). */
const isClearable = (frame: FrameBase | undefined): boolean =>
  !!frame && frame.kind !== FrameKind.SPAN && frame.kind !== FrameKind.EMPTY

/**
 * Timeline context menu. On a keyframe: Copy/Cut/Paste/Duplicate/Clear/Delete.
 * On an empty frame: Add Keyframe / Add Empty Keyframe (+ Paste). Every action
 * is an undoable command. Batch-aware: with a multi-cell selection, "Add Empty
 * Keyframe" fills only the bare cells and "Clear Keyframe" converts only the
 * cells holding real keyframes — cells already holding an empty keyframe offer
 * neither.
 */
export const TimelineContextMenu = ({
  position,
  target,
  frame,
  onClose,
}: TimelineContextMenuProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const { store, config } = useAuthoringEnvironment()
  const editing = useTimelineEditing()
  const cellSelection = useAuthoringSelector(selectCellSelection)
  const selection = useAuthoringSelector(selectTimelineSelection)
  const layersMap = useAuthoringSelector((s) => s.layers.layers)
  const activeScope = useAuthoringSelector(selectActiveTimelineScope)
  const provider = config.frameRefProvider
  const [refAnchor, setRefAnchor] = useState<HTMLElement | null>(null)
  const [refCells, setRefCells] = useState<{ layerId: string; frame: number }[]>([])
  const [curveAnchor, setCurveAnchor] = useState<HTMLElement | null>(null)
  const [curveTarget, setCurveTarget] = useState<{
    layerId: string
    frame: number
  } | null>(null)
  const [applyCurveState, setApplyCurveState] = useState<{
    mode: ApplyCurveMode
    layerId: string
    startTick: number
    endTick: number
  } | null>(null)

  const run = (action: () => void) => () => {
    action()
    onClose()
  }

  /**
   * True when direct interaction on this layer creates spans, not keyframes —
   * per-row (mirrors `useFrameInteractions.ts`'s `isSpanLayer`), not the whole
   * timeline, so a mixed timeline (e.g. Sound Studio's note/arrangement span
   * rows alongside property-tween keyframe rows) shows the right menu per row.
   */
  const isSpanLayer = (layerId: string): boolean => {
    const layer = layersMap.get(layerId)
    const def = config.layerTypes.find((d) => d.layerType === String(layer?.layerType))
    return def?.defaultFrameKind === FrameKind.SPAN
  }

  /** Empty-keyframe creation/conversion (Add Empty Keyframe, Clear Keyframe) — see `MediaConfig.disableEmptyKeyframes`. */
  const emptyKeyframesEnabled = !config.disableEmptyKeyframes

  /** Add a keyframe: to every selected cell when a multi-cell selection is active, else here. */
  const addKeyframe = (layerId: string, frame: number) =>
    cellSelection.size > 1
      ? editing.addKeyframesToCells()
      : editing.addKeyframeAt(layerId, frame)

  /** The cells a cell-targeted action applies to: the cell selection, else the clicked frame. */
  const targetCells = (
    layerId: string,
    frame: number
  ): { layerId: string; frame: number }[] => {
    if (cellSelection.size > 0) {
      return [...cellSelection].map((cell) => {
        const sep = cell.lastIndexOf(':')
        return { layerId: cell.slice(0, sep), frame: Number(cell.slice(sep + 1)) }
      })
    }
    return [{ layerId, frame }]
  }

  /** The keyframe stored at a cell (if any). */
  const frameAtCell = (layerId: string, frame: number) =>
    layersMap.get(layerId)?.timeline.frames.find((f) => f.frame === frame)

  // Batch composition of the targeted cells (frame/segment targets): which
  // empty-keyframe options apply. Cells holding an empty keyframe match neither.
  const cells =
    target && target.kind !== 'keyframe' ? targetCells(target.layerId, target.frame) : []
  const hasBareCells = cells.some(({ layerId, frame }) => !frameAtCell(layerId, frame))
  const hasClearableCells = cells.some(({ layerId, frame }) =>
    isClearable(frameAtCell(layerId, frame))
  )

  // Keyframe target: whether the current keyframe selection holds anything clearable.
  const hasClearableSelected =
    target?.kind === 'keyframe' &&
    [...layersMap.values()].some((layer) =>
      layer.timeline.frames.some((f) => selection.has(f.id) && isClearable(f))
    )

  /** "Add Empty Keyframe" for the targeted cells — shown only when a bare cell exists. */
  const addEmptyItem = (layerId: string, frame: number) =>
    emptyKeyframesEnabled && hasBareCells ? (
      <MenuItem
        key="addempty"
        onSelect={run(() =>
          editing.addEmptyKeyframesToCells(targetCells(layerId, frame))
        )}
      >
        {cellSelection.size > 1
          ? 'Add Empty Keyframe to Selection'
          : 'Add Empty Keyframe'}
      </MenuItem>
    ) : null

  /** "Clear Keyframe" for the targeted cells — shown only when a real keyframe exists. */
  const clearCellsItem = (layerId: string, frame: number) =>
    emptyKeyframesEnabled && hasClearableCells ? (
      <MenuItem
        key="clearkf"
        onSelect={run(() => editing.clearKeyframesInCells(targetCells(layerId, frame)))}
      >
        Clear Keyframe
      </MenuItem>
    ) : null

  const openRefSubmenu =
    (layerId: string, frame: number) => (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      setRefCells(targetCells(layerId, frame))
      setRefAnchor(event.currentTarget)
    }

  /** The cascading "Add Pose Frame ›" item, shown when a frameRefProvider is configured. */
  const refFrameItem = (layerId: string, frame: number) =>
    provider ? (
      <MenuItem key="ref" onClick={openRefSubmenu(layerId, frame)}>
        {provider.label}
        <ArrowRightIcon size="1.25rem" />
      </MenuItem>
    ) : null

  const openCurveSubmenu =
    (layerId: string, frame: number) => (event: MouseEvent<HTMLElement>) => {
      event.stopPropagation()
      setCurveTarget({ layerId, frame })
      setCurveAnchor(event.currentTarget)
    }

  /** Resolve the targeted cells' tick range and open the Apply Curve dialog for `mode`. */
  const chooseCurveMode = (mode: ApplyCurveMode) => {
    if (!curveTarget) return
    const ticks = targetCells(curveTarget.layerId, curveTarget.frame).map((c) => c.frame)
    setApplyCurveState({
      mode,
      layerId: curveTarget.layerId,
      startTick: Math.min(...ticks),
      endTick: Math.max(...ticks),
    })
    setCurveAnchor(null)
    onClose()
  }

  /** The cascading "Apply Curve ›" item — Pulsing / Envelope Sweep only make sense as keyframe-track curves, never on a span row (gated by the caller, like `refFrameItem`). */
  const applyCurveItem = (layerId: string, frame: number) => (
    <MenuItem key="applycurve" onClick={openCurveSubmenu(layerId, frame)}>
      Apply Curve
      <ArrowRightIcon size="1.25rem" />
    </MenuItem>
  )

  return (
    <>
      <ContextMenu anchor={target === null ? null : position} onClose={onClose}>
        {target?.kind === 'frame' &&
          isSpanLayer(target.layerId) && [
            <MenuItem
              key="addspan"
              onSelect={run(() =>
                editing.addSpansToCells(targetCells(target.layerId, target.frame))
              )}
            >
              Add Span
            </MenuItem>,
            <MenuItem
              key="addspanfill"
              onSelect={run(() =>
                editing.addSpanFillFromCells(targetCells(target.layerId, target.frame))
              )}
            >
              Add Span Fill
            </MenuItem>,
            <MenuSeparator key="sfdiv" />,
            <MenuItem key="paste" onSelect={run(editing.paste)}>
              Paste
            </MenuItem>,
          ]}
        {target?.kind === 'frame' &&
          !isSpanLayer(target.layerId) && [
            <MenuItem
              key="add"
              onSelect={run(() => addKeyframe(target.layerId, target.frame))}
            >
              {cellSelection.size > 1 ? 'Add Keyframe to Selection' : 'Add Keyframe'}
            </MenuItem>,
            addEmptyItem(target.layerId, target.frame),
            clearCellsItem(target.layerId, target.frame),
            <MenuSeparator key="fdiv" />,
            <MenuItem key="insert" onSelect={run(editing.insertFrame)}>
              Insert Frame
            </MenuItem>,
            <MenuItem key="remove" onSelect={run(editing.removeFrame)}>
              Remove Frame
            </MenuItem>,
            <MenuItem
              key="marker"
              onSelect={run(() =>
                dispatch(
                  timelineActions.addMarker({ scope: activeScope, frame: target.frame })
                )
              )}
            >
              Add Marker
            </MenuItem>,
            refFrameItem(target.layerId, target.frame),
            applyCurveItem(target.layerId, target.frame),
            <MenuItem key="paste" onSelect={run(editing.paste)}>
              Paste
            </MenuItem>,
          ]}
        {target?.kind === 'segment' &&
          (target.tweenId
            ? [
                <MenuItem key="removetween" onSelect={run(editing.removeSelectedTween)}>
                  Remove Tween
                </MenuItem>,
                <MenuItem key="mergetween" onSelect={run(editing.mergeSelectedTween)}>
                  Merge with Next
                </MenuItem>,
                <MenuItem
                  key="reversetween"
                  onSelect={run(editing.reverseSelectedTweens)}
                >
                  Reverse Tween
                </MenuItem>,
                <MenuSeparator key="tdiv" />,
                <MenuItem
                  key="addkf"
                  onSelect={run(() => addKeyframe(target.layerId, target.frame))}
                >
                  Add Keyframe
                </MenuItem>,
                addEmptyItem(target.layerId, target.frame),
                refFrameItem(target.layerId, target.frame),
              ]
            : [
                target.endKeyframeId ? (
                  <MenuItem
                    key="createtween"
                    onSelect={run(() =>
                      dispatch(
                        layersActions.createTween({
                          layerId: target.layerId,
                          startKeyframeId: target.startKeyframeId,
                          endKeyframeId: target.endKeyframeId!,
                        })
                      )
                    )}
                  >
                    Create Tween
                  </MenuItem>
                ) : null,
                <MenuItem
                  key="addkf"
                  onSelect={run(() => addKeyframe(target.layerId, target.frame))}
                >
                  Add Keyframe
                </MenuItem>,
                addEmptyItem(target.layerId, target.frame),
                refFrameItem(target.layerId, target.frame),
                <MenuSeparator key="sdiv" />,
                <MenuItem key="delete" onSelect={run(editing.deleteSelected)}>
                  Delete Keyframes
                </MenuItem>,
              ])}
        {target?.kind === 'keyframe' &&
          isSpanLayer(target.layerId) && [
            <MenuItem key="copy" onSelect={run(editing.copy)}>
              Copy
            </MenuItem>,
            <MenuItem key="cut" onSelect={run(editing.cut)}>
              Cut
            </MenuItem>,
            <MenuItem key="paste" onSelect={run(editing.paste)}>
              Paste
            </MenuItem>,
            <MenuItem key="duplicate" onSelect={run(editing.duplicate)}>
              Duplicate
            </MenuItem>,
            <MenuSeparator key="div1" />,
            <MenuItem key="split" onSelect={run(editing.splitAtPlayhead)}>
              Split at Playhead
            </MenuItem>,
            <MenuItem key="join" onSelect={run(editing.joinSelected)}>
              Join
            </MenuItem>,
            // Only shown for a shell that opted into note-grid snapping (today
            // only Sound Studio — see `MediaConfig.snapSpanFrame`'s doc comment).
            // Applies whatever denomination its Select currently has chosen,
            // regardless of that control's toggle on/off state.
            config.snapSpanFrame ? (
              <MenuItem
                key="snapstart"
                onSelect={run(() =>
                  editing.transformSelectedSpans((span) => ({
                    ...span,
                    frame: config.snapSpanFrame!(span.frame),
                  }))
                )}
              >
                Align Start to Grid
              </MenuItem>
            ) : null,
            config.snapSpanDuration ? (
              <MenuItem
                key="snapduration"
                onSelect={run(() =>
                  editing.transformSelectedSpans((span) => ({
                    ...span,
                    duration: config.snapSpanDuration!(span.duration, span.frame),
                  }))
                )}
              >
                Snap Duration to Grid
              </MenuItem>
            ) : null,
            <MenuSeparator key="div2" />,
            <MenuItem key="delete" onSelect={run(editing.deleteSelected)}>
              Delete
            </MenuItem>,
          ]}
        {target?.kind === 'keyframe' &&
          !isSpanLayer(target.layerId) && [
            <MenuItem key="copy" onSelect={run(editing.copy)}>
              Copy
            </MenuItem>,
            <MenuItem key="cut" onSelect={run(editing.cut)}>
              Cut
            </MenuItem>,
            <MenuItem key="paste" onSelect={run(editing.paste)}>
              Paste
            </MenuItem>,
            <MenuItem key="duplicate" onSelect={run(editing.duplicate)}>
              Duplicate
            </MenuItem>,
            <MenuSeparator key="div1" />,
            <MenuItem key="createtween" onSelect={run(editing.createTweenFromSelection)}>
              Create Tween
            </MenuItem>,
            <MenuItem key="split" onSelect={run(editing.splitAtPlayhead)}>
              Split at Playhead
            </MenuItem>,
            <MenuItem key="join" onSelect={run(editing.joinSelected)}>
              Join
            </MenuItem>,
            <MenuSeparator key="div2" />,
            emptyKeyframesEnabled && hasClearableSelected ? (
              <MenuItem key="clearkf" onSelect={run(editing.clearSelectedKeyframes)}>
                Clear Keyframe
              </MenuItem>
            ) : null,
            <MenuItem key="delete" onSelect={run(editing.deleteSelected)}>
              Delete
            </MenuItem>,
          ]}
        {target &&
          config.timelineTools?.showTweenAll && [
            <MenuSeparator key="tweenalldiv" />,
            <MenuItem
              key="tweenall"
              onSelect={run(() => editing.createTweenAllAtTick(frame))}
            >
              Tween All
            </MenuItem>,
          ]}
      </ContextMenu>
      {provider && (
        <ContextMenu
          anchor={refAnchor}
          onClose={() => setRefAnchor(null)}
          placement="end"
        >
          {provider.names().map((name) => (
            <MenuItem
              key={name}
              onSelect={() => {
                provider.add(store, refCells, name)
                setRefAnchor(null)
                onClose()
              }}
            >
              {name}
            </MenuItem>
          ))}
        </ContextMenu>
      )}
      <ContextMenu
        anchor={curveAnchor}
        onClose={() => setCurveAnchor(null)}
        placement="end"
      >
        <MenuItem onSelect={() => chooseCurveMode('pulse')}>Pulsing</MenuItem>
        <MenuItem onSelect={() => chooseCurveMode('envelope')}>Envelope Sweep</MenuItem>
      </ContextMenu>
      <ApplyCurveDialog
        mode={applyCurveState?.mode ?? null}
        initialStartTick={applyCurveState?.startTick ?? 0}
        initialEndTick={applyCurveState?.endTick ?? 0}
        onClose={() => setApplyCurveState(null)}
        onApply={(result) => {
          if (applyCurveState) {
            editing.applyCurve(
              applyCurveState.layerId,
              applyCurveState.startTick,
              applyCurveState.endTick,
              result
            )
          }
        }}
      />
    </>
  )
}
