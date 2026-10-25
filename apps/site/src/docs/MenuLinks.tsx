/**
 * The docs in the phones' menu: a link to each section, at its first page.
 * Its own chunk, loaded when the menu opens, so the homepage doesn't carry
 * the docs' index.
 */
import type { JSX } from 'react'
import { RouteLink, useSubpage } from '../router.tsx'
import { pageById, SECTIONS } from './pages.ts'

export const DocsMenuLinks = ({ onFollow }: { onFollow: () => void }): JSX.Element => {
  const current = pageById(useSubpage())
  return (
    <>
      {SECTIONS.map((section) => (
        <RouteLink
          key={section.name}
          to="docs"
          page={section.pages[0]!.page.id}
          aria-current={
            section.pages.some(({ page }) => page === current) ? 'location' : undefined
          }
          onClick={onFollow}
        >
          {section.name}
        </RouteLink>
      ))}
    </>
  )
}
