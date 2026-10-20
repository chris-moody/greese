---
'@greese/react': patch
---

Steps: on horizontal steps, a Step with `prefixBefore` no longer pushes its marker below the others; every step keeps a line's room for the prefix, so markers and the lines between them stay level.
