---
'@greese/react': patch
---

ContextMenu stays open when the press that opened it is released (Firefox, Safari and macOS fire `contextmenu` on the press, and the release light-dismissed the menu), and an element `anchor` now positions it beside that element instead of in the page's corner.
