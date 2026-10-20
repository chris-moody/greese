---
'@greese-ui/react': minor
---

`Grid` is now one component, as in MUI: `container` makes a grid and `size` (was GridItem's `span`) is how many columns a cell spans; one element can be both, to nest. `GridItem` is removed, and the old `container` (container queries) is now `containerQueries`. New `Tile`, a compact surface for grid cells, placeholders and drop zones. `Rating` takes `step` (1, 0.5 or 0.25) for half and quarter stars, with pointer preview and drag-to-choose on touch. `ChatBubble` has a tail pointing at its author. Every prop now has a description in the props tables.
