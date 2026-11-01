# ADR 0033: Reduced motion an app asks for

- **Status:** Accepted
- **Date:** 2026-11-01
- **Amends:** ADR 0009 (the runtime's reduced motion), ADR 0008 (greese.js)

## Context

Every motion in greese ui follows `prefers-reduced-motion`. Apps also offer
a "Reduce motion" switch of their own, for people who haven't found the
system setting or want it only for one site. A media query can't be set from
a page, so the library needs a second signal that every part of it reads.

## Decisions

### 1. One attribute: `data-greese-motion="reduce"`

- **ThemeProvider's `motion="reduce"`** stamps it on its wrapper. An app can
  also set it on any element, `<html>` included. `motion="system"` (the
  default) stamps nothing.
- **It only reduces.** An ancestor's `reduce` can't be undone below it: a
  descendant selector can't be cancelled, and motion someone turned off
  shouldn't come back in one corner.

### 2. CSS: one block in the last layer

Generated with the tokens (`scripts/build-tokens.ts`), so `tokens.css`,
`greese.css` and every `css/<Name>.css` (through `core.css`) carry it:

- the duration tokens collapse to `0.01ms` on the subtree, and on any themed
  element inside it (a theme redeclares them in `greese.theme`, which this
  outranks);
- every element and pseudo-element in it gets near-zero animation and
  transition durations, one iteration and no delays, and
  `scroll-behavior: auto`;
- on the root, the view-transition pseudo-elements cut too.

It sits in `greese.utilities`, so it beats every component without
`!important`, and an app's unlayered CSS still wins. The `motion-safe`
mixin is unchanged: components keep writing motion behind
`no-preference`, and this block stops it. One cost: a spinner stops instead
of pulsing, since the pulse is an animation too.

### 3. JavaScript: ask about the element

- **`prefersReducedMotion(el)`** (`@greese/js`, and
  `utils/motion.ts` in React): the media query, or the attribute on `el` or
  an ancestor; without an element, the root.
- **greese.js timelines** jump to the end when the page is reduced or any
  element they move is.
- **The `greese` runtime** (scroll reveals, interactions, text, page exits),
  **DrawPath** and **MarqueePath** ask about their own element.
  **`@greese/svg`'s `tween()`** has no element and asks the root.
- **ScrollCarousel** reads the computed `scroll-behavior` (ADR 0011), and
  **Carousel** is CSS (ADR 0032), so both follow from §2 alone.

## Consequences

- **Tests:** `ThemeProvider.test.tsx` (the attribute), `svg.test.tsx`
  (DrawPath holds still in a reduced subtree), `greese.test.ts` (a timeline
  on an element inside it jumps to its end; the root reduces everything),
  and `e2e/carousel.spec.ts`: inside `motion="reduce"`, Carousel's slides
  cut and ScrollCarousel scrolls at once, in all five projects.
- **Size:** about 240 B of `greese.css` (budget 25.9 → 26.15 kB), and
  greese.js's `prefersReducedMotion` and its check of the elements a timeline
  moves, 36–65 B (budgets: everything 6.65 → 6.7 kB, `animate` 5.7 → 5.8 kB,
  the `<script>` build 7.05 → 7.1 kB).
