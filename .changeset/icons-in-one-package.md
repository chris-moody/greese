---
'@greese/icons': minor
'@greese/react': minor
'@greese/ui': minor
---

Every icon lives in `@greese/icons` (ADR 0020). `@greese/react` now depends on it and draws its own glyphs (close, menu, chevron, plus, minus, check, sort, star) with it, in place of its inline SVGs. `createIcon` takes `{ viewBox, strokeWidth, filled }`, and the package gains `ChevronLeft`, `Minus`, `Sort`, `CheckDash`, `StarFilled`, `Accessibility`, `Copy`, `Dots`, `Feather`, `Github`, `Layers`, `Motion`, `Phone`, `Replay` and `Server`. `Checkbox` and `Table` style their icons by path position; the `greese-Checkbox-check`, `greese-Checkbox-dash` and `greese-SortGlyph-*` classes are gone.
