---
'@greese/ui': minor
'@greese/react': minor
---

Define the built-in effects once, in `@greese/ui` (`src/effects.ts`, exported as `builtInEffects` and from `@greese/ui/effects`), as base effects that animate one property each and combo effects made of them. Effects take arguments in a sequence: `fadeIn(0.25, 0.8)`, `fadeIn({ end: 0.8, duration: 1 })`, with `duration`, `offset` and `ease` on every call. There is no effect kind: an effect that ends at rest is a CSS preset, one that ends away from it is an overlay exit, so `exit` takes any effect and `GreesePreset`, `GreeseExit` and `GreeseInteraction` are removed. The kit gains `effect()`, which writes an effect's CSS as the built-ins have it, and `motion()` accepts all of them.
