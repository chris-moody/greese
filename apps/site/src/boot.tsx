/**
 * The app's JavaScript: React, React Router, greese ui and the pages. main.tsx
 * imports it only once the first frame has painted, so the prerendered
 * homepage paints from its HTML and CSS alone and none of this is on the way
 * to it.
 */
import { startTransition, StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
// No `import '@greese/react/greese'`: the first screen animates with CSS
// presets, so the greese prop's runtime can load lazily, after first paint.
// Loading it up front forced the page's first style calculation into a
// JavaScript task and blocked the main thread.
import './effects.ts'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { whenIdle } from './idle.ts'
import { BASE } from './router.tsx'
import { routes } from './routes.tsx'

// The rest of the library's styles, asked for now but not waited on: the
// prerendered first screen paints without them (styles/library.ts).
void import('./styles/library.ts')

// The tab's icon follows the theme being worn, once the page is idle.
whenIdle(() => void import('./logo/favicon.ts').then((m) => m.liveFavicon()))

const root = document.getElementById('root')!
const router = createBrowserRouter(routes, { basename: BASE })
const app = (
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
// The built homepage arrives rendered (server/prerender.ts), so it has
// painted before this runs; it's hydrated, as a transition: React then
// hydrates in slices, yielding to the browser between them, rather than in
// one long task while the page is already on screen. Other routes, and the
// dev server, start from an empty root.
if (root.firstElementChild) startTransition(() => void hydrateRoot(root, app))
else createRoot(root).render(app)
