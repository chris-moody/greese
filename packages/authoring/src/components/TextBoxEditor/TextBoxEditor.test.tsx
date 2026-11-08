import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TextBoxEditor } from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const rect = { x: 10, y: 20, width: 120, height: 40 }

describe('TextBoxEditor', () => {
  it('opens over the box with its words, focused, the caret at the end', async () => {
    const { container } = render(
      <TextBoxEditor rect={rect} defaultValue="Hello" aria-label="Title" />
    )
    const box = screen.getByRole('textbox', { name: 'Title' })
    expect(box).toHaveTextContent('Hello')
    expect(box).toHaveFocus()
    expect(box.style.insetInlineStart).toBe('10px')
    expect(box.style.inlineSize).toBe('120px')
    const selection = document.getSelection()!
    expect(selection.isCollapsed).toBe(true)
    expect(selection.anchorNode).toBe(box)
    expect(selection.anchorOffset).toBe(box.childNodes.length)
    await expectNoAxeViolations(container)
  })

  it('reports the words as typed, and once when editing ends', () => {
    const onValueChange = vi.fn()
    const onDone = vi.fn()
    render(
      <TextBoxEditor
        rect={rect}
        defaultValue="Hi"
        onValueChange={onValueChange}
        onDone={onDone}
      />
    )
    const box = screen.getByRole('textbox')
    box.textContent = 'Hi there'
    fireEvent.input(box)
    expect(onValueChange).toHaveBeenCalledWith(expect.stringContaining('Hi there'))
    fireEvent.keyDown(box, { key: 'Escape' })
    fireEvent.blur(box)
    expect(onDone).toHaveBeenCalledTimes(1)
  })

  it('keeps a press from reaching the stage under it', () => {
    const onPointerDown = vi.fn()
    render(
      <div onPointerDown={onPointerDown}>
        <TextBoxEditor rect={rect} defaultValue="" />
      </div>
    )
    fireEvent.pointerDown(screen.getByRole('textbox'))
    expect(onPointerDown).not.toHaveBeenCalled()
  })
})
