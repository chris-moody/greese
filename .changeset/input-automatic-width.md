---
'@greese/react': minor
'@greese/ui': minor
---

Give `Input` an automatic width, and an `htmlSize` prop for a deliberate one.

The frame was `inline-size: 100%`, and the `<input>` inside it kept the native
`size` attribute's default — a preferred width of about twenty characters that
nobody chose. Together they meant a text field demanded the full measure of
whatever it sat in and refused to be narrower than twenty characters, which in a
dense panel row is most of the row. A field holding three digits was as wide as
one holding a sentence.

The frame is now `inline-size: auto`, and the input contributes no width of its
own. A `Field` stretches its control and a block-level flex container fills its
containing block, so a labelled form is unchanged; as a flex or grid item the
field takes what the layout gives it instead of demanding a track it does not
own.

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

`Textarea` and `Select` still set `inline-size: 100%`; they are untouched here.
