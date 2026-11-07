import { useEffect, useState, type PointerEvent, type JSX } from 'react'
import { useAuthoringSelector } from '../../../environment/environment.tsx'
import { selectPlayback } from '../../../state/selectors.ts'
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

  return (
    <div
      className={'greese-TimelinePlayhead-playheadRoot'}
      style={{ left: currentFrame * frameWidth }}
    >
      <div
        className={'greese-TimelinePlayhead-playheadTab'}
        onPointerDown={onScrubStart}
        style={{ width: frameWidth, marginLeft: 0 }}
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
