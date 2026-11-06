---
'@greese/react': minor
'@greese/ui': minor
---

- **`NumberField`'s steppers stack.** Two buttons side by side cost about
  3.5rem of a field's width, which is most of a row in a dense panel; a caret
  above a caret costs one button's width. `steppers` picks the layout:
  `stacked` (the default), `split`, or `none` for a field changed only by
  typing and the keyboard.

- **`NumberStepper`**: a minus at one end, a plus at the other, the value
  between them — the quantity-picker shape, where the two directions are far
  enough apart to hit without looking.

  ```tsx
  <NumberStepper label="Guests" min={1} max={12} defaultValue={2} />
  ```

  It is a `NumberField` throughout: same parsing, clamping, snapping and
  keyboard. Only the layout differs, so there is one implementation to keep
  right.

- **`size` reaches every form control.** `Checkbox`, `Radio`, `RadioGroup`,
  `Switch`, `Slider` and `ColorPicker` take the same `xs`–`xl` scale that
  `Input`, `Select` and `Button` already did, setting font size, padding and
  the control's own box. A `RadioGroup`'s size reaches its radios through a
  custom property, so a radio inside needs none of its own.

  This is what `EditableField size` was missing: it passed its size to the
  text controls and silently dropped it for the rest, so a column of mixed
  fields came out ragged. Every control it renders now takes it.

- **`Dialog` and `Drawer` take `hideClose`.** For a dialog dismissed some
  other visible way — a navigation drawer with its own toggle. Escape, a click
  outside and a swipe still close it; none of those is discoverable on its
  own, so a dialog that asks something keeps its button.

- **`--greese-dialog-padding`** sets a dialog's inset, beside the
  `--greese-dialog-width` that was already there, so a drawer whose rows run
  edge to edge can say so.

- **Buttons take the bold weight** (700, was 600): a button's label is the
  thing you act on, and it now reads as such against the semibold headings.
