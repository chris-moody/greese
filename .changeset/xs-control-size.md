---
'@greese/ui': patch
'@greese/react': patch
---

The `xs` control size is 1.5rem (24px) on every control and every pointer: Button, IconButton, ToggleButton, Select, Input, Combobox and ActionSelect all line up at it, where it was 1rem and each grew to its own content (19 to 30px). Its inline padding is `--greese-space-2`. A Select's line no longer grows it on touch, a Combobox's toggle fits inside an `xs` field, and EditableField's colour swatch is its size's height on every pointer (it gets a `greese-EditableField--size-*` class), with a 44px hit area on touch.
