---
'@greese/ui': minor
'@greese/react': minor
---

Remove the font-size tokens (`--greese-font-size-*`, the `fontSize` group and export) and the `size` prop of `Text` and `Heading`: text sizes come from the type system's variants. `Text` takes a `variant`, `Heading` takes the variant of its level unless given another, and components read the variants' sizes. Migrate `size="sm"` to `variant="p3"` (`xs` to `caption`, `md` to `p2`, `lg` to `s2`, `xl` to `s1`, `2xl` to `h3`, `3xl` to `h2`, `4xl` to `h1`).
