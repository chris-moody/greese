---
'@greese/ui': patch
---

A docked `Sidebar` no longer stays off canvas in apps whose CSS is minified by lightningcss (Vite's default): it folded the docked rule's `translate: none; scale: none; transform: none` into `transform` alone, and the off-canvas `translate` came back.
