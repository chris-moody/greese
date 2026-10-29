import { lazy, type JSX } from 'react'
import type { RouteObject } from 'react-router'
import { App } from './App.tsx'
import { Home } from './pages/Home.tsx'
import type { RouteHandle } from './router.tsx'
import { Footer } from './sections/LazyFooter.tsx'

// Each route is its own chunk: the homepage never loads the studio's editor,
// the compiler or the importer, nor the docs' pages, stories and props.
// They're React.lazy, not route `lazy`, so the router starts at once and
// the header renders while a page's chunk loads (ADR 0030).
const StudioPage = lazy(() =>
  import('./studio/StudioPage.tsx').then((m) => ({ default: m.StudioPage }))
)
const Templates = lazy(() =>
  import('./pages/Templates.tsx').then((m) => ({ default: m.Templates }))
)
const Docs = lazy(() =>
  import('./docs/DocsPage.tsx').then((m) => ({ default: m.DocsPageView }))
)

/** The templates end with the footer; the studio and the docs place their own. */
const TemplatesPage = (): JSX.Element => (
  <>
    <Templates />
    <Footer />
  </>
)

const handle = (route: RouteHandle['route']): RouteHandle => ({ route })

/** The app's routes, under its base: one shell (App), four pages. */
export const routes: RouteObject[] = [
  {
    id: 'root',
    path: '/',
    Component: App,
    children: [
      { index: true, Component: Home, handle: handle('home') },
      { path: 'studio', Component: StudioPage, handle: handle('studio') },
      { path: 'templates/:page?', Component: TemplatesPage, handle: handle('templates') },
      { path: 'docs/:page?', Component: Docs, handle: handle('docs') },
      // Any other path is the homepage, as it always was.
      { path: '*', Component: Home, handle: handle('home') },
    ],
  },
]
