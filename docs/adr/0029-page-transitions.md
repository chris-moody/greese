# ADR 0029: Page transitions on React's transition layer

- **Status:** Accepted
- **Date:** 2026-10-29
- **Amends:** ADR 0009 (the `greese` prop gains `share` and page exits), ADR
  0017 (scopes gain an exit pass), ADR 0025 (motion themes gain page roles)

## Context

greese animates components (ADR 0009), orders entrances across a page
(ADR 0017) and gives themes a motion layer (ADR 0025), but a page change
is an instant swap. We wanted page transitions: the current page's exit, then
the next page's entrance, paced by a hierarchical configuration.

Two things made this the right time to do it:

- **React 19.3 (September 2026) made `ViewTransition` and
  `addTransitionType` stable.** Any router that commits navigations in
  `startTransition` triggers `<ViewTransition>` with no router-specific code.
- **React Router 8 deprecated its own view-transition props** in favour of
  React's component. Next.js's App Router also commits in transitions. React's
  transition layer is now the shared integration point between routers.

We weighed a plugin for one router against a router of our own
(`@greese/router`). A router of our own that also renders Server Components
would be a framework: a Flight transport, bundler integration and a server
runtime, which is outside ADR 0013's scope. It would also be React-only,
against ADR 0014.

## Decision

### 1. Build on React's layer, not around it

greese never calls `document.startViewTransition` itself. It defines
**transition types** and **view-transition effects** on top of React's
`ViewTransition` and `addTransitionType`.

| Package         | Gets                                                                                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@greese/ui`    | Framework-free CSS: view-transition forms of every built-in effect, CSS scoped to greese types, page roles in `motion-defaults()`, a `page-transitions()` kit mixin for selector rules. The same CSS serves cross-document `@view-transition`. |
| `@greese/js`    | A target adapter for `::view-transition-*` pseudo-elements, so sequences and timelines can drive snapshots                                                                                                                                     |
| `@greese/react` | `'use client'` parts: `PageTransition` (wraps `ViewTransition`; pages pass through as `children`, so they can stay Server Components), the config resolver, `usePageNavigate`, the live exit pass                                              |

### 2. greese transition types

`greese-page` on every greese navigation; `greese-forward` / `greese-back`;
`greese-deeper` / `greese-shallower` / `greese-sibling`; `greese-replace`.
Apps add their own. Effects and rules can be keyed by any type.

### 3. Two modes, `auto` by default

- **Snapshot (A):** React's `ViewTransition`, with greese effects as its
  classes, animating `::view-transition-old/new`.
- **Live (B):** the old page stays mounted and live while its members play
  their exits, inside an async transition that also starts the navigation, so
  the next route loads during the exit. The exit pass is the scope pass
  (ADR 0017) run for exits. **Its default order is `reverse`** (the last
  member leaves first). `document` and `together` are options.
- **`auto`** uses live where the leaving route has a page scope and snapshot
  otherwise. A theme's `page-mode`, or app, route or navigation config,
  overrides it.
- Back and forward can't be held without the Navigation API's deferred
  commit. Where that's missing, they fall back to snapshot (or an instant
  swap).
- View Transitions are newer than the Baseline 2024 target (ADR 0013).
  Without them, a navigation swaps instantly and nothing breaks.

### 4. One configuration cascade

Theme (page roles) → app (`PageTransition`) → route (a router's route
metadata, such as React Router's `handle.greese`) → element (the `greese`
prop) → navigation (a link or `navigate()` call). Each level sets only what
it names. **Selector rules** add specificity at the theme, app and route
levels: CSS specificity, then source order, decides within a level, and a
later level beats an earlier one. Config is data (strings and plain
objects), so it serializes, and Server Components and route modules can
declare it. Functions (`timeline`) stay client-only, as in ADR 0009.

In snapshot mode, a selector rule compiles to CSS that names the matched
elements (`view-transition-name: match-element`) only during a greese page
transition (`:active-view-transition-type(greese-page)`), inside
`@layer greese.*`. Every named element is a snapshot, so the docs say to name
sections rather than list items, and a dev-mode warning reports a transition
that names too many.

### 5. Effects and sequences, unchanged

Every built-in effect has a view-transition form, and the sequence grammar
(`+`, `,`, pauses, negative overlaps, calls) works unchanged. A transition's
`enter`, `exit` or a rule's value may also be a **timeline map**, selector →
sequence, with every entry starting together unless it is offset. It plays
as CSS when every entry is a preset with static timing, and through greese.js
otherwise (on live elements, or on pseudo-elements through `ViewTransition`'s
callbacks).

### 6. Router integration: an adapter interface, recipes first

The core depends on no router. A small `PageRouterAdapter` supplies
`navigate`, and optionally the matched route chain (exact depth and route
config) and the history index (direction). Without them, greese uses its
generic fallbacks: per-layout `PageTransition` boundaries, URL depth, and the
Navigation API's index. The site's React Router adapter lives in `apps/site`
and is published as a recipe, next to recipes for Next.js and TanStack
Router.

It's promoted to a subpath entry, `@greese/react/react-router` with
`react-router` as an optional peer, **only** if it depends on React Router
internals, grows past about 50 lines, or a React Router release breaks it.
That promotion needs its own ADR. There will be no separate package.

### 7. Shared elements: keys, not names

`greese={{ share: 'key' | [group, id] }}` takes a key that means the same
thing on both pages. greese derives a valid, namespaced identifier
(`greese-share-…`, escaped or hashed) and a view-transition class per group,
so themes (a `share` role) and rules can style a group's morphs together. A
dev-mode check names duplicate keys before the browser would skip the
transition.

Pairing from the clicked link (`share: 'link'`) ships if its spike passes,
forward-only if going back doesn't pair reliably. React's own
`<ViewTransition name>` is left untouched. `share` is for identity across
pages; selector rules (`match-element`) are for parts within a page.

### 8. Motion themes and the Studio

`motion-defaults()` gains `page`, `page-exit`, `page-back`, `page-back-exit`,
`page-duration`, `page-stagger`, `page-ease`, `page-exit-order`, `page-mode`
and `share` roles. Every motion theme assigns them in keeping with its
description. Theme Studio edits them, along with selector rules and timeline
maps, in the motion panel. The spec gains fields with a migration.

### 9. Reduced motion

React doesn't honour `prefers-reduced-motion` for view transitions. greese's
CSS and runtime turn every page transition into an instant swap under
`reduce`, as its entrances already do.

### Addendum: the CSS (Phase 2, 2026-10-29)

- **Exits have keyframes now.** An overlay's exit only transitions to its
  end values, so exits had no `@keyframes`. `cssPlan()` gains `leave`, an
  exit's steps from rest to where it ends, and the build's maps carry it. The
  kit's `effect()` and `effectCss()` write it too, so an effect Theme Studio
  defines can leave a page. `Motion.scss` doesn't emit them, so pages without
  page transitions don't carry them.
- **`@greese/ui`'s `PageTransition` stylesheet** has these classes, all for
  `view-transition-class`, all behind `prefers-reduced-motion: no-preference`:
  - `greese-PageTransition` (the page's pace, its groups included);
  - `--enter-<name>` and `--exit-<name>` for every built-in effect;
  - `--theme` and `--theme-back` (the page roles, a cross-fade without them);
  - `--share` and `--still`.

  Under `reduce`, greese snapshots don't animate.

- **Types pick classes; they don't drive selectors.** React's
  `ViewTransition` props take class names keyed by transition type, which
  works wherever React does. So greese's types choose between `--theme` and
  `--theme-back` (and any effect classes) in React, and the CSS doesn't
  depend on `:active-view-transition-type()`. That selector is used only by
  `page-transitions()`, to name elements during greese page changes alone.
- **Selector rules are numbered by theme** (`greese-page-<theme>-<n>`), so two
  themes' rules never collide.
- **Budgets:** `greese.css` 23.6 → 24.9 kB (24.82 kB), and
  `css/PageTransition.css` gets its own 1.8 kB budget (1.74 kB).
- **Checked in Chromium,** on a plain page with a real view transition:
  - the snapshots play the named effects;
  - `--theme-back` follows the theme variable;
  - groups take the page's duration;
  - under reduced motion, greese snapshots don't animate.

## Consequences

- New size budgets: the view-transition CSS, `PageTransition` and the live
  exit pass each get a `size-limit` entry. The exit pass loads lazily, like
  scopes.
- Tests: unit tests with a mocked `startViewTransition`; e2e in engines with
  and without View Transitions; back and forward fallbacks; focus after
  commit; reduced motion.
- Docs: a "Page transitions" guide, a story page per new export, and
  recipes for React Router, Next.js, TanStack Router and cross-document CSS.
- The plan and its phases are in `docs/plans/PAGE_TRANSITIONS.md` (local).
