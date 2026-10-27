import { cleanup } from '@testing-library/react'
import { vi } from 'vitest'

/** Fakes the clock greese.js runs on, so tests step its frames with `vi.advanceTimersByTime`. */
export const fakeFrames = (): void => {
  vi.useFakeTimers({
    toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
  })
}

/**
 * Unmounts, lets greese.js's shared ticker take its last frame, then brings
 * real timers back. A frame left pending when real timers return would stall
 * the ticker for every later test.
 */
export const restoreFrames = (): void => {
  if (vi.isFakeTimers()) {
    cleanup()
    vi.advanceTimersByTime(100)
  }
  vi.useRealTimers()
}
