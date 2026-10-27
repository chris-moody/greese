# ADR 0003: Form controls are restyled native elements

- **Status:** Accepted
- **Date:** 2026-10-17

## Context

Component libraries often rebuild controls from `div`s, or hide a native input
behind a custom one. Either way, the library has to re-implement keyboard
handling, form submission, autofill, validation and screen-reader semantics,
and on phones it gives up the platform pickers. greese ui is mobile-first and
aims to ship little JavaScript.

## Decisions

### 1. The native element is the control

| Component                        | Element                                 |
| -------------------------------- | --------------------------------------- |
| Button, IconButton, ToggleButton | `<button>` (`aria-pressed` for toggles) |
| Input, TextField                 | `<input>`                               |
| Textarea                         | `<textarea>`                            |
| Select                           | `<select>`                              |
| Checkbox                         | `<input type="checkbox">`               |
| Switch                           | `<input type="checkbox" role="switch">` |
| Radio                            | `<input type="radio">`                  |
| Slider                           | `<input type="range">`                  |
| FileInput                        | `<input type="file">`                   |

Checkboxes, radios and switches use `appearance: none`, and the box or track is
drawn on the **input itself**, so focus, the focus ring, clicks and
`:checked`/`:indeterminate` are all native. The check and dash marks are a
sibling SVG colored with `currentColor`, so they follow the theme. We don't
use the pseudo-element approach because Firefox doesn't render pseudo-elements
on inputs.

As a result:

- **Native forms work as-is.** `FormData` picks up every control, including
  CheckboxGroup values, which are repeated `name` entries.
- **Form libraries work without adapters.** `ref` reaches the native element,
  so react-hook-form's `register()` works directly, as the Storybook example
  shows.
- **Platform behaviour comes for free:** arrow keys across radios, Page
  Up/Down and Home/End on sliders, the native select picker on phones, and
  the camera and photo library from file inputs.

The props split follows from this. Frame-wrapped controls (Input, Select) send
`className`/`style` to the frame and everything else to the native element.

### 2. `Field` wires label, description and error

`Field` provides an id, a description id and an error id through context.
Controls call `useFieldControl()`, which is exported so custom controls can do
the same, to set `id`, `aria-describedby`, `aria-invalid`, `required` and
`disabled`. The error id joins `aria-describedby` only when the field is
invalid. Groups use `<fieldset>` and `<legend>` (`role="radiogroup"` for
RadioGroup).

A Checkbox, Radio or Switch puts **only its label text** inside `<label>`. The
description is a separate node linked by `aria-describedby`. The first
version put it inside the label, and the unit tests caught screen readers
announcing it as part of the name ("Accept terms Required").

### 3. Buttons stay focusable while loading

`loading` sets `aria-disabled` and `aria-busy` and ignores clicks, but doesn't
set `disabled`. A disabled element drops focus, so a keyboard user would lose
their place mid-action. `type` defaults to `"button"`, so a button never
submits a form by accident.

### 4. Mobile rules are built into the controls

- **No iOS zoom.** On `(pointer: coarse)`, control text is at least 16px, which
  stops iOS Safari zooming on focus. Small controls look small on desktop
  only.
- **Touch targets.** Buttons, checkboxes, radios and switches extend their hit
  area to 44×44px with a centred pseudo-element on coarse pointers, without
  changing their visual size. The slider thumb grows to 1.75rem.
- **No sticky hovers.** Hover styles only apply under `(hover: hover)`.

### 5. Styling through component variables and `color-mix()`

A button's tone sets `--greese-button-tone` and `--greese-button-on-tone` on the
component. These are overridable per instance, and declared on the component
as ADR 0002 requires. Variants derive their hover, active and soft
backgrounds with `color-mix()`, mixing toward the on-tone color or into
transparency. That works in light and dark without a token per state. Only
one new token was needed: `onNegative`.

### 6. Progressive enhancement

- **Textarea autosizing** uses CSS `field-sizing: content` where it's
  supported (Chromium). Elsewhere you get a manually resizable box sized by
  `rows`. There's no JS fallback.
- **The slider's filled track** is one CSS variable, written directly to the
  element on input, so dragging an uncontrolled slider never re-renders React.

## Verification

- 106 unit tests, including keyboard interaction (`user-event`), Field wiring,
  `FormData` across every control, and axe.
- `apps/playground/e2e/forms.spec.ts` runs in Chromium (desktop and Pixel 7),
  Firefox, WebKit and an iPhone 15 (WebKit) project. It covers native keyboard
  behaviour, the focus ring, submitted values and autosizing, and on touch
  devices the 16px text and 44px hit areas.
