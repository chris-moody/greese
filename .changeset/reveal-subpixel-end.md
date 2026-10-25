---
'@greese/react': patch
---

**Scroll reveals at the end of a page:** an `inView` element that ends the page (a footer) could stay hidden for good. Layout is fractional and scrolling whole pixels, so it can end a fraction of a pixel past the viewport, and was never "wholly in view". The check now allows a pixel's slack there.
