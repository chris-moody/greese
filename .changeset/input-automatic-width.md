---
'@greese/react': minor
'@greese/ui': minor
---

Stop `Input` forcing a twenty-character minimum width, and add `htmlSize`.

A text field could never be narrower than about twenty characters, however
little room the layout had for it. The cause was the frame's flex automatic
minimum size: a flex item's minimum is its content's min-content width, and an
`<input>`'s min-content width is whatever `size` says — twenty characters by
default, a number nobody chose. `.greese-Input` set no `min-inline-size`, so
that default became a floor every ancestor had to honour. A field holding three
digits took as much room as one holding a sentence.

`.greese-Input` now sets `min-inline-size: 0`. It still fills its container —
a Field, a table cell, a flex row — but it imposes no floor of its own and
shrinks to whatever the layout can give it.

`htmlSize` is the native `size` attribute, renamed because `size` here is the
control scale (`sm`/`md`/`lg`). Set it and the field is that many characters
wide and the frame hugs it, overriding a container's `flex: 1`:

```tsx
<Input htmlSize={7} defaultValue="#4f46e5" />
<EditableField label="Degrees" type="number" htmlSize={3} />
```

It reaches `TextField`, `NumberField`, `NumberStepper`, `MaskedInput` and
`Combobox` through `InputProps`, and `EditableField`'s text and number rows take
it directly.

`Textarea` and `Select` have the same missing `min-inline-size: 0` on their
frames; they are untouched here.

The measure is in `ch` as well (`--greese-input-size`, which the React
component sets): `size` alone measures in the font's average character, which
is narrower than its digits, so `htmlSize={7}` clipped `#4f46e5`. A measured
field doesn't shrink below its measure in a crowded row either.
