---
'@greese-ui/greese': patch
---

Interpolate between different units instead of snapping halfway: `16px` → `2rem`, `0px` → `50%`, `100px` → `50vw` and `200ms` → `1s` now blend smoothly through `calc()`, per number, so the browser converts them exactly where the value is used.
