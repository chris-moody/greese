# @greese/icons

## 0.1.0

### Minor Changes

- 9ddf302: - **`Header`:** the page's header, with `brand`, navigation (children) and `actions`, sticky by default and `floating` (inset, rounded and raised) on request. A sticky header sets the page's scroll padding to its height (`--greese-header-height`, 3.5rem), so in-page links land with their target just below it, with no JavaScript and nothing for each section to declare.
  - **`Footer` and `FooterSection`:** a `brand` beside columns of links, each a `<nav>` named by its heading, over a `legal` row.
  - **Accordion and Collapsible icons:** `icon` (or `null` for none), `openIcon` for an icon per state, and `iconTransition` (`rotate`, `fade`, `none`); an Accordion sets them for every item, and an item's own win. The default chevron still turns, by `--greese-collapsible-icon-turn`.
  - **Hovers that move the element stay put under a still pointer:** a `greese` hover lasts while the pointer is over where the element rests, and an interactive Card's hit area reaches the 2px it rises, so neither bounces.
  - **`ContrastIcon`** in `@greese/icons`.
- dda476a: Every icon lives in `@greese/icons` (ADR 0020). `@greese/react` now depends on it and draws its own glyphs (close, menu, chevron, plus, minus, check, sort, star) with it, in place of its inline SVGs. `createIcon` takes `{ viewBox, strokeWidth, filled }`, and the package gains `ChevronLeft`, `Minus`, `Sort`, `CheckDash`, `StarFilled`, `Accessibility`, `Copy`, `Dots`, `Feather`, `Github`, `Layers`, `Motion`, `Phone`, `Replay` and `Server`. `Checkbox` and `Table` style their icons by path position; the `greese-Checkbox-check`, `greese-Checkbox-dash` and `greese-SortGlyph-*` classes are gone.
- a8b1cb0: New package: `@greese/icons`, a small set of line icons as React components (Search, Plus, Trash, Star, Heart, Home, Bell, User, Sun, Moon, Document, Folder, Check, Close, Chevron, Menu, Info, ArrowRight). Sized to text (`1em`), inline on the text's baseline, and drawn in `currentColor`; decorative unless given a `title`; tree-shakable (about 0.3 kB for one); `createIcon(name, d)` makes matching icons. Optional: `@greese/react` doesn't depend on it.
- dda476a: Add `ArchiveIcon`, `CartIcon`, `InboxIcon`, `SendIcon`, `TrendUpIcon` and `TrendDownIcon`, plus `SaveIcon`, `ImportIcon`, `SlidersIcon` and `InspectIcon` (a magnifier over lines of text).
- dda476a: Add `ShapesIcon`, `ShapesFilledIcon`, `SpeedIcon` and `SpeedFilledIcon`, for shape and motion themes.
