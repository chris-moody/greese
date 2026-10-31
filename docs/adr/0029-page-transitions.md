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

### Addendum: React (Phase 3, 2026-10-29)

- **One direction type per navigation.** React joins the classes of every
  active type it finds in a `<ViewTransition>` map (and `none` wins). A back
  navigation carrying both a forward and a back class would leave the
  winning effect to stylesheet order. So `usePageNavigate` adds exactly one
  of `greese-forward`, `greese-back` or `greese-replace`, and
  `PageTransition` maps only those (plus your own types), with
  `default: 'none'`. Anything else that updates the page in a transition,
  like a tab or filter kept in the URL, changes it in place.
- **Back is going back in the history or up the URL** (`greese-shallower`),
  so "up" plays the theme's back roles. A change of hash or query alone isn't
  a page change, and gets no greese types.
- **Types reach a router's own commit.** `usePageNavigate` adds them inside
  an async transition and awaits the router's navigate in it. React
  entangles the router's later `startTransition` with the pending action.
  Checked with React Router's data router and an async loader: one view
  transition, carrying the types.
- **`share` is a component, `PageShare`, not a `greese` prop option.** In
  the prop, its name and class helpers ship with every component's static
  part, about 0.2 kB each, for a feature few pages use (Stack went from 2.44
  to 2.64 kB). As a component, only pages that share pay. Keys, names and
  groups are as in §7. The duplicate-name check is React's own development
  warning, which names the derived `greese-share-<group>-<id>`.
- **The root is the browser's.** React starts a view transition when
  `Suspense` reveals content while a `<ViewTransition>` is mounted (a lazy
  route arriving), and the browser cross-fades the document root, everything
  outside a named boundary. greese leaves that to the browser, and its own
  boundaries resolve to `none` outside greese navigations.
- **Server Components:** `PageTransition` and `PageShare` take only data
  (React's server build exports `ViewTransition`). `usePageNavigate` is the
  client part. Before React 19.3 both render their children unchanged; the
  peer range stays `^19.0.0`.
- **Budgets:** `{ PageTransition, PageShare, usePageNavigate }` is 1.53 kB.
  The whole library went 29.4 → 30.6 kB, and 34.85 → 36 kB with greese.js.
- **Tested in five engines** (Chromium, Firefox, WebKit, Pixel 7, iPhone):
  - a link plays the named exit and the theme's entrance, with the
    navigation's types;
  - going up plays the back entrance;
  - a link to the current page starts nothing;
  - under reduced motion, no greese animation plays;
  - without `startViewTransition`, the page still changes.

### Addendum: live exits and timelines (Phase 4, 2026-10-29)

- **Live exits are CSS, chosen by script, as scopes are.**
  - A page's members are its outermost on-screen elements with greese
    entrances.
  - Each gets an inline `animation`: its own exit, else the theme's
    `page-exit` (`page-back-exit` going back), at the page's pace, delayed by
    its position in `reverse` order (the default), `document` order, or
    `together`.
  - No greese.js loads. Under reduced motion the keyframes don't exist, so
    nothing plays.
  - The hook waits for those animations, capped at 2 s.
- **The commit waits for the exit.** `usePageNavigate` starts the router's
  navigate inside its async transition, so the next page loads during the
  exit, and React commits the router's update when both are done. Measured
  in five engines: the old page stays until its exit ends.
- **The exit's styles come off after the commit.** React keeps an element
  that's in the same place on both pages, and it would keep the exit's last
  frame and stay hidden. Two frames after the exit, the styles are removed,
  so a kept element plays its entrance again. The e2e test caught this.
- **Deciding at the click.** Transition types must be added before anything
  is awaited, so whether a page leaves live is decided synchronously:
  - the navigation's `mode`, else the page's, else the theme's `page-mode`,
    else `auto`;
  - `auto` is live when the page has members on screen or a timeline.

  That code ships with the hook. A live page adds `greese-live`, which maps
  to `none`, so no snapshot plays over it.

- **A page is found by markers, not a wrapper.** `PageTransition` renders two
  empty `<template>`s around its page, the first carrying its live settings
  as data. A wrapper element would break a layout's `parent > page`
  selectors. A Server Component has no context to share them through.
- **Timelines play live, through greese.js.** A sequence, or a map of
  selector → sequence whose entries start together, goes to the lazy runtime
  (`playPageExit`, built on the `greese` prop's `addMotion`).
- **No pseudo-element adapter for greese.js.** §5 planned to play
  timelines on view-transition pseudo-elements. greese.js renders by
  writing inline styles each frame, which pseudo-elements can't take. So
  snapshots play named effects in CSS, and anything needing greese.js
  plays live, on the real elements.
- **Back and forward are held where the browser can.** The Navigation API's
  `precommitHandler` defers a same-document traversal's commit. During it the
  URL and the page are still the old ones, and `popstate` fires after, so
  routers that listen for it need no changes.
  - **Support:** every engine in the test matrix supports it (Chromium,
    Firefox, WebKit, both phones). Elsewhere, back and forward change the
    page at once.
  - **Focus:** `focusReset: 'manual'`, since a plain traversal never moved
    focus.
- **Budgets:** page transitions 1.6 → 3 kB (2.94 kB), the whole library
  30.6 → 31.8 kB and 36 → 37.2 kB, and the lazy runtime 11 → 11.05 kB.

### Addendum: motion themes (Phase 5, 2026-10-29)

- **Every motion theme assigns page roles** in keeping with its description,
  forward and back:

  | Theme  | Forward: enter / exit           | Back: enter / exit              | Pace                     |
  | ------ | ------------------------------- | ------------------------------- | ------------------------ |
  | Snappy | `pop-in` / `pop-out`            | the same                        | 0.25 s, exits `together` |
  | Gentle | `blur-in` / `fade-out`          | the same                        | 0.7 s                    |
  | Wipe   | `wipe-left` / `none`            | `wipe-right` / `none`           | 0.6 s                    |
  | Pocket | `pocket-up` / `pocket-out-down` | `pocket-down` / `pocket-out-up` | 0.55 s                   |
  | Depth  | `flip-right` / `flip-out-left`  | `flip-left` / `flip-out-right`  | 0.6 s                    |

  Each takes its theme's stagger and enter ease. Wipe's old page doesn't
  move: the new one wipes over it. Depth's flips continue one rotation, so
  a page turns like a cube's face, the other way going back. Gentle's
  `blur-in` keeps its opacity, so the old page fades out beneath it.

- **Checked in Chromium** on a plain page with each theme's CSS. Every
  theme's snapshots play its roles, forward and back, and screenshots at
  45% show the intended motion.
- **Page roles reach snapshots only from `:root`.** View-transition
  pseudo-elements inherit from the document element. The motion theme files
  write their roles on `:root`, so they apply. A theme scoped to an element
  (`ThemeProvider`, the kit's `theme(name)`) couldn't reach the snapshots,
  though its live exits still followed it. Phase 6 fixes this: see below.
- **Stored themes migrate.** A theme worn or saved whose motion is exactly a
  preset's from before page transitions wears that preset as it is now, so
  the motion menu still knows it. Motion of your own is left as it is.
- **The Studio's importer** reads the page roles back from a theme's CSS,
  and every effect's keyframes, entrances and exits, count as implied by
  the roles that play them.

### Addendum: Theme Studio (Phase 6, 2026-10-29)

- **A named theme's page roles go on the root too.** Inside `theme(name)`,
  `motion-defaults()` also writes its page and share roles on
  `:root:has([data-greese-theme='<name>'])`. While the themed element is on
  the page, the root, which the snapshots inherit from, carries them. Only
  those roles go there, so a named theme's other motion doesn't leak into
  the rest of the page. `:has()` is within the Baseline 2024 target.
- **The spec gains `pageRules`:** selector → `'still'`, or `{ enter, exit,
duration, delay, ease }`, in kebab-case and CSS times.
  - It's validated: a selector that could end a rule is refused, and so are
    an entrance or exit that isn't one, and keys a rule doesn't take.
  - It's written with the kit's `page-transitions()`.
  - It's additive, so stored themes need no migration.
- **The importer reads both back:** the page roles, and the
  `page-transitions()` output, whose naming rule gives the selector and
  whose snapshot rules give its effects and pace. The root's copy of a named
  theme's page roles counts as implied.
- **The Motion tab has a Pages section**, with the page roles and the parts
  of a page.
  - The tab's stage plays them on "Change pages", forward and back. The
    stage is in the editor's document, so it sets the edited page roles on
    the editor's root while it's shown, since snapshots inherit from there.
    It hands the rules to its `PageTransition`.
  - The preview's "Page transition" tile plays the compiled theme on the
    other tabs.
- **Not in a theme:** timeline maps and sequences. They play live, through
  greese.js, from `PageTransition`'s `exit`, which is code, not CSS.
  A theme assigns effects by name.

### Addendum: the web app (Phase 7, 2026-10-29)

- **The site changes pages with `PageTransition`** around its outlet; the
  header stays put, outside it.
  - The shell makes one `usePageNavigate` and shares it.
  - `RouteLink` and search navigate through it, with app hrefs, base
    included, so a navigation's depth comes from the URL as it is. React
    Router gets its own path.
- **Live on the homepage, snapshots elsewhere.** The homepage's hero is a
  choreography of entrances, so it leaves live (`auto`): its members go in
  turn, then the page changes. On other pages the only members on screen
  are the footer's. `auto` made a docs page's "next" link (beside the
  footer) leave live, fading the footer alone, so those pages are
  `snapshot`.
- **A live page starts no view transition.** Every greese boundary
  resolves to `none` (`greese-live`), so React doesn't call
  `startViewTransition` at all. The site's e2e checks the members' exit
  styles instead.
- **A template's title morphs** from its gallery card into its page's bar
  (`PageShare`, `['template', id]`). The page itself loads lazily behind a
  spinner, so the title is what's on screen on both sides.
- **Scrolling happens before the snapshot.** `ScrollOnRoute` scrolls in
  layout effects, so a pushed page's snapshot is taken at the top. It skips
  the first render, where the browser has already placed the page.
- **Tested** in the site's e2e:
  - leaving the homepage plays its members' exits and no snapshot;
  - a card to its template is deeper, with the title's shared group;
  - the bar back is back and shallower;
  - docs page to docs page is a sibling;
  - a Studio tab changes in place.

  A production probe found no hydration errors; the markers' `useId` matches
  through the static router.

### Addendum: pairing by the link, and what the routers do (2026-10-30)

- **`<PageShare link>` pairs by the link followed** (option C of the plan's
  shared-element question), in both directions: the item around the clicked
  link with the next page's hero (its one `link` element with no link
  inside), and going back, the hero with the item linking to the page left.
  An end that isn't found leaves the page's own exit and entrance.
- **greese names both ends in the DOM, not React.** A spike showed React
  names, on a page that enters, only the outermost `<ViewTransition>`; a
  nested one is named only as half of a pair with a React one of the same
  name leaving. So `usePageNavigate` names the old end at the click, and a
  MutationObserver names the new end as it's inserted: its callback is a
  microtask inside React's view-transition update, before the browser's
  snapshot of the new page. Both names come off two frames later. It needs
  the navigation to go through `usePageNavigate`, so it's client-only;
  `PageShare` itself stays a Server Component (it only marks its child).
- **Tested** in all five engines, both directions (30 runs of the spike,
  then the playground's `?variant=link`).
- **Next.js 16.4 and TanStack Router 1.170** were run in apps of their own in
  Chromium, Firefox and WebKit. Next.js works as the recipe says (its own
  React, 19.3 canary, has `ViewTransition`). TanStack Router works, back
  included, with a `types` function comparing `state.__TSR_index` and
  returning `false` on the first load; the guide shows it.
- **The browser's back and forward buttons play no snapshot** with React
  routers: the router's update carries no greese types, and
  `PageTransition`'s classes default to `none`. Live exits are held through
  the Navigation API, as before. The guide now says so.

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

### Addendum: what a page change shows while it happens (2026-10-30)

Found on the web app with the Pocket motion theme, then checked under every
theme in Chromium, frame by frame:

- **A live exit's styles come off when the commit is seen.** Two frames
  after the exit was a guess. React commits when the next page has
  rendered, and a heavy one (the Studio) committed three frames later, so
  the hero's members came back on the old page and the page flashed.
  `usePageNavigate` now watches the leaving page with a MutationObserver
  from the end of the exit. A page change changes the page: its elements,
  its text or their attributes, but not the `style` the exit sets. Once the
  exit has played nothing else does, and a page that didn't change lets go
  after `EXIT_CAP`. The callback is a microtask after the commit, before
  the browser's snapshot of the new page.
- **A page that left live still plays the new page in.** `greese-live` was
  `none`, so after a live exit the new page simply appeared, with only its
  members' entrances. It now maps to `greese-PageTransition--left`, joined
  with the direction's classes: the new page plays the theme's entrance,
  and what the exit left of the old page (backgrounds, anything that isn't
  a member) fades beneath it. `none` from the direction still wins, and a
  replace adds no `greese-live`, so it still changes in place. This
  reverses "a live page starts no view transition" (Phase 7).
- **A page's snapshots show only the screenful in view.** A page
  `PageTransition` names is snapshotted whole, 9,500 px for the homepage.
  Effects sized by the element (a pocket slides its own height into a slot
  at its foot, a pop scales about its middle, a flip turns about its axis)
  played almost wholly off screen, so the Studio's exit couldn't be seen.
  - The page's classes carry `greese-PageTransition--page` (rules' parts
    don't). Its old and new snapshots are `min(100%, 100dvh)` tall, the
    image at its natural size (`object-fit: none`), so effects are sized
    by the screen.
  - The new page shows from its top, since it's scrolled there first. The
    old page shows from `--greese-page-scrolled`, how far the screen was
    into it, which `usePageNavigate` measures at the click, before the
    snapshot.
- **A page that commits still loading plays its fallback.** The web app's
  pages are chunks; leaving the homepage mounted a new Suspense boundary,
  which showed its empty fallback, and the snapshot played that. A docs
  page's content is behind a boundary keyed by the page, so each docs
  navigation snapshotted a spinner with the footer under it. The app's
  navigate now returns a promise for the next page's chunk, the footer and
  its content (a docs page's stories or MDX, a template), capped at 3 s.
  Those promises are marked fulfilled when they resolve, so `use` reads
  them at once where `React.lazy` would suspend for a microtask. The
  guide tells apps to do the same.
- **The Studio's preview is hidden until it has painted with the theme**
  (its first measured colors), then fades in. An iframe is blank, and in a
  dark scheme white, until its own app loads.
- **What's still stays on top.** View-transition groups stack in the
  document's order, so a still header that comes before the page was
  painted under it, and the page moved over the header. Still groups now
  take `z-index: 1`: the page moves beneath what stays, as it scrolls
  beneath a sticky header. The web app names its header still.
- **Wipe: both pages wipe, along one edge.** Its page exit was `none`, so
  the old page stayed whole under the new one wiping in, showing through
  wherever the new page has no background, then vanished at the end. The
  old page now wipes out the same way (`wipe-out-left`, `wipe-out-right`),
  so the two masks meet at one moving edge. The theme's `page-mode` is
  `snapshot`: the homepage changes the same way, as one page, not its
  members in turn.
- **Depth: a half turn.** The page turned 75 degrees with a fade, like
  the faces of a cube. Eight new effects, `flipOver<Dir>` (from 180 degrees
  to 0) and `flipOverOut<Dir>` (from 0 to 180), turn a half turn with
  `backface-visibility: hidden` and a 2000 px perspective (a screen-wide
  panel at 800 px swung through the viewer). Depth plays `flipOverRight`
  over `flipOverOutLeft` (and the mirror going back): both turn the same
  way half a turn apart, so the old page is the front of a panel and the
  new one its back, and each shows only while it faces the viewer. Whole
  pages' snapshots hide their backs too, in case a browser ignores the
  property in keyframes. Its pace is 0.8 s on an ease in and out, and its
  `page-mode` is `snapshot`, so the homepage turns as one panel too.
- **Budgets:** page transitions 3.4 → 3.6 kB (3.56 kB), the whole library
  32.15 → 32.4 kB and 37.6 → 37.8 kB, PageTransition.css 1.8 → 2 kB (1.98
  kB), greese.css 24.9 → 25.2 kB (25.18 kB). The half turns' names, which
  every component's static part carries: Tabs 2.65 → 2.7 kB, Menu 3.3 →
  3.35 kB, toast 3.65 → 3.7 kB, ScrollSpy 2.4 → 2.45 kB, the greese prop
  runtime 11.05 → 11.15 kB.

### Addendum: the commit, from React (2026-10-30)

The e2e suite, under load, showed the commit seen in the DOM was wrong in
both directions:

- **The old page changes while it leaves.** "Once the exit has played
  nothing else does" was false. The homepage mounts its sections in turn,
  so a click before they're all in adds a section mid-exit, and React
  re-renders the hero's switches (their `name`, `type` and `checked`). Both
  read as the commit, and eight members came back on the homepage.
- **The commit comes late.** `EXIT_CAP` (2 s) from the exit's end let go
  before a slow next page rendered, the same flash.

So a navigation through `usePageNavigate` now takes its commit from React:
the hook sets a state of its own inside the navigation's transition,
before anything is awaited, so React commits it with the router's update,
and a layout effect on it takes the exits off in that commit, before the
browser's snapshot (a cleanup does it if the component goes in the
commit). Back and forward, and `navigate(-1)`, can't: the router hears
`popstate`, outside that transition. They still watch the DOM, counting
only removals of what the old page had and text changes, never what it
adds or any attribute, and at `EXIT_CAP` they wait on while the URL has
moved from the page before (the router changed it; the commit is coming),
up to 10 s. Budgets: page transitions 3.6 → 3.8 kB (3.75 kB), the whole
library 32.4 → 32.6 kB (32.56 kB), with greese.js 37.85 → 37.95 kB (37.89
kB), with `@greese/react/svg` 47.45 → 47.6 kB (47.53 kB).

Two findings left as they are:

- **A page change slower than the web app's preload cap plays no view
  transition.** The site's navigate waits up to 3 s for the next page's
  chunk and content. When that runs out, the page changes without one: not
  over a loading state, not at all. The dev server, which compiles a page
  on its first request, now waits 15 s. Why React starts none isn't known.
- **A page change within a few frames of a page's content arriving can
  play none either.** Seen only on the dev server under load (a click
  about 60 ms after a docs page appeared, 3 times in 24); a second's wait
  never lost one. The site's e2e tests wait for the network to go idle
  before such clicks.

### Addendum: routes and navigations (2026-10-31)

Levels 3 (route) and 5 (navigation) of §4's cascade, built.

- **Page config is route metadata, resolved at the click.** `usePageNavigate`
  takes an optional `{ route, base }`: `route(path)` returns a page's
  `PageRoute` (`to` and `from` rules by path pattern), each router's recipe
  supplies it (React Router's `matchRoutes` over `handle.greese`), and the
  core stays router-free (§6). The page being left is mounted at the click
  but the one being reached isn't, and types must be added before anything
  is awaited, so the rules can't be props of a page's own `PageTransition`.
- **Rejected:** `from` / `to` props on a page's `PageTransition` (the arriving
  page's rules can't be read at the click; nesting a `ViewTransition` per
  page doesn't animate, since React names only the outermost boundary that
  enters); path-derived transition types (prefix globs only, and React joins
  the classes of every matching type, leaving two rules to stylesheet
  order); writing the theme's own roles at the click (it would not beat an
  app's explicit class, level 2).
- **Patterns** (`matchPagePath`, no `URLPattern`, which is newer than
  Baseline 2024): literals, `:param`, a middle `*` (one segment), a trailing
  `/*` (the page and everything below it) and `*`. Specificity is per
  segment, left to right; source order breaks a tie. A `?` or `#` is refused.
- **Resolution** (`resolvePageRoute`, pure): the leaving page's `to` rule for
  the arriving path, the arriving page's `from` rule for the leaving one,
  `back` merged over a rule going back, each side from its owner (exit and
  `mode`: the leaving page first; entrance: the arriving page first;
  `duration` and `ease`: the entrance's owner first), the navigation's own
  options over all of it. `'theme'` names nothing.
- **Applying it:** every greese navigation's click writes or removes
  `--greese-page-enter`, `-exit`, `-duration` and `-ease` on the root, and
  adds `greese-route-enter`, `-exit` and `-pace` for each part it overrides
  (none on a replace). `PageTransition` maps them to three fixed classes, so
  it stays a Server Component, and `@greese/ui`'s `--route-*` rules, after the
  named effects, read the variables. The variables stay until the next click
  (the snapshot animates after the commit) and are inert meanwhile.
- **Live exits:** `roleExit` is `var(--greese-page-exit, <the theme's chain>)`
  and the pace reads `--greese-page-duration` / `-ease` first. A member's own
  `greese={{ exit }}` beats a route's exit; a navigation's `exit` is forced
  over it (`exitPage`'s `force`). A route's or navigation's exit also beats
  the app's `PageTransition` timeline: the members' CSS exits play instead.
- **A precedence bug fixed:** the code let a page's `mode` beat the
  navigation's, against the comment and the Phase 4 addendum. The order is
  now navigation, route, page, theme (`leavesLive`'s `override`).
- **History steps and traversals:** a step (`navigate(-1)`) and a held
  back/forward resolve the destination from the Navigation API's entries
  where it can say, and skip `to` rules elsewhere. Their snapshots are not
  routed (§ the browser's buttons play none); live exits are. The latest hook
  with a `route` is what held traversals resolve with.
- **Left open:** a lazy route's `handle` is unknown at the first click
  (documented, no dev warning yet); route-level selector `rules`.
- **Budgets:** page transitions 3.8 → 4.55 kB (4.5 kB, the plan estimated
  0.3-0.45 kB and it cost 0.75 kB), the whole library 32.6 → 33.4 kB, with
  greese.js 38.05 → 38.8 kB, with `@greese/react/svg` 47.7 → 48.3 kB, and
  `css/PageTransition.css` 2 → 2.05 kB (2.02 kB).
