# ADR 0044: The default authoring theme, and strips

- **Status:** Accepted
- **Date:** 2026-11-09
- **Builds on:** ADR 0035 (the authoring package), ADR 0011 (ScrollCarousel)

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

Shaper keeps each drawing in a tab of its own, and its tab strip is the first
`ScrollCarousel` strip (§3). That is recorded in Shaper's own ADR 0044, in
[Shaper's repository](https://github.com/chris-moody/shaper/tree/main/docs/adr).

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

## Addendum (2026-11-09): docking sizes, strips and field names

- **A docked row or column is as deep as the drop was from the edge.**
  - A drop on a group's top or bottom zone makes a row, and one on its left
    or right zone a column. The pointer marks the new pane's far side:
    `dropSize`, clamped so both panes keep SplitPane's 80px.
  - The new pane is the split's primary, so it keeps that size. At the
    bottom or right, a reversed split puts it there.
  - The workspace's own edge bands are a few pixels deep, so their drops
    keep the 180px default.
- **A strip's slides are rows.** A media's stage bar slot may be several
  controls side by side (Pixels' zoom, grid and stage color), which a
  block-level slide had stacked.
- **A carousel's button at an end** is invisible and takes no pointer
  events, so clicks reach what it covers.
- **A cut-off EditableField name** shows whole in a tooltip on hover, and
  only then. The tooltip mounts only while it shows, so a page of fields
  doesn't carry a hidden copy of every name. Shaper's custom-control fields
  do the same.
- **Shaper's** stylesheet layer, canvas overlay, Library and Code panel
  changes from the same day are in Shaper's own ADR 0044.
