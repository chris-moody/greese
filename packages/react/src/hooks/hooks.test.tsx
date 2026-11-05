import { act, render, renderHook, screen } from '@testing-library/react'
import { useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setMedia } from '../test/matchMedia.ts'
import {
  configureBreakpoints,
  getBreakpointKeys,
  getBreakpoints,
  resetBreakpoints,
} from '../utils/breakpoints.ts'
import { isSpaceToken, resolveResponsive } from '../utils/responsive.ts'
import { resolveAt, useBreakpoint, useBreakpointValue } from './useBreakpoint.ts'
import { useStoredState } from './useStoredState.ts'
import { useColorScheme } from './useColorScheme.ts'
import { useControllableState } from './useControllableState.ts'
import { useMediaQuery } from './useMediaQuery.ts'
import { useTokenColors } from './useTokenColors.ts'

beforeEach(() => setMedia({ width: 1024, dark: false }))

describe('useMediaQuery', () => {
  it('tracks the query live', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 900px)'))
    expect(result.current).toBe(true)
    act(() => setMedia({ width: 500 }))
    expect(result.current).toBe(false)
  })

  it('uses ssrMatch on the server', () => {
    const Probe = () => (
      <>{String(useMediaQuery('(min-width: 1px)', { ssrMatch: true }))}</>
    )
    expect(renderToString(<Probe />)).toBe('true')
  })
})

describe('useBreakpoint', () => {
  it.each([
    [0, 'xs'],
    [599, 'xs'],
    [600, 'sm'],
    [900, 'md'],
    [1200, 'lg'],
    [1536, 'xl'],
  ])('at %ipx is %s', (width, bp) => {
    setMedia({ width })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe(bp)
  })

  it('updates when the viewport crosses a boundary', () => {
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('md')
    act(() => setMedia({ width: 1300 }))
    expect(result.current).toBe('lg')
  })

  it('assumes xs (or the given breakpoint) on the server', () => {
    const Probe = ({ ssr }: { ssr?: 'lg' }) => (
      <>{useBreakpoint({ ssrBreakpoint: ssr })}</>
    )
    expect(renderToString(<Probe />)).toBe('xs')
    expect(renderToString(<Probe ssr="lg" />)).toBe('lg')
  })
})

describe('useBreakpointValue / resolveAt', () => {
  it('falls back to the nearest smaller breakpoint', () => {
    expect(resolveAt({ xs: 1, md: 3 }, 'sm')).toBe(1)
    expect(resolveAt({ xs: 1, md: 3 }, 'xl')).toBe(3)
    expect(resolveAt({ md: 3 }, 'sm')).toBeUndefined()
    expect(resolveAt(5, 'lg')).toBe(5)
  })

  it('follows the viewport', () => {
    const { result } = renderHook(() => useBreakpointValue({ xs: 'stack', md: 'row' }))
    expect(result.current).toBe('row')
    act(() => setMedia({ width: 320 }))
    expect(result.current).toBe('stack')
  })
})

describe('useControllableState', () => {
  it('works uncontrolled, reporting changes after commit', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useControllableState({ defaultValue: 1, onChange })
    )
    act(() => result.current[1]((n) => n + 1))
    act(() => result.current[1]((n) => n + 1))
    expect(result.current[0]).toBe(3)
    expect(onChange.mock.calls).toEqual([[2], [3]])
  })

  it('works controlled: reports, but only the parent changes the value', () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ value }) => useControllableState({ value, defaultValue: 0, onChange }),
      { initialProps: { value: 5 } }
    )
    act(() => result.current[1]((n) => n * 2))
    expect(onChange).toHaveBeenCalledWith(10)
    expect(result.current[0]).toBe(5)
    rerender({ value: 10 })
    expect(result.current[0]).toBe(10)
    act(() => result.current[1](10))
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('keeps a stable setter', () => {
    const { result, rerender } = renderHook(() =>
      useControllableState({ defaultValue: 'a' })
    )
    const first = result.current[1]
    act(() => first('b'))
    rerender()
    expect(result.current[1]).toBe(first)
  })
})

describe('useColorScheme', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-greese-scheme')
    localStorage.clear()
  })

  it('defaults to system, resolved against the OS', () => {
    const { result } = renderHook(() => useColorScheme())
    expect(result.current.scheme).toBe('system')
    expect(result.current.resolvedScheme).toBe('light')
    act(() => setMedia({ dark: true }))
    expect(result.current.resolvedScheme).toBe('dark')
  })

  it('applies a choice with one attribute write, and persists it', async () => {
    const { result } = renderHook(() => useColorScheme())
    await act(async () => result.current.setScheme('dark'))
    expect(document.documentElement.getAttribute('data-greese-scheme')).toBe('dark')
    expect(localStorage.getItem('greese-scheme')).toBe('dark')
    expect(result.current).toMatchObject({ scheme: 'dark', resolvedScheme: 'dark' })

    await act(async () => result.current.setScheme('system'))
    expect(document.documentElement.hasAttribute('data-greese-scheme')).toBe(false)
    expect(localStorage.getItem('greese-scheme')).toBeNull()
    expect(result.current.scheme).toBe('system')
  })

  it('picks up changes made outside React, e.g. by the pre-paint script', async () => {
    const Probe = () => <p>{useColorScheme().scheme}</p>
    render(<Probe />)
    await act(async () =>
      document.documentElement.setAttribute('data-greese-scheme', 'light')
    )
    expect(screen.getByText('light')).toBeInTheDocument()
  })

  it('still applies the scheme when storage is unavailable', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useColorScheme({ storageKey: 'k' }))
    await act(async () => result.current.setScheme('dark'))
    expect(document.documentElement.getAttribute('data-greese-scheme')).toBe('dark')
    setItem.mockRestore()
  })
})

describe('useTokenColors', () => {
  /**
   * The values come from `getComputedStyle`, which jsdom resolves from the
   * stylesheet rather than from an inherited custom property, so the test
   * declares them on the element itself.
   */
  const withTokens = (declarations: string) => {
    const style = document.createElement('style')
    style.textContent = `.probe { ${declarations} }`
    document.head.append(style)
    return () => style.remove()
  }

  const Probe = ({
    roles,
    onRead,
  }: {
    roles: string[]
    onRead: (v: string[]) => void
  }) => {
    const ref = useRef<HTMLDivElement>(null)
    const values = useTokenColors(ref, ...roles)
    onRead(values)
    return <div ref={ref} className="probe" />
  }

  it('resolves each role, in the order given', () => {
    const cleanup = withTokens(
      '--greese-color-fg-muted: rgb(1, 2, 3); --greese-color-surface: rgb(4, 5, 6);'
    )
    const reads: string[][] = []
    render(<Probe roles={['fg-muted', 'surface']} onRead={(v) => reads.push(v)} />)
    expect(reads.at(-1)).toEqual(['rgb(1,2,3)', 'rgb(4,5,6)'])
    cleanup()
  })

  it('resolves a role a theme added, not only the ones greese ships', () => {
    const cleanup = withTokens('--greese-color-brand-glow: rgb(7, 8, 9);')
    const reads: string[][] = []
    render(<Probe roles={['brand-glow']} onRead={(v) => reads.push(v)} />)
    expect(reads.at(-1)).toEqual(['rgb(7,8,9)'])
    cleanup()
  })

  it('gives an empty string for a token that does not exist', () => {
    const reads: string[][] = []
    render(<Probe roles={['not-a-role']} onRead={(v) => reads.push(v)} />)
    expect(reads.at(-1)).toEqual([''])
  })

  it('returns the same tuple while the values are unchanged', () => {
    const cleanup = withTokens('--greese-color-fg: rgb(1, 1, 1);')
    const reads: string[][] = []
    const { rerender } = render(<Probe roles={['fg']} onRead={(v) => reads.push(v)} />)
    rerender(<Probe roles={['fg']} onRead={(v) => reads.push(v)} />)
    // Identity, not just equality: it is meant to be safe as an effect dep.
    expect(reads.at(-1)).toBe(reads.at(-2))
    cleanup()
  })

  it('has one value per role before the first measurement', () => {
    const reads: string[][] = []
    render(<Probe roles={['fg', 'surface', 'border']} onRead={(v) => reads.push(v)} />)
    expect(reads[0]).toEqual(['', '', ''])
  })
})

describe('configureBreakpoints', () => {
  afterEach(resetBreakpoints)

  it('moves the boundaries the hooks use', () => {
    configureBreakpoints({ sm: 480, md: 768 })
    expect(getBreakpoints()).toMatchObject({ xs: 0, sm: 480, md: 768, lg: 1200 })
    setMedia({ width: 800 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('md')
  })

  it('takes new keys, ordered by value, in the hooks and in responsive classes', () => {
    configureBreakpoints({ tablet: 700 })
    expect(getBreakpointKeys()).toEqual(['xs', 'sm', 'tablet', 'md', 'lg', 'xl'])
    setMedia({ width: 750 })
    const { result } = renderHook(() => useBreakpoint())
    expect(result.current).toBe('tablet')
    const value = { xs: 'a', tablet: 'b' } as never
    expect(resolveAt(value, 'md' as never)).toBe('b')
    expect(resolveAt(value, 'sm' as never)).toBe('a')
    const { className } = resolveResponsive(
      [
        [
          { tablet: 2 } as never,
          { block: 'greese-Stack', prop: 'gap', isToken: isSpaceToken },
        ],
      ],
      {}
    )
    expect(className).toBe('greese-Stack--tablet-gap-2')
  })

  it('rejects a new key that shares a value, or sits out of order', () => {
    expect(() => configureBreakpoints({ tablet: 900 })).toThrow(/its own value/)
    expect(() => configureBreakpoints({ tablet: 0 })).toThrow(/its own value/)
    expect(getBreakpointKeys()).toEqual(['xs', 'sm', 'md', 'lg', 'xl'])
  })

  it('rejects values that do not increase', () => {
    expect(() => configureBreakpoints({ md: 500 })).toThrow(/must increase/)
    expect(getBreakpoints().md).toBe(900)
  })

  it('reads the stylesheet’s own with no argument, and keeps them without one', () => {
    const style = document.createElement('style')
    style.textContent = `:root {
      --greese-breakpoint-keys: xs sm tablet md lg xl;
      --greese-breakpoint-xs: 0px; --greese-breakpoint-sm: 600px;
      --greese-breakpoint-tablet: 768px; --greese-breakpoint-md: 900px;
      --greese-breakpoint-lg: 1200px; --greese-breakpoint-xl: 1536px;
    }`
    document.head.append(style)
    try {
      configureBreakpoints()
      expect(getBreakpointKeys()).toEqual(['xs', 'sm', 'tablet', 'md', 'lg', 'xl'])
      expect(getBreakpoints()).toMatchObject({ tablet: 768, md: 900 })
    } finally {
      style.remove()
    }
    // No stylesheet: nothing to read, so nothing changes.
    resetBreakpoints()
    configureBreakpoints()
    expect(getBreakpointKeys()).toEqual(['xs', 'sm', 'md', 'lg', 'xl'])
  })
})

describe('useStoredState', () => {
  afterEach(() => localStorage.clear())

  it('keeps state in localStorage, shared by every reader of the key', () => {
    const a = renderHook(() => useStoredState('t-hook', 'grid'))
    const b = renderHook(() => useStoredState('t-hook', 'grid'))
    expect(a.result.current[0]).toBe('grid')
    act(() => a.result.current[1]('list'))
    expect(localStorage.getItem('t-hook')).toBe('"list"')
    expect(b.result.current[0]).toBe('list')
    act(() => b.result.current[2]())
    expect(a.result.current[0]).toBe('grid')
  })

  it('follows another tab', () => {
    const { result } = renderHook(() => useStoredState('t-tab', 0))
    act(() => {
      localStorage.setItem('t-tab', '7')
      window.dispatchEvent(new StorageEvent('storage', { key: 't-tab' }))
    })
    expect(result.current[0]).toBe(7)
  })

  it('renders the fallback on the server', () => {
    const Show = () => <span>{useStoredState('t-ssr', 'fallback')[0]}</span>
    expect(renderToString(<Show />)).toContain('fallback')
  })
})
