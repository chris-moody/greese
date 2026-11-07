---
'@greese/react': minor
'@greese/ui': minor
---

- **`EditableField`**: one field that renders whichever control a value asks
  for — `text`, `number`, `range`, `color`, `knob`, `checkbox`, `switch`,
  `radio`, `select`, `choice` (radios while the options are few, a dropdown
  when they are many) or `segmented`. It is for a panel built from data, where
  what is being edited decides the control: a property inspector, a settings
  sheet. Leave `type` out and a string, number or boolean picks its own, a hex
  string included.

  It is a row by default — the name on one side, the control on the other — so
  a column of them lines up down a panel; `layout="column"` stacks instead. It
  adds the things such a panel needs and a single control does not:

  - **`indeterminate`**, for a field standing in for several things that
    disagree: the control shows a placeholder instead of a value, and choosing
    one still reports it normally.
  - **`unit`**, the `px` or `%` or `°` after the number.
  - **`numDecimals`**, with a `step` finer than it widening the limit instead
    of rounding away the values the field's own arrows produce.
  - **focus selects the value**, because a field in a panel of them is read far
    more often than edited, and the edit is usually a replacement.
  - **`allowEmpty`**, so an emptied number or a cleared color reports `null`
    rather than being forced to a number.

  Controlled or uncontrolled, like every other greese input. The dial is a part
  of it rather than a component of its own.

- **ColorPicker** gains three parts a working picker needs:

  - **`channels`** — numeric fields for the formats you name (`rgb`, `hsl`,
    `hsb`), so a known value can be typed rather than hunted for. They all
    edit one color, and a grey keeps the hue it came in with.
  - **`eyedropper`** — samples any pixel on screen. The button appears only
    where the browser has the EyeDropper API, so the hex field stays the way
    to enter a color you already know.
  - **`onSwatchesChange`** — makes the swatches a collection the reader keeps,
    with buttons that save the current color and clear the row.

  Its own small buttons are plain `<button>`s rather than IconButton, so a
  picker showing none of them does not carry Button's variants: 0.65 kB.

- **NumberField fix:** a controlled field whose parent declines what was
  committed — a cleared field where empty means nothing, a value the parent
  clamps itself — was left showing the text that was typed rather than the
  value still in force. It now re-reads the value the moment the field is
  left. Found while giving EditableField's number type its `allowEmpty`
  default, where clearing a field left it looking empty while it still held
  a number.

- **Budgets raised deliberately:** `ColorPicker` 4.35 → 5.45 kB (5.38 kB
  measured), the channel fields' HSL math and field table being the bulk of
  it. `EditableField` enters at 14 kB (10.87 kB measured): it reaches eleven
  controls, and a panel built from it would have imported most of them anyway.
  The whole-library budgets and `greese.css` rise by the new component.

A number or color field reports `null` only with `allowEmpty`, and its
`onValueChange` is declared as a method, so a handler that takes the value
alone (`(value: number) => void`) fits where the field can't be cleared.
