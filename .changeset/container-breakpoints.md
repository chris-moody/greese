---
'@greese/react': minor
---

`addContainerBreakpoints({ key: px })` registers breakpoints measured against a container (a panel): `resolveResponsive()` writes their classes beside the viewport's, while `useBreakpoint()` follows the viewport. AutoLayoutItem's `maxSize` now falls back to `size` at every key either sets, added breakpoints included.
