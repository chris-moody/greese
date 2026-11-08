'use client'
import { useCallback, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { resolveDropZone } from '../../core/layoutTree.queries.ts'
import { DropZone, type DropTarget } from '../../core/layoutTree.types.ts'
import { beginPointerDrag } from '../../core/pointerDrag.ts'

/** Pointer travel before pressing a tab becomes a drag, so a click still selects it. */
const DRAG_THRESHOLD = 4

/** How close to the workspace's outer edge docks a panel along it, in pixels. */
const EDGE_BAND = 32

/** A tab's hit-test data: its panel, and where it is. */
interface TabHit {
  panelId: string
  rect: DOMRect
}

/** A leaf's hit-test data, measured once when a drag starts. */
interface LeafHit {
  leafId: string
  solePanelId: string | undefined
  /** Takes edge drops only: a headless group, or the stage or timeline. */
  edgesOnly: boolean
  /** A floating group: over the workspace, and outside its tree. */
  floating: boolean
  rect: DOMRect
  /** Its tab row, where a drop lands among the tabs; none for a headless group or a reserved leaf. */
  header: DOMRect | null
  tabs: TabHit[]
}

interface Hits {
  container: DOMRect
  leaves: LeafHit[]
  /** Tabs run right to left: a tab's leading half is its right one. */
  rtl: boolean
}

export interface DockDrag {
  dragId: string | null
  dropTarget: DropTarget
  startDrag: (panelId: string) => (event: PointerEvent<HTMLElement>) => void
  /** A ref for the drag ghost, which the hook moves with direct style writes. */
  registerGhost: (el: HTMLDivElement | null) => void
}

/** The edge zone nearest the pointer: where a headless panel or group lands instead of the center. */
const nearestEdgeZone = (rect: DOMRect, x: number, y: number): DropZone => {
  const relX = (x - rect.left) / rect.width
  const relY = (y - rect.top) / rect.height
  const distances: [DropZone, number][] = [
    [DropZone.Top, relY],
    [DropZone.Bottom, 1 - relY],
    [DropZone.LeftSplit, relX],
    [DropZone.RightSplit, 1 - relX],
  ]
  return distances.sort((a, b) => a[1] - b[1])[0]![0]
}

const sameTarget = (a: DropTarget, b: DropTarget): boolean =>
  a === b ||
  (a?.kind === 'tab' &&
    b?.kind === 'tab' &&
    a.leafId === b.leafId &&
    a.index === b.index) ||
  (a?.kind === 'leaf' &&
    b?.kind === 'leaf' &&
    a.leafId === b.leafId &&
    a.zone === b.zone) ||
  (a?.kind === 'container-edge' && b?.kind === 'container-edge' && a.edge === b.edge)

/**
 * Drag-to-dock. A drop on a tab row places the panel among its tabs (in
 * front of a tab, or after it from its right half); in the middle of its own
 * group's body, or on its lone group, it floats. Leaf rects (`[data-leaf-id]`) and the workspace's rect are
 * measured once when a drag starts, since the layout can't change mid-drag, so
 * each move is arithmetic with no DOM reads. On release, `commit` gets the
 * target: a leaf's zone, a workspace edge, or `null` (outside everything) to
 * float the panel.
 */
export const useDockDrag = (
  commit: (panelId: string, target: DropTarget, at: { x: number; y: number }) => void,
  containerRef: RefObject<HTMLDivElement | null>,
  isHeadlessPanel: (panelId: string) => boolean
): DockDrag => {
  const [dragId, setDragId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<DropTarget>(null)
  // The release handler reads the latest target from here, not a stale render.
  const targetRef = useRef<DropTarget>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const ghostAt = useRef<{ x: number; y: number } | null>(null)

  const placeGhost = () => {
    const el = ghostRef.current
    const at = ghostAt.current
    if (el && at) {
      el.style.left = `${at.x}px`
      el.style.top = `${at.y}px`
    }
  }

  const registerGhost = useCallback((el: HTMLDivElement | null) => {
    ghostRef.current = el
    placeGhost()
  }, [])

  const setTarget = (next: DropTarget) => {
    if (sameTarget(targetRef.current, next)) return
    targetRef.current = next
    setDropTarget(next)
  }

  const measure = useCallback((): Hits | null => {
    const container = containerRef.current
    if (!container) return null
    const leaves = [...container.querySelectorAll<HTMLElement>('[data-leaf-id]')].map(
      (el): LeafHit => {
        const header = el.querySelector<HTMLElement>(':scope > .greese-PanelGroup-header')
        return {
          leafId: el.dataset.leafId!,
          solePanelId: el.dataset.solePanelId,
          edgesOnly:
            el.dataset.headless !== undefined || el.dataset.reservedId !== undefined,
          floating: !!el.closest('.greese-PanelDock-float'),
          rect: el.getBoundingClientRect(),
          header: header?.getBoundingClientRect() ?? null,
          tabs: [...(header?.querySelectorAll<HTMLElement>('[data-panel-id]') ?? [])].map(
            (tab) => ({
              panelId: tab.dataset.panelId!,
              rect: tab.getBoundingClientRect(),
            })
          ),
        }
      }
    )
    return {
      container: container.getBoundingClientRect(),
      leaves,
      rtl: getComputedStyle(container).direction === 'rtl',
    }
  }, [containerRef])

  const resolveTarget = useCallback(
    (dragging: string, hits: Hits, x: number, y: number): DropTarget => {
      const headlessDrag = isHeadlessPanel(dragging)
      const inside = (rect: DOMRect) =>
        x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      // A tab row first, even at the workspace's wall: a place among its
      // tabs. On a tab's leading half, in front of it; on its trailing half,
      // after it; past the last, at the end.
      if (!headlessDrag)
        for (const leaf of hits.leaves) {
          if (!leaf.header || leaf.floating || !inside(leaf.header)) continue
          if (leaf.solePanelId === dragging) break
          const others = leaf.tabs.filter((t) => t.panelId !== dragging)
          const before = others.findIndex((t) =>
            hits.rtl
              ? x > t.rect.left + t.rect.width / 2
              : x < t.rect.left + t.rect.width / 2
          )
          return {
            kind: 'tab',
            leafId: leaf.leafId,
            index: before === -1 ? others.length : before,
          }
        }
      // Then the workspace's edges, so a drop near the outer wall docks along
      // it rather than splitting the leaf there. The side bands reach outside
      // the workspace too, so dragging into an app's sidebar still docks left.
      const r = hits.container
      if (x >= r.left && x <= r.right) {
        if (y >= r.top - EDGE_BAND && y < r.top + EDGE_BAND)
          return { kind: 'container-edge', edge: 'top' }
        if (y > r.bottom - EDGE_BAND && y <= r.bottom + EDGE_BAND)
          return { kind: 'container-edge', edge: 'bottom' }
      }
      if (y >= r.top && y <= r.bottom) {
        if (x >= r.left - EDGE_BAND && x < r.left + EDGE_BAND)
          return { kind: 'container-edge', edge: 'left' }
        if (x > r.right - EDGE_BAND && x <= r.right + EDGE_BAND)
          return { kind: 'container-edge', edge: 'right' }
      }
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) return null

      for (const leaf of hits.leaves) {
        const { rect } = leaf
        // A floating group takes no drops (it's outside the tree): the
        // workspace under it does.
        if (!inside(rect) || leaf.floating) continue
        // A lone panel's own group would change nothing: what's under it counts.
        if (leaf.solePanelId === dragging) continue
        const own = leaf.tabs.some((t) => t.panelId === dragging)
        // Dropped in the middle of its own group's body, a tab tears off and floats.
        let zone = resolveDropZone(rect, x, y)
        if (own && zone === DropZone.Center) return null
        if (zone === DropZone.Center && (leaf.edgesOnly || headlessDrag)) {
          zone = nearestEdgeZone(rect, x, y)
        }
        return { kind: 'leaf', leafId: leaf.leafId, zone }
      }
      return null
    },
    [isHeadlessPanel]
  )

  const startDrag = useCallback(
    (panelId: string) => (event: PointerEvent<HTMLElement>) => {
      // Tabs are buttons too, and they are the drag handles; other buttons
      // (collapse) are not.
      if ((event.target as HTMLElement).closest('button:not([role="tab"])')) return
      if (event.button !== 0) return
      // A floating group's tab row also starts a float move; only one runs.
      event.stopPropagation()

      let hits: Hits | null = null
      beginPointerDrag(event, {
        threshold: DRAG_THRESHOLD,
        suppressUserSelect: true,
        onStart: () => {
          hits = measure()
          setDragId(panelId)
        },
        onMove: (e) => {
          ghostAt.current = { x: e.clientX, y: e.clientY }
          placeGhost()
          if (hits) setTarget(resolveTarget(panelId, hits, e.clientX, e.clientY))
        },
        onEnd: (e, _delta, didDrag) => {
          if (didDrag) commit(panelId, targetRef.current, { x: e.clientX, y: e.clientY })
          ghostAt.current = null
          setDragId(null)
          setTarget(null)
        },
      })
    },
    [commit, measure, resolveTarget]
  )

  return { dragId, dropTarget, startDrag, registerGhost }
}
