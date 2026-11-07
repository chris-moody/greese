import { describe, expect, it } from 'vitest'
import { pickLabelTier } from './rulerTiers.ts'
import type { TickSnapPoint } from '../types/resolution.types.ts'

/** A 2-bar 4/4 musical tier set at 960 TPQ: bars(5), beats(4), 8ths(3), 16ths(2). */
const musicalPoints = (): TickSnapPoint[] => {
  const points = new Map<number, number>()
  const set = (step: number, weight: number) => {
    for (let tick = 0; tick <= 7680; tick += step) {
      const existing = points.get(tick)
      if (existing === undefined || weight > existing) points.set(tick, weight)
    }
  }
  set(240, 2)
  set(480, 3)
  set(960, 4)
  set(3840, 5)
  return [...points.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([tick, weight]) => ({ tick, weight }))
}

describe('pickLabelTier', () => {
  it('returns the finest tier whose spacing fits the pixel minimum', () => {
    // 0.5 px/tick: 16ths are 120px apart — everything fits, label all of them.
    const all = pickLabelTier(musicalPoints(), 0.5, 64)
    expect(all.map((p) => p.tick).slice(0, 3)).toEqual([0, 240, 480])

    // 0.1 px/tick: 16ths = 24px (too dense), 8ths = 48px (too dense),
    // beats = 96px — the finest tier that fits.
    const beats = pickLabelTier(musicalPoints(), 0.1, 64)
    expect(beats.map((p) => p.tick).slice(0, 3)).toEqual([0, 960, 1920])

    // 0.02 px/tick: beats = 19.2px, bars = 76.8px — bars only.
    const bars = pickLabelTier(musicalPoints(), 0.02, 64)
    expect(bars.map((p) => p.tick)).toEqual([0, 3840, 7680])
  })

  it('rejects tiers whose smallest (not first) adjacent gap is too dense', () => {
    // Non-uniform tier: first gap is wide, a later gap is narrow.
    const points: TickSnapPoint[] = [
      { tick: 0, weight: 2 },
      { tick: 100, weight: 1 },
      { tick: 110, weight: 1 },
      { tick: 200, weight: 2 },
    ]
    // At 1 px/tick the weight-1 tier has a 10px gap (< 64) — fall back to weight 2.
    expect(pickLabelTier(points, 1, 64).map((p) => p.tick)).toEqual([0, 200])
  })

  it('stride-thins a single too-dense tier instead of overlapping labels', () => {
    // Animation-style single tier: every 1000 ticks at 0.014 px/tick = 14px apart.
    const frames: TickSnapPoint[] = Array.from({ length: 20 }, (_, i) => ({
      tick: i * 1000,
      weight: 1,
    }))
    const thinned = pickLabelTier(frames, 0.014, 64)
    // ceil(64 / 14) = 5 — every 5th frame.
    expect(thinned.map((p) => p.tick)).toEqual([0, 5000, 10000, 15000])
  })

  it('handles empty and single-point inputs', () => {
    expect(pickLabelTier([], 1, 64)).toEqual([])
    expect(pickLabelTier([{ tick: 0, weight: 1 }], 1, 64)).toEqual([
      { tick: 0, weight: 1 },
    ])
  })
})
