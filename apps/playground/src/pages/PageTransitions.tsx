import { useEffect, useState, type CSSProperties, type JSX } from 'react'
import {
  Card,
  matchPagePath,
  PageShare,
  PageTransition,
  Text,
  usePageNavigate,
  type PageRoute,
} from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'

const variant = new URLSearchParams(location.search).get('variant') ?? 'snapshot'
const query = `?page=pages${variant === 'snapshot' ? '' : `&variant=${variant}`}`

/** `?variant=routes`: each page's route config, as a router's route table would hold it. */
const routeTable: Array<{ path: string; greese: PageRoute }> = [
  {
    path: '/pt/user/*',
    greese: {
      to: {
        '/pt/settings/*': {
          exit: 'wipeOutLeft',
          mode: variant === 'routes-live' ? 'live' : 'snapshot',
        },
      },
    },
  },
  {
    path: '/pt/settings/*',
    greese: { from: { '/pt/user/*': { enter: 'depth', duration: 0.8 } } },
  },
]
const route = (path: string) =>
  routeTable.find((r) => matchPagePath(r.path, path))?.greese

/**
 * Page transitions (ADR 0029) around a router of the fixture's own: the page
 * is the path, which it writes to the URL, so a navigation's direction comes
 * from the URL as it would in an app. `?variant=live` leaves live (members
 * with greese entrances, a slow page so the exit can be watched);
 * `?variant=timeline` leaves with a timeline map; `?variant=link` is a list
 * and its items' pages, paired by the link followed (`<PageShare link>`);
 * `?variant=routes` plays by route rules and a navigation's own options;
 * `?variant=routes-live` the same with live members, one with an exit of its own.
 * e2e/page-transitions.spec.ts drives it.
 */
export const PageTransitions = (): JSX.Element => {
  const [path, setPath] = useState(location.pathname)
  // Back and forward, as a router follows them.
  useEffect(() => {
    const follow = () => setPath(location.pathname)
    addEventListener('popstate', follow)
    return () => removeEventListener('popstate', follow)
  }, [])
  const page = usePageNavigate(
    (to, options) => {
      if (typeof to !== 'string') return
      history[options?.replace ? 'replaceState' : 'pushState'](null, '', `${to}${query}`)
      setPath(to)
    },
    { route }
  )
  const link = (to: string, label: string) => (
    <a href={`${to}${query}`} onClick={page.onLinkClick(to)}>
      {label}
    </a>
  )
  if (variant === 'link')
    return (
      <PageTransition>
        {path.startsWith('/pt/item/') ? (
          <main data-testid="page">
            {link('/pt/list', 'Back to the list')}
            <PageShare link>
              <h1 data-testid="hero" style={{ fontSize: '3rem' }}>
                {path}
              </h1>
            </PageShare>
          </main>
        ) : (
          <main data-testid="page">
            <h1>/pt/list</h1>
            {['1', '2', '3'].map((n) => (
              <PageShare key={n} link>
                <Card p={4} data-testid={`card-${n}`}>
                  {link(`/pt/item/${n}`, `Item ${n}`)}
                </Card>
              </PageShare>
            ))}
          </main>
        )}
      </PageTransition>
    )
  if (variant === 'routes' || variant === 'routes-live')
    return (
      <div style={{ '--greese-motion-page-duration': '0.6s' } as CSSProperties}>
        <nav>
          {link('/pt/user/1', 'User')}
          {link('/pt/settings/profile', 'Settings profile')}
          {link('/pt/settings', 'Settings')}
          {link('/pt/other', 'Other')}
          <a
            href={`/pt/settings/profile${query}`}
            onClick={page.onLinkClick('/pt/settings/profile', {
              enter: 'pocketUp',
              exit: 'fadeOut',
              duration: 'fast',
            })}
          >
            Settings own
          </a>
        </nav>
        <PageTransition stagger={0}>
          <main data-testid="page">
            <h1>{path}</h1>
            {variant === 'routes-live' && (
              <>
                <Card p={4} greese="fadeUp" data-testid="member-plain">
                  <Text>No exit of its own</Text>
                </Card>
                <Card
                  p={4}
                  greese={{ enter: 'fadeUp', exit: 'scaleOut' }}
                  data-testid="member-own"
                >
                  <Text>Its own exit</Text>
                </Card>
              </>
            )}
          </main>
        </PageTransition>
      </div>
    )
  const body =
    variant === 'snapshot' ? (
      <main data-testid="page">
        <h1>{path}</h1>
        <p data-hero>The hero of {path}</p>
      </main>
    ) : (
      <main data-testid="page">
        <h1>{path}</h1>
        <Card p={4} greese="fadeUp" className="member-a" data-testid="member-a">
          <Text>First member of {path}</Text>
        </Card>
        <Card p={4} greese="fadeUp" className="member-b" data-testid="member-b">
          <Text>Second member of {path}</Text>
        </Card>
      </main>
    )
  return (
    <div style={{ '--greese-motion-page-duration': '0.6s' } as CSSProperties}>
      <nav>
        {link('/pt/one', 'One')}
        {link('/pt/two', 'Two')}
        {link('/pt/two/deeper', 'Deeper')}
      </nav>
      {variant === 'snapshot' ? (
        <PageTransition
          exit="scaleOut"
          back={{ enter: 'slideRight' }}
          rules={{ '[data-hero]': { exit: 'fadeOut', duration: 0.3 } }}
        >
          {body}
        </PageTransition>
      ) : variant === 'live' ? (
        <PageTransition mode="live" stagger={0.1}>
          {body}
        </PageTransition>
      ) : (
        <PageTransition
          exit={{
            '.member-a': 'fadeOut(duration: 0.4)',
            '.member-b': 'scaleOut(duration: 0.2),+0.2,fadeOut(duration: 0.2)',
          }}
        >
          {body}
        </PageTransition>
      )}
    </div>
  )
}
