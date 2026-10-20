---
'@greese/js': minor
'@greese/react': patch
---

Faster starts for many animations at once. greese.js holds every style write until its timeline has read its starting values, and adds `batch(fn)` to hold writes across timelines (the ticker batches each frame). The `greese` prop attaches each commit's elements in one batch, checks their positions together and reads RTL from the `dir` attribute, instead of forcing a style recalculation per element. An `inView` text effect on an element already in view now leaves its text alone; before, it showed the effect's first frame (a count stuck at `0`).
