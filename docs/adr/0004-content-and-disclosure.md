# ADR 0004: Content, media and disclosure

- **Status:** Accepted
- **Date:** 2026-10-17

## Decisions

### 1. Accordion and Collapsible use native `<details>`/`<summary>`

`Collapsible` is a `<details>` element. `Accordion` groups them, and with
`exclusive` it gives every item the same `<details name>`, so the **browser**
keeps only one open at a time without any JavaScript. Keyboard support
(Enter/Space on the summary), screen-reader state and find-in-page (which
opens a match's section) are native. Opening and closing animate through
`::details-content` with `interpolate-size` where supported (Chromium);
elsewhere the content appears instantly. That's acceptable progressive
enhancement, and it respects reduced motion through the duration tokens.

The alternative was a custom ARIA accordion. It would animate in every
browser, but it costs JavaScript and drops find-in-page. `<details name>` is
Baseline 2024, which is within our browser baseline.

### 2. Tabs follow the WAI-ARIA pattern, keeping panels in the HTML

- **One Tab stop.** The tab list is a single Tab stop with a roving
  `tabindex`.
- **Keys.** Arrow keys move between tabs, skipping disabled ones and
  wrapping, and Home/End jump to the ends.
- **Direction.** In right-to-left layouts the horizontal arrows are mirrored.
- **Activation.** By default focusing a tab selects it (`automatic`);
  `manual` waits for Enter or Space.
- **Panels.** Every panel is rendered, and inactive ones are `hidden`, so all
  content is in the server-rendered HTML and state survives tab switches.
  Panels are focusable for keyboard users.
- **Phones.** On narrow screens the tab list scrolls sideways with scroll
  snapping instead of wrapping.

### 3. Image placeholders sit behind the image, in CSS

The `placeholder` (a color, or a tiny data URL for blur-up) is the frame's
background, and the `<img>` paints over it once loaded. There's no JS fade, so
an image that finishes loading before hydration can never stay invisible,
which is a common bug with opacity fade-ins. `priority` switches from
`loading="lazy"` / `decoding="async"` to eager loading with
`fetchpriority="high"`, for the page's LCP image. Error fallbacks (Image,
Avatar) also check `img.complete` when they mount, because an image that
failed before hydration never fires React's `onError`.

### 4. Alerts stay quiet unless asked to announce

A live region announces content _when it changes_. An alert that's already on
the page when it loads shouldn't interrupt a screen-reader user. So `Alert`
has no role by default, and `announce` opts in: `role="alert"` for
negative/warning and `role="status"` for the rest. `Spinner` is always
`role="status"`, `Progress` is a native `<progress>`, and `Skeleton` is
`aria-hidden`. Loading is announced on the container instead (`aria-busy`).

### 5. A few built-in glyphs, still icon-agnostic

Anything user-facing takes your icons (`icon` props, `Icon`). The library
draws only structural glyphs it can't do without: the dismiss and remove ×
(Alert, Chip), the accordion chevron and, from [Phase 3](0013-project-scope-and-phases.md#phases), the select chevron
and checkbox marks.

### 6. Typography separates level from size

`Heading level` sets the document outline (`<h1>`–`<h6>`). `size` sets the
look and can vary by breakpoint. Default sizes are mobile-first and step up
at `md`; for example, level 1 is `3xl` on phones and `4xl` from `md`.
Headings use `text-wrap: balance`. Links are underlined by default, so color
isn't the only cue that something is a link.

## Consequences

- The full stylesheet is now about 11 kB brotli. Phase 6's per-component CSS
  entry points let size-sensitive apps import only what they use.
- **Verification:**
  - 133 unit tests, including Tabs keyboard behaviour and axe.
  - `e2e/content.spec.ts` in five browser projects covers native exclusive
    accordions, Tabs arrows in LTR and RTL, heading steps and clamping,
    CardMedia bleed, priority images, and reduced-motion handling for
    Skeleton and Spinner.
