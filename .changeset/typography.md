---
'@greese/ui': minor
'@greese/react': minor
---

Add the type system: the variants `p1`–`p3`, `h1`–`h6`, `s1`, `s2`, `caption` and `button`, each with a size, weight, letter spacing and line height (and optional `family`, `style`, `transform`, `features`, `variation`, `stretch`, `wrap`, `spacing`, `numeric`) that change across breakpoints, as `--greese-type-<variant>-<prop>` custom properties. `Text` and `Heading` take a `variant` (`Heading`'s `level` still sets the element), `.greese-Type--<variant>` styles any element, and `createTheme({ typography })`, the kit's `typography()` and `$typography` change the values. Buttons read the `button` variant.
