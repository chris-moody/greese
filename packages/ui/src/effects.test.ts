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
    expect(effectNames).toHaveLength(94)
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
    expect(entranceNames()).toHaveLength(50)
    expect(exitNames()).toHaveLength(44)
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
      ['from', { scale: '1' }],
      ['60%', { scale: '1.075' }],
    ])
    expect(effectPlan('fadeStart').enter![0]![1].translate).toBe(
      `${cssReach.start(cssReach.distance)} 0px`
    )
  })

  it('writes an exit as everything an overlay moves to, what it doesn’t touch at rest', () => {
    const none = { 'mask-image': 'none', transform: 'none' }
    expect(effectPlan('fadeOut').exit).toEqual({
      translate: '0px 0px',
      scale: '1',
      opacity: '0',
      ...none,
    })
    expect(effectPlan('scaleOut').exit).toEqual({
      translate: '0px 0px',
      scale: '0',
      opacity: '0',
      ...none,
    })
    expect(effectPlan('fadeOutDown').exit).toEqual({
      translate: '0px var(--greese-motion-distance, 1rem)',
      scale: '1',
      opacity: '0',
      ...none,
    })
    // A wipe hides with its mask: it neither fades nor moves, and says where its mask starts.
    expect(effectPlan('wipeOutRight').exit).toMatchObject({
      translate: '0px 0px',
      scale: '1',
      opacity: '1',
      'mask-size': '0% 100%',
      'mask-from': '100% 100%',
    })
    expect(effectPlan('irisOut').exit['mask-from']).toBe('142% 142%')
  })

  it('plans any keyframes alike: an effect a theme defines gets the same CSS', () => {
    expect(cssPlan({ rotate: [0, -6, 6, 0] }).enter).toEqual([
      ['from', { rotate: '0deg' }],
      ['33.33%', { rotate: '-6deg' }],
      ['66.67%', { rotate: '6deg' }],
    ])
    expect(cssPlan({ scale: [1, 0.5], opacity: [1, 0] })).toEqual({
      exit: {
        translate: '0px 0px',
        scale: '0.5',
        opacity: '0',
        'mask-image': 'none',
        transform: 'none',
      },
      // What a page transition's old snapshot plays to leave (ADR 0029).
      leave: [
        ['from', { scale: '1', opacity: '1' }],
        ['to', { scale: '0.5', opacity: '0' }],
      ],
    })
    expect(cssPlan({ color: ['red', 'blue'] })).toMatchObject({
      exit: {
        translate: '0px 0px',
        scale: '1',
        opacity: '0',
        'mask-image': 'none',
        transform: 'none',
      },
    })
  })

  it('turns x, y, scale and rotate into the individual transform properties', () => {
    expect(toCssSteps({ opacity: [0, 1], y: ['1rem', '0px'], scale: [0.9, 1] })).toEqual([
      ['from', { translate: '0px 1rem', opacity: '0', scale: '0.9' }],
      ['to', { translate: '0px 0px', opacity: '1', scale: '1' }],
    ])
    expect(toCssSteps({ rotate: [0, 90] })[1]).toEqual(['to', { rotate: '90deg' }])
  })
})

describe('cssPlan with masks', () => {
  it('plays a mask reveal as an entrance, keeping its last step', () => {
    const plan = cssPlan({
      maskImage: ['linear-gradient(black, black)', 'linear-gradient(black, black)'],
      maskSize: ['0% 100%', '100% 100%'],
      opacity: [0, 1],
    })
    expect(plan.exit).toEqual({})
    expect(plan.enter?.map(([at]) => at)).toEqual(['from', 'to'])
    expect(plan.enter?.[1]?.[1]).toMatchObject({ 'mask-size': '100% 100%' })
  })

  it('still drops the resting last step when nothing is masked', () => {
    expect(cssPlan({ opacity: [0, 1] }).enter?.map(([at]) => at)).toEqual(['from'])
  })
})

describe('wipes and pockets', () => {
  it('wipe with a mask that grows to the whole element, holding its image and anchor', () => {
    expect(effectFrames('wipeRight')).toEqual({
      maskSize: ['0% 100%', '100% 100%'],
      maskImage: ['linear-gradient(black, black)', 'linear-gradient(black, black)'],
      maskRepeat: ['no-repeat', 'no-repeat'],
      maskPosition: ['0% 50%', '0% 50%'],
    })
    // As CSS: an entrance whose last step stays, so the reveal completes before the mask goes.
    expect(effectPlan('wipeOpenX').enter?.map(([at]) => at)).toEqual(['from', 'to'])
  })

  it('keep a pocket’s window still: the mask grows by what the element still has to travel', () => {
    const frames = effectFrames('pocketUp', jsReach('1rem', false), {
      distance: '20px',
    }) as Record<string, string[]>
    expect(frames.y).toEqual(['20px', '0px'])
    expect(frames.maskSize).toEqual(['100% calc(100% - 20px)', '100% calc(100% - 0px)'])
    expect(frames.maskPosition).toEqual(['50% 0%', '50% 0%'])
    // By default a pocket travels its whole size, so it starts out of sight.
    const full = effectFrames('pocketRight') as Record<string, string[]>
    expect(full.x).toEqual(['-100%', '0px'])
    expect(full.maskSize).toEqual(['0% 100%', '100% 100%'])
    expect(full.maskPosition).toEqual(['100% 50%', '100% 50%'])
  })

  it('go every direction, corners included, arriving and leaving', () => {
    const corner = effectFrames('pocketDownLeft') as Record<string, string[]>
    expect(corner.x).toEqual(['100%', '0px'])
    expect(corner.y).toEqual(['-100%', '0px'])
    expect(corner.maskPosition![0]).toBe('0% 100%')
    expect(effectFrames('wipeUpRight')).toMatchObject({
      maskPosition: ['0% 100%', '0% 100%'],
      maskSize: ['0% 0%', '100% 100%'],
    })
    // Leaving: the element moves on into the slot, the mask shrinks with it.
    const out = effectFrames('pocketOutDown') as Record<string, string[]>
    expect(out.y).toEqual(['0px', '100%'])
    expect(out.maskSize).toEqual(['100% 100%', '100% 0%'])
    expect(out.maskPosition![0]).toBe('50% 0%')
    expect(effectFrames('wipeOutLeft')).toMatchObject({
      maskPosition: ['0% 50%', '0% 50%'],
      maskSize: ['100% 100%', '0% 100%'],
    })
  })

  it('leave by mask: exits an overlay takes, with the mask it ends at', () => {
    for (const name of [
      'wipeOutRight',
      'wipeCloseX',
      'irisOut',
      'irisOutDownLeft',
      'pocketOutUp',
    ] as const) {
      expect(effectPlan(name).enter, name).toBeUndefined()
      expect(effectPlan(name).exit['mask-size'], name).toBeDefined()
      expect(exitNames()).toContain(name)
    }
    // A pocket's exit carries its slide too.
    expect(effectPlan('pocketOutDown').exit).toMatchObject({
      translate: '0px 100%',
      'mask-size': '100% 0%',
      'mask-position': '50% 0%',
    })
    for (const name of [
      'wipeRight',
      'wipeOpenY',
      'irisIn',
      'irisUpLeft',
      'pocketDownRight',
    ] as const)
      expect(entranceNames(), name).toContain(name)
  })

  it('never touch clip-path, which belongs to the element’s shape', () => {
    for (const name of entranceNames())
      expect(JSON.stringify(effectFrames(name)), name).not.toMatch(/clip/i)
  })
})

describe('irises', () => {
  it('close toward a side or corner, and open from the same one: an entrance is its exit reversed', () => {
    expect(effectFrames('irisRight')).toMatchObject({
      maskSize: ['0% 0%', '142% 142%'],
      maskPosition: ['100% 50%', '100% 50%'],
      maskImage: [
        'radial-gradient(farthest-side at 100% 50%, black 98%, transparent)',
        'radial-gradient(farthest-side at 100% 50%, black 98%, transparent)',
      ],
    })
    expect(effectFrames('irisOutRight')).toMatchObject({
      maskSize: ['142% 142%', '0% 0%'],
      maskPosition: ['100% 50%', '100% 50%'],
    })
    expect(effectFrames('irisOutUpLeft')).toMatchObject({
      maskPosition: ['0% 0%', '0% 0%'],
    })
    expect(effectFrames('irisUpLeft')).toMatchObject({ maskPosition: ['0% 0%', '0% 0%'] })
  })

  it('open just far enough to cover the element, from the middle, a side or a corner', () => {
    // An ellipse in the element's proportions, scaled by s, reaches the far
    // corner from any of those points when 2 / s² ≤ 1.
    const open =
      parseFloat(
        String((effectFrames('irisIn') as Record<string, unknown[]>).maskSize![1])
      ) / 100
    expect(2 / open ** 2).toBeLessThanOrEqual(1)
    expect(open).toBeLessThan(1.45)
  })

  it('write their masks without digits greese.js would mangle', () => {
    for (const name of effectNames) {
      const image = (effectFrames(name) as Record<string, unknown[]>).maskImage
      if (image) expect(String(image[0]), name).not.toMatch(/#[0-9a-f]/i)
    }
  })
})

describe('three-dimensional effects', () => {
  type Name = Parameters<typeof effectFrames>[0]
  /** Where an effect's transform starts and ends, from its frames in either form. */
  const ends = (name: string) => {
    const frames = effectFrames(name as Name) as unknown
    const values = Array.isArray(frames)
      ? (frames as Array<Record<string, unknown>>).map((f) => f.transform).filter(Boolean)
      : ((frames as Record<string, unknown[]>).transform ?? [])
    return [values[0], values.at(-1)]
  }

  it('turn with their own perspective, and arrive or leave by where they end', () => {
    expect(ends('flipUp')).toEqual([
      'perspective(800px) rotateX(75deg)',
      'perspective(800px) rotateX(0deg)',
    ])
    for (const name of [
      'flipUp',
      'flipDown',
      'flipLeft',
      'flipRight',
      'depthIn',
      'swingIn',
    ])
      expect(
        effectPlan(name as Parameters<typeof effectPlan>[0]).enter,
        name
      ).toBeDefined()
    expect(effectPlan('flipOutUp').exit).toMatchObject({
      transform: 'perspective(800px) rotateX(75deg)',
      opacity: '0',
    })
  })

  it('leave the way they came: an exit is its entrance reversed', () => {
    for (const dir of ['Up', 'Down', 'Left', 'Right'])
      expect(ends(`flipOut${dir}`), dir).toEqual([...ends(`flip${dir}`)].reverse())
  })

  it('swing about their top edge, and an overlay leaving with one pivots there too', () => {
    expect(effectPlan('swingOut').exit).toMatchObject({ 'transform-origin': '50% 0%' })
  })
})
