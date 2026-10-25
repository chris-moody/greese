/**
 * The homepage as HTML, for the build (server/prerender.ts): the app as
 * main.tsx renders it, on the server. What only the browser knows (the theme
 * worn, the colour scheme, the window's width) takes the server snapshot each
 * hook gives, so hydrating it matches; the browser then updates to its own.
 */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { App } from './App.tsx'

export const renderHome = (): string =>
  renderToString(
    <StrictMode>
      <App />
    </StrictMode>
  )
