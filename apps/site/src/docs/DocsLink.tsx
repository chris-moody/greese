/**
 * A link in the docs' content. A docs page's address, in the app's form
 * (`/docs/forms-button`) or Storybook's (`?path=/docs/forms-button--docs`, as
 * the MDX guides wrote them), opens in the app without a page load; a
 * `#heading` stays on the page; anything else leaves as usual.
 */
import type { JSX, ReactNode } from 'react'
import { Link } from '@greese/react'
import { RouteLink } from '../router.tsx'

/** The docs page a link points at, with its `#hash`, or undefined. */
export const docsTarget = (href: string): { page: string; hash: string } | undefined => {
  const storybook = /^(?:[./]*)\?path=\/docs\/([a-z0-9-]+?)(?:--[a-z0-9-]+)?(#.*)?$/.exec(
    href
  )
  if (storybook) return { page: storybook[1]!, hash: storybook[2] ?? '' }
  const app = /^\/docs\/([a-z0-9-]+)\/?(#.*)?$/.exec(href)
  if (app) return { page: app[1]!, hash: app[2] ?? '' }
  return undefined
}

export const DocsLink = ({
  href = '',
  children,
}: {
  href?: string
  children?: ReactNode
}): JSX.Element => {
  const target = docsTarget(href)
  return (
    <Link asChild={!!target} href={target ? undefined : href}>
      {target ? (
        <RouteLink to="docs" page={target.page} hash={target.hash}>
          {children}
        </RouteLink>
      ) : (
        children
      )}
    </Link>
  )
}
