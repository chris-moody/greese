import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import {
  CircleIcon,
  NavigateIcon,
  RectangleIcon,
  StarIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from '@greese/icons'
import {
  createToolCursors,
  Toolbar,
  ToolOptionsPanel,
  useToolHotkeys,
  type ToolDefinition,
} from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

type Tool = 'select' | 'shapes' | 'rect' | 'ellipse' | 'star' | 'zoom'

const tools: ToolDefinition<Tool>[] = [
  { id: 'select', label: 'Select', hotkey: 'v', icon: <NavigateIcon />, cursor: false },
  {
    id: 'shapes',
    label: 'Shapes',
    group: 'draw',
    icon: <RectangleIcon />,
    subTools: [
      { id: 'rect', label: 'Rectangle', hotkey: 'r', icon: <RectangleIcon /> },
      { id: 'ellipse', label: 'Ellipse', hotkey: 'e', icon: <CircleIcon /> },
    ],
  },
  { id: 'star', label: 'Star', hotkey: 's', group: 'draw', icon: <StarIcon /> },
  { id: 'zoom', label: 'Zoom', hotkey: 'z', group: 'view', icon: <ZoomInIcon /> },
]

interface PaletteProps {
  initial?: Tool
  onChange?: (tool: Tool) => void
}

const Palette = ({ initial = 'select', onChange }: PaletteProps) => {
  const [tool, setTool] = useState<Tool>(initial)
  return (
    <Toolbar
      tools={tools}
      value={tool}
      onValueChange={(next) => {
        setTool(next)
        onChange?.(next)
      }}
    />
  )
}

describe('Toolbar', () => {
  it('is a toolbar of pressed-state buttons, one per tool or group', async () => {
    const { container } = render(<Palette />)
    const bar = screen.getByRole('toolbar', { name: 'Tools' })
    expect(bar).toHaveAttribute('aria-orientation', 'vertical')
    expect(screen.getByRole('button', { name: 'Select' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Rectangle' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getByRole('button', { name: 'Star' })).toHaveAttribute(
      'aria-keyshortcuts',
      'S'
    )
    // Groups are set apart: draw, then view.
    expect(container.querySelectorAll('.greese-Toolbar-separator')).toHaveLength(2)
    await expectNoAxeViolations(container)
  })

  it('has one tab stop that the arrows, Home and End move', () => {
    render(<Palette />)
    const select = screen.getByRole('button', { name: 'Select' })
    const rect = screen.getByRole('button', { name: 'Rectangle' })
    const zoom = screen.getByRole('button', { name: 'Zoom' })
    expect(select).toHaveAttribute('tabindex', '0')
    expect(rect).toHaveAttribute('tabindex', '-1')

    select.focus()
    fireEvent.keyDown(select, { key: 'ArrowDown' })
    expect(rect).toHaveFocus()
    expect(rect).toHaveAttribute('tabindex', '0')
    expect(select).toHaveAttribute('tabindex', '-1')
    fireEvent.keyDown(rect, { key: 'End' })
    expect(zoom).toHaveFocus()
    fireEvent.keyDown(zoom, { key: 'ArrowDown' })
    expect(select).toHaveFocus()
    fireEvent.keyDown(select, { key: 'ArrowUp' })
    expect(zoom).toHaveFocus()
    fireEvent.keyDown(zoom, { key: 'Home' })
    expect(select).toHaveFocus()
  })

  it('picks a tool, and a group picks its last-used tool', () => {
    const onChange = vi.fn()
    render(<Palette onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rectangle' }))
    expect(onChange).toHaveBeenLastCalledWith('rect')

    // From the flyout: the group's button then shows and picks Ellipse.
    fireEvent.click(screen.getByRole('button', { name: 'Shapes tools' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ellipse (E)' }))
    expect(onChange).toHaveBeenLastCalledWith('ellipse')
    const group = screen.getByRole('button', { name: 'Ellipse' })
    expect(group).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: 'Star' }))
    expect(screen.getByRole('button', { name: 'Ellipse' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ellipse' }))
    expect(onChange).toHaveBeenLastCalledWith('ellipse')
  })

  it('opens a group’s flyout with the arrow across the toolbar', () => {
    render(<Palette />)
    const group = screen.getByRole('button', { name: 'Rectangle' })
    const flyout = screen.getByRole('button', { name: 'Shapes tools' })
    const open = vi.fn()
    flyout.addEventListener('click', open)
    fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(open).toHaveBeenCalledOnce()
    fireEvent.contextMenu(group)
    expect(open).toHaveBeenCalledTimes(2)
    // A plain tool has no flyout to open.
    fireEvent.keyDown(screen.getByRole('button', { name: 'Star' }), { key: 'ArrowRight' })
    expect(open).toHaveBeenCalledTimes(2)
  })

  it('runs horizontally, with Left and Right', () => {
    render(
      <Toolbar
        tools={tools}
        value="zoom"
        onValueChange={() => {}}
        orientation="horizontal"
      />
    )
    const zoom = screen.getByRole('button', { name: 'Zoom' })
    expect(zoom).toHaveAttribute('tabindex', '0')
    zoom.focus()
    fireEvent.keyDown(zoom, { key: 'ArrowLeft' })
    expect(screen.getByRole('button', { name: 'Star' })).toHaveFocus()
  })
})

describe('useToolHotkeys', () => {
  it('picks a tool from its key, but not while typing or with a modifier', () => {
    const onSelect = vi.fn()
    renderHook(() => useToolHotkeys(tools, onSelect))
    fireEvent.keyDown(window, { key: 'E' })
    expect(onSelect).toHaveBeenLastCalledWith('ellipse')
    fireEvent.keyDown(window, { key: 'v', metaKey: true })
    expect(onSelect).toHaveBeenCalledOnce()

    const input = document.body.appendChild(document.createElement('input'))
    fireEvent.keyDown(input, { key: 'v' })
    expect(onSelect).toHaveBeenCalledOnce()
    input.remove()
  })

  it('stops listening while disabled', () => {
    const onSelect = vi.fn()
    renderHook(() => useToolHotkeys(tools, onSelect, { disabled: true }))
    fireEvent.keyDown(window, { key: 'v' })
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('createToolCursors', () => {
  it('draws a tool’s icon as its cursor, once, and keeps the pointer for cursor: false', () => {
    const cursorFor = createToolCursors(tools, { zoom: { out: <ZoomOutIcon /> } })
    expect(cursorFor('select')).toBe('default')
    const rect = cursorFor('rect')
    expect(rect).toMatch(/^url\("data:image\/svg\+xml,.+"\) 4 4, auto$/)
    expect(cursorFor('rect')).toBe(rect)
    expect(cursorFor('zoom', 'out')).not.toBe(cursorFor('zoom'))
    expect(cursorFor('zoom', 'missing')).toBe(cursorFor('zoom'))
  })
})

describe('ToolOptionsPanel', () => {
  it('heads the options with the tool, and explains it behind About', async () => {
    const { container } = render(
      <ToolOptionsPanel tool={{ label: 'Star', description: 'Drag to draw a star.' }}>
        <label>
          Points <input type="number" defaultValue={5} />
        </label>
      </ToolOptionsPanel>
    )
    expect(screen.getByText('Star')).toBeInTheDocument()
    expect(screen.getByRole('spinbutton', { name: 'Points' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'About Star' })).toBeInTheDocument()
    await expectNoAxeViolations(container)
  })

  it('says when a tool has no options', () => {
    render(<ToolOptionsPanel tool={{ label: 'Zoom' }} />)
    expect(screen.getByText('Zoom has no options.')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
