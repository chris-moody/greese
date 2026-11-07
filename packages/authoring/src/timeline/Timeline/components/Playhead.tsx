'use client'
import {
  useEffect,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type JSX,
} from 'react'
import {
  useAuthoringDispatch,
  useAuthoringSelector,
} from '../../../environment/environment.tsx'
import { playbackActions } from '../../../state/playback.slice.ts'
import { selectFrameCount, selectPlayback } from '../../../state/selectors.ts'
import { prefersReducedMotion } from '@greese/js'
import { PulseLayerId } from '../../../core/timeline/resolutions/pulseBoundaries.helpers.ts'
import type { PulseClockHandle } from '../../usePulseClock.ts'

export interface PlayheadProps {
  frameWidth: number
  /** Shared scrub handler (also used by the ruler). */
  onScrubStart: (event: PointerEvent<HTMLElement>) => void
  /** Temporal Guide clock — when present, the playhead grows a fading echo ring on each beat pulse. */
  pulseClock?: PulseClockHandle
}

/**
 * The beat-pulse echo ring, self-animating off the pulse clock: subscribes to
 * the handle and runs its own rAF loop only while a beat pulse is decaying, so
 * the fade re-renders just this element — not the playhead line (which already
 * re-renders per `currentFrame` during playback), and never the Timeline.
 */
const PlayheadBeatEcho = ({
  pulseClock,
}: {
  pulseClock: PulseClockHandle
}): JSX.Element | null => {
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    // The ring is decoration: under reduced motion the beat shows without it.
    if (prefersReducedMotion()) return
    let raf = 0
    let running = false
    const animate = () => {
      const next = pulseClock.phaseFor(PulseLayerId.beat)
      setPhase(next)
      if (next < 1) raf = requestAnimationFrame(animate)
      else running = false
    }
    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(animate)
    }
    const unsubscribe = pulseClock.subscribe(start)
    if (pulseClock.phaseFor(PulseLayerId.beat) < 1) start()
    return () => {
      unsubscribe()
      cancelAnimationFrame(raf)
    }
  }, [pulseClock])

  if (phase >= 1) return null
  const size = 8 + phase * 24
  return (
    <div
      className={'greese-TimelinePulse-echo'}
      style={{
        width: size,
        height: size,
        marginLeft: -size / 2,
        opacity: Math.max(0, 1 - phase) * 0.5,
        top: `calc(50% - ${size / 2}px)`,
      }}
    />
  )
}

/**
 * Playback head: a vertical line at the start of the current frame *and* one
 * at its end (the frame column's right edge, `left + frameWidth`), bracketing
 * the current frame, with a draggable scrub tab spanning edge-to-edge between
 * them (flush against both lines, no gap). Scrubbing (drag + edge
 * auto-scroll) is the shared `usePlayheadScrub` handler, so the tab and the
 * ruler behave identically — both `usePlayheadScrub`'s `applyFrame` and the
 * ruler/marker drag math floor pointer position to `frame * frameWidth` (the
 * frame's left edge, matching `TimelineCursor`'s snapped grid-line position),
 * so `PlayheadRoot` has to align there too rather than at the frame's center
 * — the tab spans the rest of the way via its own inline `width`/`marginLeft`.
 */
export const Playhead = ({
  frameWidth,
  onScrubStart,
  pulseClock,
}: PlayheadProps): JSX.Element | null => {
  const { currentFrame } = useAuthoringSelector(selectPlayback)
  const count = useAuthoringSelector(selectFrameCount)
  const dispatch = useAuthoringDispatch()

  // The tab is a slider (WAI-ARIA APG): arrows step a frame, Page keys ten,
  // Home and End go to the ends.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = Math.max(0, count - 1)
    const by: Record<string, number> = {
      ArrowLeft: -1,
      ArrowDown: -1,
      ArrowRight: 1,
      ArrowUp: 1,
      PageDown: -10,
      PageUp: 10,
    }
    let next: number | undefined
    if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else if (by[event.key] !== undefined)
      next = currentFrame + by[event.key]! * (event.shiftKey ? 10 : 1)
    if (next === undefined) return
    event.preventDefault()
    dispatch(playbackActions.setCurrentFrame(Math.max(0, Math.min(last, next))))
  }

  return (
    <div
      className={'greese-TimelinePlayhead-playheadRoot'}
      style={{ left: currentFrame * frameWidth }}
    >
      <div
        className={'greese-TimelinePlayhead-playheadTab'}
        role="slider"
        tabIndex={0}
        aria-label="Playhead"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, count - 1)}
        aria-valuenow={currentFrame}
        aria-valuetext={`Frame ${currentFrame + 1} of ${count}`}
        onPointerDown={onScrubStart}
        onKeyDown={onKeyDown}
      />
      <div className={'greese-TimelinePlayhead-playheadLine'} />
      <div
        className={'greese-TimelinePlayhead-playheadLine'}
        style={{ left: frameWidth }}
      />
      {pulseClock && <PlayheadBeatEcho pulseClock={pulseClock} />}
    </div>
  )
}
