---
'@greese/js': patch
---

**Colors from `color-mix()` and the newer color spaces blend.** `parseColor` (and so `mix` and every tween) reads `oklab()`, `oklch()` and `color(srgb …)`, which browsers compute `color-mix()` and those spaces to, so animating from or to such a color (every GreeseUI token built with `color-mix`) blends instead of switching halfway. A `color()` in another space (`display-p3`…) still switches halfway.
