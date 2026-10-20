---
'@greese/ui': minor
---

Add the `greese.overrides` cascade layer, between `greese.components` and `greese.utilities`, to `LAYER_ORDER`. `scss/maps` now also exports every token's default (`$color`, `$scalars`) and the layer order (`$layer-order`), for build-time themes.
