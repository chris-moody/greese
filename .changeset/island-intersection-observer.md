---
'@greese/react': patch
---

The `greese` prop's island tells which scroll reveals start out of view with an IntersectionObserver instead of measuring each one in the commit, which forced a layout of the whole page in every commit with an island (ADR 0009).
