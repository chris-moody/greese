# ADR 0030: The web app routes with React Router

- **Status:** Accepted
- **Date:** 2026-10-29
- **Amends:** ADR 0018 (one web app). Its routes now go through React Router.

## Context

The web app (`apps/site`) routed with about 150 lines of its own
(`src/router.tsx`): the History API, a `useSyncExternalStore` snapshot of
`location`, and anchors that pushed state. That was cheaper than a library
while routing was all it did.

Page transitions (ADR 0029) changed that:

- **React only triggers `<ViewTransition>` for updates inside a transition.**
  `useSyncExternalStore` updates are always synchronous, so the hand-rolled
  router could never animate a page change.
- **The site should show what greese users will actually run.** That means
  a mainstream router whose navigations are transitions, with route metadata
  (`handle`) and matched routes (`useMatches`) for the transition adapter.

## Decision

- **React Router 8, in Data mode** (`createBrowserRouter`,
  `RouterProvider`), pinned to `~8.4.0`. 8.5 was under two weeks old when
  adopted.
  - Framework mode isn't used: it would replace the Vite config and
    `server/prerender.ts` for nothing the site needs.
  - Declarative mode has no `handle` or `useMatches`.
- **Routes** (`src/routes.tsx`): a root route rendered by `App` (the shell:
  theme, header, toaster), with children for `/`, `/studio`,
  `/templates/:page?` and `/docs/:page?`. Any other path is the homepage, as
  before. Each route's `handle` names it, and the app's base is the
  router's `basename`.
- **Pages other than `/` are `React.lazy` components, not route `lazy`.**
  With route `lazy`, the router waits for a direct visit's chunk before its
  first render, so the header would wait too. With `React.lazy`, the router
  starts at once, the header renders, and the page suspends as before. Each
  stays its own chunk, so the Vite config's homepage-reach rule is
  unchanged. A navigation commits in a transition, so the old page stays
  until the new chunk arrives.
- **`src/router.tsx` stays as the site's vocabulary over React Router**, so
  pages name routes, not paths:
  - `RouteLink` is React Router's `Link`, addressed by route;
  - `useRoute` reads the deepest match's `handle`;
  - `useSubpage` reads `useParams`;
  - `useNavigateTo` takes an app href (search results hold them);
  - `hrefOf` builds hrefs.

  The old module-level `navigate` and `useQuery` are gone.

- **Scrolling stays the site's own:** `ScrollOnRoute` scrolls a pushed
  navigation to the top or to its hash. The hash retry for sections that
  mount late stays, since React Router's scroll restoration doesn't wait for
  them.
- **The studio's tab** is `useSearchParams`, replaced rather than pushed.
  Writing `history` directly would leave the router's location stale.
- **The prerender** renders `/` through `createStaticHandler` and
  `createStaticRouter` (`hydrate={false}`: the homepage has no loader data to
  send), and the first-screen CSS check is unchanged.
- **Static hosting is unchanged:** the build still writes each route's
  `index.html` and `404.html`, so deep links work on GitHub Pages.
- **This is the site's dependency, not the library's.** No `@greese/*`
  package depends on React Router. ADR 0029 §6 governs whether one ever
  does, optionally.

### The app's JavaScript waits for the first screen

Measuring the router showed the homepage's LCP budget **already failing
without it** (simulated LCP 2.42–2.70 s, FCP about 2.1 s). The cause was
the entry itself: module scripts run before the browser's first paint, so the
app's whole JavaScript (about 120 kB gzipped, 150 kB with the router) was on
the way to the prerendered first screen it didn't need.

- **`src/main.tsx` is the first screen's CSS and a loader, about 1 kB.** The
  app is `src/boot.tsx`, imported once the first contentful paint has been
  presented (a `paint` performance entry; a frame callback alone runs before
  its frame is shown) **and** the first screen's immediate entrances have
  finished (finite, undelayed animations; capped at 1 s, and at once under
  reduced motion). A page that arrives with an empty root (the studio, the
  docs) boots at once.
- **The entrances are part of the wait** because the largest paint, the
  hero's text, fades in on the compositor. Chrome counts it at the next
  main-thread paint after it becomes visible. Script arriving mid-fade
  provided that paint early, but also put the whole download in front of
  the LCP Lighthouse simulates.
- **Hydration is a transition** (`startTransition(() => hydrateRoot(…))`), so
  React hydrates in slices that yield. Hydrating after the first paint moved
  its long tasks into the Total Blocking Time window, and slicing brings
  them back under budget.
- **Vite's dynamic-import helper has a chunk of its own** (`preload` in the
  Vite config). Otherwise it landed in the greese chunk, and the loader
  pulled that chunk, and React, back in front of the first paint.

Lighthouse, phone profile, medians of 3 runs:

| Tree                          | FCP    | LCP (budget 2 s) | TBT (budget 100 ms) | Performance |
| ----------------------------- | ------ | ---------------- | ------------------- | ----------- |
| Before (old router)           | 2.12 s | 2.64 s ✘         | 58 ms               | ≥ 0.95      |
| React Router, entry unchanged | ~2.4 s | 2.85 s ✘         | 100 ms              | 0.91 ✘      |
| React Router, deferred boot   | 1.21 s | 1.36 s           | 92 ms               | 1.00        |

No budget was raised.

## Consequences

- **Real-user LCP on the homepage is the hero text's fade:** about 0.5 s
  after the first paint (the theme's entrance duration), since nothing
  repaints during it. Making the largest element visible at its first paint
  (an entrance that doesn't start from opacity 0) would bring it to the
  first paint itself. That's a design choice, left to the hero.
- Hydration happens about 0.5 s later than before on the homepage. Its links
  are real anchors, so a click before then is a page load, not a dead click.
- The site's e2e suite covers routing: every route, deep links, back and
  forward, hash links, and the studio's tab in the query string. The e2e
  suite runs on the dev server, which doesn't prerender, so the deferred boot
  is covered by Lighthouse and the build's prerender check.
- The site's React Router adapter for page transitions (ADR 0029 §6) is in
  `src/router.tsx`: `useSitePageNavigate` (React Router's navigate behind
  `usePageNavigate`, taking app hrefs) and `PageNavigateContext`, which
  `RouteLink` and `useNavigateTo` use. It's under 30 lines and relies on no
  React Router internals, so by ADR 0029 §6 it stays a recipe.
- **Total Blocking Time: mostly recovered, still borderline.** After Phases
  2–7 it measured 112–130 ms against 100 ms. Bisecting by building past
  commits today: Phase 1 measured 88–93 ms, and Phase 2's page-transition
  stylesheet alone took it to 105–121 ms.
  - **The cause:** its rules began `::view-transition-*` with nothing
    before them, so the browser tried them against every element at every
    style recalculation.
  - **The fix:** they now begin `html::view-transition-*`, so only the root
    is tested. Phase 2 with the fix measured 89–106 ms.
  - **Now:** 99–113 ms (median 107). Lighthouse passes on its best run, but
    two of the three runs that time had a slow first paint.
  - The rest is spread across Phases 3–7 (a few ms each, within the noise of
    single runs).
  - An experiment measuring the `greese` prop island's positions in a frame
    callback instead of a microtask showed no clear gain, and was dropped.

## Addendum (2026-10-30): the boot, measured again

- **LCP failed in half of Lighthouse's runs** (1.87 s FCP, 3.1 s LCP). In
  those runs Chrome presented no frame for about 1.1 s: the page painted at
  85 ms, but no screenshot followed until 1.1 s, whatever the page did. It
  never happened in Playwright (52 loads), so it's how Lighthouse captures.
  The loader's 1 s fallback then started the boot before the recorded first
  paint, and Lighthouse counted the app's 160 kB of script on the way to it.
  The fallback is now 3 s, with a background tab booting when it's shown:
  1.21 s FCP and LCP in every run since, stalls included.
- **Those runs also hid blocking time:** with the boot before the late first
  paint, its tasks weren't counted. Measured honestly, the homepage was over
  budget (118–132 ms).
- **The boot is staged:** React, then React Router, then greese ui and the
  app, each in a task of its own. Evaluating them together was one task of
  about 23 ms (90 ms at 4× CPU); staged, the largest is about 12 ms.
- **Mounting sections in batches was worse** (two, three or all at once:
  264–473 ms against 214–227 ms one per step, from the trace at 4× CPU),
  so it stays one per task.
- **MotionLab's effect chips** lost their hover and press: 80-odd islands,
  each attached by the runtime, for buttons whose effect plays on the
  stage. The Play and example buttons keep theirs.
- **The `greese` prop's island no longer measures in the commit** (ADR 0009
  addendum, the same day).
- **Now:** Lighthouse's blocking time is 76–131 ms on a busy machine, with
  no task in its window over about 24 ms real. It doesn't reliably pass:
  what's left is the staged evaluation, React's renders and commits of the
  first screen, and the style recalculation as the library's CSS arrives.
