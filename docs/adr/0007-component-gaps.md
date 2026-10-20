# ADR 0007: Component gaps for 1.1

- **Status:** Accepted
- **Date:** 2026-10-18

## Context

After 1.0, the components people reach for most that GreeseUI lacked were a
searchable select, a number input, date input, a data table, a segmented
control, and swipe-to-dismiss for bottom sheets.

## Decisions

### 1. Combobox follows WAI-ARIA 1.2 (editable, list autocomplete)

- **Focus:** focus never leaves the `<input role="combobox">`. The active
  option is conveyed with `aria-activedescendant`, and option clicks call
  `mousedown.preventDefault()` so the input keeps focus.
- **Popup:** the listbox lives in a `popover="manual"` element, anchored with
  the shared anchor hook (ADR 0005) and sized to the field when it opens.
- **Filtering:**
  - Typing filters case- and accent-insensitively ("cote" finds "Côte
    d'Ivoire").
  - Opening with an arrow key or the toggle shows the full list.
  - The result count is announced through a polite live region.
- **Keys:**
  - ↑/↓ move through options, skipping disabled ones and wrapping.
  - Enter or Tab commits the active option.
  - Escape closes the list, and a second Escape clears the input.
- **Blur:** text matching nothing reverts to the selection. With
  `allowCustomValue` it becomes the value instead.
- **Forms:** a hidden input submits the option's _value_, not its label.
- **Empty state:** "No results" is rendered _outside_ the listbox, because an
  empty `role="listbox"` fails axe's required-children rule.

### 2. NumberField is a spinbutton on a text input

`type="number"` changes its value when the user scrolls over it, misparses
decimal commas, and gives inconsistent mobile keyboards. NumberField instead
uses `type="text"`, `inputMode="decimal"` (a number pad on phones) and
`role="spinbutton"` with `aria-valuenow`, `aria-valuemin` and `aria-valuemax`.

- **Keys:** arrows step, Page Up/Down step by ten, and Home/End jump to
  min/max.
- **Rounding:** stepping snaps to the step grid starting from `min`, with no
  float noise (0.1 + 0.2 = 0.3).
- **Typed values:** they're clamped on blur or Enter. Invalid input reverts to
  the last valid value, and empty input becomes `null`.
- **Stepper buttons:** they aren't Tab stops (per the pattern), keep focus in
  the input, disable at the bounds, and have 44px touch targets.

### 3. DateField is the native input

`DateField` is a labelled `type="date"` (or `time`, `datetime-local`, `month`,
`week`) input. Users get the platform picker and its localisation, and forms
get an ISO value. iOS layout quirks are fixed: the input no longer collapses
when empty, and its text is start-aligned. A full calendar date picker remains
a separate, later effort.

### 4. Table: semantic primitives with a stacked mode

- **Primitives:** native `<table>` elements, inside a focusable `role="region"`
  named by the caption so keyboard users can scroll wide tables.
- **Sorting:** sortable headers are buttons, and the sorted column carries
  `aria-sort`.
- **Sticky header:** it needs `maxHeight`, because a horizontally scrollable
  box can't stick to the page.
- **Stacked mode:** `stackBelow` turns rows into label/value cards on small
  screens. Changing a table's `display` drops its semantics in Safari and
  Chrome, so stacked tables set explicit `table`, `row`, `columnheader` and
  `cell` roles.
- **Alignment:** cell alignment is a `data-align` attribute.

### 5. SegmentedControl is native radios

Each segment is a full-size invisible radio inside a label. The browser gives
the arrow-key behaviour, the `radiogroup` semantics and form submission.
Selected and focused styles use `:has(:checked)` and `:has(:focus-visible)`.

### 6. Drawer swipe-to-dismiss

- **Where a swipe starts:** on the header (which gets `touch-action: none`) or
  on the grab handle shown on bottom sheets, never on the scrollable body, so
  scrolling content isn't mistaken for a dismiss.
- **Direction:** each placement class exposes `--greese-drawer-edge`, so the
  dismiss direction follows a responsive placement and is mirrored in RTL.
- **Release:** past 30% of the sheet's size, or a flick faster than
  0.5 px/ms, calls the native `dialog.close()`, and the exit transition
  continues from the dragged position. Otherwise the sheet snaps back. Turn
  it off with `swipeToClose={false}`.

### 7. Stricter visual regression

While adding [Phase 7](0013-project-scope-and-phases.md#phases) baselines, a stretched-badge bug went **undetected**.
Playwright's default per-pixel colour `threshold` (0.2) counted a pale 14%
badge tint as identical to white. The visual config now uses
`threshold: 0.02` and `maxDiffPixelRatio: 0.001`. We confirmed it: restoring
the wrong baseline makes the test fail with 17,979 differing pixels, and the
full suite is stable across repeated runs, because rendering in a pinned
browser is deterministic.

## Consequences

- No new dependencies. Each new component costs 0.8–3.2 kB of JS (brotli)
  when imported alone. The whole library is about 16.7 kB of JS and 14.3 kB
  of CSS.
- **Verification:**
  - 201 unit tests.
  - 394 e2e tests across Chromium, Pixel 7, Firefox, WebKit and iPhone,
    including a real pointer drag for swipe-to-dismiss.
  - 184 visual baselines.

## Addendum (2026-10-18): components ported from GLOP

GLOP's UI package (`@beta/ui`, 14 component folders on MUI 9 and Emotion) was
reviewed for components worth porting. Every port drops MUI and Emotion and
follows GreeseUI's conventions (SCSS tokens, native elements, pointer events,
`onValueChange`, Field wiring, tests in five engines, a docs page each).

**Ported:**

| GLOP                 | GreeseUI                                               | Notes                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `colorPicker`        | `ColorPicker`                                          | Pointer events (touch and pen), native range inputs for hue and opacity, a hex value (`#rrggbb[aa]`). Dropped: RGB/HSL/LAB/CMYK tabs, swatch history, confirm buttons, eyedropper |
| `maskedInput`        | `MaskedInput`, `applyMask`, `unmask`, `isMaskComplete` | Same mask language, on `Input` inside `Field`. Fixed GLOP's literal-stripping and mid-value bugs; numeric keypad for digit masks. Dropped `component` and US-only formatters      |
| `autoLayout`         | `AutoLayout`, `AutoLayoutItem`, `resolveMaxSize`       | Same column model, as zero-runtime CSS; nested items never inherit sizes                                                                                                          |
| `actionSelect`       | `ActionSelect`                                         | A native `<select>` joined to a button through `ButtonGroup attached`; both halves need accessible names                                                                          |
| `exportActionSelect` | A story recipe (Forms/ActionSelect → RepeatLastAction) | About ten lines of state on `ActionSelect`                                                                                                                                        |

**Not ported:**

| GLOP                             | Why                                                         | Instead                                                       |
| -------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| `span`                           | `<span>` already inherits font and colour                   | `<span>` or `<Text asChild>`                                  |
| `chart`                          | Needs Recharts, against the few-dependencies goal           | A separate package, or Recharts with GreeseUI tokens          |
| `console`                        | GLOP's console colour schemes: app-specific                 | `createTheme` in the app                                      |
| `documentPickerDialog`, `form`   | Tied to GLOP's Firestore types and validator                | `Dialog` + `Table`; `Field` for errors                        |
| `editableField` (and its inputs) | An app-level switchboard over controls GreeseUI already has | An app-level `EditableField` over GreeseUI controls           |
| `KnobInput`, `gradientEditor`    | Niche (design tools) or tied to GLOP's `GradientFill` type  | Candidates for later, on ColorPicker's pointer model          |
| `editableSelect`, `toggleSelect` | Narrow, one-toolbar controls                                | `Combobox`, `NumberField` + `Menu`, `ToggleButton` + `Select` |

The same pass added **`Break`** (a responsive line break with a fallback) and
made the build fail when a component stylesheet is missing from
`styles/index.scss`.

When porting more, record the decision and its reason here the same way.
