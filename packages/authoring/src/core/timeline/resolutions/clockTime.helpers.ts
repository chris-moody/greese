/**
 * Shared clock-time formatting — the one place both {@link import('./animationResolution').createAnimationResolution}
 * and {@link import('./musicalResolution').createMusicalResolution} implement
 * `TimeMode.Time`, so the two studios' clock-time display never drifts apart.
 */

/** Format seconds as `mm:ss.mmm`, clamping negative input to zero. */
export const formatClockTime = (seconds: number): string => {
  const totalMs = Math.round(Math.max(0, seconds) * 1000)
  const ms = totalMs % 1000
  const totalSeconds = Math.floor(totalMs / 1000)
  const s = totalSeconds % 60
  const m = Math.floor(totalSeconds / 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
}
