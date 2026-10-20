---
'@greese/react': minor
'@greese/js': patch
---

Add `useGreese()`, greese.js tied to a component's lifetime: the build runs before paint with refs set, selector strings are scoped to a ref, dependencies re-run it (pausing or, with `revertOnUpdate`, reverting the last build), and everything made through it, including animations started in handlers, is reverted on unmount. `useTimeline()` now builds on it, so it also applies before paint. greese.js: timelines take a `scope` option (selector strings match inside that element), and `kill()` now restores properties animated with explicit keyframes or `fromTo`, whose originals were previously never read.
