'use client'
import {
  memo,
  useCallback,
  useRef,
  type JSX,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import {
  PanelArea,
  type DropTarget,
  type FloatingPanelState,
  type ZoneLeaf,
} from '../../core/layoutTree.types.ts'
import { useAuthoringDispatch } from '../../environment/environment.tsx'
import { panelsActions } from '../../state/panels.slice.ts'
import { PanelGroup, type PanelMeta } from './PanelGroup.tsx'
import { markResizing } from './PanelStatusBar.tsx'
import type { PanelRegistrant } from './panel.types.ts'

const DEFAULT_WIDTH = 240
const DEFAULT_HEIGHT = 320
const MIN_WIDTH = 120
const MIN_HEIGHT = 60

export interface FloatingPanelsProps {
  panels: readonly PanelRegistrant[]
  floating: FloatingPanelState[]
  panelMeta: Map<string, PanelMeta>
  dragId: string | null
  dropTarget: DropTarget
  startDrag: (panelId: string) => (event: PointerEvent<HTMLElement>) => void
  renderBody: (panelId: string) => ReactNode
  isHeadlessPanel: (panelId: string) => boolean
  /** Panels placed in the workspace tree: a docked `FREE` panel no longer floats. */
  docked: ReadonlySet<string>
}

const noop = () => undefined

interface Float {
  id: string
  x: number
  y: number
  width: number
  height: number
  /** A `FREE` panel that hasn't been moved yet, so the store doesn't list it. */
  fresh: boolean
}

/**
 * The floating panels: those the store lists, and `FREE` panels not yet
 * moved (or docked), at their registered position. Moving and resizing write to the DOM
 * each frame and dispatch once on release, so the workspace never re-renders
 * mid-gesture. A fresh panel is added to the store on release, not on press:
 * a remount mid-drag would release the pointer capture.
 */
const FloatingPanelsView = ({
  panels,
  floating,
  panelMeta,
  dragId,
  dropTarget,
  startDrag,
  renderBody,
  isHeadlessPanel,
  docked,
}: FloatingPanelsProps): JSX.Element => {
  const dispatch = useAuthoringDispatch()
  const elements = useRef<Record<string, HTMLDivElement>>({})
  const register = useCallback(
    (panelId: string) => (el: HTMLDivElement | null) => {
      if (el) elements.current[panelId] = el
      else delete elements.current[panelId]
    },
    []
  )

  const startMove = (f: Float) => (event: PointerEvent<HTMLDivElement>) => {
    beginPointerDrag(event, {
      captureTarget: event.currentTarget,
      suppressUserSelect: true,
      onMove: (_e, { dx, dy }) => {
        const el = elements.current[f.id]
        if (!el) return
        el.style.left = `${f.x + dx}px`
        el.style.top = `${f.y + dy}px`
      },
      onEnd: (_e, { dx, dy }) => {
        const at = { panelId: f.id, x: Math.round(f.x + dx), y: Math.round(f.y + dy) }
        dispatch(
          f.fresh ? panelsActions.floatPanel(at) : panelsActions.setFloatPosition(at)
        )
      },
    })
  }

  const startResize = (f: Float) => (event: PointerEvent<HTMLDivElement>) => {
    const sizeAt = (dx: number, dy: number) => ({
      width: Math.max(MIN_WIDTH, f.width + dx),
      height: Math.max(MIN_HEIGHT, f.height + dy),
    })
    markResizing(elements.current[f.id], true)
    beginPointerDrag(event, {
      captureTarget: event.currentTarget,
      suppressUserSelect: true,
      onMove: (_e, { dx, dy }) => {
        const el = elements.current[f.id]
        if (!el) return
        const { width, height } = sizeAt(dx, dy)
        el.style.width = `${width}px`
        el.style.height = `${height}px`
      },
      onEnd: (_e, { dx, dy }) => {
        markResizing(elements.current[f.id], false)
        dispatch(panelsActions.setFloatSize({ panelId: f.id, ...sizeAt(dx, dy) }))
      },
    })
  }

  const floats: Float[] = [
    ...floating.map((fp) => ({
      id: fp.id,
      x: fp.x,
      y: fp.y,
      width: fp.width ?? DEFAULT_WIDTH,
      height: fp.height ?? DEFAULT_HEIGHT,
      fresh: false,
    })),
    ...panels
      .filter(
        (p) =>
          p.area === PanelArea.FREE &&
          !docked.has(p.id) &&
          !floating.some((f) => f.id === p.id)
      )
      .map((p) => ({
        id: p.id,
        x: p.x ?? 16,
        y: p.y ?? 16,
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
        fresh: true,
      })),
  ]

  return (
    <>
      {floats.map((f) => {
        const meta = panelMeta.get(f.id)
        if (!meta) return null
        const leaf: ZoneLeaf = {
          kind: 'leaf',
          id: f.id,
          tabs: [f.id],
          activeTab: f.id,
          collapsed: false,
          headless: isHeadlessPanel(f.id) || undefined,
        }
        return (
          <div
            key={f.id}
            ref={register(f.id)}
            className="greese-PanelDock-float"
            // Drag-driven geometry, rewritten on every move.
            style={{ left: f.x, top: f.y, width: f.width, height: f.height }}
          >
            <PanelGroup
              leaf={leaf}
              panelMeta={panelMeta}
              dragId={dragId}
              activeDropZone={
                dropTarget?.kind === 'leaf' && dropTarget.leafId === f.id
                  ? dropTarget.zone
                  : null
              }
              onSelectTab={noop}
              onToggleCollapsed={noop}
              startDrag={startDrag}
              // A headless bar runs the dock drag instead, or the panel could
              // never dock again; dropping on empty space still floats it.
              onGroupDrag={meta.headless ? undefined : startMove(f)}
              renderBody={renderBody}
            />
            <div
              className="greese-PanelDock-resize"
              aria-hidden="true"
              onPointerDown={startResize(f)}
            />
          </div>
        )
      })}
    </>
  )
}

export const FloatingPanels = memo(FloatingPanelsView)
