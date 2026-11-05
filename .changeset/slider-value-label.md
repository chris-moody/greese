---
'@greese/react': minor
'@greese/ui': minor
---

- **`Slider` can show its value**: `valueLabel="auto"` puts it in a bubble
  above the thumb while the slider is hovered, focused or dragged, `always`
  keeps it up, and `unit` goes after the number.

  ```tsx
  <Field label="Blend weight">
    <Slider value={weight} onValueChange={setWeight} valueLabel="auto" unit="%" />
  </Field>
  ```

  The bubble is a `Tooltip`, so it is the same surface, placement, flip-to-fit
  and motion as every other floating thing — not a second implementation. It
  hangs off a zero-size anchor sitting at the thumb rather than off the input,
  so it follows the value instead of floating over the middle of the track; the
  thumb's travel is inset by half its width at each end, which the anchor's
  `calc()` accounts for.

  It is **off by default**, and deliberately: the filled part of the track is a
  custom property written straight to the element, so an uncontrolled slider
  does not re-render as it moves, and showing the number gives that up. You opt
  into the cost.

  The bubble is presentational (`role="presentation"`, no `aria-describedby`).
  A range input already announces its value, so a bubble repeating it would be
  announced twice; with a `unit` the slider sets `aria-valuetext` instead, which
  is the one place a unit can be spoken.

- **`Tooltip` takes `open` and `describe`.** `open` drives it from outside —
  `true` keeps it up, `false` turns it off entirely — and replaces the hover,
  focus and tap behaviour, so the tooltip shows exactly when you say. A
  controlled tooltip shows and hides at once rather than through the hover
  delay, because a delay belongs to hovering. `describe={false}` makes it
  presentational, for a trigger that already exposes the same thing.

- **Fix: `Slot` no longer lets a child's `undefined` clobber the Slot's own
  prop.** A prop the child did not set is not an override, but spreading it
  overwrote the value anyway. Every greese control passes
  `useFieldControl()`'s `aria-describedby` straight through, and it is
  `undefined` outside a `Field` — so a `Tooltip` around a `Switch`, a `Slider`
  or any other control wrote its id onto the trigger and then erased it, and
  described nothing at all. Costs about 10 B in every component.

- `@greese/ui` gains `greese-Slider-wrap` and `greese-Slider-thumbAnchor`,
  present only when a slider shows its value, so a plain slider's markup is
  unchanged.
