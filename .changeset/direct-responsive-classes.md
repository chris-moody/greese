---
'@greese-ui/react': minor
---

Faster style recalculation. Responsive props compile to one class per breakpoint that sets the property directly (`.greese-Stack--md-gap-2`, or `.greese-Stack--md-gap` reading an inline `--greese-stack-gap-md` for open-ended values), with no `var()` fallback chain, no "uses" class (`.greese-Stack--gap` is gone) and no `@property` registrations. Below a prop's smallest set breakpoint, the component's own styles now apply instead of being reset. The `greese` prop's presets share one set of rules, and stagger uses `sibling-index()` where supported. `responsivePropClass` is replaced by `responsiveValueClass`. The full stylesheet is 1.2 kB smaller.
