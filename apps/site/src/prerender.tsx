/**
 * The homepage as HTML, for the build (server/prerender.ts): the app as
 * main.tsx renders it, on the server, through React Router's static router
 * (ADR 0030). What only the browser knows (the theme worn, the colour scheme,
 * the window's width) takes the server snapshot each hook gives, so hydrating
 * it matches; the browser then updates to its own.
 */
import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router'
import { BASE } from './router.tsx'
import { routes } from './routes.tsx'

export const renderHome = async (): Promise<string> => {
  const handler = createStaticHandler(routes, { basename: BASE })
  const context = await handler.query(new Request(new URL(BASE, 'http://localhost')))
  if (context instanceof Response)
    throw new Error(`The homepage answered ${context.status}, not a page.`)
  const router = createStaticRouter(handler.dataRoutes, context)
  // No hydration data: the homepage has no loaders, and the browser's router
  // starts from its own location, which the HTML then matches.
  return renderToString(
    <StrictMode>
      <StaticRouterProvider router={router} context={context} hydrate={false} />
    </StrictMode>
  )
}
