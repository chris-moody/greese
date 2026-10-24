---
'@greese/ui': minor
---

Theme layers (ADR 0025).

- **Tabs:** the current tab has a tinted background over its underline, and a tab panel enters each time its tab is chosen.
- **Effects:** mask properties count as at rest, so an effect can wipe or reveal with a mask; its last step is kept.
- **Shapes:** `SHAPE_TARGETS` covers Input, SegmentedControl, Segment, Tab, AccordionItem, Status, Avatar, SpeedDial, Popover, Menu, Tooltip and Toast, with targets that only clip, per-component focus, and smaller features for small buttons.
- **Theme files:** shape themes set no colors and have square corners, and four motion themes are new: `@greese/ui/themes/{snappy,gentle,wipe,pocket}.css`.
