---
'@greese/svg': minor
---

Add `@greese/svg/markup` (Shaper's ADR 0037): `parseMarkup`, a parser that records where every node and attribute is (`nodeAtOffset` finds the element a caret is in) and throws a `MarkupError` with the line and column; `serializeMarkup` and `serializeMarkupWithRanges`, canonical pretty or minified output that records where each node lands; `sanitizeMarkup`, which takes out scripts, handlers, `javascript:` URLs and outside `href`s and says what it took; `hoistDefs`, which gathers definitions into one `<defs>`; `renameIds`, which renames clashing ids and rewrites every reference; and `adoptIds`, which carries editor ids across a reparse.
