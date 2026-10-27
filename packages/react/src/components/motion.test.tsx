import { StrictMode, useRef, useState } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToString } from 'react-dom/server'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectNoAxeViolations } from '../test/axe.ts'
import { restoreFrames, fakeFrames } from '../test/frames.ts'
import { installIntersectionObserver, intersect } from '../test/intersection.ts'
import { setMedia } from '../test/matchMedia.ts'
import { useGreese } from '../hooks/useGreese.ts'
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
import { defineGreeseEffect, removeGreeseEffect } from './Motion/effects.ts'
import { effectClass } from '@greese/ui/effects'
import { entranceNames } from '@greese/ui/effect-classes'
import { isReady } from './Motion/greeseRuntime.ts'
import { loadGreeseRuntime } from './Motion/registry.ts'
import { Stack } from './Stack/Stack.tsx'
import { Text } from './Text/Text.tsx'

/** Scrolls observed elements to `ratio` visible, in an 800px-tall viewport. */
const scrollIntoView = (isIntersecting: boolean, ratio = isIntersecting ? 1 : 0) =>
  act(() =>
    intersect({
      isIntersecting,
      intersectionRatio: ratio,
      intersectionRect: { height: 100 * ratio } as DOMRectReadOnly,
      boundingClientRect: { bottom: 100 } as DOMRectReadOnly,
      rootBounds: { height: 800 } as DOMRectReadOnly,
    })
  )

/** The classes a resolved prop adds, in any order. */
const classes = (resolved: { className?: string }) => resolved.className?.split(' ') ?? []

/** Lets the lazily loaded runtime attach. */
const attached = () => act(async () => void (await loadGreeseRuntime()))

beforeEach(installIntersectionObserver)
afterEach(() => {
  restoreFrames()
  vi.unstubAllGlobals()
  setMedia({ reducedMotion: false })
})

describe('resolveGreese', () => {
  it("plays the theme's entrance, in CSS, for 'theme'", () => {
    const theme = resolveGreese({ enter: 'theme' })
    expect(classes(theme)).toEqual(
      expect.arrayContaining(['greese-Motion', 'greese-Motion--enter-theme'])
    )
    expect(theme).toMatchObject({ style: undefined, runtime: false })
    expect(resolveGreese({ inView: 'theme' }).className).toMatch(
      /greese-Motion--view-theme/
    )
  })

  it('turns presets into classes and options into variables, with no runtime', () => {
    const fadeUp = resolveGreese('fadeUp')
    expect(classes(fadeUp)).toContain('greese-Motion--enter-fade-up')
    expect(fadeUp).toMatchObject({ style: undefined, runtime: false })
    const tuned = resolveGreese({
      enter: 'pop',
      duration: 0.3,
      delay: 0.1,
      distance: '2rem',
      stagger: 0.05,
      ease: 'inOut',
    })
    expect(classes(tuned)).toEqual(
      expect.arrayContaining(['greese-Motion--enter-pop', 'greese-Motion--stagger'])
    )
    expect(tuned).toMatchObject({
      style: {
        '--greese-motion-duration': '0.3s',
        '--greese-motion-delay': '0.1s',
        '--greese-motion-distance': '2rem',
        '--greese-motion-stagger': '0.05s',
        '--greese-motion-ease': 'var(--greese-ease-in-out)',
      },
      runtime: false,
    })
    expect(classes(resolveGreese({ exit: 'scaleOut' }))).toContain(
      'greese-Motion--exit-scale-out'
    )
    expect(resolveGreese(undefined)).toEqual({ runtime: false })
  })

  it('hands anything CSS can’t do to the runtime', () => {
    expect(cssEase([0.2, 0, 0, 1])).toBe('cubic-bezier(0.2, 0, 0, 1)')
    expect(cssEase('elastic.out')).toBeUndefined()
    const elastic = resolveGreese({ enter: 'fadeIn', ease: 'elastic.out' })
    expect(elastic.runtime).toBe(true)
    expect(elastic.className).toBeUndefined()
    const cases: GreeseOptions[] = [
      { hover: 'rise' },
      { inView: 'fadeIn' },
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
      <Card greese={{ enter: 'fadeUp', delay: 0.2 }}>
        <Text greese="fadeIn">Hi</Text>
      </Card>
    )
    expect(html).toContain('greese-Motion--enter-fade-up')
    expect(html).toContain('--greese-motion-delay:0.2s')
    expect(html).toContain('greese-Motion--enter-fade-in')
  })

  it('merges with the component’s own classes and styles', () => {
    render(
      <Stack
        data-testid="s"
        gap={2}
        className="mine"
        style={{ color: 'red' }}
        greese={{ enter: 'fadeIn', stagger: 0.1 }}
      >
        <span>a</span>
      </Stack>
    )
    const stack = screen.getByTestId('s')
    expect(stack).toHaveClass(
      'greese-Stack',
      'mine',
      'greese-Motion--stagger',
      'greese-Motion--enter-fade-in'
    )
    expect(stack.style.color).toBe('red')
    expect(stack.style.getPropertyValue('--greese-motion-stagger')).toBe('0.1s')
  })

  it('restyles an overlay’s exit', () => {
    render(<Dialog title="Hi" open greese={{ exit: 'scaleOut' }} />)
    expect(screen.getByRole('dialog')).toHaveClass('greese-Motion--exit-scale-out')
  })

  it('lets an overlay leave with an effect defined at run time', async () => {
    // A built-in's exit is CSS: no runtime. One of your own has no class, so
    // the runtime sets what it changes, from the same plan the build makes.
    expect(resolveGreese({ exit: 'scaleOut' }).runtime).toBe(false)
    expect(resolveGreese({ exit: 'sink' as never }).runtime).toBe(true)
    defineGreeseEffect('sink', {
      keyframes: { y: [0, '2rem'], scale: [1, 0.9], opacity: [1, 0] },
    })
    render(<Dialog title="Hi" open greese={{ exit: 'sink' as never }} />)
    await attached()
    const dialog = screen.getByRole('dialog')
    expect(dialog.style.getPropertyValue('--greese-motion-exit-translate')).toBe(
      '0px 2rem'
    )
    expect(dialog.style.getPropertyValue('--greese-motion-exit-scale')).toBe('0.9')
    cleanup()
    removeGreeseEffect('sink')
  })

  it('wraps any element with Motion', async () => {
    const { container } = render(
      <Motion asChild greese="blurIn">
        <a href="#x">Link</a>
      </Motion>
    )
    expect(screen.getByRole('link')).toHaveClass(
      'greese-Motion',
      'greese-Motion--enter-blur-in'
    )
    await expectNoAxeViolations(container)
  })
})

describe('the runtime', () => {
  it('plays an interaction while hovered and reverses on leave', async () => {
    render(<Button greese={{ hover: 'rise' }}>Go</Button>)
    await attached()
    fakeFrames()
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
      <Card data-testid="c" greese={{ inView: 'fadeUp' }}>
        Below the fold
      </Card>
    )
    const card = screen.getByTestId('c')
    // Marked in a microtask after the commit, before paint. jsdom lays
    // nothing out, so everything counts as out of view.
    await act(async () => {})
    expect(card.dataset.greeseView).toBe('pending')
    expect(card).toHaveClass('greese-Motion--view-fade-up')
    await attached()
    // Readiness is read from the element's box, as the page scrolls.
    const box = {
      top: innerHeight - 40,
      bottom: innerHeight + 60,
      height: 100,
      left: 0,
      right: 100,
    }
    vi.spyOn(card, 'getBoundingClientRect').mockImplementation(() => box as DOMRect)
    // Partly in view (its bottom still under the fold): not yet.
    scrollIntoView(true, 0.4)
    expect(card.dataset.greeseView).toBe('pending')
    // Wholly in view, though a shape's clip-path keeps the observer's ratio
    // under 1: revealed on the next scroll frame.
    Object.assign(box, { top: 100, bottom: 200 })
    await act(async () => {
      dispatchEvent(new Event('scroll'))
      await new Promise((r) => requestAnimationFrame(r))
    })
    expect(card.dataset.greeseView).toBe('in')
    // Once: scrolling away and back doesn't hold or replay it.
    scrollIntoView(false)
    scrollIntoView(true)
    expect(card.dataset.greeseView).toBe('in')
  })

  it('counts text up on a hidden copy, keeping one readable string', async () => {
    fakeFrames()
    render(<Text greese={{ text: 'count', duration: 0.2 }}>480</Text>)
    await attached()
    const p = screen.getByText('480', { selector: 'span' }).parentElement!
    expect(p.querySelector('[aria-hidden="true"]')).not.toBeNull()
    act(() => vi.advanceTimersByTime(600))
    // Done: the original text node is back, nothing hidden remains.
    expect(p.innerHTML).toBe('480')
  })

  it('leaves an inView text effect already in view as written', async () => {
    // In view at mount: a reveal would only flash it, so nothing may change.
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
      top: 10,
      bottom: 50,
      left: 10,
      right: 50,
    } as DOMRect)
    render(
      <Text data-testid="t" greese={{ text: 'count', inView: 'fadeIn' }}>
        480
      </Text>
    )
    await attached()
    const t = screen.getByTestId('t')
    expect(t.dataset.greeseView).toBe('in')
    expect(t.innerHTML).toBe('480')
    vi.restoreAllMocks()
  })

  it('does nothing interactive under reduced motion, and reveals at once', async () => {
    setMedia({ reducedMotion: true })
    render(
      <Card data-testid="c" greese={{ hover: 'rise', inView: 'fadeIn' }}>
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

describe('effects and sequences', () => {
  // Fake from the start, so entrances that play on attach run on fake frames.
  beforeEach(() => {
    fakeFrames()
  })

  it('sends sequences and defined effects to the runtime, keeping CSS for a lone preset', () => {
    expect(resolveGreese('fadeIn+scaleIn,+2,fadeOut')).toEqual({
      className: undefined,
      style: undefined,
      runtime: true,
    })
    expect(resolveGreese('fadeOut').runtime).toBe(true)
    expect(classes(resolveGreese({ exit: 'fadeOutDown' }))).toContain(
      'greese-Motion--exit-fade-out-down'
    )
    expect(resolveGreese('scaleIn').runtime).toBe(false)
  })

  it('plays groups together, waits, then plays the next group', async () => {
    render(
      <Card
        data-testid="c"
        greese={{ enter: 'fadeIn+scaleIn,+1,fadeOut', duration: 0.2 }}
      >
        Hi
      </Card>
    )
    await attached()
    const card = screen.getByTestId('c')
    act(() => vi.advanceTimersByTime(100))
    // Mid-way through the first group: both effects are running.
    expect(Number(card.style.opacity)).toBeGreaterThan(0)
    expect(Number(card.style.opacity)).toBeLessThan(1)
    expect(parseFloat(card.style.scale)).toBeGreaterThan(0)
    expect(parseFloat(card.style.scale)).toBeLessThan(1)
    act(() => vi.advanceTimersByTime(600))
    // In the pause: fully in.
    expect(card.style.opacity).toBe('1')
    expect(parseFloat(card.style.scale)).toBe(1)
    act(() => vi.advanceTimersByTime(1000))
    expect(card.style.opacity).toBe('0')
  })

  it('plays defined effects, with their own defaults and the prop’s options winning', async () => {
    defineGreeseEffect('nudge', {
      keyframes: ({ distance }) => ({ x: ['0px', distance] }),
      duration: 1,
    })
    defineGreeseEffect('dim', { opacity: [1, 0.5] })
    render(
      <Card data-testid="c" greese={{ enter: 'nudge+dim', distance: '10px' }}>
        Hi
      </Card>
    )
    await attached()
    const card = screen.getByTestId('c')
    act(() => vi.advanceTimersByTime(600))
    // dim (0.5 s default) is done; nudge (its own 1 s) is still going.
    expect(card.style.opacity).toBe('0.5')
    expect(card.style.translate).not.toBe('10px')
    act(() => vi.advanceTimersByTime(600))
    expect(card.style.translate).toBe('10px')
  })

  it('composes interactions too', async () => {
    defineGreeseEffect('shrink', { scale: [1, 0.9] })
    render(<Button greese={{ hover: 'tilt+shrink' }}>Go</Button>)
    await attached()
    const button = screen.getByRole('button')
    fireEvent.pointerEnter(button)
    act(() => vi.advanceTimersByTime(400))
    expect(button.style.rotate).toBe('-2deg')
    expect(parseFloat(button.style.scale)).toBe(0.9)
  })

  it('cuts between effects under reduced motion but keeps the pauses', async () => {
    setMedia({ reducedMotion: true })
    render(
      <Card data-testid="c" greese={{ enter: 'fadeIn,+1,fadeOut', delay: 3 }}>
        Hi
      </Card>
    )
    await attached()
    const card = screen.getByTestId('c')
    act(() => vi.advanceTimersByTime(100))
    // No delay and no fade: shown at once, and still readable in the pause.
    expect(card.style.opacity).toBe('1')
    act(() => vi.advanceTimersByTime(1000))
    expect(card.style.opacity).toBe('0')
  })
})

describe('one source of truth for effect names', () => {
  it('plays every entrance as CSS, from keyframes @greese/ui builds', () => {
    // @greese/ui's built styles, from this file rather than the working directory.
    const built = readFileSync(
      join(import.meta.dirname, '../../../ui/dist/css/Motion.css'),
      'utf8'
    )
    expect(entranceNames.length).toBeGreaterThan(0)
    for (const preset of entranceNames) {
      expect(resolveGreese(preset).className).toContain(`--enter-${effectClass(preset)}`)
      expect(built).toContain(`@keyframes greese-${effectClass(preset)} {`)
    }
  })

  /** A card playing `greese` on fake frames, read at `ms`. */
  const playFor = async (greese: GreeseOptions, ms: number) => {
    fakeFrames()
    render(
      <Card data-testid="c" greese={greese}>
        Hi
      </Card>
    )
    await attached()
    act(() => vi.advanceTimersByTime(ms))
    const { opacity, scale, translate } = screen.getByTestId('c').style
    cleanup()
    restoreFrames()
    return { opacity, scale, translate }
  }

  it('keeps a built-in: a definition under its name never replaces it', async () => {
    defineGreeseEffect('fall', { keyframes: { y: [0, 9] }, duration: 2 })
    // The built-in's half second, not the definition's two: fall has dropped
    // and shrunk, and never moved the definition's 9px.
    const end = await playFor({ enter: 'fadeIn,fall', duration: 0.5 }, 1200)
    expect(parseFloat(end.scale)).toBeCloseTo(0.98)
    expect(end.translate).not.toMatch(/9px/)
    removeGreeseEffect('fall')
  })

  it('plays a call’s arguments: its own parameters and its timing', async () => {
    // Its own end and duration: 0.8 after 1 s, though the instance asks for 3.
    expect(
      (await playFor({ enter: 'fadeIn(0.25, 0.8, 1)', duration: 3 }, 1100)).opacity
    ).toBe('0.8')
    // An offset delays only its own effect: still fading at 1.4 s, done by 1.6 s.
    const offset = 'fadeIn(duration: 1, offset: 0.5)'
    expect(Number((await playFor({ enter: offset }, 1400)).opacity)).toBeLessThan(1)
    expect((await playFor({ enter: offset }, 1600)).opacity).toBe('1')
    // Steps still follow each other: scaleIn starts after fadeIn's offset end.
    const steps: GreeseOptions = { enter: 'fadeIn(offset: 0.2),scaleIn', duration: 0.5 }
    expect(parseFloat((await playFor(steps, 1000)).scale)).toBeLessThan(1)
    expect(parseFloat((await playFor(steps, 1300)).scale)).toBe(1)
  })

  it('never mistakes an Object prototype key for an effect', async () => {
    fakeFrames()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <Card data-testid="c" greese="fadeIn,constructor">
        Hi
      </Card>
    )
    await attached()
    expect(warn).toHaveBeenCalledWith('greese: no effect named "constructor"')
    warn.mockRestore()
  })
})

describe('useTimeline', () => {
  it('builds after mount and restores on unmount', () => {
    fakeFrames()
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

describe('useGreese', () => {
  beforeEach(() => {
    fakeFrames()
  })

  /** Timelines start playing on a microtask, then run on (fake) frames. */
  const run = async (ms: number) => {
    await act(async () => {})
    act(() => vi.advanceTimersByTime(ms))
  }

  /** Two lists in one page, to prove selectors stay inside their scope. */
  const List = ({ id, onBuild }: { id: string; onBuild?: () => void }) => {
    const root = useRef<HTMLUListElement>(null)
    const { animate } = useGreese(
      (g) => {
        onBuild?.()
        g.timeline().from('.item', { opacity: 0, duration: 1 })
      },
      { scope: root }
    )
    return (
      <ul ref={root} data-testid={id}>
        <li className="item">a</li>
        <li className="item">b</li>
        <button onClick={() => animate('.item', { scale: [1, 1.5] }, { duration: 0.1 })}>
          {`pulse ${id}`}
        </button>
      </ul>
    )
  }

  it('builds before paint, with refs set, and scopes selectors to the component', () => {
    const { rerender } = render(<List id="one" />)
    const items = () => [...screen.getByTestId('one').querySelectorAll('li')]
    // Applied in the layout effect: the starting frame is there already.
    expect(items().map((li) => li.style.opacity)).toEqual(['0', '0'])
    rerender(
      <>
        <List id="one" />
        <ul data-testid="outside">
          <li className="item">untouched</li>
        </ul>
      </>
    )
    expect(screen.getByText('untouched').style.opacity).toBe('')
  })

  it('reverts everything on unmount, including animations started in handlers', async () => {
    const { unmount } = render(<List id="one" />)
    const list = screen.getByTestId('one')
    fireEvent.click(screen.getByText('pulse one'))
    await run(300)
    const li = list.querySelector('li')!
    expect(parseFloat(li.style.scale)).toBe(1.5)
    unmount()
    // The inline styles it added are gone, so the list's own CSS applies.
    expect(li.style.scale).toBe('')
    expect(li.style.opacity).toBe('')
  })

  it('re-runs on dependency changes, pausing or reverting the last build', async () => {
    const Demo = ({ x, revert }: { x: number; revert: boolean }) => {
      const box = useRef<HTMLDivElement>(null)
      useGreese(
        (g) => {
          g.timeline().to(box.current, { x, duration: 0.1 })
        },
        { dependencies: [x], revertOnUpdate: revert }
      )
      return <div ref={box} data-testid="box" />
    }
    const { rerender } = render(<Demo x={100} revert={false} />)
    const box = screen.getByTestId('box')
    await run(300)
    expect(box.style.translate).toBe('100px')
    // Paused, not reverted: the next build starts from where this one ended.
    rerender(<Demo x={200} revert={false} />)
    expect(box.style.translate).toBe('100px')
    await run(300)
    expect(box.style.translate).toBe('200px')

    const other = render(<Demo x={100} revert />)
    const box2 = other.getAllByTestId('box')[1]!
    await run(300)
    other.rerender(<Demo x={50} revert />)
    // Reverted first, so the rebuild starts from the original value.
    expect(box2.style.translate).not.toBe('100px')
  })

  it('accepts a dependency array, a build cleanup and contextSafe handlers', async () => {
    const cleanup = vi.fn()
    const Demo = () => {
      const [n, setN] = useState(0)
      const box = useRef<HTMLButtonElement>(null)
      const { contextSafe } = useGreese(() => cleanup, [n])
      const grow = contextSafe((g, by: number) =>
        g.animate(box.current, { scale: [1, by] }, { duration: 0.1 })
      )
      return (
        <button
          ref={box}
          onClick={() => {
            grow(2)
            setN((v) => v + 1)
          }}
        >
          go
        </button>
      )
    }
    render(<Demo />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    expect(cleanup).toHaveBeenCalledTimes(1)
    await run(300)
    expect(parseFloat(button.style.scale)).toBe(2)
  })

  it('survives Strict Mode’s double effects and renders on the server', () => {
    const builds = vi.fn()
    render(
      <StrictMode>
        <List id="strict" onBuild={builds} />
      </StrictMode>
    )
    expect(builds).toHaveBeenCalledTimes(2)
    // The first build was reverted; the second holds its starting frame.
    const items = [...screen.getByTestId('strict').querySelectorAll('li')]
    expect(items.map((li) => li.style.opacity)).toEqual(['0', '0'])
    expect(renderToString(<List id="ssr" />)).toContain('pulse ssr')
  })
})

describe('scroll reveals: when an element is ready', () => {
  const box = (top: number, bottom: number) => ({ top, bottom, height: bottom - top })

  it('reveals once wholly in view and clear of the bottom 10%', () => {
    expect(isReady(box(100, 700), 1000, 500)).toBe(true)
    expect(isReady(box(700, 950), 1000, 500)).toBe(false)
  })

  it('reveals one taller than half the viewport once a fifth of it shows', () => {
    expect(isReady(box(700, 1800), 1000, 500)).toBe(true)
    expect(isReady(box(900, 2000), 1000, 500)).toBe(false)
  })

  it('reveals what ends the page once wholly in view, a sub-pixel past the edge included', () => {
    // A footer at the end of a page, as Chromium lays it out: 900.39 of 900.
    expect(isReady(box(660.39, 900.39), 900, 0)).toBe(true)
    // Still cut off by more than a pixel, or more page left to scroll: not yet.
    expect(isReady(box(670, 910), 900, 0)).toBe(false)
    expect(isReady(box(660, 900), 900, 200)).toBe(false)
  })
})
