import { lazy, StrictMode, Suspense, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * `?page=<name>` picks a page; each is its own chunk and imports its own CSS,
 * so the MUI benchmark never loads greese ui's stylesheet (or vice versa).
 */
const pages: Record<string, () => Promise<{ default: ComponentType }>> = {
  theming: () => import('./pages/Theming.tsx').then((m) => ({ default: m.Theming })),
  layout: () => import('./pages/Layout.tsx').then((m) => ({ default: m.Layout })),
  forms: () => import('./pages/Forms.tsx').then((m) => ({ default: m.Forms })),
  content: () => import('./pages/Content.tsx').then((m) => ({ default: m.Content })),
  overlays: () => import('./pages/Overlays.tsx').then((m) => ({ default: m.Overlays })),
  gaps: () => import('./pages/Gaps.tsx').then((m) => ({ default: m.Gaps })),
  motion: () => import('./pages/Motion.tsx').then((m) => ({ default: m.Motion })),
  authoring: () =>
    import('./pages/Authoring.tsx').then((m) => ({ default: m.Authoring })),
  'authoring-timeline': () =>
    import('./pages/AuthoringTimeline.tsx').then((m) => ({
      default: m.AuthoringTimeline,
    })),
  'authoring-tools': () =>
    import('./pages/AuthoringTools.tsx').then((m) => ({ default: m.AuthoringTools })),
  additions: () =>
    import('./pages/Additions.tsx').then((m) => ({ default: m.Additions })),
  catalogue: () =>
    import('./pages/Catalogue.tsx').then((m) => ({ default: m.Catalogue })),
  pages: () =>
    import('./pages/PageTransitions.tsx').then((m) => ({ default: m.PageTransitions })),
  'bench-greese': () =>
    import('./pages/bench/GreeseBench.tsx').then((m) => ({ default: m.GreeseBench })),
  'bench-greese-css': () =>
    import('./pages/bench/GreeseCssBench.tsx').then((m) => ({
      default: m.GreeseCssBench,
    })),
  'bench-mui': () =>
    import('./pages/bench/MuiBench.tsx').then((m) => ({ default: m.MuiBench })),
}

const name = new URLSearchParams(location.search).get('page') ?? 'theming'
const Page = lazy(pages[name] ?? pages.theming!)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense>
      <Page />
    </Suspense>
  </StrictMode>
)
