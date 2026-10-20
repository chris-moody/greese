import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@greese/react/base.css'
import '@greese/react/styles.css'
import { App } from './App.tsx'
import './studio.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
