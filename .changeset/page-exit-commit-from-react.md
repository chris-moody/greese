---
'@greese/react': patch
---

Page transitions: a live exit's styles come off when React commits the navigation, not at the first change the leaving page makes. A page that was still mounting or re-rendering as it left (a homepage mounting its sections in turn) put its members back on screen before the next page arrived. Back and forward, which a router hears outside the navigation's transition, still watch the page, but ignore what it adds and its attributes, and wait past the cap while the URL has moved.
