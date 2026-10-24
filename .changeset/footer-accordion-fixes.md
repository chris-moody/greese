---
'@greese/react': patch
---

- **`Footer`** leaves out its brand, sections and legal row when they render nothing: a `null`, or a condition that came out `false`, no longer leaves an empty grid above the legal row.
- **`AccordionItem`'s icons are a set:** an item that sets `icon` or `openIcon` uses its own pair and its own (or the default) transition, instead of mixing its icon with the group's open icon or the group's transition.
