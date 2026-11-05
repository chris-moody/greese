---
'@greese/ui': patch
---

**Fix: `EditableField`'s colour picker took clicks while closed.** Its popover
declared `display: grid` unconditionally, and an author `display` beats the
user agent's `[popover]:not(:popover-open) { display: none }` — so the closed
popover stayed laid out and hit-testable. Invisible, because the overlay exit
sets `opacity: 0`, and sitting over the controls, taking the presses meant for
them: pickers appeared to open themselves. `display` is scoped to
`:popover-open` now.

A test guards the whole kit against the same mistake. It finds the classes that
land on a popover from two sources that can't drift — the `:not(:popover-open)`
rule `floating.enter-exit` emits for each overlay root, and the `className` a
component hands an overlay — and fails on any `display` declared on one of them
without its open state. The docked `Sidebar` is the one exception, and it is
qualified by its layout class so it can never match an off-canvas sidebar.

If you set `display` on a popover of your own, scope it to `:popover-open`.
