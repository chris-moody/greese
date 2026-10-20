import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@greese-ui/react/base.css'
import '@greese-ui/react/styles.css'
import { App } from './App.tsx'
import './studio.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
