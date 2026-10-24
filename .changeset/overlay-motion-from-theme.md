---
'@greese/ui': minor
---

Overlays take their motion from the theme. Popovers, menus, tooltips, dialogs, drawers, the sidebar and speed-dial actions no longer carry transitions or `@starting-style` of their own. Each component only says what it is and where it opens from (`--greese-overlay-origin`), and reads its motion from a role the theme assigns:

- **Arriving:** `--greese-motion-overlay`, or one kind's: `-dialog`, `-popover` (menus and speed-dial actions too), `-tooltip`, `-drawer` (the sidebar too), over `--greese-motion-overlay-duration`. The base theme fades in from the origin; a drawer slides from its edge.
- **Leaving:** `--greese-motion-overlay-exit-*`, or one kind's (`--greese-motion-dialog-exit-*`…), over `--greese-motion-exit-duration` and `-exit-ease`. One transition remains, which keeps a closing overlay rendered while its exit plays.
- **Scrim and toasts:** `--greese-motion-backdrop` and `--greese-motion-toast`, with their `-duration`.

A component's `motion()` in the kit, or an instance's `greese` prop, overrides its role.
