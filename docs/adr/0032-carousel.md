# ADR 0032: Carousel, one slide at a time with greese effects

- **Status:** Accepted
- **Date:** 2026-11-01
- **Amends:** ADR 0025 (the `carousel` motion roles), ADR 0011 §2
  (ScrollCarousel is the scrolling one)

## Context

ScrollCarousel (ADR 0011 §2) is native scrolling: slides in a row, snapped,
several in view at once. Two things it can't do well:

- **Transitions.** A scroll is the only way it moves. A fade, a wipe, an iris
  or any other greese effect between slides needs slides that aren't laid
  out in a row.
- **Deep links.** A page opened on a later slide scrolls there after the
  first paint, visibly. A scroll position can't be set before layout, and
  snapping fights it.

So the library has two carousels: ScrollCarousel for browsing a row, and
Carousel for stepping through slides one at a time, by link if need be.

## Decisions

### 1. Slides stacked in one cell, CSS doing the motion

- **Layout:** every slide sits in the same grid cell
  (`grid-area: 1 / 1`), so the carousel is as tall as its tallest slide and
  never changes height as it moves. The viewport clips them.
- **Only one is live:** the shown slide has `data-active`; the others are
  `inert` and `visibility: hidden`. Inert takes them out of the tab order
  and the accessibility tree, so the polite live region reads only the new
  slide.
- **No JavaScript animation.** The arriving slide plays its entrance's
  `@keyframes` (the effect's `greese-<name>`). The leaving slide transitions
  to its exit's values (`--greese-motion-exit-*`, the same values an
  overlay's exit uses, ADR 0025) and is hidden when they end, since
  `visibility` turns at a transition's end. The arriving slide has no
  transition, so its exit values never fight its entrance: transitions
  outrank animations in the cascade.
- **Nothing on the first paint.** Animation and transitions apply only once
  the carousel has moved (`data-moved`), so the slide it opens on, a deep
  link's included, is simply there.
- **Reduced motion:** both sit inside `mixins.motion-safe`, so slides change
  at once.

### 2. Effects: by name, or the theme's roles

- `enter` and `exit` name an effect (`fadeIn`/`fadeOut`, `pocketLeft`/
  `pocketOutLeft`, `irisIn`/`irisOut`…). The arriving slide gets
  `--greese-carousel-slide-enter: greese-<name>`; the leaving one gets the
  exit's class, `greese-Motion--exit-<name>`. Both come from the Motion
  stylesheet, which Carousel's per-component CSS imports.
- `back` overrides either one going back (Previous, an earlier dot, Home,
  a swipe rightward). Where a side isn't named it follows the forward one.
- **Unnamed, the theme decides:** the new roles `carousel`, `carousel-exit`,
  and going back `carousel-back` and `carousel-back-exit` (each falling back
  to its forward role), plus `carousel-duration`. The kit's
  `motion-defaults()` and Theme Studio assign them. The base theme slides
  the way the carousel moves: in from the side it's heading for, out the
  other way, mirrored right to left.
- **Ancestors' exits don't leak.** A dialog's `greese` exit sets
  `--greese-motion-exit-*` on the dialog, which its descendants inherit. The
  viewport sets each to `initial` (the guaranteed-invalid value), so slides
  fall back to their own and the role's.

### 3. Deep links through slide ids

- **A slide with an `id` is linkable.** On mount, a layout effect reads
  `location.hash` and, if it names a slide, shows that slide before the
  first paint, with no transition. A `hashchange` (a link to `#<id>`, back
  and forward through hashes) moves there, with the transition.
- **`syncHash`** writes the shown slide's id as it changes, with
  `history.replaceState`, so stepping through slides adds no history
  entries. Off by default: a carousel shouldn't rewrite a page's address
  unasked.
- **Server rendering:** a server can't see the hash, so a server-rendered
  page shows `defaultIndex` until it hydrates. A page that knows the slide
  from the request (a query, a route) passes it as `defaultIndex`.
- **No router dependency** (ADR 0030): a router that owns the address
  drives the controlled `index` instead.

### 4. Input

- Previous and next buttons and a dot per slide, styled as ScrollCarousel's.
  Both stylesheets emit them from one partial (`styles/_slides.scss`), so
  each stands alone.
- The buttons stay visible on touch screens. ScrollCarousel hides them there
  because a swipe scrolls natively. Here a swipe is JavaScript, so the
  buttons stay.
- The focused viewport takes the APG carousel keys: the arrows (mirrored
  right to left), Home and End.
- Swipes by touch or pen: across by 40px and more across than down. A mouse
  drag stays a text selection. `touch-action: pan-y` leaves vertical drags
  to the page.
- `loop` wraps round; no autoplay, for the reasons in ADR 0011 §2.

## Consequences

- **Size:** `{ Carousel, CarouselSlide }` is 3.49 kB brotli (budget
  3.55 kB). `greese.css` gains about 0.66 kB: the roles in both directions
  for each of an exit's ten properties, and the shared buttons and dots.
- **Tests:** `catalogue.test.tsx` (inert slides, buttons, dots, keys,
  named effects, opening on a hash, `hashchange`, `syncHash`, loop) and
  `e2e/carousel.spec.ts` in all five projects. The e2e tests check that
  every frame from the first shows the linked slide, that nothing animates
  on load, that the theme and named effects run as CSS animations and
  transitions, swipes, keys, and that reduced motion changes slides at once.
  `styles/kit.test.ts` covers the roles.
- **Docs:** `Content/Carousel` and `Content/CarouselSlide`; the roles in the
  Theming guide.
