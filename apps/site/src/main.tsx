import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@greese/react/base.css'
import '@greese/react/styles.css'
import 'virtual:greese-utilities.css'
// No `import '@greese/react/greese'`: the first screen animates with CSS
// presets, so the greese prop's runtime can load lazily, after first paint.
// Loading it up front forced the page's first style calculation into a
// JavaScript task and blocked the main thread.
import './effects.ts'
import './site.scss'
import { App } from './App.tsx'

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
