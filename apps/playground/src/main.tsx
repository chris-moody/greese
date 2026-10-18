import { lazy, StrictMode, Suspense, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'

/**
 * `?page=<name>` picks a page; each is its own chunk and imports its own CSS,
 * so the MUI benchmark never loads SauceUI's stylesheet (or vice versa).
 */
const pages: Record<string, () => Promise<{ default: ComponentType }>> = {
  theming: () => import('./pages/Theming.tsx').then((m) => ({ default: m.Theming })),
  layout: () => import('./pages/Layout.tsx').then((m) => ({ default: m.Layout })),
  forms: () => import('./pages/Forms.tsx').then((m) => ({ default: m.Forms })),
  content: () => import('./pages/Content.tsx').then((m) => ({ default: m.Content })),
  overlays: () => import('./pages/Overlays.tsx').then((m) => ({ default: m.Overlays })),
  'bench-sauce': () =>
    import('./pages/bench/SauceBench.tsx').then((m) => ({ default: m.SauceBench })),
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
