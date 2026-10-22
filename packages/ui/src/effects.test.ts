import { describe, expect, it } from 'vitest'
import {
  baseEffects,
  builtInEffects,
  comboEffects,
  cssPlan,
  cssReach,
  effectFrames,
  effectNames,
  effectParamNames,
  effectPlan,
  entranceNames,
  exitNames,
  jsReach,
  negate,
  parseSequence,
  splitTiming,
  toCssSteps,
} from './effects.ts'

describe('effects', () => {
  it('are base effects (one property each) and combos made of them', () => {
    expect(effectNames).toEqual([
      ...Object.keys(baseEffects),
      ...Object.keys(comboEffects),
    ])
    expect(effectNames).toHaveLength(Object.keys(builtInEffects).length)
    expect(effectNames).toHaveLength(24)
    expect(effectFrames('fadeIn')).toEqual({ opacity: [0, 1] })
  })

  it('takes optional parameters, positional or by name, and keeps the other defaults', () => {
    expect(effectFrames('fadeIn', undefined, { end: 0.8 })).toEqual({ opacity: [0, 0.8] })
    expect(effectFrames('fadeIn', undefined, { start: 0.25, end: 0.8 })).toEqual({
      opacity: [0.25, 0.8],
    })
    expect(effectFrames('blurIn', undefined, { start: 20 })).toEqual({
      filter: ['blur(20px)', 'blur(0px)'],
    })
    expect(effectFrames('rise', undefined, { lift: -8 })).toEqual({
      y: [0, -8],
      scale: [1, 1.02],
    })
  })

  it('places the parts of a combo as shares of it', () => {
    expect(effectFrames('popIn')).toEqual([
      { scale: 0.8, opacity: 0, offset: 0 },
      { scale: 1.04, opacity: 1, offset: 0.6 },
      { scale: 1, offset: 1 },
    ])
    expect(effectFrames('popOut')).toEqual([
      { scale: 1, offset: 0 },
      { scale: 1.04, opacity: 1, offset: 0.4 },
      { scale: 0.8, opacity: 0, offset: 1 },
    ])
    expect(effectFrames('fadeUp', undefined, { distance: '2rem' })).toEqual({
      opacity: [0, 1],
      y: ['2rem', '0px'],
    })
  })

  it('flips lengths, plain ones textually', () => {
    expect(negate('1rem')).toBe('-1rem')
    expect(negate('-12px')).toBe('12px')
    expect(negate('calc(1rem + 2px)')).toBe('calc(-1 * calc(1rem + 2px))')
  })

  it('flips start and end with the writing direction', () => {
    expect(effectFrames('fadeStart', jsReach('1rem', false))).toEqual({
      opacity: [0, 1],
      x: ['-1rem', '0px'],
    })
    expect(effectFrames('fadeStart', jsReach('1rem', true))).toEqual({
      opacity: [0, 1],
      x: ['1rem', '0px'],
    })
    expect(effectFrames('fadeEnd', jsReach('1rem', false))).toEqual({
      opacity: [0, 1],
      x: ['1rem', '0px'],
    })
  })

  it('names its parameters, then the timing keys', () => {
    expect(effectParamNames('fadeIn')).toEqual([
      'start',
      'end',
      'duration',
      'offset',
      'ease',
    ])
    expect(effectParamNames('fadeUp')).toEqual(['distance', 'duration', 'offset', 'ease'])
    expect(effectParamNames('wobble')).toEqual(['duration', 'offset', 'ease'])
  })
})

describe('sequences', () => {
  const names = (sequence: string) =>
    parseSequence(sequence).map((step) =>
      typeof step === 'number' ? step : step.map((call) => call.name)
    )

  it('splits groups, effects that play together, and pauses', () => {
    expect(names('fadeIn+scaleIn,+2,fadeOut')).toEqual([
      ['fadeIn', 'scaleIn'],
      2,
      ['fadeOut'],
    ])
    expect(names('slideUp,-0.2,popIn')).toEqual([['slideUp'], -0.2, ['popIn']])
  })

  it('reads arguments by position, by name and as an object', () => {
    expect(parseSequence('fadeIn(0.25, 0.8)')).toEqual([
      [{ name: 'fadeIn', args: { start: 0.25, end: 0.8 } }],
    ])
    expect(parseSequence('fadeIn(end: 0.8, duration: 1)')).toEqual([
      [{ name: 'fadeIn', args: { end: 0.8, duration: 1 } }],
    ])
    expect(parseSequence('fadeIn({ end: 0.8, offset: .2 })')).toEqual([
      [{ name: 'fadeIn', args: { end: 0.8, offset: 0.2 } }],
    ])
    expect(parseSequence('fadeUp(2rem, 0.4)')).toEqual([
      [{ name: 'fadeUp', args: { distance: '2rem', duration: 0.4 } }],
    ])
  })

  it('keeps commas, plus signs and minus signs inside arguments', () => {
    expect(parseSequence('slideUp(calc(1rem + 2px), -4),+1,fadeIn(0.5)+scaleIn')).toEqual(
      [
        [{ name: 'slideUp', args: { start: 'calc(1rem + 2px)', end: -4 } }],
        1,
        [
          { name: 'fadeIn', args: { start: 0.5 } },
          { name: 'scaleIn', args: {} },
        ],
      ]
    )
  })

  it('treats an effect of your own as taking only timing', () => {
    expect(parseSequence('wobble(0.6, 0.1)')).toEqual([
      [{ name: 'wobble', args: { duration: 0.6, offset: 0.1 } }],
    ])
    expect(splitTiming({ end: 1, duration: 2, offset: 0.5, ease: 'out' })).toEqual({
      timing: { duration: 2, offset: 0.5, ease: 'out' },
      params: { end: 1 },
    })
  })
})

describe('CSS', () => {
  it('plays an effect as CSS exactly when it ends at the resting state', () => {
    expect(entranceNames()).toHaveLength(13)
    expect(exitNames()).toHaveLength(11)
    for (const name of entranceNames()) expect(effectPlan(name).enter, name).toBeDefined()
    expect(exitNames()).toEqual(
      expect.arrayContaining([
        'fadeOut',
        'fadeOutUp',
        'scaleOut',
        'popOut',
        'rise',
        'glow',
      ])
    )
  })

  it('writes an entrance as keyframes that end at the element’s own styles', () => {
    expect(effectPlan('fadeUp').enter).toEqual([
      ['from', { opacity: '0', translate: '0px var(--greese-motion-distance, 1rem)' }],
    ])
    expect(effectPlan('pop').enter).toEqual([
      ['from', { scale: '0.8' }],
      ['60%', { scale: '1.04' }],
    ])
    expect(effectPlan('fadeStart').enter![0]![1].translate).toBe(
      `${cssReach.start(cssReach.distance)} 0px`
    )
  })

  it('writes an exit as what it changes, never the fade', () => {
    expect(effectPlan('fadeOut').exit).toEqual({})
    expect(effectPlan('scaleOut').exit).toEqual({ scale: '0.92' })
    expect(effectPlan('fadeOutDown').exit).toEqual({
      translate: '0px var(--greese-motion-distance, 1rem)',
    })
  })

  it('plans any keyframes alike: an effect a theme defines gets the same CSS', () => {
    expect(cssPlan({ rotate: [0, -6, 6, 0] }).enter).toEqual([
      ['from', { rotate: '0deg' }],
      ['33.33%', { rotate: '-6deg' }],
      ['66.67%', { rotate: '6deg' }],
    ])
    expect(cssPlan({ scale: [1, 0.5], opacity: [1, 0] })).toEqual({
      exit: { scale: '0.5' },
    })
    expect(cssPlan({ color: ['red', 'blue'] })).toEqual({ exit: {} })
  })

  it('turns x, y, scale and rotate into the individual transform properties', () => {
    expect(toCssSteps({ opacity: [0, 1], y: ['1rem', '0px'], scale: [0.9, 1] })).toEqual([
      ['from', { translate: '0px 1rem', opacity: '0', scale: '0.9' }],
      ['to', { translate: '0px 0px', opacity: '1', scale: '1' }],
    ])
    expect(toCssSteps({ rotate: [0, 90] })[1]).toEqual(['to', { rotate: '90deg' }])
  })
})
