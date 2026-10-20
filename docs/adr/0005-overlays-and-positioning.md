# ADR 0005: Overlays and positioning

- **Status:** Accepted
- **Date:** 2026-10-17

## Context

Overlays are where component libraries usually ship the most JavaScript:
focus traps, scroll locks, portals, z-index management, outside-click
detection and a positioning engine (typically Floating UI, the one runtime
dependency we pre-approved in §3.7). The platform now covers almost all of
this.

## Decisions

### 1. Positioning: CSS anchor positioning, with a small fallback

**We don't add Floating UI.** The trigger gets `anchor-name`, and the floating
element gets `position-anchor`, a logical `position-area` (`bottom-start` maps
to `block-end span-inline-end`) and `position-try-fallbacks: flip-block,
flip-inline`. The gap is a margin on the axis facing the trigger only, so
start-aligned popovers stay flush with the trigger. The e2e suite caught the
first version adding it on both axes.

Our 2024 baseline predates anchor positioning (Safari 17.5, Firefox 128). In
those browsers, `useAnchoredPopover` falls back to fixed coordinates from
`computeFallbackPosition()`, which flips and clamps like the CSS fallbacks,
recomputed on scroll and resize while open. That function is pure and
unit-tested directly, because none of our test browsers lacks anchor
positioning. The whole positioning layer costs well under 1 kB.

### 2. Dialog and Drawer are `<dialog>` + `showModal()`

The browser provides the top layer, the focus trap, the inert background,
Escape to close and `::backdrop`. We add:

- **Scroll lock in CSS:** `:root:has(.greese-Dialog:modal) { overflow: hidden }`.
  No lock is left behind if a component unmounts mid-open. Where scrollbars
  take space (Windows, macOS with a mouse), removing the scrollbar would shift
  the page. A reserved gutter (`scrollbar-gutter: stable`) avoids the shift
  but can't be painted over: browsers clip the top layer at the gutter, so the
  backdrop left an undimmed strip and end drawers stopped short of the edge.
  So the lock removes the scrollbar, and the page is padded by its width
  (`--greese-scrollbar-gap`, measured just before the first modal opens: one
  line of JS). That keeps the page still while the backdrop and drawers
  reach the screen edge. `e2e/scrollbars.spec.ts` checks this with real
  scrollbars.
- **Always dismissible:** `closedby="any"`. Where that isn't supported, a
  click outside the dialog's box closes it. Escape, the backdrop and the close
  button always close a dialog or drawer; there is no way to turn that off. A
  flow that needs a decision treats closing as cancelling (`onOpenChange`),
  so nobody is ever trapped in a modal.
- **Reliable focus return.** Native dialogs return focus to the element that
  had focus when they opened, but Safari doesn't focus buttons on click, and
  WebKit fires `close` while focus is still inside the dialog. We record the
  opener (the trigger on click, or the focused element) and restore it when
  focus is left on the body or inside the closed dialog. We never take focus
  back if it has already moved on. The cross-engine e2e tests found this; the
  first version passed in Chromium only.
- **Mobile layout:** footer actions stack full-width on phones, primary
  action on top.
- **Drawer placement can vary by breakpoint**, for example `{ xs: 'bottom',
md: 'end' }` for a bottom sheet on phones and a side panel on desktop. Each
  placement class sets the complete geometry in logical properties, so RTL
  works and a larger breakpoint fully replaces a smaller one. Swipe-to-dismiss
  isn't included.

### 3. Popover, Menu, Tooltip and Sidebar use the Popover API

- **Popover** is `popover="auto"`: the top layer, click-outside and Escape
  dismissal, and Tab order that flows from the trigger into the content, with
  no JS.
- **Menu** is the WAI-ARIA menu button pattern on `popover="auto"`. Arrow
  keys, Home/End and type-ahead move focus; Enter and Space select; Escape or
  Tab closes, and the platform returns focus to the trigger.
- **Tooltip** is `popover="manual"` with `role="tooltip"` and
  `aria-describedby`. It opens on mouse hover after a delay and immediately on
  keyboard focus, stays open while hovered, and closes with Escape, meeting
  WCAG 1.4.13. Tooltips are mouse and keyboard only, so they must never carry
  essential information.
- **Sidebar** is one element. Below the breakpoint it's an off-canvas
  `popover="auto"`, and following a link inside closes it. From the
  breakpoint up, author CSS overrides the browser's
  `[popover]:not(:popover-open) { display: none }`, making it a sticky column.
  There's no duplicated markup and no JS layout switch. If the viewport widens
  while it's open, it closes.

### 4. Toasts portal into the open modal

The Toaster is a `popover="manual"` region, re-shown for each new toast so it
stacks above anything opened since. Everything outside an open modal dialog
is **inert**, though: unclickable and hidden from assistive tech. So while a
modal is open, the Toaster portals itself _into_ the topmost modal. It stays
visible above it, its buttons work, and it's announced. The e2e suite caught
this: the toast _looked_ right on top of the dialog, but hit-testing showed
it was inert.

Announcements go through two always-present visually hidden live regions,
polite (assertive for negative toasts), because a live region inserted at the
same moment as its content is often not announced. Toasts auto-dismiss after
5 seconds by default, pausing on hover and focus.

### 5. Navigation

- **AppBar:** a sticky `<header>` padded for safe areas. Its scroll shadow is
  a CSS scroll-driven animation, so there's no scroll listener.
- **Breadcrumbs:** a `<nav>` with an `<ol>` and `aria-current="page"`.
  Separators use `content: '/' / ''`, so screen readers ignore them, and
  `maxItems` collapses the middle behind an expand button.
- **Pagination:** a pure, tested `paginationRange()` drives it. `getHref`
  renders real links, which are crawlable and work without JS. On phones it
  condenses to previous / current / next.

## Consequences

- No new dependencies. Each overlay costs about 2–2.5 kB of JS (brotli) when
  imported on its own.
- Exit animations use `@starting-style`, `transition-behavior: allow-discrete`
  and `overlay`, so they're progressive. Where unsupported, overlays appear
  and disappear instantly.
- **Testing in jsdom:** jsdom implements neither `<dialog>` methods nor the
  Popover API, and its built-in stylesheet hides every `[popover]`. Unit tests
  therefore use a small state-and-events polyfill (`src/test/topLayer.ts`),
  and the real behaviour is verified in Chromium, Firefox, WebKit and iPhone
  emulation (`e2e/overlays.spec.ts`).
