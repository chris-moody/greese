---
'@greese/js': minor
---

Add `tweenEase` and `tweenEaseName`: an editor tween's named curve (`easeOut`, `back`, `stepped`, a bézier) as a greese.js ease, with CSS's keyword curves for Pixels (ADR 0040). `fromPixels` uses it, so a Pixels `back` tween is now `back.in`, as every Glop studio draws it.
