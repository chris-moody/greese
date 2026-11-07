import { describe, expect, it } from 'vitest'
import {
  colorAtOffset,
  defaultGradient,
  gradientDirection,
  gradientStopsCss,
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
