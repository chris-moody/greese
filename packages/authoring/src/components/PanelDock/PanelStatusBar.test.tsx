import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import { getContainerBreakpoints, resolveResponsive } from '@greese/react'
import { useRef } from 'react'
import { markResizing, PanelStatusBar } from './PanelStatusBar.tsx'
import { panelBreakpointAt, panelBreakpoints } from './panelBreakpoints.ts'

describe('the panel breakpoints', () => {
  it('are the stylesheet’s, registered for responsive props', () => {
    const scss = readFileSync(join(process.cwd(), 'src/styles/_PanelGroup.scss'), 'utf8')
    const written = Object.fromEntries(
      [...scss.matchAll(/^\s+(panel\w+): (\d+)px,$/gm)].map(([, key, px]) => [
        key,
        Number(px),
      ])
    )
    expect(written).toEqual(panelBreakpoints)
    expect(getContainerBreakpoints()).toMatchObject(panelBreakpoints)
    expect(
      resolveResponsive([
        [
          { xs: 12, panelsm: 6 },
          { block: 'greese-AutoLayoutItem', prop: 'size' },
        ],
      ]).className
    ).toBe('greese-AutoLayoutItem--xs-size-12 greese-AutoLayoutItem--panelsm-size-6')
  })

  it('name the one a width meets', () => {
    expect(panelBreakpointAt(100)).toBe('xs')
    expect(panelBreakpointAt(panelBreakpoints.panelsm)).toBe('panelsm')
    expect(panelBreakpointAt(panelBreakpoints.panelmd + 1)).toBe('panelmd')
    expect(panelBreakpointAt(5000)).toBe('panellg')
  })
})

describe('PanelStatusBar', () => {
  let observed: ((entries: unknown[]) => void) | undefined
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: (entries: unknown[]) => void) {
          observed = callback
        }
        observe() {}
        disconnect() {}
      }
    )
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  const Panel = () => {
    const body = useRef<HTMLDivElement>(null)
    return (
      <div data-testid="split">
        <div ref={body} />
        <PanelStatusBar target={body} />
      </div>
    )
  }
  const resize = (width: number, height: number) =>
    act(() => observed?.([{ contentRect: { width, height } }]))

  it('shows the size only while a resize gesture changes it, then leaves', () => {
    const { container, getByTestId } = render(<Panel />)
    const bar = () => container.querySelector('.greese-PanelGroup-status')

    // A change outside a gesture (the window, a docking) shows nothing.
    resize(300, 200)
    expect(bar()).toBeNull()

    markResizing(getByTestId('split'), true)
    resize(330.4, 210.6)
    expect(bar()).toHaveTextContent('330 × 211panelmd')
    // Held still mid-gesture, it stays.
    act(() => vi.advanceTimersByTime(2000))
    expect(bar()).not.toHaveAttribute('data-leaving')

    markResizing(getByTestId('split'), false)
    act(() => vi.advanceTimersByTime(600))
    expect(bar()).toHaveAttribute('data-leaving')
    // Gone once its exit transition ends.
    fireEvent.transitionEnd(bar()!)
    expect(bar()).toBeNull()
  })

  it('is gone without a transition, where motion is reduced to nothing', () => {
    const { container, getByTestId } = render(<Panel />)
    markResizing(getByTestId('split'), true)
    resize(250, 100)
    markResizing(getByTestId('split'), false)
    act(() => vi.advanceTimersByTime(600))
    act(() => vi.advanceTimersByTime(400))
    expect(container.querySelector('.greese-PanelGroup-status')).toBeNull()
  })
})
