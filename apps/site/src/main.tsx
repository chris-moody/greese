import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@greese-ui/react/base.css'
import '@greese-ui/react/styles.css'
// No `import '@greese-ui/react/greese'`: the first screen animates with CSS
// presets, so the greese prop's runtime can load lazily, after first paint.
// Loading it up front forced the page's first style calculation into a
// JavaScript task and blocked the main thread.
import './effects.ts'
import './site.css'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
