/**
 * Storybook as part of the app, at `<base>storybook/`, where every docs link
 * points (src/config.ts), the search's results included:
 *
 *   build  copies the docs' build (apps/docs/storybook-static) into
 *          dist/storybook, so dist/ is the whole site: what GitHub Pages
 *          serves, and what `vite preview` serves locally
 *   serve  sends `/storybook/…` to the Storybook dev server on the same host,
 *          so stories reload as they're edited and a phone on the network
 *          follows the link too. Storybook's dev server can't run under a
 *          sub-path, so it keeps its own port; while it isn't running (or,
 *          for another device, runs on this machine only), the link opens a
 *          page that says how to start it, and reloads itself once it's up
 */
import { cpSync, existsSync, readFileSync, rmSync } from 'node:fs'
import type { ServerResponse } from 'node:http'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin, ResolvedConfig } from 'vite'

const DOCS = join(dirname(fileURLToPath(import.meta.url)), '../../docs')
export const STORYBOOK_BUILD = join(DOCS, 'storybook-static')

/** The port `npm run dev -w docs` uses, read from its script so the two can't drift. */
export const storybookPort = (
  pkg = JSON.parse(readFileSync(join(DOCS, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>
  }
): number => Number(/(?:-p|--port)[ =](\d+)/.exec(pkg.scripts?.dev ?? '')?.[1] ?? 6006)

/**
 * The path under `/storybook` for a request URL, or undefined when it isn't
 * one: `/storybook/?path=/docs/x--docs` → `/?path=/docs/x--docs`.
 */
export const storybookPath = (url: string, base = '/'): string | undefined => {
  const prefix = `${base.replace(/\/$/, '')}/storybook`
  if (url !== prefix && !url.startsWith(`${prefix}/`) && !url.startsWith(`${prefix}?`))
    return undefined
  const rest = url.slice(prefix.length)
  return rest.startsWith('/') ? rest : `/${rest}`
}

/** The host a request came to, without its port: `192.168.1.5:5180` → `192.168.1.5`. */
const hostnameOf = (host: string | undefined): string =>
  (host ?? 'localhost').replace(/:\d+$/, '')

/** The Storybook dev server URL for that path, on the host the request came to. */
export const storybookTarget = (host: string | undefined, path: string, port: number) =>
  `http://${hostnameOf(host)}:${port}${path}`

// Vite only lets through a Host that's localhost or an IP address, so this
// only ever asks this machine, or an address it answered on, about one port.
const running = async (url: string): Promise<boolean> => {
  try {
    await fetch(url, { signal: AbortSignal.timeout(500) })
    return true
  } catch {
    return false
  }
}

const page = (res: ServerResponse, title: string, body: string) => {
  res.statusCode = 503
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.end(`<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="2">
<title>${title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:36rem;margin:3rem auto;padding:0 1rem}code{background:#8882;padding:.1em .3em;border-radius:.25em}</style>
<h1>${title}</h1>
${body}`)
}

const notRunning = (res: ServerResponse, port: number) =>
  page(
    res,
    "Storybook isn't running",
    `<p>The docs are Storybook's dev server, on port ${port}. Start it, and this page opens it:</p>
<p><code>npm run dev -w docs</code></p>
<p>Or run the site and the docs together with <code>npm run dev</code> at the repository root.</p>`
  )

// Storybook's dev server listens on this machine only unless told otherwise.
const notOnNetwork = (res: ServerResponse, port: number) =>
  page(
    res,
    'Storybook is only on the computer',
    `<p>It's running, on port ${port}, but only for the computer itself, so this device can't open it. Restart it on the network, and this page opens it:</p>
<p><code>npm run dev -w docs -- --host 0.0.0.0</code></p>`
  )

export const storybook = (): Plugin => {
  let config: ResolvedConfig
  return {
    name: 'greese-storybook',
    configResolved(resolved) {
      config = resolved
    },
    configureServer(server) {
      const port = storybookPort()
      server.middlewares.use((req, res, next) => {
        const path = storybookPath(req.url ?? '/', server.config.base)
        if (path === undefined) return next()
        const target = storybookTarget(req.headers.host, path, port)
        const local = `http://localhost:${port}/`
        void Promise.all([
          running(local),
          hostnameOf(req.headers.host) === 'localhost' ? null : running(target),
        ]).then(([here, there]) => {
          if (there ?? here) {
            res.statusCode = 302
            res.setHeader('location', target)
            return res.end()
          }
          return here ? notOnNetwork(res, port) : notRunning(res, port)
        })
      })
    },
    closeBundle() {
      if (config.command !== 'build') return
      const target = join(resolve(config.root, config.build.outDir), 'storybook')
      rmSync(target, { recursive: true, force: true })
      if (!existsSync(join(STORYBOOK_BUILD, 'index.html'))) {
        const message =
          'apps/docs/storybook-static is missing, so dist/ has no /storybook/ and the docs links lead nowhere. Build the docs first: `npx turbo run build --filter=site` does both.'
        // Pages must never ship without the docs; a local build may.
        if (process.env.CI) throw new Error(message)
        config.logger.warn(message)
        return
      }
      cpSync(STORYBOOK_BUILD, target, { recursive: true })
    },
  }
}
