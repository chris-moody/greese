import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard.ts'
import { expectNoAxeViolations } from '../test/axe.ts'
import { Button } from './Button/Button.tsx'
import { CopyToClipboard } from './CopyToClipboard/CopyToClipboard.tsx'

let writeText: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>

beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
})
afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard')
  vi.useRealTimers()
})

const refuse = () => {
  writeText.mockRejectedValue(new Error('NotAllowedError'))
  // jsdom has no execCommand, so the fallback fails too.
}

describe('useCopyToClipboard', () => {
  it('copies, reports copied, then goes back to idle', async () => {
    vi.useFakeTimers()
    const onCopy = vi.fn()
    const { result } = renderHook(() => useCopyToClipboard({ resetAfter: 500, onCopy }))
    expect(result.current.status).toBe('idle')
    await act(async () => {
      expect(await result.current.copy('hi')).toBe(true)
    })
    expect(writeText).toHaveBeenCalledWith('hi')
    expect(onCopy).toHaveBeenCalledWith('hi')
    expect(result.current.copied).toBe(true)
    act(() => vi.advanceTimersByTime(500))
    expect(result.current.status).toBe('idle')
  })

  it('reports a refusal without throwing', async () => {
    refuse()
    const onCopyError = vi.fn()
    const { result } = renderHook(() => useCopyToClipboard({ onCopyError }))
    await act(async () => {
      expect(await result.current.copy('hi')).toBe(false)
    })
    expect(result.current.status).toBe('failed')
    expect(onCopyError).toHaveBeenCalledWith(expect.any(Error))
    act(() => result.current.reset())
    expect(result.current.status).toBe('idle')
  })

  it('keeps copy the same function across renders', () => {
    const { result, rerender } = renderHook(() =>
      useCopyToClipboard({ onCopy: () => {} })
    )
    const first = result.current.copy
    rerender()
    expect(result.current.copy).toBe(first)
  })
})

describe('CopyToClipboard', () => {
  it('copies on its child’s click, marks the child and announces it', async () => {
    const { container } = render(
      <CopyToClipboard text="npm i @greese/react">
        <Button>Copy</Button>
      </CopyToClipboard>
    )
    const button = screen.getByRole('button', { name: 'Copy' })
    await act(async () => fireEvent.click(button))
    expect(writeText).toHaveBeenCalledWith('npm i @greese/react')
    expect(button).toHaveAttribute('data-copy-status', 'copied')
    expect(screen.getByRole('status')).toHaveTextContent('Copied')
    await expectNoAxeViolations(container)
  })

  it('reads the text at the click, and passes its state to a function child', async () => {
    let value = 'first'
    render(
      <CopyToClipboard text={() => value}>
        {({ copied }) => <button type="button">{copied ? 'Done' : 'Copy'}</button>}
      </CopyToClipboard>
    )
    value = 'second'
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Copy' })))
    expect(writeText).toHaveBeenCalledWith('second')
    expect(screen.getByRole('button', { name: 'Done' })).toBeInTheDocument()
  })

  it('runs the child’s own onClick first, which can cancel the copy', async () => {
    const onClick = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault()
    )
    render(
      <CopyToClipboard text="x">
        <button type="button" onClick={onClick}>
          Copy
        </button>
      </CopyToClipboard>
    )
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(onClick).toHaveBeenCalled()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('announces a refusal with its own message, or nothing with announce={false}', async () => {
    refuse()
    const { rerender } = render(
      <CopyToClipboard text="x" failedMessage="Blocked">
        <button type="button">Copy</button>
      </CopyToClipboard>
    )
    await act(async () => fireEvent.click(screen.getByRole('button')))
    expect(screen.getByRole('status')).toHaveTextContent('Blocked')
    expect(screen.getByRole('button')).toHaveAttribute('data-copy-status', 'failed')
    rerender(
      <CopyToClipboard text="x" announce={false}>
        <button type="button">Copy</button>
      </CopyToClipboard>
    )
    expect(screen.queryByRole('status')).toBeNull()
  })
})
