---
'@greese/ui': patch
'@greese/react': patch
---

Page transitions' snapshot rules start with `html` (`html::view-transition-old(…)`): the snapshots belong to the root, and a selector with nothing before `::view-transition-*` was tried against every element at every style recalculation, about 15 ms of blocking time on a large page.
