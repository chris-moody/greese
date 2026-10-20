---
'@greese/react': minor
'@greese/ui': minor
---

Add `greese={{ scope }}`: a parent that orders every entrance inside it, at any depth, in document order (`stagger` apart, after `delay`, optionally held until it scrolls into view). A scope inside a scope takes one position in the outer one. It only sets each entrance's start time (`--greese-motion-scope`), so the entrances stay CSS animations; the code is a lazy chunk under 1 kB, loaded only when a scope is used, and components without one pay about 30 B.
