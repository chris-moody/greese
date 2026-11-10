# @greese/authoring

## 0.1.0

### Minor Changes

- 8fca91d: Docking: a tab dropped on a tab row lands among its tabs (in front of a tab, or after it from its trailing half), even at the workspace's wall, with a bar showing where (`panelsActions.moveTab`, `moveTab` in core); one dropped in the middle of its own group's body floats. A floating group takes no drops, so the workspace under it does. `CodeEditor` takes `wrap`, to wrap long lines. In a `PropertyGrid`, a switch or checkbox sits at its row's far end.
- 2bf3855: A panel docked on a group's edge is as deep (or wide) as the drop was from that edge (`dropSize`, and `movePanel`'s `size`). `gradientToSvg` writes the gradient editor's value as an SVG gradient. A stage bar slot of several controls stays in one row.
- 2b9d677: Shared edit-in-place transforms in `@greese/authoring/core`: `composeStageTransform` (from Rigatron), `invertStageTransform`, and `toEditSceneLocal`/`fromEditSceneLocal` (from Pixels' backend), for editors that edit a scene in place within the root stage.
- f0e4dc0: `gradientFromSvg` reads an SVG `<linearGradient>` or `<radialGradient>` back for the gradient editor, the inverse of `gradientToSvg`.
- 8d8177d: Add `LayerPropertiesPanel`: the selected layer's type, and its name, visibility and lock to edit, for media without a properties panel of their own.
- 5a4dce1: Add `@greese/authoring`, editor UI for greese (ADR 0035): `PanelDock`, a dockable workspace of tab groups around a stage and timeline, where panels drag to any edge, join groups as tabs, dock along the workspace's edges or float; its layout as data, `LayoutSpec` and `buildFromSpec`, with `useLayoutCache` to remember each workspace; and a Redux store per editor from `createAuthoringEnvironment`, so editors can share a page or nest, with the framework's slices (layers, library, timeline selection and clipboard, navigation, guides, playback and its bounds, time modes, time signatures, rate curves, recording), their selectors, and undo and redo that restore the document while keeping the view (`undoable` marks an edit as a step, `viewSlices` names the slices undo keeps; `useHistory`, and `useUndoRedoKeymap`, which can listen on an editor's root and leaves a text field its own undo). `@greese/authoring/core` adds the layer, frame, tween, library and timing types, the timing model, tick maths, animation and musical time resolutions, and tree, layer and viewport helpers. `HierarchicalList` (with `HierarchicalListItem` and `HierarchicalListFolder`) is a WAI-ARIA tree to select, rename, reorder and nest items by pointer, drag or keyboard, with an actions bar, `LayerTree` (with `LayerTreeItem`) binds it to the editor's layers, with visibility, lock and mute toggles and the config's structural layer types, the stage (`StageHost` mounting a media's backend from `MediaConfig`, `StageContext`, `StageRulers`, `RulerToggle`, `AuthoringBreadcrumbs`) with its driver and subview navigation, `LibraryPanel` (with `LibraryAssetItem` and `SymbolCreateDialog`) keeps the editor's reusable symbols, the stage's controls (`StageBar`, `ZoomControl`, `GridControl`, `StageColorControl`, `LayoutBar`) with `EditableSelect`, a typed value with presets, the stage's guides (`GuidesOverlay`, each guide a keyboard slider, with `GuidePropertiesDialog`), the editor's tools as data (`ToolDefinition`, with `buildToolHotkeys` and `toolForKey` in core) drawn by `Toolbar` (with `ToolbarItem`), a WAI-ARIA toolbar whose groups open a flyout, picked by `useToolHotkeys` and shown on the stage by `createToolCursors`, with `ToolOptionsPanel` for the active tool's settings, the nav bar's parts (`NavBar`, `NavHistory`, `EnvironmentSelect`, `AccentIcon`, and an icon and hue per step of `AuthoringBreadcrumbs`), property fields (`PropertyGrid`, which lines up `EditableField` rows, `ComplexColorField` for a solid, gradient or no fill (its picker can sit in place inside a popover, with its own kind names), `GradientEditor` and `GradientStopBar`, whose stops are keyboard sliders, and `ToggleSelect`, under or beside its toggle) with the paint and gradient maths in core, `CodeEditor` (with `Highlighted`), a code box with highlighting and no dependency that lights a span (`highlight`) and keeps its selection in step with a canvas (`selection`, `onSelectionChange`), on `highlightCode` in core, which reads CSS, SCSS, JavaScript, TypeScript and XML, with its palette as `@greese/authoring/scss/code`, the timeline (`Timeline`, `TimelineHeader`, `TimelinePanel`: layers' frames, keyframes, tweens, spans and markers, the ruler, playhead and playback bounds, the rate, time-signature and marker tools, `TimelineLevelEditor` and `SpanActivityChart`), played by greese.js (`usePlaybackClock`, or a host's own clock through `MediaConfig.playbackClock`) with tweens eased by greese.js's `cubicBezier`, with `TweenPanel`, `MarkerPanel`, a layer row's `LayerContextMenu` (opened where `contextMenuPoint`, in core, says: it cancels the browser's own menu and gives the pointer's position, or the trigger's corner from the keyboard), and `AuthoringView`, a whole editor around them, `NodeGraph`, a controlled graph of nodes, input ports and edges laid out in columns by depth from its sources (`nodeGraphColumns`), connected from each port's menu or by dragging from an output, with arrow-key focus, selection and Delete to remove (ADR 0039), and search providers (fuzzy, prefix, exact) rank what a filter box finds, indexed once per collection by `useSearchProvider`. Tabs follow the WAI-ARIA tab pattern and splits are keyboard-resizable window splitters. `@greese/authoring/core` and `@greese/authoring/state` run without React; `@reduxjs/toolkit`, `react-redux` and `immer` are peer dependencies.
- 2c935f2: Panel breakpoints: `panelsm`, `panelmd` and `panellg` (240, 320 and 480px), measured against each panel's body, so Stack, Grid and AutoLayout inside a panel answer to its width. A resized panel shows its size and breakpoint in a status bar along its foot, in and out on the theme's motion.
- 925013a: The stage bar's controls are all `xs`: RulerToggle was `sm`. StageContext adds a `GuidesToggle` beside the rulers' (the guides' `hidden` state, `guidesActions.setGuidesHidden`, `selectGuidesHidden`; hidden guides are kept, and a new one shows them again). StageRulers takes `ticks`, a spacing or `'auto'` (`rulerTicks(scale)`), for drawings measured in a few units. `distinguishingColor(index)` and `DISTINGUISHING_COLORS`: Pixels' thirty node colours. GridControl's toggle, the layer rows' toggles, gradient stops, panel collapse and the library's open button get tooltips.
- 84d20de: `AuthoringTheme`: the default authoring theme every editor app wraps itself in, with dense text controls and field names in the code face. The stylesheet opens with greese's layer order, so it holds whatever loads first. The stage's context bar scrolls when its controls overflow, every stage control has a tooltip, Stage color drops its label, and the layout's Save is an icon button.
- 18fee11: Add `tweenEaseResolver(keywords?)`: a `TweenEaseResolver` drawing each tween with greese.js's `tweenEase`, so a medium needs no easing table of its own.
- f882119: Zoom the stage with the wheel at the pointer, and pan sideways or with Shift, as Pixels does: `StageHost` and `AuthoringView` do it by default (`wheelZoom={false}` turns it off) through a backend's new `zoomBy` and `panBy`, and `useWheelZoom` and `wheelGesture` give any stage the same rules. Add `ColorTool`, Pixels' fill and stroke swatches with swap and reset, and `GridOverlay`, a reference grid laid out as the rulers and guides are. `ComplexColorField` takes `allowGradient` and `allowCurrentColor`, and `paintCss` paints a swatch.

### Patch Changes

- e3d07bb: AuthoringBreadcrumbs styles its `leading` step as one of the trail's own crumbs, so a host passes a plain button.
- 11c99a4: ZoomControl reads every zoom as a percentage (137%), not only the presets.
- Updated dependencies [d01af8c]
- Updated dependencies [0a4281e]
- Updated dependencies [ab9793d]
- Updated dependencies [2023ebd]
- Updated dependencies [43294bc]
- Updated dependencies [5ba0dd0]
- Updated dependencies [3598681]
- Updated dependencies [43ba1fb]
- Updated dependencies [8e6c274]
- Updated dependencies [f857289]
- Updated dependencies [6a70a7e]
- Updated dependencies [0e921ad]
- Updated dependencies [72fd015]
- Updated dependencies [a0e71e0]
- Updated dependencies [8d75e3a]
- Updated dependencies [6f5cba2]
- Updated dependencies [5f4b8ef]
- Updated dependencies [c63a837]
- Updated dependencies [3cb005c]
- Updated dependencies [4242aa1]
- Updated dependencies [efb19d8]
- Updated dependencies [5f05823]
- Updated dependencies [fc5c2e2]
- Updated dependencies [538a019]
- Updated dependencies [72f1c5a]
- Updated dependencies [692626a]
- Updated dependencies [ecbc037]
- Updated dependencies [d914054]
- Updated dependencies [8a8dca5]
- Updated dependencies [f472d19]
- Updated dependencies [6b2da3f]
- Updated dependencies [5ca7c65]
- Updated dependencies [6516f27]
- Updated dependencies [c0c4381]
- Updated dependencies [65f5fee]
- Updated dependencies [dc360d4]
- Updated dependencies [5c2774b]
- Updated dependencies [998e63f]
- Updated dependencies [4f43cc9]
- Updated dependencies [22a6395]
- Updated dependencies [c069414]
  - @greese/react@1.2.0
  - @greese/ui@1.2.0
  - @greese/js@0.2.0
  - @greese/icons@0.2.0
