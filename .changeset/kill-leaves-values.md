---
'@greese/js': minor
'@greese/react': patch
---

`Timeline.kill()` and `killTweensOf()` now stop **in place**: animated
properties keep the value they have, as in GSAP. The old put-everything-back
behavior is the new `Timeline.revert()`, which `Motion` and `useGreese` now use
for their cleanups so unmounting still leaves no inline styles behind.
