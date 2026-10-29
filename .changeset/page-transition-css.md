---
'@greese/ui': minor
---

**Page transitions, in CSS (ADR 0029).** Every built-in effect plays on a view transition's snapshots: `greese-PageTransition--enter-<name>` on the new page, `greese-PageTransition--exit-<name>` on the old one (exits now have `@keyframes` from rest, `cssPlan().leave`), and `greese-PageTransition--theme` / `--theme-back` follow the theme. `motion-defaults()` gains the page roles (`page`, `page-exit`, `page-back`, `page-back-exit`, `page-duration`, `page-ease`, `share-duration`, `share-ease`, `page-stagger`, `page-exit-order`, `page-mode`), and the kit gains `page-transitions()` for selector rules. Under reduced motion greese snapshots don't animate.
