import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type JSX } from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePageNavigate } from '../hooks/usePageNavigate.ts'
import { functionProps } from '../test/serverProps.ts'
import { Card } from './Card/Card.tsx'
import { PageShare } from './PageTransition/PageShare.tsx'
import {
  exitPage,
  leavesLive,
  membersOf,
  pagesOnScreen,
} from './PageTransition/pageExit.ts'
import { isTimeline } from './PageTransition/pageMotion.ts'
import {
  pageClasses,
  pageClassMap,
  pageRulesCss,
  pageTransitionTypes,
  PageTransition,
  shareClasses,
  shareName,
} from './PageTransition/PageTransition.tsx'

const T = 'greese-PageTransition'

describe('PageTransition classes', () => {
  it('follows the theme by default, and its back roles going back', () => {
    expect(pageClasses({})).toBe(`${T} ${T}--theme`)
    expect(pageClasses({}, true)).toBe(`${T} ${T}--theme-back`)
  })

  it('names an effect on the side that has one, and keeps the theme on the other', () => {
    expect(pageClasses({ enter: 'slideLeft' })).toBe(
      `${T} ${T}--theme ${T}--enter-slide-left`
    )
    expect(pageClasses({ enter: 'popIn', exit: 'scaleOut' })).toBe(
      `${T} ${T}--enter-pop-in ${T}--exit-scale-out`
    )
    expect(pageClasses({ enter: 'none', exit: 'fadeOut' })).toBe(
      `${T} ${T}--enter-none ${T}--exit-fade-out`
    )
    // Neither side animates: React doesn't name it at all.
    expect(pageClasses({ enter: 'none', exit: 'none' })).toBe('none')
  })

  it('animates only greese navigations, each by its direction or its own type', () => {
    expect(
      pageClassMap(
        { enter: 'fadeUp' },
        { enter: 'slideRight' },
        { checkout: { enter: 'popIn' }, quiet: 'none' }
      )
    ).toEqual({
      'greese-forward': `${T} ${T}--theme ${T}--enter-fade-up`,
      'greese-back': `${T} ${T}--theme-back ${T}--enter-slide-right`,
      // A page that left live plays no snapshot over it.
      'greese-live': 'none',
      checkout: `${T} ${T}--theme ${T}--enter-pop-in`,
      quiet: 'none',
      // A tab kept in the URL, a filter: the page changes in place.
      default: 'none',
    })
  })
})

describe('PageTransition selector rules', () => {
  it('names the matches only during a greese page change, with their own pace', () => {
    const css = pageRulesCss({
      'header, footer': 'still',
      '.greese-Card': { exit: 'scaleOut', duration: 'fast', delay: 0.05, ease: 'in' },
    })
    expect(css).toMatch(/^@layer greese\.utilities \{/)
    expect(css).toContain(
      `:root:active-view-transition-type(greese-page) :is(header, footer) { view-transition-name: match-element; view-transition-class: ${T} ${T}--still; }`
    )
    const own = /greese-page-[a-z0-9]+-2/.exec(css)![0]
    expect(css).toContain(
      `:is(.greese-Card) { view-transition-name: match-element; view-transition-class: ${T} ${T}--theme ${T}--exit-scale-out ${own}; }`
    )
    expect(css).toContain(
      `@media (prefers-reduced-motion: no-preference) { html::view-transition-old(*.${own}), html::view-transition-new(*.${own}) { animation-duration: var(--greese-duration-fast); animation-delay: 0.05s; animation-timing-function: var(--greese-ease-in); } }`
    )
  })

  it('gives the same rules the same names on the server and in the browser', () => {
    const rules = { main: { exit: 'fadeOut' } } as const
    expect(pageRulesCss(rules)).toBe(pageRulesCss({ main: { exit: 'fadeOut' } }))
    expect(pageRulesCss(rules)).not.toBe(pageRulesCss({ main: { exit: 'scaleOut' } }))
  })

  it('refuses a selector that could close its style element', () => {
    expect(() => pageRulesCss({ 'main } body {': 'still' })).toThrow(/isn't a selector/)
    expect(() => pageRulesCss({ '</style><script>': 'still' })).toThrow(
      /isn't a selector/
    )
  })
})

describe('shared elements', () => {
  it('derives a valid, namespaced name from a key', () => {
    expect(shareName('hero')).toBe('greese-share-share-hero')
    expect(shareName(['template', 'finance'])).toBe('greese-share-template-finance')
    // Characters a name can't hold are replaced, and a hash keeps keys apart.
    const a = shareName(['template', 'a b'])
    const b = shareName(['template', 'a/b'])
    expect(a).toMatch(/^greese-share-template-a-b-[a-z0-9]+$/)
    expect(a).not.toBe(b)
    expect(shareClasses(['template', 'finance'])).toBe(
      `${T} ${T}--share greese-share-template`
    )
  })

  it('renders its child as usual, and hands the DOM no function, so a Server Component can share', () => {
    render(
      <PageShare id={['template', 'finance']}>
        <Card data-testid="card">Finance</Card>
      </PageShare>
    )
    expect(screen.getByTestId('card')).toHaveTextContent('Finance')
    expect(
      renderToString(
        <PageShare id="hero">
          <p>Hero</p>
        </PageShare>
      )
    ).toBe('<p>Hero</p>')
    expect(
      functionProps(
        <PageShare id="hero">
          <Card>Hero</Card>
        </PageShare>,
        [PageShare, Card] as never
      )
    ).toEqual([])
  })
})

describe('navigation types', () => {
  const from = 'https://example.com/docs/button'

  it('says which way a navigation went', () => {
    expect(pageTransitionTypes(from, '/docs/button/props')).toEqual([
      'greese-page',
      'greese-forward',
      'greese-deeper',
    ])
    expect(pageTransitionTypes(from, '/docs/card')).toEqual([
      'greese-page',
      'greese-forward',
      'greese-sibling',
    ])
    // Up the URL is back.
    expect(pageTransitionTypes(from, '/docs')).toEqual([
      'greese-page',
      'greese-back',
      'greese-shallower',
    ])
    expect(pageTransitionTypes(from, -1)).toEqual(['greese-page', 'greese-back'])
    expect(
      pageTransitionTypes(from, '/docs/card', { direction: 'back', types: ['x'] })
    ).toEqual(['greese-page', 'greese-back', 'greese-sibling', 'x'])
  })

  it('replaces in place, and treats a new hash or query as no page change', () => {
    expect(pageTransitionTypes(from, '/docs/card', { replace: true })).toEqual([
      'greese-page',
      'greese-replace',
      'greese-sibling',
    ])
    expect(pageTransitionTypes(from, '/docs/button#props')).toEqual([])
    expect(pageTransitionTypes(from, '?tab=code', { types: ['tab'] })).toEqual(['tab'])
  })
})

describe('PageTransition', () => {
  const startViewTransition = vi.fn(
    ({ update, types }: { update: () => unknown; types?: string[] }) => {
      const done = Promise.resolve(update()).then(() => undefined)
      return {
        ready: done,
        finished: done,
        updateCallbackDone: done,
        skipTransition: () => {},
        types: new Set(types),
      }
    }
  )

  afterEach(() => {
    startViewTransition.mockClear()
    delete (document as { startViewTransition?: unknown }).startViewTransition
  })

  /** A one-state router: the page is the path. */
  const App = ({ initial = '/a' }: { initial?: string }): JSX.Element => {
    const [path, setPath] = useState(initial)
    const page = usePageNavigate((to) => {
      if (typeof to === 'string') setPath(to)
    })
    return (
      <>
        <a href="/a/b" onClick={page.onLinkClick('/a/b')}>
          Deeper
        </a>
        <a href="/a#x" onClick={page.onLinkClick('/a#x')}>
          Section
        </a>
        <PageTransition rules={{ header: 'still' }}>
          <main>Page {path}</main>
        </PageTransition>
      </>
    )
  }

  it('renders its page, and its rules once, in the head', () => {
    render(<App />)
    expect(screen.getByRole('main')).toHaveTextContent('Page /a')
    const styles = document.head.querySelectorAll('style[data-href^="greese-page-"]')
    expect(styles).toHaveLength(1)
    expect(styles[0]!.textContent).toContain(':is(header)')
  })

  it('renders on the server, handing the page no function', () => {
    const html = renderToString(
      <PageTransition enter="fadeUp">
        <main>Server page</main>
      </PageTransition>
    )
    expect(html).toContain('<main>Server page</main>')
    expect(
      functionProps(
        <PageTransition rules={{ main: { exit: 'fadeOut' } }}>
          <main>Page</main>
        </PageTransition>,
        [PageTransition] as never
      )
    ).toEqual([])
  })

  it('starts a view transition with the navigation’s types', async () => {
    Object.assign(document, { startViewTransition })
    window.history.replaceState(null, '', '/a')
    render(<App />)
    await userEvent.click(screen.getByRole('link', { name: 'Deeper' }))
    await act(() => Promise.resolve())
    expect(screen.getByRole('main')).toHaveTextContent('Page /a/b')
    expect(startViewTransition).toHaveBeenCalled()
    expect(startViewTransition.mock.lastCall![0].types).toEqual([
      'greese-page',
      'greese-forward',
      'greese-deeper',
    ])
  })

  it('leaves a modified click, and a hash on the same page, to the browser', async () => {
    window.history.replaceState(null, '', '/a')
    render(<App />)
    const link = screen.getByRole('link', { name: 'Deeper' })
    const click = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      metaKey: true,
    })
    link.dispatchEvent(click)
    expect(click.defaultPrevented).toBe(false)
    expect(screen.getByRole('main')).toHaveTextContent('Page /a')
  })
})

describe('live exits', () => {
  afterEach(() => vi.restoreAllMocks())

  /** Every element on screen, as jsdom lays nothing out. */
  const onScreen = () =>
    vi
      .spyOn(Element.prototype, 'getBoundingClientRect')
      .mockReturnValue({
        top: 0,
        bottom: 100,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
      } as DOMRect)

  const Page = ({
    mode,
    exit,
  }: {
    mode?: 'live' | 'snapshot'
    exit?: 'fadeOut' | 'fadeOut,scaleIn'
  }) => (
    <div>
      <header className="greese-Motion greese-Motion--enter">
        Header, outside the page
      </header>
      <PageTransition mode={mode} exit={exit} order="document" stagger={0.1}>
        <main>
          <section className="greese-Motion greese-Motion--enter" data-testid="first">
            <p className="greese-Motion greese-Motion--enter">Inside the first</p>
          </section>
          <section
            className="greese-Motion greese-Motion--view greese-Motion--exit-scale-out"
            data-testid="second"
          >
            Second
          </section>
        </main>
      </PageTransition>
    </div>
  )

  it('marks the page with its live settings, drawing nothing', () => {
    const html = renderToString(<Page mode="live" />)
    expect(html).toMatch(
      /<template data-greese-page="[^"]+" data-greese-config="\{&quot;mode&quot;:&quot;live&quot;,&quot;order&quot;:&quot;document&quot;,&quot;stagger&quot;:0.1\}"><\/template>/
    )
    expect(html).toMatch(/<template data-greese-page-end="[^"]+"><\/template>/)
  })

  it("finds the page's outermost members on screen, not what's outside it", () => {
    onScreen()
    render(<Page />)
    const [page] = pagesOnScreen()
    expect(membersOf(page!).map((el) => el.dataset.testid)).toEqual(['first', 'second'])
  })

  it('leaves live by its mode, the theme’s, or when it has members or a timeline', () => {
    onScreen()
    const { unmount } = render(<Page mode="snapshot" />)
    expect(leavesLive(pagesOnScreen()[0]!, 'live')).toBe(false)
    unmount()
    const { unmount: again } = render(<Page />)
    expect(leavesLive(pagesOnScreen()[0]!, '')).toBe(true)
    expect(leavesLive(pagesOnScreen()[0]!, 'snapshot')).toBe(false)
    again()
    render(<Page exit="fadeOut,scaleIn" />)
    expect(pagesOnScreen()[0]!.config.timeline).toBe('fadeOut,scaleIn')
    expect(isTimeline('fadeOut')).toBe(false)
    expect(isTimeline({ main: 'fadeOut' })).toBe(true)
  })

  it('plays each member’s exit (its own, else the theme’s), spaced in order, and puts them back', async () => {
    onScreen()
    render(<Page />)
    const page = pagesOnScreen()[0]!
    const { done, restore } = exitPage(page, false, 'reverse', 0.1)
    await done
    const first = screen.getByTestId('first')
    const second = screen.getByTestId('second')
    // Reverse: the second leaves first, with its own exit.
    expect(second.style.animation).toMatch(
      /^greese-scale-out .* calc\(0 \* 0\.1s\) both$/
    )
    expect(first.style.animation).toMatch(
      /^var\(--greese-motion-page-exit, greese-fade-out\) .* calc\(1 \* 0\.1s\) both$/
    )
    restore()
    expect(first.style.animation).toBe('')
    exitPage(page, true, 'together')
    expect(first.style.animation).toMatch(
      /^var\(--greese-motion-page-back-exit, .* 0s both$/
    )
  })

  it('plays nothing over a live page: its snapshot is none', () => {
    expect(pageClassMap({})['greese-live']).toBe('none')
  })
})
