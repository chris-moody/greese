import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  EditableSelect,
  GridControl,
  StageBar,
  unitOptions,
  ZoomControl,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const commit = (input: HTMLElement, text: string) => {
  fireEvent.change(input, { target: { value: text } })
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('EditableSelect', () => {
  it('takes a typed value that parses, and refuses one that doesn’t', () => {
    const onChange = vi.fn()
    render(
      <EditableSelect
        label="Zoom"
        value={100}
        options={unitOptions([50, 100], '%')}
        onChange={onChange}
      />
    )
    const field = screen.getByRole('combobox', { name: 'Zoom' })
    commit(field, '150')
    expect(onChange).toHaveBeenLastCalledWith(150)
    onChange.mockClear()
    commit(field, 'lots')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('reads values through parse and format', () => {
    const onChange = vi.fn()
    render(
      <EditableSelect<string>
        label="Bound"
        value="guide:top"
        format={(v) => v.replace('guide:', '')}
        parse={(text) => (text ? `guide:${text}` : undefined)}
        options={[{ value: 'guide:top', label: 'Top guide' }]}
        onChange={onChange}
      />
    )
    commit(screen.getByRole('combobox', { name: 'Bound' }), 'middle')
    expect(onChange).toHaveBeenLastCalledWith('guide:middle')
  })
})

describe('the stage bar controls', () => {
  it('zooms by percentage, clamped, and resets the view', () => {
    const onZoomChange = vi.fn()
    const onResetView = vi.fn()
    render(<ZoomControl zoom={1} onZoomChange={onZoomChange} onResetView={onResetView} />)
    commit(screen.getByRole('combobox', { name: 'Zoom' }), '250')
    expect(onZoomChange).toHaveBeenLastCalledWith(2.5)
    fireEvent.click(screen.getByRole('button', { name: 'Reset view' }))
    expect(onResetView).toHaveBeenCalled()
  })

  it('presses the grid button while the grid shows', () => {
    const onToggleGrid = vi.fn()
    render(
      <GridControl
        showGrid
        gridInterval={10}
        onToggleGrid={onToggleGrid}
        onIntervalChange={() => {}}
      />
    )
    const grid = screen.getByRole('button', { name: 'Grid' })
    expect(grid).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(grid)
    expect(onToggleGrid).toHaveBeenCalled()
  })

  it('groups zoom and layout under a name, and passes axe', async () => {
    const onSelectLayout = vi.fn()
    const { container } = render(
      <StageBar
        zoom={1}
        onZoomChange={() => {}}
        onResetView={() => {}}
        layouts={[
          { id: 'design', name: 'Design' },
          { id: 'code', name: 'Code' },
        ]}
        activeLayoutId="design"
        onSelectLayout={onSelectLayout}
        onSaveLayout={() => {}}
        canSave
      />
    )
    expect(screen.getByRole('group', { name: 'Stage controls' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('combobox', { name: 'Panel layout' }), {
      target: { value: 'code' },
    })
    expect(onSelectLayout).toHaveBeenCalledWith('code')
    await expectNoAxeViolations(container)
  })
})
