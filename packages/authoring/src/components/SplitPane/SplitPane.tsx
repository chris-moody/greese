'use client'
import {
  useRef,
  useState,
  type JSX,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { cx } from '@greese/react'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { markResizing } from '../PanelDock/PanelStatusBar.tsx'

/** How far one arrow key moves the divider, in pixels (four times that with Shift). */
const KEY_STEP = 16

export interface SplitPaneProps {
  /** `row` puts the panes side by side; `col` stacks them. */
  orientation: 'row' | 'col'
  /** The primary pane's starting size along the axis, in pixels. */
  initialPrimarySize: number
  minPrimarySize?: number
  minSecondarySize?: number
  /** Puts the primary pane at the end (right or bottom), so it keeps a fixed size there. */
  reversed?: boolean
  /** Overrides the primary's size while set, without losing the dragged size: a collapsed group. */
  controlledPrimarySize?: number
  /** Shrinks the secondary to its content and lets the primary fill: a collapsed group. */
  secondaryCollapsed?: boolean
  /** Called once with the primary's size when a drag or a key press resizes it. */
  onResizeEnd?: (primarySize: number) => void
  primary: ReactNode
  secondary: ReactNode
}

/**
 * Two panes and a divider between them, the dock's split. Dragging writes the
 * primary's size straight to the DOM each frame and commits it once on
 * release, so nothing re-renders mid-drag. The divider is a focusable
 * window splitter (WAI-ARIA APG): the arrow keys along its axis resize it.
 * Internal to the package: the dock renders it for each split.
 */
export const SplitPane = ({
  orientation,
  initialPrimarySize,
  minPrimarySize = 80,
  minSecondarySize = 80,
  reversed = false,
  controlledPrimarySize,
  secondaryCollapsed = false,
  onResizeEnd,
  primary,
  secondary,
}: SplitPaneProps): JSX.Element => {
  const rootRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)
  const keyTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [size, setSize] = useState(initialPrimarySize)
  const vertical = orientation === 'col'
  const shown = controlledPrimarySize ?? size

  /** Clamps a primary size to what leaves both panes their minimums. */
  const clamp = (next: number): number => {
    const rect = rootRef.current?.getBoundingClientRect()
    // Unmeasured (hidden, or not laid out yet): no upper bound to keep.
    const total = (rect && (vertical ? rect.height : rect.width)) || Infinity
    return Math.max(minPrimarySize, Math.min(next, total - minSecondarySize))
  }

  const write = (next: number) => {
    const pane = paneRef.current
    if (pane) pane.style[vertical ? 'height' : 'width'] = `${next}px`
  }

  const commit = (next: number) => {
    setSize(next)
    onResizeEnd?.(next)
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    let latest = 0
    // The panels on both sides show their size while it changes.
    markResizing(rootRef.current, true)
    beginPointerDrag(event, {
      captureTarget: event.currentTarget,
      suppressUserSelect: true,
      rafThrottle: true,
      onMove: (e) => {
        const rect = rootRef.current?.getBoundingClientRect()
        if (!rect) return
        const total = vertical ? rect.height : rect.width
        const offset = vertical ? e.clientY - rect.top : e.clientX - rect.left
        // A reversed primary sits at the far end, so its size is measured from there.
        latest = clamp(reversed ? total - offset : offset)
        write(latest)
      },
      onEnd: () => {
        markResizing(rootRef.current, false)
        if (latest > 0) commit(latest)
      },
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const [less, more] = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']
    if (event.key !== less && event.key !== more) return
    event.preventDefault()
    // Arrows move the divider; a reversed primary grows as it moves toward the start.
    const toward = event.key === more ? 1 : -1
    const step = (event.shiftKey ? 4 : 1) * KEY_STEP * (reversed ? -toward : toward)
    const next = clamp(shown + step)
    // A run of presses is one resize, which ends a moment after the last.
    markResizing(rootRef.current, true)
    clearTimeout(keyTimer.current)
    keyTimer.current = setTimeout(() => markResizing(rootRef.current, false), 300)
    write(next)
    commit(next)
  }

  const axis = vertical ? 'height' : 'width'

  return (
    <div
      ref={rootRef}
      className={cx(
        'greese-SplitPane',
        `greese-SplitPane--${orientation}`,
        reversed && 'greese-SplitPane--reversed'
      )}
    >
      <div
        ref={paneRef}
        className="greese-SplitPane-primary"
        data-fill={secondaryCollapsed ? '' : undefined}
        style={secondaryCollapsed ? undefined : { [axis]: shown }}
      >
        {primary}
      </div>
      <div
        className="greese-SplitPane-divider"
        role="separator"
        aria-orientation={vertical ? 'horizontal' : 'vertical'}
        aria-label="Resize panes"
        aria-valuenow={Math.round(shown)}
        aria-valuemin={minPrimarySize}
        aria-valuetext={`${Math.round(shown)} pixels`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      />
      <div
        className="greese-SplitPane-secondary"
        data-shrink={secondaryCollapsed ? '' : undefined}
      >
        {secondary}
      </div>
    </div>
  )
}
