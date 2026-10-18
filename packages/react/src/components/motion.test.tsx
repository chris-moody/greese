import { useRef } from 'react'
import { renderToString } from 'react-dom/server'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setMedia } from '../test/matchMedia.ts'
import { useTimeline } from '../hooks/useTimeline.ts'
import {
  cssEase,
  needsRuntime,
  resolveGreese,
  type GreeseOptions,
} from '../utils/greese.ts'
import { Button } from './Button/Button.tsx'
import { Card } from './Card/Card.tsx'
import { Dialog } from './Dialog/Dialog.tsx'
import { Motion } from './Motion/Motion.tsx'
import { loadGreeseRuntime } from './Motion/registry.ts'
import { Stack } from './Stack/Stack.tsx'
import { Text } from './Text/Text.tsx'

/** Captures IntersectionObserver callbacks so tests can scroll things into view. */
const observers: Array<{
  callback: IntersectionObserverCallback
  disconnected: boolean
}> = []
class FakeIntersectionObserver {
  record: (typeof observers)[number]
  constructor(callback: IntersectionObserverCallback) {
    this.record = { callback, disconnected: false }
    observers.push(this.record)
  }
  observe() {}
  disconnect() {
    this.record.disconnected = true
  }
}
const scrollIntoView = (isIntersecting: boolean) =>
  act(() => {
    for (const o of observers.filter((o) => !o.disconnected)) {
      o.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    }
  })

/** Lets the lazily loaded runtime attach. */
const attached = () => act(async () => void (await loadGreeseRuntime()))

beforeEach(() => {
  observers.length = 0
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver)
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  setMedia({ reducedMotion: false })
})

describe('resolveGreese', () => {
  it('turns presets into classes and options into variables, with no runtime', () => {
    expect(resolveGreese('fade-up')).toEqual({
      className: 'greese-Motion greese-Motion--enter-fade-up',
      style: undefined,
      runtime: false,
    })
    expect(
      resolveGreese({
        enter: 'pop',
        duration: 0.3,
        delay: 0.1,
        distance: '2rem',
        stagger: 0.05,
        ease: 'inOut',
      })
    ).toEqual({
      className: 'greese-Motion greese-Motion--enter-pop greese-Motion--stagger',
      style: {
        '--greese-motion-duration': '0.3s',
        '--greese-motion-delay': '0.1s',
        '--greese-motion-distance': '2rem',
        '--greese-motion-stagger': '0.05s',
        '--greese-motion-ease': 'var(--greese-ease-in-out)',
      },
      runtime: false,
    })
    expect(resolveGreese({ exit: 'scale-out' }).className).toBe(
      'greese-Motion greese-Motion--exit-scale-out'
    )
    expect(resolveGreese(undefined)).toEqual({ runtime: false })
  })

  it('hands anything CSS can’t do to the runtime', () => {
    expect(cssEase([0.2, 0, 0, 1])).toBe('cubic-bezier(0.2, 0, 0, 1)')
    expect(cssEase('elastic.out')).toBeUndefined()
    const elastic = resolveGreese({ enter: 'fade', ease: 'elastic.out' })
    expect(elastic.runtime).toBe(true)
    expect(elastic.className).toBeUndefined()
    const cases: GreeseOptions[] = [
      { hover: 'lift' },
      { inView: 'fade' },
      { text: 'type' },
      { enter: { opacity: [0, 1] } },
    ]
    for (const o of cases) {
      expect(needsRuntime(o)).toBe(true)
    }
  })
})

describe('the greese prop on components', () => {
  it('styles server-rendered markup with no client code', () => {
    const html = renderToString(
      <Card greese={{ enter: 'fade-up', delay: 0.2 }}>
        <Text greese="fade">Hi</Text>
      </Card>
    )
    expect(html).toContain('greese-Motion--enter-fade-up')
    expect(html).toContain('--greese-motion-delay:0.2s')
    expect(html).toContain('greese-Motion--enter-fade')
  })

  it('merges with the component’s own classes and styles', () => {
    render(
      <Stack
        data-testid="s"
        gap={2}
        className="mine"
        style={{ color: 'red' }}
        greese={{ enter: 'fade', stagger: 0.1 }}
      >
        <span>a</span>
      </Stack>
    )
    const stack = screen.getByTestId('s')
    expect(stack).toHaveClass(
      'greese-Stack',
      'mine',
      'greese-Motion--stagger',
      'greese-Motion--enter-fade'
    )
    expect(stack.style.color).toBe('red')
    expect(stack.style.getPropertyValue('--greese-motion-stagger')).toBe('0.1s')
  })

  it('restyles an overlay’s exit', () => {
    render(<Dialog title="Hi" open greese={{ exit: 'scale-out' }} />)
    expect(screen.getByRole('dialog')).toHaveClass('greese-Motion--exit-scale-out')
  })

  it('wraps any element with Motion', () => {
    render(
      <Motion asChild greese="blur-in">
        <a href="#x">Link</a>
      </Motion>
    )
    expect(screen.getByRole('link')).toHaveClass(
      'greese-Motion',
      'greese-Motion--enter-blur-in'
    )
  })
})

describe('the runtime', () => {
  it('plays an interaction while hovered and reverses on leave', async () => {
    render(<Button greese={{ hover: 'lift' }}>Go</Button>)
    await attached()
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
    const button = screen.getByRole('button')
    fireEvent.pointerEnter(button)
    act(() => vi.advanceTimersByTime(400))
    expect(button.style.translate).toBe('0px -4px')
    fireEvent.pointerLeave(button)
    act(() => vi.advanceTimersByTime(400))
    expect(button.style.translate).toBe('0px 0px')
  })

  it('reveals out-of-view elements when they scroll into view', async () => {
    render(
      <Card data-testid="c" greese={{ inView: 'fade-up' }}>
        Below the fold
      </Card>
    )
    const card = screen.getByTestId('c')
    // jsdom lays nothing out, so everything counts as out of view.
    expect(card.dataset.greeseView).toBe('pending')
    expect(card).toHaveClass('greese-Motion--view-fade-up')
    await attached()
    scrollIntoView(true)
    expect(card.dataset.greeseView).toBe('in')
    expect(observers.every((o) => o.disconnected)).toBe(true) // once
  })

  it('counts text up on a hidden copy, keeping one readable string', async () => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
    render(<Text greese={{ text: 'count', duration: 0.2 }}>480</Text>)
    await attached()
    const p = screen.getByText('480', { selector: 'span' }).parentElement!
    expect(p.querySelector('[aria-hidden="true"]')).not.toBeNull()
    act(() => vi.advanceTimersByTime(600))
    // Done: the original text node is back, nothing hidden remains.
    expect(p.innerHTML).toBe('480')
  })

  it('does nothing interactive under reduced motion, and reveals at once', async () => {
    setMedia({ reducedMotion: true })
    render(
      <Card data-testid="c" greese={{ hover: 'lift', inView: 'fade' }}>
        Card
      </Card>
    )
    await attached()
    const card = screen.getByTestId('c')
    expect(card.dataset.greeseView).toBe('in')
    fireEvent.pointerEnter(card)
    expect(card.style.translate).toBe('')
  })

  it('cleans up on unmount', async () => {
    const { unmount } = render(<Button greese={{ press: 'squish' }}>Go</Button>)
    await attached()
    const button = screen.getByRole('button')
    unmount()
    fireEvent.pointerDown(button)
    expect(button.style.scale).toBe('')
  })
})

describe('useTimeline', () => {
  it('builds after mount and restores on unmount', () => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    })
    const Demo = () => {
      const box = useRef<HTMLDivElement>(null)
      const tl = useTimeline(
        (t) => t.to(box.current, { opacity: 0.5, duration: 0.1 }),
        [],
        {
          paused: true,
        }
      )
      return (
        <div ref={box} data-testid="box" onClick={() => tl?.progress(1)}>
          box
        </div>
      )
    }
    const { unmount } = render(<Demo />)
    const box = screen.getByTestId('box')
    fireEvent.click(box)
    expect(box.style.opacity).toBe('0.5')
    unmount()
    expect(box.style.opacity).not.toBe('0.5')
  })
})
