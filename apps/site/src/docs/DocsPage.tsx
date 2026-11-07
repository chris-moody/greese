/**
 * The docs, at `/docs/<page>`: a page of the app like any other, under its
 * header and in the theme being worn, with the docs' pages in a sidebar (a
 * sticky column from md, an off-canvas sheet below it) and the page's own
 * sections beside it from lg.
 */
import '../styles/library.ts'
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type JSX } from 'react'
import {
  Button,
  Collapsible,
  Container,
  Heading,
  Link,
  ScrollSpy,
  Sidebar,
  SidebarLayout,
  Spinner,
  Stack,
  Text,
} from '@greese/react'
import { ChevronLeftIcon, ChevronRightIcon, MenuIcon } from '@greese/icons'
import { RouteLink, useSubpage } from '../router.tsx'
import { ComponentPage } from './ComponentPage.tsx'
import { MdxPage } from './MdxPage.tsx'
import { pageMdx, pageStories } from './load.ts'
import { Footer } from '../sections/LazyFooter.tsx'
import { neighbours, pageById, pageName, SECTIONS, type DocsPage } from './pages.ts'
import './docs.scss'

const Nav = ({ current }: { current?: DocsPage }): JSX.Element => (
  <nav aria-label="Docs" className="docs-nav">
    {SECTIONS.map((section) => (
      <Collapsible
        key={section.name}
        title={section.name}
        defaultOpen={
          section.name === 'Guides' || section.pages.some(({ page }) => page === current)
        }
        className="docs-nav-section"
      >
        <ul>
          {section.pages.map(({ page, label, group }) => (
            <li key={page.id}>
              <RouteLink
                to="docs"
                page={page.id}
                aria-current={page === current ? 'page' : undefined}
                className="docs-nav-link"
              >
                {group && <span className="docs-nav-group">{group} / </span>}
                {label}
              </RouteLink>
            </li>
          ))}
        </ul>
      </Collapsible>
    ))}
  </nav>
)

/** Fetches a docs page's content, for a page change to wait on (pages/chunks.ts). */
export const preloadDocsPage = (id: string | undefined): Promise<unknown> | undefined => {
  const page = pageById(id)
  if (!page) return undefined
  return page.kind === 'mdx' ? pageMdx(page.file) : pageStories(page.file)
}

/** The page's sections, read from what it rendered, for the "On this page" list. */
const useSections = (page: DocsPage): Array<[string, string, number]> => {
  const [sections, setSections] = useState<Array<[string, string, number]>>([])
  useLayoutEffect(() => {
    const headings = document.querySelectorAll<HTMLElement>(
      '.docs-article h2[id], .docs-article h3[id]'
    )
    setSections(
      [...headings]
        // An example's own headings (a dialog's title, rendered while it's
        // closed) are the example's, not sections of the page.
        .filter((h) => !h.closest('.docs-story, .docs-live'))
        .map((h) => [
          h.id,
          (h.textContent ?? '').replace(/#$/, '').trim(),
          h.tagName === 'H2' ? 2 : 3,
        ])
    )
    // A visit to `/docs/<page>#section`: the browser looked for it before
    // the page loaded, so scroll to it now that it's there.
    if (location.hash)
      document
        .getElementById(decodeURIComponent(location.hash.slice(1)))
        ?.scrollIntoView()
  }, [page])
  return sections
}

const OnThisPage = ({ page }: { page: DocsPage }): JSX.Element | null => {
  const sections = useSections(page)
  if (sections.length < 2) return null
  return (
    <ScrollSpy asChild offset={100}>
      <nav aria-label="On this page" className="docs-toc">
        <Text variant="caption" tone="muted" className="docs-toc-title">
          On this page
        </Text>
        <ul>
          {sections.map(([id, text, level]) => (
            <li key={id} data-level={level}>
              <a href={`#${id}`}>{text}</a>
            </li>
          ))}
        </ul>
      </nav>
    </ScrollSpy>
  )
}

const PageFoot = ({ page }: { page: DocsPage }): JSX.Element => {
  const { previous, next } = neighbours(page)
  return (
    <nav aria-label="Previous and next" className="docs-pager">
      {previous && (
        <Link asChild tone="neutral" className="docs-pager-link">
          <RouteLink to="docs" page={previous.id} rel="prev">
            <ChevronLeftIcon /> {pageName(previous)}
          </RouteLink>
        </Link>
      )}
      {next && (
        <Link asChild tone="neutral" className="docs-pager-link docs-pager-next">
          <RouteLink to="docs" page={next.id} rel="next">
            {pageName(next)} <ChevronRightIcon />
          </RouteLink>
        </Link>
      )}
    </nav>
  )
}

const Loading = (): JSX.Element => (
  <Stack align="center" py={8}>
    <Spinner label="Loading the page" />
  </Stack>
)

const NotFound = (): JSX.Element => (
  <Stack gap={3} py={6}>
    <Heading level={1} variant="h2">
      No such page
    </Heading>
    <Text tone="muted">
      The docs have no page at this address. Pick one from the list, or search for it.
    </Text>
  </Stack>
)

export const DocsPageView = (): JSX.Element => {
  const id = useSubpage()
  const page = pageById(id)

  useEffect(() => {
    const before = document.title
    document.title = page ? `${pageName(page)} · greese ui docs` : 'greese ui docs'
    return () => {
      document.title = before
    }
  }, [page])

  // The sidebar's id, for the trigger: SidebarLayout makes it, and the
  // library's SidebarTrigger can't show a word beside its icon.
  const sidebar = useRef<HTMLElement>(null)
  const [sidebarId, setSidebarId] = useState<string>()
  useLayoutEffect(() => setSidebarId(sidebar.current?.id), [])

  return (
    <SidebarLayout breakpoint="md" className="docs">
      <Sidebar ref={sidebar} label="Docs pages" className="docs-sidebar">
        <Nav current={page} />
      </Sidebar>
      {/* The page and, after it, the footer: beside the sidebar, which stays
          in view to the end. */}
      <div className="docs-column">
        <Container size="full" className="docs-main">
          {/* Below md, it sticks under the header, so the pages are a tap away
            wherever the page is scrolled to. */}
          <div className="docs-bar">
            {page && (
              <Text variant="p3" tone="muted" className="docs-bar-path">
                {page.title.split('/').slice(0, -1).join(' / ')}
              </Text>
            )}
            <Button
              size="sm"
              variant="soft"
              tone="neutral"
              endIcon={<MenuIcon />}
              popoverTarget={sidebarId}
              aria-label="Docs pages"
              className="docs-pages-trigger"
            >
              Pages
            </Button>
          </div>
          <div className="docs-columns">
            {page ? (
              // The contents list reads the page's headings, so it waits with it.
              <Suspense key={page.id} fallback={<Loading />}>
                <article id="main" className="docs-article">
                  {page.kind === 'mdx' ? (
                    <MdxPage page={page} />
                  ) : (
                    <ComponentPage page={page} />
                  )}
                  <PageFoot page={page} />
                </article>
                <OnThisPage page={page} />
              </Suspense>
            ) : (
              <article id="main" className="docs-article">
                <NotFound />
              </article>
            )}
          </div>
        </Container>
        <Suspense>
          <Footer />
        </Suspense>
      </div>
    </SidebarLayout>
  )
}
