import { useEffect, useMemo, useRef, type PointerEvent, type JSX } from 'react'
import { ownsDeleteKey } from '../../core/keyboard.ts'
import { useAuthoringSelector } from '../../environment/environment.tsx'
import { selectLevelPointSelection } from '../../state/selectors.ts'
import { pointX, pointY, type LevelEditorScale } from '../../core/timeline/levelEditor.ts'
import { useLevelEditorInteractions } from './useLevelEditorInteractions.ts'
import { useLevelEditorEditing } from './useLevelEditorEditing.ts'
import type { LevelPoint } from '../../core/timeline/levelEditor.types.ts'

/** Horizontal value grid divisions (lines rendered at each boundary, min → max). */
const GRID_DIVISIONS = 4

const isTypingTarget = (target: EventTarget | null): boolean => {
  const el = target as HTMLElement | null
  return (
    !!el &&
    (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable === true)
  )
}

export interface TimelineLevelEditorProps {
  points: LevelPoint[]
  min: number
  max: number
  /** Pixel width of the graph area — the full timeline content width. */
  width: number
  /** Pixel height of the graph — the scroll VIEWPORT height (values normalize to it). */
  height: number
  pixelsPerTick: number
  /** Current horizontal scroll offset — the floating y-axis pins to this edge. */
  scrollLeft?: number
  /** Vertical inset (px) at the top/bottom of the graph — see `LevelEditorScale.paddingY`. */
  paddingY?: number
  onPointsChange: (points: LevelPoint[]) => void
}

/**
 * Overlay over the frames area: a semi-transparent backdrop, horizontal value
 * grid lines with a floating y-axis (pinned to the visible left edge), an SVG
 * polyline through `points` (held flat past the last point to the end of the
 * timeline), and draggable point circles — data-source agnostic like
 * `BezierEditor`. Point/drag/marquee interactions come from
 * `useLevelEditorInteractions`; Delete/Backspace removes the selected points.
 */
export const TimelineLevelEditor = ({
  points,
  min,
  max,
  width,
  height,
  pixelsPerTick,
  scrollLeft = 0,
  paddingY = 0,
  onPointsChange,
}: TimelineLevelEditorProps): JSX.Element => {
  const containerRef = useRef<HTMLDivElement>(null)
  const selection = useAuthoringSelector(selectLevelPointSelection)
  const scale: LevelEditorScale = useMemo(
    () => ({ pixelsPerTick, min, max, height, paddingY }),
    [pixelsPerTick, min, max, height, paddingY]
  )
  const {
    marquee,
    dragPreview,
    onBackdropPointerDown,
    onPointPointerDown,
    onLinePointerDown,
  } = useLevelEditorInteractions(points, onPointsChange, scale, containerRef)
  const editing = useLevelEditorEditing(points, onPointsChange)

  // Delete/Backspace removes the selected points. Bound only while the editor
  // is mounted (its tool is active), so it never fights the frame/marker keymap.
  const editingRef = useRef(editing)
  editingRef.current = editing
  const hasSelection = selection.size > 0
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return
      if (isTypingTarget(event.target) || ownsDeleteKey(event.target) || !hasSelection)
        return
      event.preventDefault()
      editingRef.current.deleteSelectedPoints()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hasSelection])

  const shown = dragPreview ?? points
  const sorted = useMemo(() => [...shown].sort((a, b) => a.tick - b.tick), [shown])
  const last = sorted[sorted.length - 1]
  // Hold the final value flat to the end of the timeline — the curve continues
  // at the previous level past the last point.
  const polylinePoints = [
    ...sorted.map((p) => `${pointX(p, scale)},${pointY(p, scale)}`),
    ...(last ? [`${width},${pointY(last, scale)}`] : []),
  ].join(' ')

  const gridValues = Array.from({ length: GRID_DIVISIONS + 1 }, (_, i) => {
    const value = min + ((max - min) * i) / GRID_DIVISIONS
    return { value, y: pointY({ id: '', tick: 0, value }, scale) }
  })

  return (
    <div
      className={'greese-TimelineLevelEditor-backdrop'}
      ref={containerRef}
      style={{ width, height }}
      onPointerDown={onBackdropPointerDown}
    >
      {gridValues.map(({ value, y }) => (
        <div
          className={'greese-TimelineLevelEditor-gridLine'}
          key={value}
          style={{ top: y }}
        />
      ))}
      {/* eslint-disable-next-line no-restricted-syntax -- the level curve’s plot, not an icon */}
      <svg className={'greese-TimelineLevelEditor-svg'} width={width} height={height}>
        {sorted.length > 0 && (
          <polyline
            className={'greese-TimelineLevelEditor-line'}
            points={polylinePoints}
            onPointerDown={(event: PointerEvent<SVGPolylineElement>) => {
              event.stopPropagation()
              onLinePointerDown(event)
            }}
          />
        )}
        {sorted.map((p) => (
          <circle
            className={'greese-TimelineLevelEditor-point'}
            key={p.id}
            data-selected={selection.has(p.id) ? 'true' : undefined}
            cx={pointX(p, scale)}
            cy={pointY(p, scale)}
            r={5}
            onPointerDown={(event: PointerEvent<SVGCircleElement>) =>
              onPointPointerDown(event, p.id)
            }
          />
        ))}
      </svg>
      <div className={'greese-TimelineLevelEditor-axis'} style={{ left: scrollLeft }}>
        {gridValues.map(({ value, y }) => (
          <div
            className={'greese-TimelineLevelEditor-axisLabel'}
            key={value}
            style={{ top: y }}
          >
            {Math.round(value)}
          </div>
        ))}
      </div>
      {marquee && (
        <div
          className={'greese-TimelineLevelEditor-marqueeRect'}
          style={{
            left: marquee.left,
            top: marquee.top,
            width: marquee.width,
            height: marquee.height,
          }}
        />
      )}
    </div>
  )
}
