---
'@greese/react': minor
---

Page transitions can be set by route and by navigation. `usePageNavigate(navigate, { route })` reads each page's `PageRoute` (`to` and `from` rules by path pattern) and `navigate` and `onLinkClick` take `enter`, `exit`, `duration` and `ease`. A navigation's `mode` now beats a page's own, as documented.
