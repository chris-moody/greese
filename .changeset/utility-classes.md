---
'@greese/ui': minor
---

Add utility classes (ADR 0019): about 2,300 single-purpose classes named for the property and the value (`p-4`, `pt-3`, `ms-2`, `display-flex`, `text-align-center`, `justify-content-between`, `background-primary`), with breakpoint and `hover` variants, in `@layer greese.utilities`. `@greese/ui/utilities.css` is the whole set; `greese-utilities --content "src/**/*.tsx" --out utilities.css`, `greeseUtilities()` from `@greese/ui/vite`, and `purgeUtilities()` write only the classes your source uses.
