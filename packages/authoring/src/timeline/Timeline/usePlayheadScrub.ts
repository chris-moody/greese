'use client'
import { useCallback, type PointerEvent, type RefObject } from 'react'
import { useAuthoringEnvironment } from '../../environment/environment.tsx'
import { beginPointerDrag } from '../../core/pointerDrag.ts'
import { playbackActions } from '../../state/playback.slice.ts'
import { selectFrameCount } from '../../state/selectors.ts'
import { LABEL_WIDTH } from '../../core/constants.ts'

const EDGE = 40 // px from a viewport edge that triggers auto-scroll
const SCROLL_STEP = 14 // px scrolled per tick while at an edge

export interface ScrubConfig {
  frameWidth: number
  /** The frames column, used to map pointer x → frame. */
  containerRef: RefObject<HTMLDivElement | null>
  /** The scroll viewport, used for edge auto-scroll. */
  scrollRef: RefObject<HTMLDivElement | null>
}

/**
 * Returns a pointer-down handler that scrubs the playhead: it moves the playhead
 * to the pointer and, while held, follows it via a rAF loop — auto-scrolling the
 * frame area when the pointer nears the left/right edge. Shared by the ruler
 * (click anywhere to jump + drag) and the playhead tab.
 */
export const usePlayheadScrub = ({
  frameWidth,
  containerRef,
  scrollRef,
}: ScrubConfig) => {
  const { store } = useAuthoringEnvironment()
  const dispatch = store.dispatch

  return useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const count = selectFrameCount(store.getState())
      let clientX = event.clientX
      let raf = 0

      const applyFrame = () => {
        const container = containerRef.current
        if (!container) return
        const rect = container.getBoundingClientRect()
        const frame = Math.max(
          0,
          Math.min(count - 1, Math.floor((clientX - rect.left) / frameWidth))
        )
        dispatch(playbackActions.setCurrentFrame(frame))
      }

      // The rAF loop (not pointermove) drives updates so edge auto-scroll keeps
      // advancing the playhead while the pointer is held still at an edge.
      const loop = () => {
        const scroll = scrollRef.current
        if (scroll) {
          const view = scroll.getBoundingClientRect()
          if (clientX > view.right - EDGE) scroll.scrollLeft += SCROLL_STEP
          else if (clientX < view.left + LABEL_WIDTH + EDGE)
            scroll.scrollLeft -= SCROLL_STEP
        }
        applyFrame()
        raf = requestAnimationFrame(loop)
      }

      beginPointerDrag(event, {
        captureTarget: event.currentTarget as HTMLElement,
        onStart: () => {
          applyFrame()
          raf = requestAnimationFrame(loop)
        },
        onMove: (e) => {
          clientX = e.clientX
        },
        onEnd: () => cancelAnimationFrame(raf),
      })
    },
    [frameWidth, containerRef, scrollRef, store, dispatch]
  )
}
