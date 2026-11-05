---
'@greese/js': minor
---

- **`killTweensOf(targets, scope?)`** stops every animation on a target,
  wherever it was started, leaving its properties where they are. Other targets in the
  same timelines keep running. Use it where something else is about to take a
  property over, so two animations don't fight: a new hit reaction on a sprite
  already recoiling, a particle returning to its pool, an element animated
  again from somewhere else in the code. A timeline has the method too
  (`tl.killTweensOf(o)`), scoped to itself and its children, as the counterpart
  to `kill()`: that stops a timeline you hold, this stops whatever is animating
  a target you hold.

  Targets are found through a `WeakMap` keyed by the target, so the entry goes
  when the target does — safe for the thousands of short-lived objects a game or
  particle system animates. While a target is alive the timelines animating it
  stay alive with it, which is the trade every library with this feature makes.

- **`delay`** on `AnimateOptions`: seconds to wait before an animation starts.
  On a timeline a `Position` says this and more, so it is for the one-call
  `animate()`, where there is no timeline to position against. It shifts the
  whole segment, so a later `'<'` or `'>'` follows the delayed start.

- **Budgets raised deliberately** for these: `everything` 6.9 → 7.1 kB,
  `animate` 5.95 → 6.1 kB, the `<script>` build 7.3 → 7.5 kB. The registry is
  written from `Timeline`'s own track bookkeeping, so `{ animate }` pays for it
  (77 B brotli) whether or not it calls `killTweensOf`. That is the cost of the
  feature being reliable: a registry only filled on demand would miss the
  animations started before anyone asked.
