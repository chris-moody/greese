'use client'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../environment/environment.tsx'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { guidesActions, type AuthoringGuide } from '../../state/guides.slice.ts'
import {
  selectDraggingGuide,
  selectPendingGuide,
  selectVisibleGuides,
} from '../../state/selectors.ts'
import { GuidePropertiesDialog } from './GuidePropertiesDialog.tsx'

/** A guide's grab area across its line, in pixels. */
const HIT_WIDTH = 10

export interface GuidesOverlayProps {
  /** The stage origin's offset from the container's center, horizontally: the rulers' `offsetX`. */
  offsetX: number
  /** The stage origin's offset from the container's center, vertically: the rulers' `offsetY`. */
  offsetY: number
  /** The zoom, 1 for 100%. */
  scale: number
}

interface Tip {
  label: string
  x: number
  y: number
  visible: boolean
}

/**
 * The stage's guides, from the store: the current subview's and the global
 * ones (in their own color), and the dashed preview of one being dragged out
 * of a ruler. Drag a guide to move it, with its position shown as it goes;
 * double-click it for its properties. Each guide is also a slider for the
 * keyboard: the arrow keys along its axis move it (Shift for 10), Enter opens
 * its properties and Delete removes it.
 *
 * ```tsx
 * <GuidesOverlay offsetX={pan.x} offsetY={pan.y} scale={zoom} />
 * ```
 */
export const GuidesOverlay = ({
  offsetX,
  offsetY,
  scale,
}: GuidesOverlayProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const guides = useAuthoringSelector(selectVisibleGuides)
  const pending = useAuthoringSelector(selectPendingGuide)
  const dragging = useAuthoringSelector(selectDraggingGuide)
  const svgRef = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [tip, setTip] = useState<Tip | null>(null)
  const fade = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [editing, setEditing] = useState<AuthoringGuide | null>(null)
  // Pointer handlers read the latest viewport from here.
  const viewport = useRef({ offsetX, offsetY, scale })
  viewport.current = { offsetX, offsetY, scale }

  useEffect(() => {
    const el = svgRef.current?.parentElement
    if (!el) return
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    measure()
    return () => observer.disconnect()
  }, [])

  const toScreen = useCallback(
    (axis: 'h' | 'v', pos: number) => {
      const { offsetX: ox, offsetY: oy, scale: s } = viewport.current
      return axis === 'h' ? size.h / 2 + oy + pos * s : size.w / 2 + ox + pos * s
    },
    [size]
  )
  const toStage = useCallback(
    (axis: 'h' | 'v', screen: number) => {
      const { offsetX: ox, offsetY: oy, scale: s } = viewport.current
      return axis === 'h'
        ? (screen - size.h / 2 - oy) / s
        : (screen - size.w / 2 - ox) / s
    },
    [size]
  )

  const stopFade = () => {
    if (fade.current !== null) clearTimeout(fade.current)
    fade.current = null
  }
  const fadeTip = () => {
    stopFade()
    fade.current = setTimeout(
      () => setTip((t) => (t ? { ...t, visible: false } : null)),
      1000
    )
  }
  useEffect(() => stopFade, [])

  const startDrag = (guide: AuthoringGuide) => (event: PointerEvent<SVGLineElement>) => {
    event.stopPropagation()
    stopFade()
    const along = (e: globalThis.PointerEvent) => {
      const rect = svgRef.current!.getBoundingClientRect()
      return guide.axis === 'h' ? e.clientY - rect.top : e.clientX - rect.left
    }
    beginPointerDrag(event, {
      captureTarget: event.currentTarget,
      onMove: (e) => {
        if (!svgRef.current) return
        const screen = along(e)
        const pos = toStage(guide.axis, screen)
        dispatch(guidesActions.setDragging({ id: guide.id, pos }))
        const value = Math.round(pos)
        setTip({
          label: guide.name ? `${guide.name}: ${value}` : String(value),
          x: guide.axis === 'h' ? 8 : screen + 4,
          y: guide.axis === 'h' ? screen - 4 : 8,
          visible: true,
        })
      },
      onEnd: (e) => {
        if (e.type !== 'pointercancel' && svgRef.current)
          dispatch(
            guidesActions.moveGuide({ id: guide.id, pos: toStage(guide.axis, along(e)) })
          )
        dispatch(guidesActions.setDragging(null))
        fadeTip()
      },
    })
  }

  const onGuideKeyDown =
    (guide: AuthoringGuide) => (event: KeyboardEvent<SVGLineElement>) => {
      const [less, more] =
        guide.axis === 'h' ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']
      const step = event.shiftKey ? 10 : 1
      if (event.key === less || event.key === more) {
        dispatch(
          guidesActions.moveGuide({
            id: guide.id,
            pos: guide.pos + (event.key === more ? step : -step),
          })
        )
      } else if (event.key === 'Enter') {
        setEditing(guide)
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        dispatch(guidesActions.removeGuide(guide.id))
      } else return
      event.preventDefault()
      event.stopPropagation()
    }

  const ready = size.w > 0 || size.h > 0
  const line = (axis: 'h' | 'v', at: number) =>
    axis === 'h'
      ? { x1: 0, y1: at, x2: size.w, y2: at }
      : { x1: at, y1: 0, x2: at, y2: size.h }

  return (
    <>
      {/* eslint-disable-next-line no-restricted-syntax -- a drawing of the stage's guides, not an icon */}
      <svg ref={svgRef} className="greese-GuidesOverlay">
        {ready &&
          guides.map((guide) => {
            const pos = dragging?.id === guide.id ? dragging.pos : guide.pos
            const ends = line(guide.axis, toScreen(guide.axis, pos))
            const name = `${guide.name || 'Guide'}, ${guide.axis === 'h' ? 'horizontal' : 'vertical'}`
            return (
              <g key={guide.id} data-global={guide.isGlobal ? '' : undefined}>
                <line className="greese-GuidesOverlay-line" {...ends} />
                <line
                  className="greese-GuidesOverlay-hit"
                  {...ends}
                  strokeWidth={HIT_WIDTH}
                  data-axis={guide.axis}
                  role="slider"
                  tabIndex={0}
                  aria-label={name}
                  aria-orientation={guide.axis === 'h' ? 'vertical' : 'horizontal'}
                  aria-valuenow={Math.round(pos)}
                  onPointerDown={startDrag(guide)}
                  onKeyDown={onGuideKeyDown(guide)}
                  onDoubleClick={(event: MouseEvent) => {
                    event.stopPropagation()
                    setEditing(guide)
                  }}
                />
              </g>
            )
          })}
        {ready && pending && (
          <line
            className="greese-GuidesOverlay-line"
            data-pending=""
            {...line(pending.axis, toScreen(pending.axis, pending.pos))}
          />
        )}
        {tip && (
          <text
            className="greese-GuidesOverlay-tip"
            x={tip.x}
            y={tip.y}
            data-visible={tip.visible ? '' : undefined}
          >
            {tip.label}
          </text>
        )}
      </svg>
      <GuidePropertiesDialog
        guide={editing}
        onClose={() => setEditing(null)}
        onSave={(name, isGlobal, pos) => {
          if (!editing) return
          dispatch(guidesActions.renameGuide({ id: editing.id, name }))
          dispatch(guidesActions.setGuideGlobal({ id: editing.id, isGlobal }))
          dispatch(guidesActions.moveGuide({ id: editing.id, pos }))
        }}
        onDelete={() => editing && dispatch(guidesActions.removeGuide(editing.id))}
      />
    </>
  )
}
