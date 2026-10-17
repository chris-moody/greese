import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@sauce-ui/react/base.css'
import '@sauce-ui/react/styles.css'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
