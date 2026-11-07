---
'@greese/react': patch
'@greese/ui': patch
---

`Text` with no `variant` is body copy (`p1`), and its `tone` and `weight` show again.

`Text` now always carries a type variant, `greese-Type--p1` when none is named.
The variant classes come after `Text`'s in the stylesheet and set `color` and
`font-weight` themselves, so they beat `.greese-Text--<tone>` and
`.greese-Text--<weight>`: `<Text tone="muted">` rendered in the body colour and
`<Text weight="bold">` at the variant's weight. The tone and weight classes are
now doubled with `.greese-Text`, so they win. A `tone` also wins over a named
variant (`<Text variant="caption" tone="muted">` is muted), which it never did.
