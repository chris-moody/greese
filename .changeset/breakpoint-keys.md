---
'@greese/ui': minor
'@greese/react': minor
---

Breakpoints can gain keys at build time: `@use 'pkg:@greese/ui/scss' with ($breakpoints: (…, tablet: 700px, …))` gives the new key responsive classes, and every breakpoint is now a custom property, `--greese-breakpoint-<key>`, in the built CSS. `configureBreakpoints({ tablet: 700 })` registers it for the hooks, `getBreakpointKeys()` lists the keys in effect, and `BreakpointKeys` can be augmented so `Responsive<T>` accepts it.
