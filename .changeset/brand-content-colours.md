---
'@greese/ui': minor
'@greese/react': minor
---

Brand colors lead with `primary`. Components use `primary` for interactive emphasis and default to `tone="primary"`; `accent` is now a color of its own (pink by default), after `tertiary`, and every `tone` prop takes `primary`, `secondary`, `tertiary` and `accent`. `on<Color>` tokens are renamed `<color>Content` (`--greese-color-primary-content`). `createTheme` (and the SCSS kit's `tokens()`) derive a WCAG AA-safe content color and a strong shade from any brand color a theme sets, and the tokens package exports `contentColor`, `contrastRatio`, `luminance` and `deriveColors`. Scroll reveals now wait until an element is wholly in view and clear of the bottom edge.
