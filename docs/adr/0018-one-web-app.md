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

- **One header**, on both routes: the wordmark, the section links with
  **Studio** after Components, then a **theme menu**, **Replay motion**, the
  color scheme and GitHub. The studio route adds **Inspect**, **Import** and
  **Save** (with its green Saved badge); they're not on the homepage.
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
