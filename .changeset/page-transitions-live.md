---
'@greese/react': minor
---

**Live page exits (ADR 0029).** `PageTransition` takes `mode` (`auto`, `snapshot`, `live`), `order` and `stagger`: a live page's members (its elements with greese entrances) play their exits on the real page, the last first by default, while the router loads the next page, which then commits. `exit` also takes a sequence or a timeline map (selector → sequence), played by greese.js. Back and forward wait for a live exit where the browser can defer a traversal's commit (the Navigation API's precommit handler). The theme's `page-mode`, `page-exit-order` and `page-stagger` apply.
