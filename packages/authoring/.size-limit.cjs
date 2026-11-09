/**
 * Size budgets (brotli). See .claude/skills/greese-lightweight. Peers (React,
 * Redux, immer) and the greese packages are left out: an app has them anyway.
 */
module.exports = [
  {
    name: '@greese/authoring/core: everything',
    path: 'dist/core/index.js',
    import: '*',
    // greese.js's cubicBezier is the tween sampler's (ADR 0036); an app has
    // greese.js anyway, as with the other greese packages.
    ignore: ['@greese/js'],
    // 3 → 7 kB (2026-11-06): Glop's framework types and pure helpers joined
    // the layout tree: timing model, tick maths, musical and animation time
    // resolutions, the tree and layer helpers, viewport maths (6.41 kB).
    // 7 → 7.6 kB (2026-11-06): the search providers, with a fuzzy scorer of
    // our own in place of fuzzysort, and the drop readers (7.02 kB).
    // 7.6 → 8.2 kB (2026-11-06): the library helpers (asset kinds, folder
    // trees, symbol naming) and the stage driver's sampling and
    // reconciliation (7.67 kB).
    // 8.2 → 9 kB (2026-11-07): the tool registry (hotkeys, flattening) and
    // the paint and gradient maths: direction, type and kind switches, stop
    // blending (8.73 kB).
    // 9 → 12.7 kB (2026-11-07): the timeline's pure helpers from Glop (step
    // 8): frame evaluation and tween sampling, curve and bezier presets, the
    // level editor's curve, span playback and the ruler's label tiers
    // (12.44 kB, greese.js's cubicBezier left out as an app's anyway).
    // 12.7 → 12.8 kB (2026-11-08): Pixels' thirty node colours
    // (`distinguishingColor`), shared with Shaper (12.73 kB).
    // 12.8 → 12.9 kB (2026-11-08): `splitLines`, the highlighter's tokens cut
    // into the code box's numbered lines (12.87 kB).
    // 12.9 → 13.8 kB (2026-11-08): box editing for text tools shared by Pixels
    // and Shaper: drawing a box from a drag, resizing with the opposite edge
    // kept, moving by the outline, fitting a group, and the caret at a click
    // (13.76 kB).
    // 13.8 → 13.9 kB (2026-11-08): `wheelGesture`, Pixels' wheel (zoom at
    // the pointer, pan sideways or with Shift) for every stage, and
    // `paintCss`, a paint as a swatch's background (13.88 kB).
    // 13.9 → 14.3 kB (2026-11-09): `dropSize`, a docked pane as deep as the
    // drop was from the edge, and `gradientToSvg`, the gradient editor's
    // value as SVG for Shaper's New gradient (14.25 kB).
    // 14.3 → 14.6 kB (2026-11-09): `gradientFromSvg`, an SVG gradient read
    // back for the gradient editor, so Shaper edits the library's (14.57 kB).
    // 14.6 → 14.75 kB (2026-11-09): the edit-in-place transforms Pixels,
    // Rigatron and Shaper share: `composeStageTransform`, its inverse, and
    // `toEditSceneLocal`/`fromEditSceneLocal` (14.74 kB).
    limit: '14.75 kB',
  },
  {
    name: '@greese/authoring/state: everything',
    path: 'dist/state/index.js',
    import: '*',
    ignore: ['@reduxjs/toolkit', 'immer'],
    // 2 → 8.7 kB (2026-11-06): every framework slice (layers, library,
    // timeline, navigation, guides, playback and its bounds, time modes and
    // signatures, rate curves, recording), selectors and undo (7.98 kB).
    limit: '8.7 kB',
  },
  {
    name: '@greese/authoring: PanelDock and an environment',
    path: 'dist/index.js',
    import: '{ PanelDock, createAuthoringEnvironment }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // 6.4 → 12 kB (2026-11-06): an environment's store now has every
    // framework slice, so a dock costs the whole state layer (11.1 kB).
    // 12 → 12.1 kB (2026-11-08): docking by tab row and tearing a tab off its own group, with the panels slice's `moveTab` (12.07 kB).
    // 12.1 → 12.5 kB (2026-11-09): the panel breakpoints, registered where
    // the dock renders, and each panel's status bar: its size and breakpoint
    // while a divider or a floating panel's grip resizes it (12.47 kB).
    // 12.5 → 12.7 kB (2026-11-09): a drop on a group's edge measures the
    // group, sizing the new pane by the drop (12.65 kB).
    limit: '12.7 kB',
  },
  {
    name: '@greese/authoring: HierarchicalList',
    path: 'dist/index.js',
    import: '{ HierarchicalList }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The tree, its rows and folders, its keyboard and drag handling, and the
    // tree helpers it reorders with (4.32 kB).
    limit: '4.7 kB',
  },
  {
    name: '@greese/authoring: LayerTree and an environment',
    path: 'dist/index.js',
    import: '{ LayerTree, createAuthoringEnvironment }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The tree, its layer rows, and the store's whole state layer (11.89 kB).
    // 12.8 → 15.6 kB (2026-11-07): the tree opens its own LayerContextMenu,
    // which pastes keyframes into a layer through the timeline's editing
    // hook (its clipboard and edit helpers), the step-8 work the menu waited
    // for (15.39 kB). Loading it lazily measured worse: size-limit counts the
    // chunk, plus its overhead.
    // 15.6 → 15.7 kB (2026-11-08): the panels slice's `moveTab` and the guides' hidden state (15.66 kB).
    limit: '15.7 kB',
  },
  {
    name: '@greese/authoring: StageHost and StageContext',
    path: 'dist/index.js',
    import: '{ StageHost, StageContext, createAuthoringEnvironment }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The stage, its driver (sampling, reconciling, selection), navigation
    // and instance creation, over the store's state layer (9.57 kB).
    limit: '10.4 kB',
  },
  {
    name: '@greese/authoring: LibraryPanel and an environment',
    path: 'dist/index.js',
    import: '{ LibraryPanel, createAuthoringEnvironment }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The library list, its rows, the add-symbol dialog, naming and
    // navigation, over the store's state layer (12.7 kB).
    limit: '13.6 kB',
  },
  {
    name: '@greese/authoring: Toolbar, hotkeys and cursors',
    path: 'dist/index.js',
    import: '{ Toolbar, useToolHotkeys, createToolCursors }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The toolbar, its buttons and flyouts, the hotkey table and the cursor
    // builder: no store (2.1 kB).
    limit: '2.3 kB',
  },
  {
    name: '@greese/authoring: the nav bar parts',
    path: 'dist/index.js',
    import: '{ NavBar, NavHistory, EnvironmentSelect, AccentIcon }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The nav bar's slots, Back and its history menu, the environment
    // picker and the accent: no store (646 B).
    limit: '750 B',
  },
  {
    name: '@greese/authoring: the property fields',
    path: 'dist/index.js',
    import: '{ PropertyGrid, ComplexColorField, ToggleSelect }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The paint field, the gradient editor and its stop bar, the gradient
    // maths, the property grid and the toggle select: no store (2.89 kB).
    limit: '3.1 kB',
  },
  {
    name: '@greese/authoring: NodeGraph',
    path: 'dist/index.js',
    import: '{ NodeGraph }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The graph (ADR 0039): computed columns, measured edges, roving focus,
    // each port's menu of valid origins, and a wire dragged from an output
    // with beginPointerDrag: no store (2.54 kB).
    limit: '2.8 kB',
  },
  {
    name: '@greese/authoring: CodeEditor',
    path: 'dist/index.js',
    import: '{ CodeEditor }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The code box and its highlighter (CSS, SCSS, JavaScript, TypeScript
    // and XML), with no dependency: no store (2.57 kB).
    // 2.8 → 2.9 kB (2026-11-08): line numbers and the caret's line, each line
    // memoised (2.86 kB).
    // 2.9 → 3.1 kB (2026-11-08): the status line, the caret's line and
    // column or a selection's spans (3.04 kB).
    // 3.1 → 3.2 kB (2026-11-08): the status line's selection counts, tab size
    // and language (3.17 kB).
    limit: '3.2 kB',
  },
  {
    name: '@greese/authoring: TextBoxEditor',
    path: 'dist/index.js',
    import: '{ TextBoxEditor }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // Words edited where they're drawn: a plain-text editable box with the
    // caret at a click, no store (671 B).
    limit: '750 B',
  },
  {
    name: '@greese/authoring: ColorTool',
    path: 'dist/index.js',
    import: '{ ColorTool }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The new shapes' paint: two swatches, swap and reset, and a popover
    // with the paint field and its gradient editor (3.38 kB).
    limit: '3.5 kB',
  },
  {
    name: '@greese/authoring: Timeline and an environment',
    path: 'dist/index.js',
    import: '{ Timeline, createAuthoringEnvironment }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // Glop's whole timeline (step 8): rows of frames, keyframes, tweens and
    // spans, the ruler, playhead, bounds, markers, pulses, the rate,
    // time-signature and marker tools, the level editor, the span chart, its
    // header and toolbar, the keymap, clipboard and editing hooks, and the
    // greese.js clock, over the store (30.7 kB).
    limit: '31.5 kB',
  },
  {
    name: '@greese/authoring: AuthoringView, a whole editor',
    path: 'dist/index.js',
    import: '{ AuthoringView, createAuthoringEnvironment }',
    ignore: [
      'react',
      'react-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'immer',
      '@greese/react',
      '@greese/icons',
      '@greese/js',
    ],
    // The editor shell: the dock, the stage (host, context bar, rulers) and
    // the timeline, with undo and redo keys (36.94 kB).
    // 37.5 → 37.6 kB (2026-11-07): the frame width as a CSS variable, so the
    // playhead's box can be 24px (WCAG 2.5.8) while it draws the frame
    // (37.54 kB).
    // 37.6 → 37.9 kB (2026-11-08): the context bar's guides toggle and the
    // guides' hidden state, the rulers' automatic ticks, and tooltips on the
    // layer rows', panels' and gradient stops' icon buttons (37.84 kB).
    // 37.9 → 38.3 kB (2026-11-08): docking by tab row (a place among a group's tabs, measured at the drag's start) and tearing a tab off its own group, `moveTab`, and the code box's line wrapping (38.24 kB).
    // 38.3 → 38.5 kB (2026-11-08): wheel zoom and pan on the stage, on by
    // default, through the backend's `zoomBy` and `panBy` (38.49 kB).
    // 38.5 → 38.9 kB (2026-11-09): the dock's panel breakpoints and resize
    // status bar, as above, and zoom read as a percentage (38.85 kB).
    // 38.9 → 39.1 kB (2026-11-09): the dock's drop sizing, as above (39.09 kB).
    limit: '39.1 kB',
  },
  {
    name: '@greese/authoring/styles.css',
    path: 'dist/styles.css',
    rolldown: false,
    // 1.4 → 1.7 kB (2026-11-06): HierarchicalList's rows, drop lines and
    // actions bar (1.56 kB).
    // 1.7 → 2 kB (2026-11-06): the stage's host, context bar, rulers and
    // breadcrumbs (1.8 kB).
    // 2 → 2.25 kB (2026-11-06): the stage bar's controls and the guides'
    // lines, grab areas and position tip (2.05 kB).
    // 2.25 → 2.6 kB (2026-11-07): the toolbar and its flyout arrow, the Tool
    // Options panel, the nav bar, and the environment accent (2.42 kB).
    // 2.6 → 3.1 kB (2026-11-07): the property grid's subgrid rows, the
    // gradient stop bar (preview, stops and their touch-sized hit areas), the
    // paint field and the toggle select (2.85 kB).
    // 3.1 → 5.7 kB (2026-11-07): the timeline (frames, keyframes, tweens,
    // spans, markers, ruler, playhead, bounds, pulses, level editor, span
    // chart), its header and toolbar, the tween and marker panels and the
    // authoring view, about 2.4 kB (5.49 kB). One stylesheet still: most
    // editors have a timeline, and a second import is one to forget.
    // 5.7 → 5.8 kB (2026-11-07): 24px boxes for the playhead, the playback
    // bounds and the bezier points (WCAG 2.5.8), their drawings unchanged
    // (5.71 kB).
    // 5.8 → 6.3 kB (2026-11-07): NodeGraph's nodes, sources, ports, output
    // handles and their touch-sized hit areas, and its edges (6.18 kB).
    // 6.3 → 6.35 kB (2026-11-08): the bar showing where a dragged tab lands in a tab row, and the code box's wrapped lines (6.30 kB).
    // 6.35 → 6.55 kB (2026-11-08): the code box's line-number gutter, which
    // stays put scrolled sideways, the caret's line and the marked line as a
    // line's tint (6.52 kB).
    // 6.55 → 6.6 kB (2026-11-08): the code box's status line (6.59 kB).
    // 6.6 → 6.65 kB (2026-11-08): the status line's parts laid out in a row
    // that wraps (6.62 kB).
    // 6.65 → 6.7 kB (2026-11-08): TextBoxEditor, words edited on a stage
    // (6.67 kB).
    // 6.7 → 7 kB (2026-11-08): ColorTool, Pixels' fill and stroke swatches
    // with swap and reset, now shared with Shaper, and GridOverlay's lines
    // (6.98 kB).
    // 7 → 8.65 kB (2026-11-09): the panel breakpoints (ADR 0043): Stack's,
    // Grid's and AutoLayout's responsive classes again for panelsm, panelmd
    // and panellg under the `greese-panel` container query, a third each,
    // about 1.55 kB; and the resize status bar (8.58 kB). Measured per
    // component, none was worth leaving out: a panel lays out with all three.
    // 8.65 → 8.95 kB (2026-11-09): the default authoring theme (ADR 0044):
    // greese's layer order first, dense text controls and field names in the
    // code face; and the stage bar's strip and tooltip wrappers (8.93 kB).
    limit: '8.95 kB',
  },
]
