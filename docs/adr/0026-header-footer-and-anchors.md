# ADR 0026: Header and Footer, anchors without an Anchor component

- **Status:** Accepted
- **Date:** 2026-10-24

## Context

The site built its header from AppBar, Container and Stack, and its footer
by hand, and in-page links landed about 1.5rem above their sections: a fixed
`scroll-padding` of 5rem guessed at the header's height. Every app with a
sticky header has the same guess to make. Hovers that move an element (a
card that lifts, a `greese` `rise`) could move it from under a still pointer,
which then left, settled back and entered again: it bounced.

## Decision

**`Header` and `Footer` (with `FooterSection`) are library components.**
Header is a row of `brand`, navigation and `actions`, sticky by default and
`floating` (inset, rounded, raised) on request; Footer is a brand beside
columns of links over a `legal` row. AppBar stays, for a bar you lay out
yourself.

**A sticky Header sets the page's scroll padding**, from CSS alone:
`:root:has([class~='greese-Header--sticky'])` gets
`scroll-padding-block-start` of the header's height
(`--greese-header-height`, 3.5rem, which also sizes its row) plus its rule,
or a floating one's inset, plus the top safe area. In-page links, `#hash`
loads and `scrollIntoView()` all land with the target just below it.

**No Anchor component.** It would only repeat what the page's scroll
padding already does for every target, and each section would have to
declare it. A row taller than 3.5rem sets `--greese-header-height` on
`:root`.

**A hover that moves its element is measured where the element rests.** A
`greese` hover lasts while the pointer is over the element's resting box
(measured as it starts), not its moved one; an interactive Card's hit area
reaches the 2px it rises. Anything new that moves on hover does one or the
other.

## Consequences

- `greese.css` grows by about 0.5 kB and the whole library by about 0.3 kB
  (`.size-limit.cjs` says each).
- A shaped (clip-path) interactive card clips its hit strip with its shape;
  its 2px lift can still bounce at the very edge.
- The site's header and footer are Header and Footer. From md the wordmark
  links home and its arrow opens a menu of the homepage's sections (on hover
  or a click); below lg the homepage's row leaves those sections to that
  menu. On phones the pages and their sections are an accordion in a
  full-screen drawer, with the scheme a select in the bar, colored as the
  segmented control it replaces. GitHub and search stay in the bar at every
  width.
