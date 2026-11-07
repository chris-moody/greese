import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { EditableField } from '@greese/react'
import { GridIcon } from '@greese/icons'
import {
  ComplexColorField,
  GradientEditor,
  GradientStopBar,
  PropertyGrid,
  ToggleSelect,
  type ComplexColorValue,
  type GradientColorStop,
  type GradientFill,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const stops: GradientColorStop[] = [
  { offset: 0, color: '#ff0000' },
  { offset: 1, color: '#0000ff' },
]

const linear: GradientFill = { type: 'linear', x0: 0, y0: 0.5, x1: 1, y1: 0.5, stops }

/** A track 200px wide at the left edge, which jsdom can't lay out. */
const sizeTrack = (container: HTMLElement) => {
  const track = container.querySelector('.greese-GradientStopBar-track')!
  track.getBoundingClientRect = () =>
    ({ left: 0, width: 200, top: 0, height: 16, right: 200, bottom: 16 }) as DOMRect
}

const Bar = ({ onChange }: { onChange?: (stops: GradientColorStop[]) => void }) => {
  const [value, setValue] = useState(stops)
  return (
    <GradientStopBar
      stops={value}
      onChange={(next) => {
        setValue(next)
        onChange?.(next)
      }}
    />
  )
}

describe('GradientStopBar', () => {
  it('makes each stop a slider with its place and color', async () => {
    const { container } = render(<Bar />)
    const [first, last] = screen.getAllByRole('slider')
    expect(first).toHaveAttribute('aria-valuenow', '0')
    expect(last).toHaveAttribute('aria-valuetext', '100%, #0000ff')
    expect(screen.getByRole('button', { name: 'Delete stop 1' })).toBeDisabled()
    await expectNoAxeViolations(container)
  })

  it('moves a stop by keyboard, keeping it chosen as it passes another', () => {
    const onChange = vi.fn()
    render(<Bar onChange={onChange} />)
    const first = screen.getAllByRole('slider')[0]!
    fireEvent.focus(first)
    fireEvent.keyDown(first, { key: 'ArrowRight', shiftKey: true })
    expect(onChange).toHaveBeenLastCalledWith([
      { offset: 0.1, color: '#ff0000' },
      { offset: 1, color: '#0000ff' },
    ])
    fireEvent.keyDown(screen.getAllByRole('slider')[0]!, { key: 'End' })
    // Now the red stop shares the end; it's still the chosen one.
    expect(screen.getByRole('button', { name: /Delete stop/ })).toHaveAccessibleName(
      /Delete stop \d/
    )
    expect(onChange.mock.lastCall![0].map((s: GradientColorStop) => s.offset)).toEqual([
      1, 1,
    ])
  })

  it('adds a stop by click with a blended color, or by Add, and deletes down to two', () => {
    const onChange = vi.fn()
    const { container } = render(<Bar onChange={onChange} />)
    sizeTrack(container)
    fireEvent.click(container.querySelector('.greese-GradientStopBar-preview')!, {
      clientX: 100,
    })
    expect(onChange).toHaveBeenLastCalledWith([
      stops[0],
      { offset: 0.5, color: '#800080' },
      stops[1],
    ])
    expect(screen.getAllByRole('slider')).toHaveLength(3)

    fireEvent.click(screen.getByRole('button', { name: 'Add stop' }))
    expect(screen.getAllByRole('slider')).toHaveLength(4)

    const slider = screen.getAllByRole('slider')[1]!
    fireEvent.focus(slider)
    fireEvent.keyDown(slider, { key: 'Delete' })
    fireEvent.click(screen.getByRole('button', { name: /Delete stop/ }))
    expect(screen.getAllByRole('slider')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Delete stop/ })).toBeDisabled()
  })

  it('keeps Delete from reaching a window-level shortcut', () => {
    const onWindowKey = vi.fn()
    window.addEventListener('keydown', onWindowKey)
    const { container } = render(<Bar />)
    sizeTrack(container)
    fireEvent.click(container.querySelector('.greese-GradientStopBar-preview')!, {
      clientX: 50,
    })
    fireEvent.keyDown(screen.getAllByRole('slider')[1]!, { key: 'Delete' })
    expect(onWindowKey).not.toHaveBeenCalled()
    window.removeEventListener('keydown', onWindowKey)
  })
})

describe('GradientEditor', () => {
  it('switches type keeping the stops, and turns the direction', async () => {
    const onChange = vi.fn()
    const { container } = render(<GradientEditor value={linear} onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Radial' }))
    expect(onChange.mock.lastCall![0]).toMatchObject({
      type: 'radial',
      stops,
      outerRadius: 0.5,
    })
    expect(screen.getByRole('spinbutton', { name: 'Start X' })).toHaveValue('0')
    const dial = screen.getByRole('slider', { name: 'Direction' })
    expect(dial).toHaveAttribute('aria-valuenow', '90')
    await expectNoAxeViolations(container)
  })

  it('shows a radial’s centers, radii and squash', () => {
    render(
      <GradientEditor
        value={{
          type: 'radial',
          cx: 0.5,
          cy: 0.5,
          innerRadius: 0,
          outerCx: 0.5,
          outerCy: 0.5,
          outerRadius: 0.5,
          rotation: 30,
          scaleY: 1,
          stops,
        }}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('spinbutton', { name: 'Outer radius' })).toHaveValue('0.5')
    expect(screen.getByRole('spinbutton', { name: 'Squash' })).toHaveValue('1')
    expect(screen.queryByRole('spinbutton', { name: 'Start X' })).not.toBeInTheDocument()
  })
})

describe('ComplexColorField', () => {
  const Paint = ({ initial }: { initial: ComplexColorValue }) => {
    const [value, setValue] = useState(initial)
    return <ComplexColorField label="Fill" value={value} onChange={setValue} allowNone />
  }

  it('switches kind, carrying the color across', async () => {
    const { container } = render(<Paint initial={{ type: 'solid', color: '#123456' }} />)
    expect(screen.getByRole('group', { name: 'Fill' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Gradient' }))
    expect(screen.getAllByRole('slider', { name: /^Stop/ })[0]).toHaveAttribute(
      'aria-valuetext',
      '0%, #123456'
    )
    fireEvent.click(screen.getByRole('radio', { name: 'None' }))
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('offers None only when asked', () => {
    render(
      <ComplexColorField
        label="Stroke"
        value={{ type: 'solid', color: '#000000' }}
        onChange={() => {}}
      />
    )
    expect(screen.queryByRole('radio', { name: 'None' })).not.toBeInTheDocument()
  })

  it('shows the picker in place, with its own kind names and a hidden label', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <ComplexColorField
        label="Ink"
        value={{ type: 'solid', color: '#ff0000' }}
        onChange={onChange}
        inlinePicker
        hideLabel
        kindLabels={{ solid: 'Flat', gradient: 'Blend' }}
      />
    )
    expect(screen.getByRole('group', { name: 'Ink' })).toBeInTheDocument()
    expect(screen.getByText('Ink')).not.toBeVisible()
    expect(screen.getByRole('radio', { name: 'Flat' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Blend' })).toBeInTheDocument()
    // No swatch that opens a popover: the picker's fields are already here.
    expect(container.querySelector('.greese-ColorPicker')).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })
})

describe('PropertyGrid and ToggleSelect', () => {
  it('sets its column count for the fields to line up in', () => {
    const { container } = render(
      <PropertyGrid columns={2}>
        <EditableField label="X" defaultValue={1} />
        <EditableField label="Y" defaultValue={2} />
      </PropertyGrid>
    )
    const grid = container.querySelector<HTMLElement>('.greese-PropertyGrid')!
    expect(grid.style.getPropertyValue('--greese-propertygrid-columns')).toBe('2')
    expect(screen.getByRole('spinbutton', { name: 'Y' })).toBeInTheDocument()
  })

  it('takes a choice only while toggled on', async () => {
    const onPressedChange = vi.fn()
    const onChange = vi.fn()
    const options = [
      { value: '4', label: '1/4' },
      { value: '8', label: '1/8' },
    ]
    const { container, rerender } = render(
      <ToggleSelect
        label="Snap"
        icon={<GridIcon />}
        pressed={false}
        onPressedChange={onPressedChange}
        value="4"
        onChange={onChange}
        options={options}
      />
    )
    expect(screen.getByRole('combobox', { name: 'Snap value' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Snap' }))
    expect(onPressedChange).toHaveBeenCalledWith(true)
    rerender(
      <ToggleSelect
        label="Snap"
        icon={<GridIcon />}
        pressed
        onPressedChange={onPressedChange}
        value="4"
        onChange={onChange}
        options={options}
      />
    )
    const select = screen.getByRole('combobox', { name: 'Snap value' })
    expect(screen.getByRole('button', { name: 'Snap' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    fireEvent.change(select, { target: { value: '8' } })
    expect(onChange).toHaveBeenCalledWith('8')
    await expectNoAxeViolations(container)
  })
})
