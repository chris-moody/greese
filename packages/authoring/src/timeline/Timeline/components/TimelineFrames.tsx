import {
  memo,
  useCallback,
  useState,
  type DragEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
  type JSX,
} from 'react'
import {
  useAuthoringDispatch,
  useAuthoringEnvironment,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { playbackActions } from '../../../state/playback.slice.ts'
import { timelineActions } from '../../../state/timeline.slice.ts'
import {
  selectCellSelection,
  selectFrameCount,
  selectSelectedTweens,
  selectTimelineSelection,
  selectVisibleLayers,
} from '../../../state/selectors.ts'
import { FrameKind, type SpanFrame } from '../../../core/types/frame.types.ts'
import type { AuthoringLayer } from '../../../core/types/layer.types.ts'
import { ROW_HEIGHT } from '../../../core/constants.ts'
import type {
  FrameInteractions,
  KeyframeDrag,
  SpanDraft,
  SpanResize,
} from '../useFrameInteractions.ts'
import { TimelineContextMenu, type ContextTarget } from './TimelineContextMenu.tsx'
import { SpanPlayingHighlight } from './SpanPlayingHighlight.tsx'

interface MenuState {
  position: { top: number; left: number }
  target: ContextTarget
  /** Tick under the right-clicked point — captured regardless of target kind so context-menu tools (e.g. "Tween All") always have one. */
  frame: number
}

interface TimelineFrameRowProps {
  layer: AuthoringLayer
  frameCount: number
  frameWidth: number
  disableCellSelection?: boolean
  cellSelection: ReadonlySet<string>
  selection: ReadonlySet<string>
  selectedTweens: ReadonlySet<string>
  spanDraft: SpanDraft | null
  resize: SpanResize | null
  drag: KeyframeDrag | null
  frameAt: (clientX: number) => number
  onRowPointerDown: FrameInteractions['onRowPointerDown']
  onRowDoubleClick: FrameInteractions['onRowDoubleClick']
  onKeyframePointerDown: FrameInteractions['onKeyframePointerDown']
  onSpanTrimStart: FrameInteractions['onSpanTrimStart']
  onOpenMenu: (menu: MenuState) => void
}

/**
 * One layer's row of keyframe diamonds/hold blocks/tween bars/span bars.
 * Split out of `TimelineFrames` and `memo`'d so an edit to *one* layer (e.g.
 * autokeying a single joint mid-drag) only re-renders that layer's own row —
 * every other row's props are referentially unchanged (Immer only replaces
 * the mutated layer's own reference, siblings keep theirs), so `memo` skips
 * them entirely instead of every row rebuilding on every edit anywhere in the
 * scene. This was previously the dominant cost behind Animation-mode IK/Rotate
 * drags feeling slow — see armaturePixiBackend.ts's autokey-perf notes.
 */
const TimelineFrameRow = memo(function TimelineFrameRow({
  layer,
  frameCount,
  frameWidth,
  disableCellSelection,
  cellSelection,
  selection,
  selectedTweens,
  spanDraft,
  resize,
  drag,
  frameAt,
  onRowPointerDown,
  onRowDoubleClick,
  onKeyframePointerDown,
  onSpanTrimStart,
  onOpenMenu,
}: TimelineFrameRowProps): JSX.Element {
  const dispatch = useAuthoringDispatch()
  const { config } = useAuthoringEnvironment()
  const renderSpanChart = config.layerTypes.find(
    (d) => d.layerType === layer.layerType
  )?.renderSpanChart

  const openFrameMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const frame = frameAt(event.clientX)
    onOpenMenu({
      position: { top: event.clientY, left: event.clientX },
      target: { kind: 'frame', layerId: layer.id, frame },
      frame,
    })
  }

  const openKeyframeMenu = (frameId: string) => (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    // Add the clicked keyframe to the selection (never clear it) so menu actions
    // can apply to a multi-selection.
    if (!selection.has(frameId)) dispatch(timelineActions.toggleTimelineItem(frameId))
    onOpenMenu({
      position: { top: event.clientY, left: event.clientX },
      target: { kind: 'keyframe', layerId: layer.id },
      frame: frameAt(event.clientX),
    })
  }

  const selectHold = (aId: string) => (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.button !== 0) return // let right-click open the menu without changing selection
    // Clicking the segment also moves the playhead to that frame.
    dispatch(playbackActions.setCurrentFrame(frameAt(event.clientX)))
    // Shift/Cmd add this empty segment's endpoints to the selection.
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    const next = additive ? new Set(selection) : new Set<string>()
    next.add(aId)
    //next.add(bId)
    dispatch(timelineActions.setTimelineSelection([...next]))
  }

  const selectTween = (tweenId: string) => (event: PointerEvent<HTMLDivElement>) => {
    event.stopPropagation()
    if (event.button !== 0) return // right-click keeps the current selection
    // Clicking the tween also moves the playhead to that frame.
    dispatch(playbackActions.setCurrentFrame(frameAt(event.clientX)))
    // Shift/Cmd add to the multi-selection; a plain click selects just this tween.
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      dispatch(timelineActions.toggleTween({ tweenId }))
    } else {
      dispatch(timelineActions.selectTween({ layerId: layer.id, tweenId }))
    }
  }

  const openSegmentMenu =
    (aId: string, bId: string | undefined, tweenId?: string) =>
    (event: MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      // Right-click never clears the selection — it ADDS the clicked segment so
      // Create/Reverse/Remove Tween applies across ALL selected segments. Never
      // remove an already-selected tween on right-click. `bId` is absent for the
      // trailing hold after a layer's last keyframe (no next keyframe to select).
      const segmentIds = bId ? [aId, bId] : [aId]
      if (tweenId) {
        if (!selectedTweens.has(tweenId))
          dispatch(
            timelineActions.setCombinedSelection({
              keyframes: [...selection],
              tweens: [...selectedTweens, tweenId],
            })
          )
      } else if (!segmentIds.every((id) => selection.has(id))) {
        dispatch(
          timelineActions.setCombinedSelection({
            keyframes: [...new Set([...selection, ...segmentIds])],
            tweens: [...selectedTweens],
          })
        )
      }
      const frame = frameAt(event.clientX)
      onOpenMenu({
        position: { top: event.clientY, left: event.clientX },
        target: {
          kind: 'segment',
          layerId: layer.id,
          frame,
          startKeyframeId: aId,
          endKeyframeId: bId,
          tweenId,
        },
        frame,
      })
    }

  return (
    <div
      className={'greese-TimelineFrames-frameRow'}
      style={{ width: frameCount * frameWidth }}
      onPointerDown={(event: PointerEvent<HTMLDivElement>) =>
        onRowPointerDown(event, layer.id)
      }
      onDoubleClick={(event: MouseEvent<HTMLDivElement>) =>
        onRowDoubleClick(event, layer.id)
      }
      onContextMenu={openFrameMenu}
    >
      {!disableCellSelection &&
        [...cellSelection]
          .filter((cell) => cell.startsWith(`${layer.id}:`))
          .map((cell) => {
            const cellFrame = Number(cell.slice(cell.lastIndexOf(':') + 1))
            return (
              <div
                className={'greese-TimelineFrames-cellHighlight'}
                key={cell}
                style={{ left: cellFrame * frameWidth, width: frameWidth }}
              />
            )
          })}
      {layer.timeline.frames
        .filter((f) => f.kind !== FrameKind.SPAN)
        .map((keyframe, index, keyframes) => {
          const next = keyframes[index + 1]
          if (!next) {
            // Trailing hold: shade from the last key to the end of the
            // timeline — full frames when the key is non-empty, bare
            // otherwise ("not shaded" reads as nothing there).
            if (keyframe.kind === FrameKind.EMPTY || keyframe.frame >= frameCount - 1)
              return null
            return (
              <div
                className={'greese-TimelineFrames-holdBlock'}
                key={`tail-${keyframe.id}`}
                data-selected={selection.has(keyframe.id) ? 'true' : undefined}
                style={{
                  left: keyframe.frame * frameWidth + frameWidth / 2,
                  width: (frameCount - 1 - keyframe.frame) * frameWidth + frameWidth / 2,
                }}
                onPointerDown={selectHold(keyframe.id)}
                onContextMenu={openSegmentMenu(keyframe.id, undefined)}
              />
            )
          }
          const style = {
            left: keyframe.frame * frameWidth + frameWidth / 2,
            width: (next.frame - keyframe.frame) * frameWidth,
          }
          const tween = layer.timeline.tweens.find(
            (t) =>
              t.enabled &&
              t.startKeyframeId === keyframe.id &&
              t.endKeyframeId === next.id
          )
          if (tween) {
            return (
              <div
                className={'greese-TimelineFrames-tweenBar'}
                key={`seg-${keyframe.id}`}
                data-selected={selectedTweens.has(tween.id) ? 'true' : undefined}
                style={style}
                onPointerDown={selectTween(tween.id)}
                onContextMenu={openSegmentMenu(keyframe.id, next.id, tween.id)}
              />
            )
          }
          return (
            <div
              className={'greese-TimelineFrames-holdBlock'}
              key={`seg-${keyframe.id}`}
              data-selected={selection.has(keyframe.id) ? 'true' : undefined}
              data-empty={keyframe.kind === FrameKind.EMPTY ? 'true' : undefined}
              style={style}
              onPointerDown={selectHold(keyframe.id)}
              onContextMenu={openSegmentMenu(keyframe.id, next.id)}
            />
          )
        })}
      {spanDraft?.layerId === layer.id && (
        <div
          className={'greese-TimelineFrames-spanBar'}
          data-selected="true"
          style={{
            left: spanDraft.frame * frameWidth,
            width: spanDraft.duration * frameWidth,
            opacity: 0.6,
            pointerEvents: 'none',
          }}
        />
      )}
      {layer.timeline.frames.map((frame) => {
        const selected = selection.has(frame.id)

        if (frame.kind === FrameKind.SPAN) {
          const previewing = resize?.spanId === frame.id
          const start = previewing
            ? resize.frame
            : selected && drag
              ? Math.max(0, frame.frame + drag.delta)
              : frame.frame
          const duration = previewing ? resize.duration : (frame.duration ?? 1)
          const RenderSpanChart = renderSpanChart
          return (
            <SpanPlayingHighlight
              key={frame.id}
              selected={selected}
              start={start}
              duration={duration}
              frameWidth={frameWidth}
              onPointerDown={(event: PointerEvent<HTMLDivElement>) =>
                onKeyframePointerDown(event, layer.id, frame.id, frame.frame)
              }
              onContextMenu={openKeyframeMenu(frame.id)}
              onTrimLeftPointerDown={(event: PointerEvent<HTMLDivElement>) =>
                onSpanTrimStart(
                  event,
                  layer.id,
                  frame.id,
                  'left',
                  frame.frame,
                  frame.duration ?? 1
                )
              }
              onTrimRightPointerDown={(event: PointerEvent<HTMLDivElement>) =>
                onSpanTrimStart(
                  event,
                  layer.id,
                  frame.id,
                  'right',
                  frame.frame,
                  frame.duration ?? 1
                )
              }
              chart={
                RenderSpanChart && (
                  <RenderSpanChart
                    layer={layer}
                    frame={frame as SpanFrame}
                    frameWidth={frameWidth}
                    height={ROW_HEIGHT * 0.9}
                  />
                )
              }
            />
          )
        }

        const shownFrame =
          selected && drag ? Math.max(0, frame.frame + drag.delta) : frame.frame
        return (
          <div
            className={'greese-TimelineFrames-keyframeDiamond'}
            key={frame.id}
            data-selected={selected ? 'true' : undefined}
            data-kind={String(frame.kind)}
            /*
             * An empty keyframe draws as a hollow diamond. The old styled
             * component worked this out from `$kind` inside its style
             * function; a stylesheet can't branch on another attribute's
             * value, so the flag is computed here.
             */
            data-empty={frame.kind === FrameKind.EMPTY ? 'true' : undefined}
            style={{ left: shownFrame * frameWidth + frameWidth / 2 }}
            onPointerDown={(event: PointerEvent<HTMLDivElement>) =>
              onKeyframePointerDown(event, layer.id, frame.id, frame.frame)
            }
            onContextMenu={openKeyframeMenu(frame.id)}
          />
        )
      })}
    </div>
  )
})
TimelineFrameRow.displayName = 'TimelineFrameRow'

/**
 * Per-layer keyframe rows aligned with the visible layer tree. Cell borders are
 * a CSS gradient (no per-cell DOM) so only sparse keyframe diamonds render.
 * Interactions (marquee select, keyframe select + drag-move preview, double-click
 * to add) come from {@link useFrameInteractions}; right-click opens a context menu
 * for the keyframe or the empty frame.
 *
 * Shading encodes content: regions governed by a non-empty keyframe (the key and
 * its hold/tween descendants) are shaded full frames — including the trailing
 * hold after the last key; regions governed by an *empty* keyframe (hollow
 * diamond) render unshaded, as does the run before a layer's first keyframe.
 *
 * Row rendering itself lives in {@link TimelineFrameRow} (memoized per layer) —
 * see its doc comment for why.
 */
export interface TimelineFramesProps {
  frameWidth: number
  /** Windowed grid-line x positions (px), from the resolution's snap tiers. */
  gridLineXs: number[]
  /** Hides cell-selection highlights — see `TimelineProps.disableCellSelection`. */
  disableCellSelection?: boolean
  bodyRef: RefObject<HTMLDivElement | null>
  interactions: FrameInteractions
  /**
   * Accepts an external HTML5 drag dropped anywhere on the frames area (e.g. a
   * library row dragged in from outside the timeline) — undefined by default,
   * so studios that don't opt in see no behavior change. Reads the dragged
   * id(s) from `dataTransfer` (`HierarchicalList`'s own drag-start already
   * sets `itemId`/`selectedItems` on every draggable row, so no source-side
   * wiring is needed) and resolves the drop x to a frame; which layer (if
   * any) each dragged id targets is left entirely to the caller.
   */
  onExternalDrop?: (draggedIds: string[], frame: number) => void
  /** Reports the timeline context menu's open/closed state — e.g. so `TimelineCursor` can freeze in place instead of hiding while it's up. */
  onMenuOpenChange?: (open: boolean) => void
}

export const TimelineFrames = memo(function TimelineFrames({
  frameWidth,
  gridLineXs,
  disableCellSelection,
  bodyRef,
  interactions,
  onExternalDrop,
  onMenuOpenChange,
}: TimelineFramesProps): JSX.Element | null {
  const frameCount = useAuthoringSelector(selectFrameCount)
  const layers = useAuthoringSelector(selectVisibleLayers)
  const selection = useAuthoringSelector(selectTimelineSelection)
  const selectedTweens = useAuthoringSelector(selectSelectedTweens)
  const cellSelection = useAuthoringSelector(selectCellSelection)
  const {
    marquee,
    drag,
    resize,
    spanDraft,
    onRowPointerDown,
    onRowDoubleClick,
    onKeyframePointerDown,
    onSpanTrimStart,
  } = interactions
  const [menu, setMenu] = useState<MenuState | null>(null)
  const openMenu = useCallback(
    (next: MenuState) => {
      setMenu(next)
      onMenuOpenChange?.(true)
    },
    [onMenuOpenChange]
  )
  const closeMenu = useCallback(() => {
    setMenu(null)
    onMenuOpenChange?.(false)
  }, [onMenuOpenChange])

  const width = frameCount * frameWidth

  const frameAt = useCallback(
    (clientX: number): number => {
      const rect = bodyRef.current?.getBoundingClientRect()
      if (!rect) return 0
      return Math.max(0, Math.floor((clientX - rect.left) / frameWidth))
    },
    [bodyRef, frameWidth]
  )

  const handleExternalDragOver = onExternalDrop
    ? (event: DragEvent<HTMLDivElement>) => event.preventDefault()
    : undefined

  const handleExternalDrop = onExternalDrop
    ? (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault()
        const selectedItemsData = event.dataTransfer.getData('selectedItems')
        const singleId = event.dataTransfer.getData('itemId')
        const ids: string[] = selectedItemsData
          ? JSON.parse(selectedItemsData)
          : singleId
            ? [singleId]
            : []
        if (ids.length === 0) return
        onExternalDrop(ids, frameAt(event.clientX))
      }
    : undefined

  return (
    <div
      className={'greese-TimelineFrames-body'}
      ref={bodyRef}
      style={{ width }}
      onDragOver={handleExternalDragOver}
      onDrop={handleExternalDrop}
    >
      {gridLineXs.map((x) => (
        <div className={'greese-TimelineFrames-gridLine'} key={x} style={{ left: x }} />
      ))}
      {layers.map((layer) => (
        <TimelineFrameRow
          key={layer.id}
          layer={layer}
          frameCount={frameCount}
          frameWidth={frameWidth}
          disableCellSelection={disableCellSelection}
          cellSelection={cellSelection}
          selection={selection}
          selectedTweens={selectedTweens}
          spanDraft={spanDraft}
          resize={resize}
          drag={drag}
          frameAt={frameAt}
          onRowPointerDown={onRowPointerDown}
          onRowDoubleClick={onRowDoubleClick}
          onKeyframePointerDown={onKeyframePointerDown}
          onSpanTrimStart={onSpanTrimStart}
          onOpenMenu={openMenu}
        />
      ))}
      {marquee && (
        <div
          className={'greese-TimelineFrames-marqueeRect'}
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      )}
      <TimelineContextMenu
        position={menu?.position ?? null}
        target={menu?.target ?? null}
        frame={menu?.frame ?? 0}
        onClose={closeMenu}
      />
    </div>
  )
})
