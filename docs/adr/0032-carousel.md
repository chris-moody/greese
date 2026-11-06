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
- **Opening on a later slide.** A page opened on a later slide scrolls
  there after the first paint, visibly. A scroll position can't be set
  before layout, and snapping fights it.

So the library has two carousels: ScrollCarousel for browsing a row, and
Carousel for stepping through slides one at a time, opening on any of them.

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
  the carousel has moved (`data-moved`), so the slide it opens on is simply
  there.
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

### 3. Deep links are the app's

Carousel doesn't read or write the address. An earlier draft did: it read
`location.hash` in a layout effect, followed `hashchange`, and wrote the
slide's id with `syncHash`. That was dropped before release:

- **One job.** Which slide an address names is routing. A hash is only one
  scheme; apps use paths (`/tour/coast`), queries and routers' own state,
  and a carousel that knows one scheme ends up half-supporting the rest.
- **The server can't see a hash.** A server-rendered page showed
  `defaultIndex` until it hydrated, then jumped. The props the app already
  has do it from the first paint.
- **No effects for the address.** Without them Carousel has no layout
  effect, no global listener, and nothing to get wrong with an odd hash
  (a stray `%` threw in `decodeURIComponent`).

So the app owns it, with three props Carousel has anyway:

- **`defaultIndex` or `index` from the route.** A server-rendered or
  prerendered page renders the slide its route names, so it's in the HTML,
  and Carousel animates nothing until it moves (`data-moved`).
- **A controlled `index`** follows route changes (a link, back and
  forward) with the transition, going the way the index moved.
- **`onIndexChange`** is where the app writes the address (`navigate`, or
  `history.replaceState` to add no history).

The e2e fixture (`apps/playground/src/pages/Catalogue.tsx`) is the hash
version of this, in about fifteen lines, and the Controlled story documents
the pattern. No router dependency either way (ADR 0030).

### 4. Input

- Previous and next buttons and a dot per slide, styled as ScrollCarousel's.
  Both stylesheets emit them from one partial (`styles/_slides.scss`), so
  each stands alone.
- The buttons stay visible on touch screens. ScrollCarousel hides them there
  because a swipe scrolls natively. Here a swipe is JavaScript, so the
  buttons stay.
- The focused viewport takes the APG carousel keys: the arrows (mirrored
  right to left), Home and End. Only keys aimed at the viewport itself: a
  key that bubbles up from a control inside a slide (a slider, a color
  picker) stays that control's, and so does one with Alt, Ctrl or Cmd held
  (Alt+Left is the browser's back).
- Your own controls and dots (`CarouselPrevious`, `CarouselNext`,
  `CarouselIndicator`) take `asChild`. A link (`<a href>`) never moves the
  carousel itself: it navigates, and the carousel follows the controlled
  `index` the app gives it. A router's Link runs your click handler before
  it prevents the default, so checking for that would move the carousel and
  push the slide to history twice.
- Used alone, the previous and next parts render the chevron and take the
  carousel's `previousLabel` and `nextLabel`; text children name them
  instead. With `asChild` at the end they get `aria-disabled` and
  `data-disabled`, not `disabled`, so a focused link or button keeps focus.
- **Every name is the app's to translate:** `previousLabel`, `nextLabel`,
  and functions for the slides (`slideLabel`, "2 of 4") and the dots
  (`indicatorLabel`, "Slide 2"), from the index and the count.
- Swipes by touch or pen: across by 40px and more across than down. A mouse
  drag stays a text selection. `touch-action: pan-y` leaves vertical drags
  to the page.
- `loop` wraps round; no autoplay, for the reasons in ADR 0011 §2.

## Consequences

- **Size:** `{ Carousel, CarouselSlide }` is 3.49 kB brotli (budget
  3.55 kB). `greese.css` gains about 0.66 kB: the roles in both directions
  for each of an exit's ten properties, and the shared buttons and dots.
- **Tests:** `catalogue.test.tsx` (inert slides, buttons, dots, keys,
  named effects, opening on `defaultIndex`, a controlled `index` and a move
  its parent turned down, the label functions, the parts' names, loop) and
  `e2e/carousel.spec.ts` in all five projects. The e2e tests check that
  every frame from the first shows the slide the app opened on, that nothing animates
  on load, that the theme and named effects run as CSS animations and
  transitions, swipes, keys, and that reduced motion changes slides at once.
  `styles/kit.test.ts` covers the roles.
- **Docs:** `Content/Carousel` and `Content/CarouselSlide`; the roles in the
  Theming guide.
