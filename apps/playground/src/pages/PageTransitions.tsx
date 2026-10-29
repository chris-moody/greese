import { useState, type JSX } from 'react'
import { PageTransition, usePageNavigate } from '@greese/react'
import '@greese/react/base.css'
import '@greese/react/styles.css'

/**
 * Page transitions (ADR 0029) around a router of the fixture's own: the page
 * is the path, which it writes to the URL, so a navigation's direction comes
 * from the URL as it would in an app. e2e/page-transitions.spec.ts drives it.
 */
export const PageTransitions = (): JSX.Element => {
  const [path, setPath] = useState(location.pathname)
  const page = usePageNavigate((to, options) => {
    if (typeof to !== 'string') return
    history[options?.replace ? 'replaceState' : 'pushState'](null, '', `${to}?page=pages`)
    setPath(to)
  })
  const link = (to: string, label: string) => (
    <a href={`${to}?page=pages`} onClick={page.onLinkClick(to)}>
      {label}
    </a>
  )
  return (
    <>
      <nav>
        {link('/pt/one', 'One')}
        {link('/pt/two', 'Two')}
        {link('/pt/two/deeper', 'Deeper')}
      </nav>
      <PageTransition
        exit="scaleOut"
        back={{ enter: 'slideRight' }}
        rules={{ '[data-hero]': { exit: 'fadeOut', duration: 0.3 } }}
      >
        <main data-testid="page">
          <h1>{path}</h1>
          <p data-hero>The hero of {path}</p>
        </main>
      </PageTransition>
    </>
  )
}
