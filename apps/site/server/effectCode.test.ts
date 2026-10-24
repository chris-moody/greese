import { describe, expect, it } from 'vitest'
import { formatKeyframes, parseKeyframes } from '../src/studio/effectCode.ts'
import { emptySpec, validateSpec, type ThemeSpec } from '../src/studio/spec.ts'

describe('effect code', () => {
  it('formats keyframes as code and reads them back', () => {
    const object = { opacity: [0, 1], y: ['1rem', '0px'] }
    expect(formatKeyframes(object)).toBe(
      "{\n  opacity: [0, 1],\n  y: ['1rem', '0px'],\n}"
    )
    expect(parseKeyframes(formatKeyframes(object))).toEqual({ frames: object })
    const frames = [
      { opacity: 0, scale: 0.8 },
      { scale: 1.04, offset: 0.6 },
      { scale: 1 },
    ]
    expect(parseKeyframes(formatKeyframes(frames))).toEqual({ frames })
  })

  it('accepts comments and trailing commas, and says what is wrong otherwise', () => {
    expect(parseKeyframes('{ x: [0, 8], // slide\n}')).toEqual({ frames: { x: [0, 8] } })
    expect(parseKeyframes('{ x: ')).toHaveProperty('error')
    expect(parseKeyframes('{}')).toHaveProperty('error')
    expect(parseKeyframes('42')).toHaveProperty('error')
    expect(parseKeyframes('[1, 2]')).toHaveProperty('error')
  })
})

describe('effect code is data only', () => {
  it('escapes every string so none can end early, and reads it back the same', () => {
    const frames = { opacity: ['0\\', "it's"], '--a\\': ['line\nbreak', ' '] }
    const code = formatKeyframes(frames)
    // Each string is one literal: nothing after a value is code.
    expect(code).toContain("'0\\\\'")
    expect(code).toContain("'it\\'s'")
    expect(code).not.toMatch(/\n[^ \n}]/)
    expect(parseKeyframes(code)).toEqual({ frames })
  })
})

describe('validateSpec on effects', () => {
  const withFrames = (keyframes: unknown) =>
    validateSpec({ ...emptySpec(), effects: { glide: { keyframes } } } as ThemeSpec)

  it('accepts offsets from 0 to 1 and eases by name or as four numbers', () => {
    expect(
      withFrames([
        { opacity: 0, ease: 'power2.out' },
        { opacity: 0.5, offset: 0.4, ease: 'steps(4)' },
        { opacity: 1, ease: [0.2, 0, 0, 1] },
      ])
    ).toEqual([])
  })

  it('refuses any other offset or ease', () => {
    expect(withFrames([{ opacity: 0, offset: 2 }, { opacity: 1 }])).toHaveLength(1)
    expect(withFrames([{ opacity: 0, offset: '0' }, { opacity: 1 }])).toHaveLength(1)
    expect(
      withFrames([{ opacity: 0, ease: "out' + x + '" }, { opacity: 1 }])
    ).toHaveLength(1)
    expect(withFrames([{ opacity: 0, ease: [0, 1] }, { opacity: 1 }])).toHaveLength(1)
  })
})
