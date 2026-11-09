import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  ColorTool,
  ComplexColorField,
  paintCss,
  type ComplexColorValue,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const Tool = ({ onReset = () => {} }: { onReset?: () => void }) => {
  const [fill, setFill] = useState<ComplexColorValue>({ type: 'none' })
  const [stroke, setStroke] = useState<ComplexColorValue>({
    type: 'solid',
    color: 'currentColor',
  })
  return (
    <ColorTool
      primary={fill}
      secondary={stroke}
      onPrimaryChange={setFill}
      onSecondaryChange={setStroke}
      onSwap={() => {
        setFill(stroke)
        setStroke(fill)
      }}
      onReset={onReset}
      allowCurrentColor
    />
  )
}

describe('ColorTool', () => {
  it('names each swatch by its paint, and swaps them', async () => {
    const { container } = render(<Tool />)
    expect(screen.getByRole('button', { name: 'Fill: none' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Stroke: current color' })
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Swap fill and stroke' }))
    expect(
      screen.getByRole('button', { name: 'Fill: current color' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stroke: none' })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('resets, and opens a swatch’s picker', () => {
    const onReset = vi.fn()
    render(<Tool onReset={onReset} />)
    fireEvent.click(screen.getByRole('button', { name: 'Reset colors' }))
    expect(onReset).toHaveBeenCalled()
    const stroke = screen.getByRole('button', { name: 'Stroke: current color' })
    fireEvent.click(stroke)
    expect(stroke).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: 'Stroke' })).toBeInTheDocument()
  })
})

describe('ComplexColorField’s Current', () => {
  it('stores currentColor as a solid, shown as its own kind with no picker', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <ComplexColorField
        label="Stroke"
        value={{ type: 'solid', color: '#ff0000' }}
        onChange={onChange}
        allowCurrentColor
        allowGradient={false}
      />
    )
    expect(screen.queryByRole('radio', { name: 'Gradient' })).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'Current' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'solid', color: 'currentColor' })
    rerender(
      <ComplexColorField
        label="Stroke"
        value={{ type: 'solid', color: 'currentColor' }}
        onChange={onChange}
        allowCurrentColor
      />
    )
    expect(screen.getByRole('radio', { name: 'Current' })).toBeChecked()
    expect(screen.queryByLabelText('Stroke color')).toBeNull()
    fireEvent.click(screen.getByRole('radio', { name: 'Solid' }))
    expect(onChange).toHaveBeenLastCalledWith({ type: 'solid', color: '#000000' })
  })

  it('paints a swatch with the color or the stops', () => {
    expect(paintCss({ type: 'none' })).toBeNull()
    expect(paintCss({ type: 'solid', color: 'red' })).toBe('red')
    expect(
      paintCss({
        type: 'gradient',
        gradient: {
          type: 'radial',
          cx: 0.5,
          cy: 0.5,
          innerRadius: 0,
          outerCx: 0.5,
          outerCy: 0.5,
          outerRadius: 0.5,
          rotation: 0,
          scaleY: 1,
          stops: [
            { offset: 1, color: 'blue' },
            { offset: 0, color: 'red' },
          ],
        },
      })
    ).toBe('radial-gradient(closest-side, red 0%, blue 100%)')
  })
})
