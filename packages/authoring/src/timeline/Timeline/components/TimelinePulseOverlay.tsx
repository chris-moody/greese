import { useEffect, useState, type JSX } from 'react'
import {
  PULSE_DECAY_MS,
  type PulseClockHandle,
  type PulseEntry,
} from '../../usePulseClock.ts'
import { PulseLayerId } from '../../../core/timeline/resolutions/pulseBoundaries.helpers.ts'

/**
 * Which Temporal Guide pulse layer a flash belongs to, and so which token
 * colors it. `measure` and `loop` share the heavier accent; see
 * `pulse.module.scss`.
 */
export type PulseFlashLayer = 'measure' | 'subdivision' | 'frame' | 'loop'

export interface TimelinePulseOverlayProps {
  pixelsPerTick: number
  pulseClock: PulseClockHandle
}

/** `beat` drives the {@link import('./Playhead').Playhead} echo instead — never flashed here (it would just double the playhead itself). */
const FLASH_LAYERS = new Set<PulseLayerId>([
  PulseLayerId.measure,
  PulseLayerId.subdivision,
  PulseLayerId.frame,
  PulseLayerId.loop,
])

/**
 * Temporal Guide: transient flashes at measure/subdivision/frame/loop boundary
 * ticks still within their decay window — almost always empty. Positioned like
 * `TimelineRuler`'s own ticks (`tick * pixelsPerTick`), independently computed
 * here rather than by editing `TimelineRuler.tsx`, which stays `memo`-wrapped
 * and playback-state-free (see the metronome plan's Locked decisions).
 *
 * Self-animating: subscribes to the pulse clock and runs its own rAF loop only
 * while pulses are decaying, so pulse activity re-renders this leaf (a handful
 * of absolutely-positioned divs) — never the Timeline hosting it.
 */
export const TimelinePulseOverlay = ({
  pixelsPerTick,
  pulseClock,
}: TimelinePulseOverlayProps): JSX.Element | null => {
  const [pulses, setPulses] = useState<readonly PulseEntry[]>([])

  useEffect(() => {
    let raf = 0
    let running = false
    const animate = () => {
      const current = pulseClock.getRecentPulses()
      // Fresh array each frame so the fade opacity re-renders even when the
      // entry set itself hasn't changed.
      setPulses(current.length > 0 ? [...current] : [])
      if (current.length > 0) raf = requestAnimationFrame(animate)
      else running = false
    }
    const start = () => {
      if (running) return
      running = true
      raf = requestAnimationFrame(animate)
    }
    const unsubscribe = pulseClock.subscribe(start)
    if (pulseClock.getRecentPulses().length > 0) start()
    return () => {
      unsubscribe()
      cancelAnimationFrame(raf)
    }
  }, [pulseClock])

  const visible = pulses.filter((pulse) => FLASH_LAYERS.has(pulse.layer))
  if (visible.length === 0) return null

  const now = performance.now()

  return (
    <div className={'greese-TimelinePulse-overlay'}>
      {visible.map((pulse, index) => {
        const phase = Math.min(1, (now - pulse.atMs) / PULSE_DECAY_MS)
        const fade = Math.max(0, 1 - phase)
        return (
          <div
            className={'greese-TimelinePulse-flash'}
            key={`${pulse.layer}:${pulse.tick}:${pulse.atMs}:${index}`}
            data-layer={pulse.layer as PulseFlashLayer}
            style={{
              left: pulse.tick * pixelsPerTick - 1.5,
              width: 3,
              opacity: fade * 0.6,
            }}
          />
        )
      })}
    </div>
  )
}
