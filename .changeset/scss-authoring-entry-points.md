---
'@greese/ui': minor
---

Export the partials the components are written with, for theme authors (ADR 0021): `pkg:@greese/ui/scss/mixins` (`up`, `down`, `hover`, `focus-ring`, `touch-target`, `motion-safe`, `component-root`), `pkg:@greese/ui/scss/tones` (`$tones`, `$brand`), `pkg:@greese/ui/scss/floating` (`surface`, `anchored`, `enter-exit`) and `pkg:@greese/ui/scss/controls` (`$sizes`, `frame`, `focused`, `no-zoom-font`). Each is the module the library itself loads, so a build's own `$breakpoints` reach them.
