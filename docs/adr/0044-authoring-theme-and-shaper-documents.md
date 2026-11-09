# ADR 0044: The default authoring theme, Shaper's documents in tabs, and strips

- **Status:** Accepted
- **Date:** 2026-11-09
- **Builds on:** ADR 0035 (the authoring package), ADR 0038 (Shaper and the
  icon editor), ADR 0042 (Shaper's clipboard), ADR 0011 (ScrollCarousel)

## Context

- **The icon editor looked different from Shaper.** Its panel tabs, icons and
  button labels were larger, buttons had a different weight, and inputs had
  an inner outline. Nothing in their styles differed: the icon editor imports
  `shaper` before greese ui's CSS. `shaper.css` declares
  `@layer greese.components`, so that layer came first and lost to greese
  ui's resets.
- **Inputs differed in size between apps.** In Shaper, comboboxes at the
  default `md` stood taller than the panel's `sm` fields. Pixels' inputs were
  taller still. Each app set field styles of its own, Glop in its own
  stylesheet.
- **Shaper edited one drawing at a time.** Copying between drawings meant the
  icon editor's list or a second page.

## Decision

### 1. A default authoring theme in @greese/authoring

- **`<AuthoringTheme>`** scopes what every authoring app draws alike. It
  renders `display: contents`, so it leaves a shell's layout alone. An editor
  root can carry `greese-AuthoringTheme` itself, as Shaper's does.
- **Inside it,** text controls are dense: an Input, Select or Textarea at
  `md` or larger is drawn at `sm` (Combobox and NumberField are Inputs).
  EditableField names use the code face at caption size, and values keep the
  control's own type.
- **Who uses it:** Shaper and the icon editor. Glop's
  `AuthoringThemeProvider` (Pixels, Amp, Rigatron) renders it, and Glop no
  longer sets field styles of its own.
- **Layer order:** `@greese/authoring/styles.css` opens with greese's layer
  order (`pkg:@greese/ui/scss/layers`), and so does `shaper.css`. Whichever
  sheet a bundle loads first, the order holds.

### 2. Shaper's documents in tabs

- **Each drawing is an editor of its own:** its own store, undo history,
  selection and view. All of them stay mounted, each in a `TabPanel`, so a
  switch keeps zoom, scroll and the code's caret. A switch carries the dock's
  arrangement, the tool and the panel layout across, so only the drawing
  changes.
- **The tab strip:** greese `Tabs` in a `ScrollCarousel` strip (§3), then a
  New button.
- **New** opens a New SVG dialog: a name, and "Copy <current>", on by
  default. A copy takes the tree and its editor state.
- **Open** puts each file in a tab named after it. Import still goes into the
  current drawing.
- **Modified marking:** a tab shows a dot (and "modified" to a screen reader)
  while its tree differs from the last save or open.
- **Closing:** a ×, a middle click, or Delete on a focused tab. A modified
  drawing asks first, and the last tab can't close.
- **Copy and paste between tabs** use the one clipboard (ADR 0042). A paste
  into another drawing lands in place.
- **Hosts:** `tabs={false}` keeps one drawing, for the icon editor. There,
  New replaces the drawing unless it's a copy, which renames it, and Open
  replaces it. `onNew` takes New over, so the bar's New in the icon editor
  opens the icon editor's own New icon dialog.
- **A move snaps to whole screen pixels.** Under the strip, the stage sits at
  a fractional offset, and engines report a press and a move in slightly
  different steps. Without this, a move wrote `5.001` for `5`.

### 3. Strips, clearable fields and the stage bar

- **`ScrollCarousel strip`** is a row of controls that scrolls when it
  overflows:
  - each slide is as wide as its content;
  - the carousel's roles, live region, focusable viewport and dots are left
    out, so tabs stay a tab list's;
  - its buttons are for the pointer: they're `aria-hidden`, out of the tab
    order, and page by most of a view.

  The document tabs and the stage's context bar use it.

- **The stage bar:**
  - every control has a tooltip, the dropdowns included. A field's tooltip
    repeats its name, so it shows without describing;
  - Stage color drops its visible label;
  - the layout's Save is an icon button.
- **EditableField `clearable`** (default off):
  - text, number and the new `textarea` type get an × inside that empties
    them. A number becomes `null`;
  - a select gets a first option for its own cleared value (`clearValue`,
    `''` by default), so its types don't change;
  - the × is the pointer's, as a search field's is: the keyboard selects and
    deletes;
  - NumberField has `clearable` too, since its typed text is its own state.

## Consequences

- **Glop:** the field styles Pixels set for itself are gone. Its fields look
  as Shaper's do.
- **Size:** authoring's CSS budget goes to 8.95 kB, greese.css to 27.35 kB,
  and greese react's whole library to 39.45 kB, each with its reason in
  `.size-limit.cjs`.
- **Memory:** all open drawings stay mounted. Many open drawings cost a dock
  each, which is the price of switching without remounting.
