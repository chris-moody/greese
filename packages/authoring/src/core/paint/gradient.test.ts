import { describe, expect, it } from 'vitest'
import {
  colorAtOffset,
  defaultGradient,
  gradientDirection,
  gradientStopsCss,
  gradientToSvg,
  withGradientDirection,
  withGradientType,
  withPaintType,
  type GradientFill,
} from './gradient.ts'

const linear: GradientFill = {
  type: 'linear',
  x0: 0,
  y0: 0.5,
  x1: 1,
  y1: 0.5,
  stops: [
    { offset: 0, color: '#ff0000' },
    { offset: 1, color: '#0000ff' },
  ],
}

const round = (g: GradientFill) =>
  JSON.parse(
    JSON.stringify(g, (_, v) => (typeof v === 'number' ? Math.round(v * 1e6) / 1e6 : v))
  )

describe('gradient maths', () => {
  it('reads a linear gradient’s direction clockwise from up', () => {
    expect(gradientDirection(linear)).toBe(90)
    expect(gradientDirection({ ...linear, x1: 0, y1: -0.5 })).toBe(0)
    expect(gradientDirection({ ...linear, x1: 0, y1: 0.5 })).toBe(0)
  })

  it('turns a linear gradient about its middle, keeping its length', () => {
    const down = round(withGradientDirection(linear, 180))
    expect(down).toMatchObject({ x0: 0.5, y0: 0, x1: 0.5, y1: 1 })
    const radial = withGradientType(linear, 'radial')
    expect(withGradientDirection(radial, 45)).toMatchObject({ rotation: 45 })
  })

  it('swaps type keeping its place and stops', () => {
    const radial = withGradientType(linear, 'radial')
    expect(radial).toMatchObject({ type: 'radial', cx: 0.5, cy: 0.5, outerRadius: 0.5 })
    expect(radial.stops).toBe(linear.stops)
    expect(withGradientType(radial, 'linear')).toMatchObject({ x0: 0, x1: 1, y0: 0.5 })
    expect(withGradientType(linear, 'linear')).toBe(linear)
  })

  it('switches paint kind, carrying the color across', () => {
    const gradient = withPaintType({ type: 'solid', color: '#123456' }, 'gradient')
    expect(gradient).toEqual({ type: 'gradient', gradient: defaultGradient('#123456') })
    expect(withPaintType(gradient, 'solid')).toEqual({ type: 'solid', color: '#123456' })
    expect(withPaintType(gradient, 'none')).toEqual({ type: 'none' })
    expect(withPaintType({ type: 'none' }, 'solid')).toEqual({
      type: 'solid',
      color: '#000000',
    })
  })

  it('the default gradient stays inside the box', () => {
    const { x0, x1, y0, y1 } = defaultGradient() as Extract<
      GradientFill,
      { type: 'linear' }
    >
    expect([x0, x1, y0, y1].every((n) => n >= 0 && n <= 1)).toBe(true)
  })

  it('blends a new stop’s color from its neighbors', () => {
    expect(colorAtOffset(linear.stops, 0.5)).toBe('#800080')
    expect(colorAtOffset(linear.stops, -1)).toBe('#ff0000')
    expect(colorAtOffset([], 0.5)).toBe('#ffffff')
  })

  it('previews the stops in order', () => {
    expect(gradientStopsCss([...linear.stops].reverse())).toBe(
      'linear-gradient(to right, #ff0000 0%, #0000ff 100%)'
    )
  })
})

describe('gradientToSvg', () => {
  it('writes a linear gradient’s points in the box, its stops in order', () => {
    expect(
      gradientToSvg({
        type: 'linear',
        x0: 0,
        y0: 0.5,
        x1: 1,
        y1: 0.5,
        stops: [
          { offset: 1, color: '#000000' },
          { offset: 0, color: '#38bdf8' },
        ],
      })
    ).toEqual({
      tag: 'linearGradient',
      attrs: { x1: '0', y1: '0.5', x2: '1', y2: '0.5' },
      stops: [
        { offset: '0', 'stop-color': '#38bdf8' },
        { offset: '1', 'stop-color': '#000000' },
      ],
    })
  })

  it('writes a radial’s outer circle as SVG’s, its inner as the focus, turned and squashed', () => {
    const radial = {
      type: 'radial' as const,
      cx: 0.4,
      cy: 0.4,
      innerRadius: 0.1,
      outerCx: 0.5,
      outerCy: 0.5,
      outerRadius: 0.5,
      rotation: 30,
      scaleY: 0.5,
      stops: [
        { offset: 0, color: '#fff' },
        { offset: 1, color: '#000' },
      ],
    }
    expect(gradientToSvg(radial).attrs).toEqual({
      cx: '0.5',
      cy: '0.5',
      r: '0.5',
      fx: '0.4',
      fy: '0.4',
      fr: '0.1',
      gradientTransform:
        'translate(0.5 0.5) rotate(30) scale(1 0.5) translate(-0.5 -0.5)',
    })
    // Unturned and round, it needs no transform.
    expect(
      gradientToSvg({ ...radial, rotation: 0, scaleY: 1, innerRadius: 0 }).attrs
    ).toEqual({ cx: '0.5', cy: '0.5', r: '0.5', fx: '0.4', fy: '0.4' })
  })
})
