'use client'
import { useCallback, useId, useRef, type CSSProperties, type RefCallback } from 'react'

/** Where a floating element sits relative to its trigger. Logical: `start`/`end` follow the writing direction. */
export type Placement =
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'start'
  | 'end'

/** Placement → CSS `position-area`. `span-inline-end` aligns the start edges. */
export const positionArea: Record<Placement, string> = {
  bottom: 'block-end',
  'bottom-start': 'block-end span-inline-end',
  'bottom-end': 'block-end span-inline-start',
  top: 'block-start',
  'top-start': 'block-start span-inline-end',
  'top-end': 'block-start span-inline-start',
  start: 'inline-start',
  end: 'inline-end',
}

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/**
 * Fallback for browsers without CSS anchor positioning: where to put a fixed
 * element next to its anchor. Mirrors `position-try-fallbacks: flip-block,
 * flip-inline` (flip to the other side when it would overflow) and keeps the
 * element inside the viewport. Pure, so it is unit-tested directly.
 */
export const computeFallbackPosition = (
  anchor: Rect,
  floating: { width: number; height: number },
  viewport: { width: number; height: number },
  placement: Placement,
  gap: number,
  rtl = false
): { top: number; left: number } => {
  const clamp = (value: number, size: number, max: number) =>
    Math.max(gap, Math.min(value, max - size - gap))

  // Logical start/end in physical terms.
  const side = placement.split('-')[0] as 'bottom' | 'top' | 'start' | 'end'
  const align = placement.split('-')[1] as 'start' | 'end' | undefined

  if (side === 'start' || side === 'end') {
    const toRight = (side === 'end') !== rtl
    let left = toRight
      ? anchor.left + anchor.width + gap
      : anchor.left - floating.width - gap
    if (toRight && left + floating.width > viewport.width - gap)
      left = anchor.left - floating.width - gap
    if (!toRight && left < gap) left = anchor.left + anchor.width + gap
    const top = anchor.top + anchor.height / 2 - floating.height / 2
    return {
      top: clamp(top, floating.height, viewport.height),
      left: clamp(left, floating.width, viewport.width),
    }
  }

  const below = anchor.top + anchor.height + gap
  const above = anchor.top - floating.height - gap
  let top = side === 'bottom' ? below : above
  if (side === 'bottom' && below + floating.height > viewport.height && above >= gap)
    top = above
  if (side === 'top' && above < gap && below + floating.height <= viewport.height)
    top = below

  const startEdge = rtl ? anchor.left + anchor.width - floating.width : anchor.left
  const endEdge = rtl ? anchor.left : anchor.left + anchor.width - floating.width
  const left =
    align === 'start'
      ? startEdge
      : align === 'end'
        ? endEdge
        : anchor.left + anchor.width / 2 - floating.width / 2

  return {
    top: clamp(top, floating.height, viewport.height),
    left: clamp(left, floating.width, viewport.width),
  }
}

const supportsAnchor = (): boolean =>
  typeof CSS !== 'undefined' && CSS.supports('position-area', 'block-end')

export interface AnchoredPopover {
  /** Spread on the trigger's `style`: names it as the anchor. */
  anchorStyle: CSSProperties
  /** Spread on the floating element's `style`. */
  floatingStyle: CSSProperties
  /** Attach to the floating element (a `popover`). */
  floatingRef: RefCallback<HTMLElement>
  /** Attach to the trigger (needed by the fallback only). */
  triggerRef: RefCallback<HTMLElement>
}

/**
 * Anchors a popover to its trigger with CSS anchor positioning, falling back
 * to fixed coordinates (recomputed on scroll and resize while open) where the
 * browser lacks it.
 */
export const useAnchoredPopover = (placement: Placement, gap = 6): AnchoredPopover => {
  const id = useId().replace(/[^\w-]/g, '')
  const name = `--greese-anchor-${id}`
  const trigger = useRef<HTMLElement | null>(null)

  const floatingRef = useCallback<RefCallback<HTMLElement>>(
    (floating) => {
      if (!floating || supportsAnchor()) return
      let frame = 0
      const place = () => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          if (!trigger.current || !floating.matches(':popover-open')) return
          const { top, left } = computeFallbackPosition(
            trigger.current.getBoundingClientRect(),
            floating.getBoundingClientRect(),
            { width: innerWidth, height: innerHeight },
            placement,
            gap,
            getComputedStyle(trigger.current).direction === 'rtl'
          )
          floating.style.inset = 'auto'
          floating.style.margin = '0'
          floating.style.top = `${top}px`
          floating.style.left = `${left}px`
        })
      }
      const onToggle = (event: Event) => {
        if ((event as ToggleEvent).newState === 'open') {
          place()
          addEventListener('scroll', place, true)
          addEventListener('resize', place)
        } else {
          removeEventListener('scroll', place, true)
          removeEventListener('resize', place)
        }
      }
      floating.addEventListener('toggle', onToggle)
      return () => {
        floating.removeEventListener('toggle', onToggle)
        removeEventListener('scroll', place, true)
        removeEventListener('resize', place)
        cancelAnimationFrame(frame)
      }
    },
    [placement, gap]
  )

  const triggerRef = useCallback<RefCallback<HTMLElement>>((node) => {
    trigger.current = node
  }, [])

  // The gap goes only on the axis facing the trigger, so start/end-aligned
  // placements stay flush with the trigger's edge.
  const beside = placement === 'start' || placement === 'end'
  return {
    anchorStyle: { anchorName: name } as CSSProperties,
    floatingStyle: {
      positionAnchor: name,
      positionArea: positionArea[placement],
      margin: beside ? `0 ${gap}px` : `${gap}px 0`,
    } as CSSProperties,
    floatingRef,
    triggerRef,
  }
}
