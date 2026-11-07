---
'@greese/svg': patch
---

Harden `@greese/svg/markup`'s sanitizer (names by local name and case, script schemes hidden by whitespace or entities, animations that set links or handlers, outside `url()`s and `@import`, comments that end early in HTML, `<foreignObject>`'s HTML, a refused root), fix a parser hang on an unclosed doctype, keep `renameIds` from rewriting colours, match ids first in `adoptIds`, correct the schema's content model and presentation flags, and read `S` and `T` handles in `nodeType`.
