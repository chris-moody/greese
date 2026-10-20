# ADR 0011: Component gap review

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

We listed the components applications commonly need and checked which ones
GreeseUI lacked: common UI that people would otherwise build themselves.

Many were already covered under other names:

| Component                                                                                                                                                                                 | GreeseUI                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Range                                                                                                                                                                                     | Slider                     |
| Toggle                                                                                                                                                                                    | Switch                     |
| Loading                                                                                                                                                                                   | Spinner                    |
| Dropdown                                                                                                                                                                                  | Menu                       |
| Modal                                                                                                                                                                                     | Dialog                     |
| Join                                                                                                                                                                                      | ButtonGroup (`attached`)   |
| Navbar                                                                                                                                                                                    | AppBar                     |
| Drawer sidebar                                                                                                                                                                            | SidebarLayout              |
| Validator                                                                                                                                                                                 | Field's error state        |
| Label                                                                                                                                                                                     | Field                      |
| Hover 3D card                                                                                                                                                                             | the `greese` prop's `tilt` |
| Collapse                                                                                                                                                                                  | Collapsible                |
| Radio, Checkbox, Select, Textarea, File input, Input, Badge, Card, Avatar, Accordion, Table, Breadcrumbs, Pagination, Tab, Alert, Progress, Skeleton, Toast, Tooltip, Link, Divider, Menu | same names                 |

## Decisions

### 1. What we built (19 components, 7 parts)

| Component                                                             | Native base                        | Notes                                                                                                                |
| --------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `ScrollCarousel` + `ScrollCarouselSlide`                                          | CSS scroll snapping                | See §2                                                                                                               |
| `Rating`                                                              | Radios in a `<fieldset>`           | See §3                                                                                                               |
| `Diff`                                                                | `<input type="range">`             | See §4                                                                                                               |
| `OtpField`                                                            | One `<input>`                      | See §5                                                                                                               |
| `SpeedDial` + `SpeedDialAction`                                       | Popover API, anchored like Popover | Escape and click-outside built in; an action closes it                                                               |
| `Steps` + `Step`                                                      | `<ol>`, `aria-current="step"`      | Completed steps say "Completed:" to screen readers; horizontal steps scroll when they don't fit                      |
| ~~`TimelineList` + `TimelineItem`~~ (folded into Steps, see addendum) | `<ol>`, `<time>`                   | Not `Timeline`: that name is greese.js's animation class, already exported                                           |
| `Dock` + `DockItem`                                                   | `<nav>` of links                   | `aria-current="page"`, safe-area padding, `hideFrom` a breakpoint                                                    |
| `Countdown`                                                           | `role="timer"`                     | Ticks against an end time, so it doesn't drift; its label is the spoken duration, so it isn't announced every second |
| `ChatBubble`                                                          | —                                  | Put messages in a `role="log"` so new ones are announced                                                             |
| `List` + `ListItem`                                                   | `<ul>`                             | `start`, `title`, `description`, `end` slots                                                                         |
| `Stat` + `StatGroup`                                                  | `<dl>`                             | The trend's direction must be in the text, not only the color                                                       |
| `Status`                                                              | —                                  | Decorative unless it has a `label` (then `role="img"`)                                                               |
| `Indicator`                                                           | —                                  | Logical placements, centred on the corner                                                                            |
| `Key`                                                                 | `<kbd>`                            | Nested for shortcuts                                                                                                 |
| `Fieldset`                                                            | `<fieldset>` + `<legend>`          | `disabled` disables everything inside, natively                                                                      |
| `RadialProgress`                                                      | `role="progressbar"`               | `conic-gradient` masked to a ring; registers one `@property` so the ring animates                                    |
| `Swap`                                                                | `<button aria-pressed>`            | The name stays the same in both states                                                                               |
| `TextRotate`                                                          | CSS only                           | See §6                                                                                                               |

Each has:

- the `greese` prop;
- unit tests with axe (`src/components/catalogue.test.tsx`);
- a docs page, one for each part too;
- visual baselines.

ScrollCarousel, Diff, OtpField, Rating, SpeedDial and Swap also have real-browser
tests (`apps/playground/e2e/catalogue.spec.ts`), run in five engines.

### 2. ScrollCarousel: native scrolling, no autoplay

- **Scrolling:** slides sit in a horizontally scrolling viewport with
  `scroll-snap-type: x mandatory`. Swipe, trackpad and keyboard scrolling
  work with no JavaScript.
- **JavaScript** adds only:
  - the previous/next buttons, hidden where nothing can hover, since phones
    swipe;
  - the dots;
  - an IntersectionObserver that reports which slide leads the view.
- **Moving the view:** buttons scroll by the slide's measured offset, which is
  RTL-aware, and honour reduced motion.
- **No autoplay.** Moving content needs a pause control and causes
  WCAG 2.2.2 trouble. Apps that need it can drive the controlled `index`.
- **Semantics:** the viewport is focusable and `aria-live="polite"`. Each
  slide is `role="group"` with `aria-roledescription="slide"` and "n of
  count", following the APG carousel pattern.
- **Props:**
  - `perView` is responsive, with token classes for 1–6 and inline values
    otherwise. A fraction such as `1.15` lets the next slide peek in.
  - `gap` is a single value: a responsive gap cost about 0.3 kB of CSS for
    little use.

### 3. Rating: radios, with the preview in CSS

- **Native radios:** each star is a visually hidden radio with a label ("3
  stars"; override with `getItemLabel`). Arrow keys, forms and `required`
  work natively.
- **Fill and hover preview:** `:has()` selectors fill stars up to the checked
  one, and up to the hovered one under `(hover: hover)`, with no JavaScript.
- **`allowClear`:** clicking the checked star clears it. That needs a click
  handler, because a checked radio fires no change event.
- **`readOnly`:** renders an image named "3.5 out of 5". It overlays a filled
  row clipped to the exact fraction, so 4.3 draws as 4.3.

### 4. Diff: the divider is a range input

- **The control:** an invisible `<input type="range">` covers the whole area.
  It gives keyboard control, a spoken percentage and pointer dragging for
  free.
- **Touch:** iOS doesn't jump to a tapped point on a range track. So the
  input is widened by its thumb's width and offset by half, which puts the
  thumb exactly under the visible grip, and dragging the grip works on touch.
- **Scrolling:** `touch-action: pan-y` lets the page still scroll vertically
  over it.
- **The before side:** clipped with `clip-path`, with an RTL rule.

### 5. OtpField: one input, drawn as boxes

The common one-box-per-digit build breaks several things: SMS autofill
(`autocomplete="one-time-code"` fills one field), paste, password managers,
and screen readers, which announce six separate fields.

OtpField is instead one input:

- it's transparent and covers the boxes;
- it's labelled by its Field;
- the boxes draw its value, with a caret in the active box.

Input is sanitised to the mode (digits, or letters and digits, upper-cased),
`onComplete` fires once per complete code, and `mask` switches it to a
password field.

### 6. TextRotate: keyframes per item count, at most 6

CSS can't generate keyframes for an arbitrary count, so one set is compiled
for each count from 2 to 6.

- **Above 6:** extra items are dropped. A cap of 10 cost about 0.3 kB more.
- **Screen readers** hear every item once, from a visually hidden copy; the
  moving copy is `aria-hidden`.
- **Reduced motion:** the first item stays.

### 7. What we didn't build, and why

| Component                              | Why not                                                                                                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calendar                               | A real date grid (keyboard model, locales, ranges) is a project of its own; DateField uses the native picker. A candidate for its own ADR.                                            |
| Megamenu                               | Large and app-specific: compose AppBar, Popover and links.                                                                                                                            |
| Filter                                 | A radio group with a reset: SegmentedControl, or selectable Chips plus a Button.                                                                                                      |
| Theme controller                       | `useColorScheme()` plus a SegmentedControl or Swap. The Theming guide shows it.                                                                                                       |
| Mockups (browser, phone, window, code) | Marketing decoration, not app UI. `Code block` covers code.                                                                                                                           |
| Aura, Hover gallery, Mask              | Decorative effects; CSS or the `greese` prop does them per app.                                                                                                                       |
| Hero, Footer                           | Layout compositions of Box, Stack and Container, not components.                                                                                                                      |
| Stack (layered cards)                  | A one-off visual; our `Stack` is layout, and the name is taken.                                                                                                                       |

## Consequences

**Size budgets were raised deliberately** (`.size-limit.cjs`, with the reasons
inline):

| Budget            | Before |   After |                             Measured |
| ----------------- | -----: | ------: | -----------------------------------: |
| Whole library, JS |  22 kB | 25.5 kB | 24.88 kB (about 210 B per component) |
| With greese.js    |  26 kB | 30.5 kB |                             29.89 kB |
| `greese-ui.css`   |  18 kB |   20 kB |                             19.32 kB |

Tree-shaking and `css/<Name>.css` keep the new components out of apps that
don't use them. The seven interactive components have their own budgets
(1.8–3.1 kB each, the shared `greese` prop runtime included).

**Smaller changes:**

- **`flattenChildren`** (`utils/children.ts`): Steps and ScrollCarousel open
  fragments, so `<>…</>` around steps or slides counts each one. A visual
  baseline caught the bug.
- **Story coverage lint:** all-caps exports such as `TEXT_ROTATE_MAX` are
  constants, not components.

## Addendum (2026-10-19): revisions after review

**TimelineList folded into Steps.** A timeline is a vertical list of steps
with a time beside each. The only real difference was that its entries are
events, not progress. So `TimelineList` and `TimelineItem` are gone, and:

- **Steps** gained `direction` (`horizontal` | `vertical`, replacing
  `orientation`) and `markers` (`numbers` | `dots`).
- **Without `current`,** steps are events: no "Completed:" text, no
  `aria-current`, and each marker in its own tone.
- **Step** gained `prefix` (content ahead of the step, such as a time) and
  `prefixBefore`. With it, the prefix sits in its own column before the
  marker (vertical, a column every step shares, through `:has()`) or above
  the marker (horizontal). Without it, the prefix sits above the title.
- **Tones** gained `neutral` and `info`.
- **Connectors are measured from the markers.** Vertical lines run from
  under a marker to the next step. Horizontal ones use container query
  units (each step is a size container, and `100cqi` is the distance
  between markers). This fixed TimelineList's lines being off the dots'
  centres without `timesBeside`, and lines going wrong when steps had
  different heights.

**Grid and GridItem are one component, as in MUI.**

- **`container`** makes a grid. Without it, a Grid is a cell, and its
  `size` (was GridItem's `span`) is how many columns it spans. One element
  can be both, to nest grids.
- **The old `container`** (container queries) became `containerQueries`.
- **Cost:** none to speak of. It's one function either way, and the size
  classes simply moved from `greese-GridItem` to `greese-Grid`.
- **Breaking change:** GridItem is removed. Nothing had been published, so
  no one is affected.

**Kbd is now Key.** React also exports a type called `Key` (for list keys).
That only matters if an app imports both by name in one file, and an alias
(`Key as KeyType`) solves it.

**Rating takes `step`** (1, 0.5 or 0.25).

- **Read-only** ratings always drew any fraction.
- **One visual for both modes:** interactive ratings now share the
  two-layer drawing, an empty row with a filled row clipped to the value,
  over one radio per step.
- **Native behaviour kept:** arrow keys move by `step`, and the form
  submits the value.
- **Hover preview** moved from `:has()` CSS to pointer state, since it has
  to land on fractions.
- **Touch** commits from the finger's coordinates on lift, tap or drag,
  and ignores the click that follows. Browsers nudge taps to a "best"
  nearby target, which is unreliable with quarter slices 6–12 px wide.
- **Cost:** about 280 B; the budget went from 2.5 to 2.75 kB.
- **Quarter steps** are width-proportional, as in MUI. Because of a star's
  shape, 0.75 of one looks nearly full.

**ChatBubble has a tail.** A wedge at the lower corner on the author's side,
in the bubble's color, mirrored for right-to-left text. The corner it joins
is square. Bubbles reserve room for it (a wider gap beside an avatar,
padding without one), so it's never cut off at a container's edge.

**Tile** joined the library. It's a compact surface (`filled`, `outline`,
`dashed`) for grid cells, placeholders and drop zones, with padding from the
style props. It was the docs' placeholder; stories now use the real
component. Card stays the structured container: media, responsive padding,
interactive.

**Field and Fieldset both stay.** They answer different questions:

- **Field** labels _one_ control: a `<label for>`, plus a description and
  error wired to that control through context.
- **Fieldset** names a _group_ of controls: a native `<fieldset>` and
  `<legend>`, announced before each control in it, with `disabled`
  cascading to all of them.

A form has a Fieldset of Fields. ChoiceGroup (checkbox and radio groups) is
the one case that is both, with a fieldset whose legend labels the choices.

## Addendum (2026-10-19): ScrollCarousel reaching its target, under load

Repeated real-browser runs (150–200 at a time across five engines) found
dots and buttons sometimes stopping one or two slides short in WebKit and
Firefox. Logging each scroll showed two causes, and the fixes for both:

- **A stale-index race.** The observer updates `index` as slides pass, and
  an effect scrolled whenever `index` differed from what the carousel had
  reported. Under load, a late effect saw an index the scroll had already
  passed, and scrolled back to it. Neither a flag nor a value comparison
  could tell such an echo from a real request. Now only the controlled
  `index` prop drives that effect, skipping values the carousel reported
  itself since the view last settled. Uncontrolled carousels never need it:
  buttons and dots scroll directly.
- **Re-snapping mid-scroll.** With `scroll-snap-type: mandatory`, a layout
  change during a smooth scroll makes browsers re-snap to the old snap
  point. That could be the active dot widening, or any re-render on the
  page. So:
  - the dots now keep one size, and the active pill is drawn with
    `clip-path`, which never changes layout;
  - snapping is suspended while the carousel scrolls itself, and restored
    on arrival (the target is a snap point, so nothing moves);
  - an arrival check finishes any scroll still cut short, instantly, up to
    three tries. It uses `behavior: 'instant'`; `'auto'` would defer to the
    CSS `scroll-behavior: smooth`.

After the fixes, 200 of 200 repeated runs passed.
