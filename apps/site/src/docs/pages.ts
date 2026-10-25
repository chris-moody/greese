/**
 * The docs' pages, from the build (server/docsIndex.ts): in the docs' order,
 * found by id, and grouped for the sidebar.
 */
import index from 'virtual:greese-docs'
import type { DocsPage } from '../../server/docsIndex.ts'

export type { DocsPage }

export const PAGES: readonly DocsPage[] = index

/** The page `/docs` opens on. */
export const FIRST_PAGE = PAGES.find((p) => p.id === 'guides-introduction') ?? PAGES[0]!

const byId = new Map(PAGES.map((page) => [page.id, page]))

/** A page by its id (`forms-button`), or undefined. */
export const pageById = (id: string | undefined): DocsPage | undefined =>
  id === undefined ? FIRST_PAGE : byId.get(id)

/** The page's own name: `Button` for `Forms/Button`. */
export const pageName = (page: DocsPage): string => page.title.split('/').at(-1)!

/** One section of the sidebar: `Forms`, with its pages, a recipe's under `Recipes`. */
export interface DocsSection {
  name: string
  pages: Array<{ page: DocsPage; label: string; group?: string }>
}

/** The sidebar: one section per first title segment, pages in order. */
export const SECTIONS: readonly DocsSection[] = (() => {
  const sections: DocsSection[] = []
  for (const page of PAGES) {
    const [name, ...rest] = page.title.split('/')
    let section = sections.at(-1)
    if (!section || section.name !== name) {
      section = { name: name!, pages: [] }
      sections.push(section)
    }
    section.pages.push({
      page,
      label: rest.at(-1)!,
      ...(rest.length > 1 && { group: rest.slice(0, -1).join(' / ') }),
    })
  }
  return sections
})()

/** The pages before and after one, for the links at its foot. */
export const neighbours = (page: DocsPage): { previous?: DocsPage; next?: DocsPage } => {
  const at = PAGES.indexOf(page)
  return { previous: PAGES[at - 1], next: PAGES[at + 1] }
}
