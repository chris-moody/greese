---
'@greese-ui/react': patch
---

ScrollCarousel: the dots and buttons always reach their slide. A late update could scroll the view back to a slide it had passed, and browsers re-snapped a smooth scroll when layout changed mid-way, often a slide short. Only a controlled `index` from outside scrolls now; snapping is suspended while the carousel scrolls itself; the dots no longer change size (the active pill is drawn with `clip-path`); and any scroll still cut short is finished.
