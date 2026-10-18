import { createRef } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { composeRefs, Slot, Slottable } from './Slot.tsx'

describe('Slot', () => {
  it('renders the child element with merged props, child winning', () => {
    render(
      <Slot
        id="slot"
        title="slot"
        className="from-slot"
        style={{ color: 'red', margin: 1 }}
      >
        <a href="/x" title="child" className="from-child" style={{ color: 'blue' }}>
          link
        </a>
      </Slot>
    )
    const link = screen.getByRole('link', { name: 'link' })
    expect(link).toHaveAttribute('id', 'slot')
    expect(link).toHaveAttribute('title', 'child')
    expect(link).toHaveClass('from-slot', 'from-child')
    expect(link).toHaveStyle({ color: 'rgb(0, 0, 255)', margin: '1px' })
  })

  it('runs both event handlers, child first', () => {
    const calls: string[] = []
    render(
      <Slot onClick={() => calls.push('slot')}>
        <button onClick={() => calls.push('child')}>go</button>
      </Slot>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(calls).toEqual(['child', 'slot'])
  })

  it('keeps a lone slot handler or style', () => {
    const onClick = vi.fn()
    render(
      <Slot onClick={onClick} style={{ color: 'red' }}>
        <button>go</button>
      </Slot>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole('button')).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  it('composes the slot ref with the child ref', () => {
    const slotRef = createRef<HTMLElement>()
    const childRef = createRef<HTMLButtonElement>()
    const { unmount } = render(
      <Slot ref={slotRef}>
        <button ref={childRef}>go</button>
      </Slot>
    )
    expect(slotRef.current).toBe(screen.getByRole('button'))
    expect(childRef.current).toBe(screen.getByRole('button'))
    unmount()
    expect(slotRef.current).toBeNull()
    expect(childRef.current).toBeNull()
  })

  it('renders nothing for a non-element child and throws for several', () => {
    const { container } = render(<Slot>text</Slot>)
    expect(container).toBeEmptyDOMElement()
    expect(() =>
      render(
        <Slot>
          <span />
          <span />
        </Slot>
      )
    ).toThrow(/exactly one React element/)
  })
})

describe('Slottable', () => {
  it('makes its child the host and places siblings around the host children', () => {
    render(
      <Slot className="from-slot">
        <i>before</i>
        <Slottable>
          <a href="/x" className="from-child">
            label
          </a>
        </Slottable>
        <i>after</i>
      </Slot>
    )
    const link = screen.getByRole('link')
    expect(link).toHaveClass('from-slot', 'from-child')
    expect(link.textContent).toBe('beforelabelafter')
  })

  it('renders nothing when its child is not an element, and passes through outside a Slot', () => {
    const { container } = render(
      <Slot>
        <Slottable>text</Slottable>
      </Slot>
    )
    expect(container).toBeEmptyDOMElement()
    render(<Slottable>plain</Slottable>)
    expect(screen.getByText('plain')).toBeInTheDocument()
  })
})

describe('composeRefs', () => {
  it('returns a single ref unchanged, for a stable identity', () => {
    const ref = createRef<HTMLElement>()
    expect(composeRefs(ref, undefined)).toBe(ref)
    expect(composeRefs()).toBeUndefined()
  })

  it('runs callback-ref cleanups instead of calling them with null', () => {
    const cleanup = vi.fn()
    const callback = vi.fn(() => cleanup)
    const object = createRef<HTMLElement>()
    const composed = composeRefs<HTMLElement>(callback, object) as (
      n: HTMLElement | null
    ) => () => void
    const node = document.createElement('div')
    const dispose = composed(node)
    expect(callback).toHaveBeenCalledWith(node)
    dispose()
    expect(cleanup).toHaveBeenCalledOnce()
    expect(callback).toHaveBeenCalledTimes(1)
    expect(object.current).toBeNull()
  })
})
