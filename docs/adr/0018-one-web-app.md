# ADR 0018: The homepage and Theme Studio are one web app

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

The homepage (`apps/site`) and Theme Studio (`apps/theme-studio`) were two
Vite apps with two headers, deployed side by side. They share a purpose (the
studio is the best demo of theming) and now a header's worth of controls: a
theme to wear, motion to replay, a color scheme.

## Decision

One app, `apps/site`, with two routes: `/` (the homepage) and `/studio` (Theme
Studio). The studio's code lives in `apps/site/src/studio` and its dev-server
file access in `apps/site/server`; `npm run studio` runs the app.

- **One header**, on every route: the wordmark, the section links with
  **Studio** after Components, then **search** (the site's pages and
  sections, the templates and every docs page, in a dialog), a **theme
  menu**, **Replay motion**, the color scheme and GitHub. The studio's own
  controls, **Inspect**, **Import** and **Save** (with its green Saved
  badge), head its editor rather than the header (amended 2026-10-24).
- **One theme.** The theme menu (the studio's presets, "Greese" first, the
  site's own orange) sets a theme that the homepage wears, built with
  `createTheme` from the spec, and the studio edits. It starts as the site's
  theme, or the last one saved in the browser. The studio's editor and its
  header controls stay on GreeseUI's defaults so editing a theme restyles only
  its preview; its component and motion edits are the preview's (the page
  wears the tokens and typography).
- **Replay motion** is app state: the homepage remounts, the studio's
  preview remounts its gallery.
- **Routing** is a small History-API router (`src/router.tsx`) under the
  app's base, with plain anchors, so links work without JavaScript. The studio
  page, the header's theme menu and the studio controls are lazy chunks: the
  homepage's first paint doesn't load an editor, a compiler or a menu.
- **Hosting:** the base is `/` in development and `/<repository>/` on Pages
  (`GREESE_BASE`). The build writes `studio/index.html` and `404.html` as
  copies of the page, so GitHub Pages, which has no rewrites, serves the app
  for a direct visit to `/studio`.
- The studio's preview stays a separate page (`preview.html`, in an iframe),
  as before.

## Consequences

- One deployment, one header, one theme state; the Pages workflow builds the
  app and Storybook, and no longer a third app.
- Commit scope `studio` now means `apps/site/src/studio` and
  `apps/site/server`; `site` is the rest of the app.
- A saved theme in the browser applies to the homepage too, which is the point
  and also something to know when the homepage looks different on a visit.

## Addendum (2026-10-24): the docs are part of the app

> Superseded by [ADR 0028](0028-docs-in-the-web-app.md): the app renders the
> docs itself, and no longer copies or links to Storybook. The `GREESE_BASE`
> and blank-page fixes below still stand.

The app's docs links (the header's, and every docs result in the search)
point at `<base>storybook/`, which only existed on Pages, assembled there by
the workflow. Locally nothing served it: the dev server and `vite preview`
answered with the homepage, so the links seemed dead.

- **The app's build includes the docs.** `server/storybook.ts` copies
  `apps/docs/storybook-static` into `dist/storybook`, and turbo builds the
  docs before the app (`site#build` depends on `docs#build`). `dist/` is the
  whole site: the Pages workflow uploads it as it is, and `vite preview`
  serves it locally. A build without the docs fails in CI and warns locally.
- **In development, `/storybook/…` redirects to Storybook's dev server** on
  the same host. Storybook's dev server can't run under a sub-path, so it
  keeps its port (read from `apps/docs`' `dev` script), and stories keep
  hot-reloading. While it isn't running, or runs on this machine only and
  the request came from another device, the link opens a page saying what to
  run, which reloads itself until Storybook answers.
- **`GREESE_BASE` reaches the build.** Turbo's strict environment mode
  dropped it, so a Pages build used `/` and every asset 404'd under
  `/greese/`. `site#build` now declares it (`env`, so it's in the cache key)
  and passes `CI` through.
- **The production build rendered nothing.** The `react` chunk group pulled
  React out of the chunk shared by both entries (`effects-runtime`), where
  Rolldown had put its runtime helpers, onto an import cycle; React's chunk
  ran first and threw `__commonJSMin is not a function`, leaving a blank
  page. The dev server doesn't split chunks, and no gate loaded the build.
  `effects-runtime.ts` now joins the `react` group, which costs nothing
  (`output.strictExecutionOrder` also fixed it, for 18 kB more on the
  homepage), and `server/runtimeChunk.ts` fails the build if the helpers'
  chunk is ever on a cycle again.
- **Tests:** `server/storybook.test.ts` (paths under the base, the redirect
  target and port, the cycle check).

## Addendum (2026-10-25): the homepage is prerendered

The built homepage was an empty `#root` until about 300 kB of JavaScript had
loaded and React had rendered, so nothing painted before it. The build now
renders `/` to HTML (`server/prerender.ts`, through Vite's SSR loader with
the app's own config) and `main.tsx` hydrates it. The routes' copies
(`studio/`, `docs/…`, `404.html`) keep the empty root, so they never show the
homepage's HTML first.

- **Hydration must match.** What only the browser knows takes a server
  value while hydrating, then updates: the library's hooks already do
  (`useSyncExternalStore` server snapshots); the site's theme saved in the
  hosted studio is read once hydrated (`useHydrated` in App.tsx), and the
  search's ⌘/Ctrl label likewise. Anything new the homepage renders from
  `window`, `navigator` or storage needs the same, or React reports error
  418 and re-renders the page.
- **Measured** 2026-10-25 in Chromium under Lighthouse's phone profile
  applied for real (150 ms RTT, 1.6 Mbps, 4× CPU), medians of three: first
  paint 1.55 → 1.09 s, LCP 2.06 → 1.64 s (the hero's text, which fades in;
  1.09 s with reduced motion).
- **The stylesheet is split.** Render-blocking: the tokens and the 31
  library blocks the first screen uses, with the ones they depend on
  (`src/styles/firstScreen.ts`, in the library's order), about 14 kB
  brotli of the whole 22 kB. The whole library's CSS (`src/styles/library.ts`)
  is asked for when `main.tsx` runs, without blocking the paint, and every
  lazy part imports it, so nothing renders before its styles. It repeats the
  first screen's blocks (about 12 kB), so the library's rules keep their own
  order and the cascade is a single stylesheet's. The build fails when the
  prerendered HTML uses a block, or a block it depends on, that
  firstScreen.ts doesn't load (`missingBlocks`); with the rest of the CSS
  held back, the first screen is pixel-identical on a phone and a desktop.
  The `greese` chunk group takes scripts only, or it pulled the whole
  library's CSS into a render-blocking file.
- **Measured** 2026-10-25, same profile, medians of three: first paint
  0.90 s, LCP 1.45 s. Lighthouse (simulated): LCP 2.50 → 2.24 s,
  performance 0.95 → 0.97; still over its 2 s LCP budget by the hero's
  fade-in, which stays for now.
