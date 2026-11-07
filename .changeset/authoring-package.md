---
'@greese/authoring': minor
---

Add `@greese/authoring`, editor UI for greese (ADR 0035): `PanelDock`, a dockable workspace of tab groups around a stage and timeline, where panels drag to any edge, join groups as tabs, dock along the workspace's edges or float; its layout as data, `LayoutSpec` and `buildFromSpec`, with `useLayoutCache` to remember each workspace; and a Redux store per editor from `createAuthoringEnvironment`, so editors can share a page or nest. Tabs follow the WAI-ARIA tab pattern and splits are keyboard-resizable window splitters. `@greese/authoring/core` and `@greese/authoring/state` run without React; `@reduxjs/toolkit` and `react-redux` are peer dependencies.
