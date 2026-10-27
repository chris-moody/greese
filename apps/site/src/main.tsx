import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@greese/react/base.css'
// Render-blocking: only what the first screen uses. The rest is library.ts.
import './styles/firstScreen.ts'
import 'virtual:greese-utilities.css'
// No `import '@greese/react/greese'`: the first screen animates with CSS
// presets, so the greese prop's runtime can load lazily, after first paint.
// Loading it up front forced the page's first style calculation into a
// JavaScript task and blocked the main thread.
import './effects.ts'
import './site.scss'
import { App } from './App.tsx'
import { whenIdle } from './idle.ts'

// The rest of the library's styles, asked for now but not waited on: the
// prerendered first screen paints without them (styles/library.ts).
void import('./styles/library.ts')

// The tab's icon follows the theme being worn, once the page is idle.
whenIdle(() => void import('./logo/favicon.ts').then((m) => m.liveFavicon()))

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)
// The built homepage arrives rendered (server/prerender.ts), so it paints
// before this script runs; it's hydrated. Other routes, and the dev server,
// start from an empty root.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
