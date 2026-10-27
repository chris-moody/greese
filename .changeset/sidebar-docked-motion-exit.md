---
'@greese/ui': patch
---

**A docked `Sidebar` shows under every motion theme.** Above its breakpoint it's never open as a popover, so a theme's drawer exit applied to it: Snappy's scaled it to nothing, and a wipe's or pocket's mask could hide it. The docked column now puts scale, transform and mask back to rest, as it already did opacity and translate.
