import { useEffect, useState, type CSSProperties, type JSX } from 'react'
import { Card, PageTransition, Text, usePageNavigate } from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'

const variant = new URLSearchParams(location.search).get('variant') ?? 'snapshot'
const query = `?page=pages${variant === 'snapshot' ? '' : `&variant=${variant}`}`

/**
 * Page transitions (ADR 0029) around a router of the fixture's own: the page
 * is the path, which it writes to the URL, so a navigation's direction comes
 * from the URL as it would in an app. `?variant=live` leaves live (members
 * with greese entrances, a slow page so the exit can be watched);
 * `?variant=timeline` leaves with a timeline map. e2e/page-transitions.spec.ts
 * drives it.
 */
export const PageTransitions = (): JSX.Element => {
  const [path, setPath] = useState(location.pathname)
  // Back and forward, as a router follows them.
  useEffect(() => {
    const follow = () => setPath(location.pathname)
    addEventListener('popstate', follow)
    return () => removeEventListener('popstate', follow)
  }, [])
  const page = usePageNavigate((to, options) => {
    if (typeof to !== 'string') return
    history[options?.replace ? 'replaceState' : 'pushState'](null, '', `${to}${query}`)
    setPath(to)
  })
  const link = (to: string, label: string) => (
    <a href={`${to}${query}`} onClick={page.onLinkClick(to)}>
      {label}
    </a>
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
