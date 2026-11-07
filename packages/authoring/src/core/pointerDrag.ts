/** Pointer geometry passed to every drag callback. */
export interface PointerDragDelta {
  /** Travel since the press. */
  dx: number
  dy: number
  /** Where the press was, in client coordinates. */
  startX: number
  startY: number
  /** Where the pointer is now. */
  clientX: number
  clientY: number
}

export interface PointerDragOptions {
  /** Pixels of travel before the drag starts. @default 0 */
  threshold?: number
  /**
   * An element to capture the pointer on. Move and release listeners attach
   * to it (capture guarantees delivery); without one they attach to `window`.
   */
  captureTarget?: Element | null
  /** Turn off text selection on the page while dragging. */
  suppressUserSelect?: boolean
  /** Deliver moves once per animation frame: for callbacks that write layout or dispatch. */
  rafThrottle?: boolean
  /** Once, when the threshold is crossed (at once, with no threshold). */
  onStart?: (event: PointerEvent) => void
  /** On every move after the drag starts. */
  onMove: (event: PointerEvent, delta: PointerDragDelta) => void
  /**
   * On release or cancel, after the listeners are gone. `didDrag` is false when
   * the threshold was never crossed: a plain click.
   */
  onEnd?: (event: PointerEvent, delta: PointerDragDelta, didDrag: boolean) => void
}

/** What `beginPointerDrag` reads from the press. React's and the DOM's pointer events both have it. */
export interface PointerDownLike {
  pointerId: number
  clientX: number
  clientY: number
}

/**
 * Runs a press-and-drag from a `pointerdown`: dock drags, split resizes,
 * floating-panel moves, scrubbing, handles. It attaches the listeners, applies
 * the threshold, and always cleans up (listeners, pointer capture, text
 * selection) on release or cancel, so callers only say what a move and the
 * end do.
 *
 * ```ts
 * onPointerDown={(event) =>
 *   beginPointerDrag(event, {
 *     captureTarget: event.currentTarget,
 *     onMove: (_e, { dx }) => (pane.style.width = `${start + dx}px`),
 *   })
 * }
 * ```
 */
export const beginPointerDrag = (
  event: PointerDownLike,
  options: PointerDragOptions
): void => {
  const {
    threshold = 0,
    captureTarget,
    suppressUserSelect,
    rafThrottle,
    onStart,
    onMove,
    onEnd,
  } = options

  const { clientX: startX, clientY: startY } = event
  const target: Element | Window = captureTarget ?? window
  let active = threshold <= 0
  let frame: number | null = null
  let pending: PointerEvent | null = null

  if (captureTarget) captureTarget.setPointerCapture(event.pointerId)
  if (suppressUserSelect) document.body.style.userSelect = 'none'

  const deltaFor = (e: PointerEvent): PointerDragDelta => ({
    dx: e.clientX - startX,
    dy: e.clientY - startY,
    startX,
    startY,
    clientX: e.clientX,
    clientY: e.clientY,
  })

  const move = (e: Event) => {
    const pe = e as PointerEvent
    if (!active) {
      if (Math.hypot(pe.clientX - startX, pe.clientY - startY) < threshold) return
      active = true
      onStart?.(pe)
    }
    if (!rafThrottle) {
      onMove(pe, deltaFor(pe))
      return
    }
    pending = pe
    if (frame !== null) cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      frame = null
      pending = null
      onMove(pe, deltaFor(pe))
    })
  }

  const finish = (e: Event) => {
    const pe = e as PointerEvent
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', finish)
    target.removeEventListener('pointercancel', finish)
    if (frame !== null) cancelAnimationFrame(frame)
    frame = null
    // A release can come before the frame that would deliver the last move;
    // deliver it now, or the drag ends short of where the pointer let go.
    if (pending) onMove(pending, deltaFor(pending))
    pending = null
    if (captureTarget?.hasPointerCapture(event.pointerId)) {
      captureTarget.releasePointerCapture(event.pointerId)
    }
    if (suppressUserSelect) document.body.style.userSelect = ''
    onEnd?.(pe, deltaFor(pe), active)
  }

  if (active) onStart?.(event as unknown as PointerEvent)

  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', finish)
  target.addEventListener('pointercancel', finish)
}
