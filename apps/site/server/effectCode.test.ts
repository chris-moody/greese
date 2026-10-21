import { describe, expect, it } from 'vitest'
import { formatKeyframes, parseKeyframes } from '../src/studio/effectCode.ts'

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
