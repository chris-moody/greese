---
'@greese-ui/react': patch
---

Fix modals where scrollbars take space (Windows, macOS with a mouse): the backdrop now covers the whole screen and end drawers reach the screen edge, without the page shifting. The scroll lock removes the scrollbar and pads the page by its width instead of reserving a gutter, which browsers don't paint the top layer over.
