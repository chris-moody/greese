# ADR 0017: Motion scopes

- **Status:** Accepted
- **Date:** 2026-10-20

## Context

Every component takes the `greese` prop, and `stagger` already orders a
parent's direct children. Choreographing a page, a hero, then its cards, then
what's inside each card, meant hand-tuned delays. The question was whether
every parent should own a timeline its children belong to, and what that would
cost (the MUI comparison, server components, size).

## Decision

**Opt-in scopes, not a timeline per parent.**

`greese={{ scope: true | { stagger, delay, inView } }}` makes an element a
scope. Every `enter` inside it, at any depth, starts at
`delay + position × stagger` seconds, in document order. A scope inside a
scope takes one position in the outer one, and its own members start from
there (outer scopes are resolved first).

- **It only chooses start times.** A small pass sets `--greese-motion-scope`
  on each member (rounded to the millisecond); the existing CSS entrances
  read it in their `animation-delay`. No greese.js, no extra animation, so
  reduced motion, hydration and server components behave as before.
- **A client island, a lazy chunk.** The prop adds the island (as other
  JavaScript-backed options do), which holds the scope's entrances at their
  first frame (`data-greese-scope='pending'`, paused), loads `scope.ts` (under
  1 kB, no greese.js; registered up front by `@greese/react/greese`), sets the
  times and releases them. `inView: true` keeps them held until the scope
  scrolls into view. Components that don't use it pay about 30 B.
- **DOM-driven, not context-driven.** Members are found by class in the
  rendered DOM, so they stay server components: they emit classes, nothing
  more.

### Why not a timeline for every parent

- **Cost on every page.** Registering a timeline in every parent needs a
  client boundary in each, which ends server-component use of Box, Stack and
  Card, and adds script, style work and update work to every render: the
  metrics GreeseUI wins against MUI. Scopes leave the default path untouched.
- **First paint.** Members must be hidden until their time comes; the held
  state is JavaScript-only on purpose, so content never stays hidden for
  visitors without it.
- **Two ways to stagger.** `stagger` (direct children, pure CSS) stays; a scope
  is for depth.

### Limits

- Members are fixed when the scope attaches; later children play unordered.
- Pause, reverse and scrubbing a whole section (what a greese.js nested
  timeline gives) aren't covered: scopes are CSS animations with start times.
  That's a separate, larger piece if it's wanted (a scope that builds a
  greese.js timeline from the same members).
- With server rendering, entrances start at first paint, before hydration,
  unless the runtime is registered or the scope uses `inView`.

## Consequences

- Budgets: the static part is about 30 B per component entry (a few entries
  rose by 50 B); the chunk has its own 1 kB budget.
- Tested in jsdom (ordering, nesting, release, clean-up) and in five real
  engines (computed delays; held until in view).
