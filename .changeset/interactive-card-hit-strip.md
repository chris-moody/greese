---
'@greese/ui': patch
---

**An interactive Card no longer bounces under a pointer resting on its lower edge.** The strip that keeps its hit area under the pointer after it rises was clipped by the card's `overflow: hidden`, and reached only 1px past a border. An interactive card now doesn't clip its overflow (CardMedia rounds its own corners where it bleeds to an edge, so media looks the same), and the strip reaches 4px.
