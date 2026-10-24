---
'@greese/ui': minor
'@greese/react': minor
'@greese/icons': minor
---

- **`Header`:** the page's header, with `brand`, navigation (children) and `actions`, sticky by default and `floating` (inset, rounded and raised) on request. A sticky header sets the page's scroll padding to its height (`--greese-header-height`, 3.5rem), so in-page links land with their target just below it, with no JavaScript and nothing for each section to declare.
- **`Footer` and `FooterSection`:** a `brand` beside columns of links, each a `<nav>` named by its heading, over a `legal` row.
- **Accordion and Collapsible icons:** `icon` (or `null` for none), `openIcon` for an icon per state, and `iconTransition` (`rotate`, `fade`, `none`); an Accordion sets them for every item, and an item's own win. The default chevron still turns, by `--greese-collapsible-icon-turn`.
- **Hovers that move the element stay put under a still pointer:** a `greese` hover lasts while the pointer is over where the element rests, and an interactive Card's hit area reaches the 2px it rises, so neither bounces.
- **`ContrastIcon`** in `@greese/icons`.
