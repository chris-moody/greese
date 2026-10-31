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
import {
  isTimeline,
  matchPageRule,
  matchPagePath,
  resolvePageRoute,
  routeTypes,
  stripBase,
  type PageRoute,
} from './PageTransition/pageMotion.ts'
import { pairByLink } from './PageTransition/shareLink.ts'
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

describe('route patterns', () => {
  it('matches literals, params, middle and trailing wildcards', () => {
    expect(matchPagePath('/settings', '/settings/')).toBe(true)
    expect(matchPagePath('/settings', '/settings/a')).toBe(false)
    expect(matchPagePath('/user/:id', '/user/7')).toBe(true)
    expect(matchPagePath('/user/:id', '/user/7/x')).toBe(false)
    expect(matchPagePath('/docs/*/edit', '/docs/a/edit')).toBe(true)
    expect(matchPagePath('/docs/*/edit', '/docs/a/b/edit')).toBe(false)
    expect(matchPagePath('/settings/*', '/settings')).toBe(true)
    expect(matchPagePath('/settings/*', '/settings/a/b')).toBe(true)
    expect(matchPagePath('/settings/*', '/other')).toBe(false)
    expect(matchPagePath('*', '/anything/at/all')).toBe(true)
    expect(matchPagePath('*', '/')).toBe(true)
  })

  it('refuses patterns with a query or a hash', () => {
    expect(() => matchPagePath('/a?b=1', '/a')).toThrow(/page pattern/)
    expect(() => matchPagePath('/a#b', '/a')).toThrow(/page pattern/)
  })

  it('picks the most specific rule, then source order', () => {
    const rules = {
      '*': { exit: 'fadeOut' as const },
      '/settings/*': { exit: 'slideLeft' as const },
      '/settings/:tab': { exit: 'wipeOutLeft' as const },
      '/settings/:other': { exit: 'fadeOut' as const },
    }
    expect(matchPageRule(rules, '/settings/a')?.exit).toBe('wipeOutLeft')
    expect(matchPageRule(rules, '/settings/a/b')?.exit).toBe('slideLeft')
    expect(matchPageRule(rules, '/x')?.exit).toBe('fadeOut')
    expect(matchPageRule(undefined, '/x')).toBeUndefined()
  })

  it('strips the base', () => {
    expect(stripBase('/app/user/1', '/app')).toBe('/user/1')
    expect(stripBase('/app', '/app')).toBe('/')
    expect(stripBase('/apple', '/app')).toBe('/apple')
    expect(stripBase('/a')).toBe('/a')
  })
})

describe('resolving a route', () => {
  const user: PageRoute = {
    to: { '/settings/*': { exit: 'wipeOutLeft', mode: 'snapshot', duration: 0.5 } },
  }
  const settings: PageRoute = {
    from: {
      '/user/*': {
        enter: 'flipOverRight',
        exit: 'fadeOut',
        duration: 0.8,
        back: { enter: 'fadeIn' },
      },
    },
  }
  const pages = { from: user, to: settings }

  it('takes each side from its owner', () => {
    expect(resolvePageRoute(pages, '/user/1', '/settings/p')).toEqual({
      enter: 'greese-flip-over-right',
      exit: 'greese-wipe-out-left',
      duration: '0.8s',
      mode: 'snapshot',
    })
  })

  it('falls back to the other page’s rule, and has nothing without a match', () => {
    expect(
      resolvePageRoute({ from: undefined, to: settings }, '/user/1', '/settings')
    ).toEqual({
      enter: 'greese-flip-over-right',
      exit: 'greese-fade-out',
      duration: '0.8s',
    })
    expect(resolvePageRoute(pages, '/home', '/about')).toEqual({})
    expect(resolvePageRoute(pages, '/user/1', undefined)).toEqual({
      enter: 'greese-flip-over-right',
      exit: 'greese-fade-out',
      duration: '0.8s',
    })
  })

  it('merges back over the rule', () => {
    expect(resolvePageRoute(pages, '/user/1', '/settings/p', true).enter).toBe(
      'greese-fade-in'
    )
    expect(resolvePageRoute(pages, '/user/1', '/settings/p', true).exit).toBe(
      'greese-wipe-out-left'
    )
  })

  it('lets the navigation win, side by side', () => {
    const r = resolvePageRoute(pages, '/user/1', '/settings/p', false, {
      exit: 'none',
      duration: 'fast',
      ease: 'inOut',
      mode: 'live',
    })
    expect(r).toEqual({
      enter: 'greese-flip-over-right',
      exit: 'none',
      duration: 'var(--greese-duration-fast)',
      ease: 'var(--greese-ease-in-out)',
      mode: 'live',
    })
    // `theme` names nothing, so the route's entrance still plays.
    expect(
      resolvePageRoute(pages, '/user/1', '/settings/p', false, { enter: 'theme' }).enter
    ).toBe('greese-flip-over-right')
  })

  it('names a type for each part it overrides', () => {
    expect(routeTypes({})).toEqual([])
    expect(routeTypes({ enter: 'x', exit: 'y', ease: 'z' })).toEqual([
      'greese-route-enter',
      'greese-route-exit',
      'greese-route-pace',
    ])
  })

  it('maps its types to fixed classes', () => {
    const map = pageClassMap({}) as Record<string, string>
    expect(map['greese-route-enter']).toBe(`${T}--route-enter`)
    expect(map['greese-route-exit']).toBe(`${T}--route-exit`)
    expect(map['greese-route-pace']).toBe(`${T}--route-pace`)
  })
})

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
      // A whole page: only its screenful shows.
      'greese-forward': `${T} ${T}--theme ${T}--enter-fade-up ${T}--page`,
      'greese-back': `${T} ${T}--theme-back ${T}--enter-slide-right ${T}--page`,
      // A page that left live: joined with its direction's, its rest fades.
      'greese-live': `${T}--left`,
      'greese-route-enter': `${T}--route-enter`,
      'greese-route-exit': `${T}--route-exit`,
      'greese-route-pace': `${T}--route-pace`,
      checkout: `${T} ${T}--theme ${T}--enter-pop-in ${T}--page`,
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

describe('shared elements paired by the link followed', () => {
  const named = () =>
    [...document.querySelectorAll<HTMLElement>('*')]
      .filter((el) => el.style.getPropertyValue('view-transition-name'))
      .map((el) => el.dataset.testid)
  /** Two frames: past both snapshots. */
  const frames = () =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
  /** Swaps the page, as a router's commit does. */
  const show = (html: string) => {
    document.body.innerHTML = html
    // The observer's microtask, before the browser's snapshot.
    return Promise.resolve()
  }
  const list = `
    <main>
      <div data-greese-share-link data-testid="card-1"><a href="/item/1">One</a></div>
      <div data-greese-share-link data-testid="card-2"><a href="/item/2">Two</a></div>
    </main>`
  const item = `
    <main>
      <a href="/list" data-testid="back">Back</a>
      <h1 data-greese-share-link data-testid="hero">Two</h1>
    </main>`
  afterEach(() => {
    document.body.innerHTML = ''
    history.replaceState(null, '', '/')
  })

  it('marks its child, and renders nothing more, on the server too', () => {
    expect(
      renderToString(
        <PageShare link>
          <p>Hero</p>
        </PageShare>
      )
    ).toBe('<p data-greese-share-link="">Hero</p>')
  })

  it('names the clicked item, then the new page’s hero as it arrives, and lets both go', async () => {
    history.replaceState(null, '', '/list')
    document.body.innerHTML = list
    pairByLink(document.querySelector('a[href="/item/2"]'), false)
    expect(named()).toEqual(['card-2'])
    await show(item)
    expect(named()).toEqual(['hero'])
    expect(
      screen.getByTestId('hero').style.getPropertyValue('view-transition-class')
    ).toBe(`${T} ${T}--share greese-share-link`)
    await frames()
    expect(named()).toEqual([])
  })

  it('going back, names the hero, then the item linking to the page left', async () => {
    history.replaceState(null, '', '/item/2')
    document.body.innerHTML = item
    pairByLink(screen.getByTestId('back'), true)
    expect(named()).toEqual(['hero'])
    await show(list)
    expect(named()).toEqual(['card-2'])
  })

  it('does nothing on a page with nothing marked, or with no end to pair', async () => {
    document.body.innerHTML = '<main><a href="/x">X</a></main>'
    pairByLink(document.querySelector('a'), false)
    expect(named()).toEqual([])
    // Two items and no hero: a link outside them has no end on this page.
    document.body.innerHTML = list + '<a href="/elsewhere" data-testid="nav">Nav</a>'
    pairByLink(screen.getByTestId('nav'), false)
    expect(named()).toEqual([])
  })
})

/**
 * A router's navigate with overloads, as React Router's `useNavigate()` is (a
 * path, or a history step): `usePageNavigate` takes it as it is. Checked by
 * the type check; never called.
 */
declare const routerNavigate: {
  (
    to: string | { pathname?: string },
    options?: { replace?: boolean }
  ): void | Promise<void>
  (delta: number): void | Promise<void>
}
export const useTakesARoutersNavigate = () => usePageNavigate(routerNavigate)

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
  describe('routes', () => {
    const route = (path: string): PageRoute | undefined =>
      path.startsWith('/a')
        ? { to: { '/b/*': { exit: 'wipeOutLeft', duration: 0.4 } } }
        : undefined

    const Routed = (): JSX.Element => {
      const [path, setPath] = useState('/a')
      const page = usePageNavigate(
        (to) => {
          if (typeof to === 'string') setPath(to)
        },
        { route }
      )
      return (
        <>
          <a href="/b/c" onClick={page.onLinkClick('/b/c')}>
            Matching
          </a>
          <a href="/z" onClick={page.onLinkClick('/z')}>
            Plain
          </a>
          <a href="/b/c" onClick={page.onLinkClick('/b/c', { enter: 'pocketUp' })}>
            Own
          </a>
          <PageTransition>
            <main>Page {path}</main>
          </PageTransition>
        </>
      )
    }
    const root = () => document.documentElement.style

    it('adds the route types and root variables, and removes them at the next click', async () => {
      Object.assign(document, { startViewTransition })
      window.history.replaceState(null, '', '/a')
      render(<Routed />)
      await userEvent.click(screen.getByRole('link', { name: 'Matching' }))
      await act(() => Promise.resolve())
      expect(startViewTransition.mock.lastCall![0].types).toEqual([
        'greese-page',
        'greese-forward',
        'greese-deeper',
        'greese-route-exit',
        'greese-route-pace',
      ])
      expect(root().getPropertyValue('--greese-page-exit')).toBe('greese-wipe-out-left')
      expect(root().getPropertyValue('--greese-page-duration')).toBe('0.4s')
      expect(root().getPropertyValue('--greese-page-enter')).toBe('')

      window.history.replaceState(null, '', '/a')
      await userEvent.click(screen.getByRole('link', { name: 'Plain' }))
      await act(() => Promise.resolve())
      expect(startViewTransition.mock.lastCall![0].types).not.toContain(
        'greese-route-exit'
      )
      expect(root().getPropertyValue('--greese-page-exit')).toBe('')
      expect(root().getPropertyValue('--greese-page-duration')).toBe('')
    })

    it('puts a navigation’s own options over the route’s', async () => {
      Object.assign(document, { startViewTransition })
      window.history.replaceState(null, '', '/a')
      render(<Routed />)
      await userEvent.click(screen.getByRole('link', { name: 'Own' }))
      await act(() => Promise.resolve())
      expect(startViewTransition.mock.lastCall![0].types).toContain('greese-route-enter')
      expect(root().getPropertyValue('--greese-page-enter')).toBe('greese-pocket-up')
      expect(root().getPropertyValue('--greese-page-exit')).toBe('greese-wipe-out-left')
    })
  })
})

describe('live exits', () => {
  afterEach(() => vi.restoreAllMocks())

  /** Every element on screen, as jsdom lays nothing out. */
  const onScreen = () =>
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
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

  it('lets the navigation’s or route’s mode beat the page’s, then the theme’s', () => {
    onScreen()
    render(<Page mode="snapshot" />)
    const page = pagesOnScreen()[0]!
    expect(leavesLive(page, 'live', false, 'live')).toBe(true)
    expect(leavesLive(page, 'live', false)).toBe(false)
    expect(leavesLive(page, 'live', false, 'snapshot')).toBe(false)
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
      /^var\(--greese-page-exit, var\(--greese-motion-page-exit, greese-fade-out\)\) .* calc\(1 \* 0\.1s\) both$/
    )
    restore()
    expect(first.style.animation).toBe('')
    exitPage(page, true, 'together')
    expect(first.style.animation).toMatch(
      /^var\(--greese-page-exit, var\(--greese-motion-page-back-exit, .* 0s both$/
    )
  })

  it('keeps the exit until the navigation commits, whatever the old page does meanwhile', async () => {
    onScreen()
    // A router whose next page takes its time to render.
    let arrive = () => {}
    const Leave = () => {
      const page = usePageNavigate(() => new Promise<void>((r) => (arrive = r)))
      return <button onClick={() => page.navigate('/next')}>Go</button>
    }
    render(
      <>
        <Page />
        <Leave />
      </>
    )
    await act(async () => screen.getByRole('button', { name: 'Go' }).click())
    const first = screen.getByTestId('first')
    expect(first.style.animation).not.toBe('')
    // The old page grows and updates as it leaves (a homepage mounting its
    // sections in turn): not the commit.
    const late = document.createElement('section')
    late.innerHTML = '<input>'
    await act(async () => {
      first.parentElement!.append(late)
      late.querySelector('input')!.setAttribute('name', 'x')
      screen.getByTestId('second').remove()
    })
    expect(first.style.animation).not.toBe('')
    // The navigation commits: the exit comes off.
    await act(async () => arrive())
    expect(first.style.animation).toBe('')
  })

  it('going back, sees the commit in the page, and waits past the cap while the URL has moved', async () => {
    onScreen()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    try {
      const Leave = () => {
        const page = usePageNavigate(() => {})
        return <button onClick={() => page.navigate(-1)}>Back</button>
      }
      const go = vi.spyOn(history, 'go')
      // The browser's history moves the URL at once; the router commits later.
      go.mockImplementation(() => history.replaceState(null, '', '/before'))
      const { unmount } = render(
        <>
          <Page />
          <Leave />
        </>
      )
      const back = async () => {
        await act(async () => screen.getByRole('button', { name: 'Back' }).click())
        await act(async () => vi.advanceTimersByTime(0))
      }
      await back()
      const first = () => screen.getByTestId('first')
      expect(first().style.animation).not.toBe('')
      // The old page grows, and updates its attributes: not the commit.
      await act(async () => {
        first().append(document.createElement('span'))
        first().setAttribute('aria-busy', 'true')
        vi.advanceTimersByTime(5000)
      })
      expect(first().style.animation).not.toBe('')
      // The page changes: something the old page had goes.
      await act(async () => screen.getByTestId('second').remove())
      expect(first().style.animation).toBe('')

      // No page change, and the URL moved: held until the longer cap.
      unmount()
      history.replaceState(null, '', '/next')
      const second = render(
        <>
          <Page />
          <Leave />
        </>
      )
      await back()
      await act(async () => vi.advanceTimersByTime(5000))
      expect(first().style.animation).not.toBe('')
      await act(async () => vi.advanceTimersByTime(6000))
      expect(first().style.animation).toBe('')

      // No page change, and the URL stayed: let go at the exit's cap.
      second.unmount()
      go.mockImplementation(() => {})
      render(
        <>
          <Page />
          <Leave />
        </>
      )
      await back()
      expect(first().style.animation).not.toBe('')
      await act(async () => vi.advanceTimersByTime(2500))
      expect(first().style.animation).toBe('')
      go.mockRestore()
    } finally {
      vi.useRealTimers()
      history.replaceState(null, '', '/')
    }
  })

  it('still plays the new page in after a live exit, and fades what the exit left', () => {
    const map = pageClassMap({})
    expect(map['greese-live']).toBe(`${T}--left`)
    // Where neither side animates, `none` still wins: React stops at it.
    expect(pageClassMap({ enter: 'none', exit: 'none' })['greese-forward']).toBe('none')
  })
})
