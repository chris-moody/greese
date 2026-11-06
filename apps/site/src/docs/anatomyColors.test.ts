// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { color } from '@greese/ui'
import {
  anatomyColors,
  contrast,
  MIN_CONTRAST,
  type Rgb,
} from '../../../docs/stories/_shared/anatomyColors.ts'

const rgb = (css: string): Rgb => {
  const hex = /^#([0-9a-f]{6})$/i.exec(css)?.[1]
  if (hex)
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as unknown as Rgb
  const parts = /^rgb\((\d+) (\d+) (\d+)\)$/.exec(css)
  if (!parts) throw new Error(`not a color this test reads: ${css}`)
  return [Number(parts[1]), Number(parts[2]), Number(parts[3])]
}

describe('anatomyColors', () => {
  const backgrounds: [string, Rgb][] = [
    ['white', [255, 255, 255]],
    ['black', [0, 0, 0]],
    ['mid grey', [119, 119, 119]],
    ['dark navy', [16, 24, 40]],
    ['pale yellow', [255, 250, 205]],
  ]
  // The base theme's canvas in both schemes, when it's written as hex.
  for (const mode of ['light', 'dark'] as const) {
    const canvas = color.canvas[mode]
    if (/^#[0-9a-f]{6}$/i.test(canvas))
      backgrounds.push([`canvas (${mode})`, rgb(canvas)])
  }

  it.each(backgrounds)(
    'every depth reads on %s: lines and tags, and each label’s text',
    (_, background) => {
      for (const { color: line, on } of anatomyColors(background, 6)) {
        expect(contrast(rgb(line), background)).toBeGreaterThanOrEqual(MIN_CONTRAST)
        expect(contrast(rgb(on), rgb(line))).toBeGreaterThanOrEqual(MIN_CONTRAST)
      }
    }
  )

  it('tells the depths apart', () => {
    const colors = anatomyColors([255, 255, 255], 4).map((c) => c.color)
    expect(new Set(colors).size).toBe(4)
  })
})
