import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { CodeEditor, Highlighted, type CodeRange } from '../../index.ts'
import { expectNoAxeViolations } from '../../test/axe.ts'

const svg = '<svg viewBox="0 0 24 24">\n  <path d="M0 0Z"/>\n</svg>'

describe('CodeEditor', () => {
  it('colours the code under an editable textarea', async () => {
    const onChange = vi.fn()
    const { container } = render(
      <CodeEditor aria-label="SVG" language="xml" value={svg} onChange={onChange} />
    )
    const box = screen.getByRole('textbox', { name: 'SVG' })
    expect(box).toHaveValue(svg)
    expect(container.querySelector('.greese-CodeToken--tag')).toHaveTextContent('svg')
    expect(container.querySelector('.greese-CodeToken--attribute')).toHaveTextContent(
      'viewBox'
    )
    // The layer is the same text, so it lines up with what's typed.
    expect(container.querySelector('.greese-CodeEditor-layer')!.textContent).toBe(
      `${svg}\n`
    )
    fireEvent.change(box, { target: { value: '<g/>' } })
    expect(onChange).toHaveBeenCalledWith('<g/>')
    await expectNoAxeViolations(container)
  })

  it('lights a span, cut at its edges', () => {
    const start = svg.indexOf('<path')
    const end = svg.indexOf('/>') + 2
    const { container } = render(
      <CodeEditor
        aria-label="SVG"
        language="xml"
        value={svg}
        highlight={{ start, end }}
      />
    )
    expect(container.querySelector('.greese-CodeEditor-highlight')!.textContent).toBe(
      '<path d="M0 0Z"/>'
    )
  })

  it('marks a line, invalid', () => {
    const { container } = render(
      <CodeEditor aria-label="CSS" language="css" value=".a {" markLine={3} invalid />
    )
    const mark = container.querySelector<HTMLElement>('.greese-CodeEditor-mark')!
    expect(mark.style.getPropertyValue('--greese-codeeditor-line')).toBe('2')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('selects the span it’s given, and reports the reader’s selection', () => {
    const reported: CodeRange[] = []
    const Synced = () => {
      const [selection, setSelection] = useState<CodeRange>({ start: 5, end: 12 })
      return (
        <>
          <CodeEditor
            aria-label="SVG"
            language="xml"
            value={svg}
            selection={selection}
            onSelectionChange={(next) => reported.push(next)}
          />
          <button type="button" onClick={() => setSelection({ start: 0, end: 4 })}>
            Select svg
          </button>
        </>
      )
    }
    render(<Synced />)
    const box = screen.getByRole<HTMLTextAreaElement>('textbox')
    expect([box.selectionStart, box.selectionEnd]).toEqual([5, 12])
    expect(box).not.toHaveFocus()
    fireEvent.click(screen.getByRole('button', { name: 'Select svg' }))
    expect([box.selectionStart, box.selectionEnd]).toEqual([0, 4])

    box.setSelectionRange(1, 3)
    fireEvent.select(box)
    expect(reported.at(-1)).toEqual({ start: 1, end: 3 })
  })

  it('is read-only without onChange', () => {
    render(<CodeEditor aria-label="Markup" language="xml" value="<svg/>" />)
    expect(screen.getByRole('textbox', { name: 'Markup' })).toHaveAttribute('readonly')
  })

  it('doesn’t pull the caret back to a span that hasn’t changed as you type', () => {
    const Editor = () => {
      const [value, setValue] = useState(svg)
      return (
        <CodeEditor
          aria-label="SVG"
          language="xml"
          value={value}
          onChange={setValue}
          selection={{ start: 5, end: 12 }}
        />
      )
    }
    render(<Editor />)
    const box = screen.getByRole<HTMLTextAreaElement>('textbox')
    expect([box.selectionStart, box.selectionEnd]).toEqual([5, 12])
    box.setSelectionRange(box.value.length, box.value.length)
    fireEvent.change(box, { target: { value: `${box.value}\n` } })
    expect(box.selectionStart).not.toBe(5)
  })

  it('colours read-only code', () => {
    const { container } = render(
      <pre className="greese-CodeEditor-static">
        <Highlighted value="a { color: red }" language="css" />
      </pre>
    )
    expect(container.querySelector('.greese-CodeToken--property')).toHaveTextContent(
      'color'
    )
  })
})
