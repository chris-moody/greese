import type { JSX } from 'react'
import type { RouteObject } from 'react-router'
import { App } from './App.tsx'
import { Home } from './pages/Home.tsx'
import { fromChunk, loadDocs, loadStudio, loadTemplates } from './pages/chunks.ts'
import type { RouteHandle } from './router.tsx'
import { Footer } from './sections/LazyFooter.tsx'

// Each route is its own chunk: the homepage never loads the studio's editor,
// the compiler or the importer, nor the docs' pages, stories and props.
// They load as they render, not as route `lazy`, so the router starts at
// once and the header renders while a page's chunk loads (ADR 0030). A page
// change fetches them first (pages/chunks.ts), and then they render at once.
const StudioPage = fromChunk(loadStudio, (m) => m.StudioPage)
const Templates = fromChunk(loadTemplates, (m) => m.Templates)
const Docs = fromChunk(loadDocs, (m) => m.DocsPageView)

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
