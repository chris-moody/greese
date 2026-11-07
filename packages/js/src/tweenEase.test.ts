import { describe, expect, it } from 'vitest'
import { tweenEase, tweenEaseName } from './tweenEase.ts'

// The curves Glop's rigs, sound tweens and game code played, before they came
// from here: every saved name has to keep drawing exactly these.
const glop: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  bounce: (t) => {
    const n1 = 7.5625
    const d1 = 2.75
    if (t < 1 / d1) return n1 * t * t
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  },
  elastic: (t) =>
    t === 0 || t === 1
      ? t
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1,
  back: (t) => 2.70158 * t * t * t - 1.70158 * t * t,
}

const samples = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1]

describe('tweenEase', () => {
  it.each(Object.keys(glop))('draws %s as Glop always did', (name) => {
    const curve = tweenEase(name)
    for (const t of samples) expect(curve(t)).toBeCloseTo(glop[name]!(t), 10)
  })

  it('reads the older spellings saved rigs still hold', () => {
    for (const [old, now] of [
      ['easeInQuad', 'easeIn'],
      ['easeOutQuad', 'easeOut'],
      ['easeInOutQuad', 'easeInOut'],
    ] as const)
      for (const t of samples) expect(tweenEase(old)(t)).toBeCloseTo(glop[now]!(t), 10)
  })

  it('holds a step until the end', () => {
    for (const name of ['step', 'stepped']) {
      expect(tweenEase(name)(0.99)).toBe(0)
      expect(tweenEase(name)(1)).toBe(1)
    }
  })

  it("draws the keyword names as CSS's curves for Pixels", () => {
    expect(tweenEaseName('easeIn', { keywords: 'css' })).toBe('ease-in')
    expect(tweenEaseName('easeInOut', { keywords: 'css' })).toBe('ease-in-out')
    expect(tweenEaseName('back', { keywords: 'css' })).toBe('back.in')
  })

  it('takes a bezier tween’s points, or CSS ease without them', () => {
    expect(tweenEaseName('bezier', { bezier: [0.7, 0, 0.84, 0] })).toEqual([
      0.7, 0, 0.84, 0,
    ])
    expect(tweenEaseName('bezier')).toEqual([0.25, 0.1, 0.25, 1])
    expect(tweenEase('bezier', { bezier: [0, 0, 1, 1] })(0.3)).toBeCloseTo(0.3, 5)
  })

  it("passes greese.js's own names through, and plays anything unknown as linear", () => {
    expect(tweenEaseName('power3.out')).toBe('power3.out')
    expect(tweenEaseName('elastic.out(1.2, 0.4)')).toBe('elastic.out(1.2, 0.4)')
    expect(tweenEaseName('wobble')).toBe('linear')
    expect(tweenEaseName('')).toBe('linear')
    expect(tweenEaseName(undefined)).toBe('linear')
    expect(tweenEase('wobble')(0.3)).toBe(0.3)
  })
})
