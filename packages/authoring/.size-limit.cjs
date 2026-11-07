/**
 * Size budgets (brotli). See .claude/skills/greese-lightweight. Peers (React,
 * Redux, immer) and the greese packages are left out: an app has them anyway.
 */
module.exports = [
  {
    name: '@greese/authoring/core: everything',
    path: 'dist/core/index.js',
    import: '*',
    // 3 → 7 kB (2026-11-06): Glop's framework types and pure helpers joined
    // the layout tree: timing model, tick maths, musical and animation time
    // resolutions, the tree and layer helpers, viewport maths (6.41 kB).
    // 7 → 7.6 kB (2026-11-06): the search providers, with a fuzzy scorer of
    // our own in place of fuzzysort, and the drop readers (7.02 kB).
    // 7.6 → 8.2 kB (2026-11-06): the library helpers (asset kinds, folder
    // trees, symbol naming) and the stage driver's sampling and
    // reconciliation (7.67 kB).
    limit: '8.2 kB',
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
    ],
    // 6.4 → 12 kB (2026-11-06): an environment's store now has every
    // framework slice, so a dock costs the whole state layer (11.1 kB).
    limit: '12 kB',
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
    ],
    // The tree, its layer rows, and the store's whole state layer (11.89 kB).
    limit: '12.8 kB',
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
    ],
    // The nav bar's slots, Back and its history menu, the environment
    // picker and the accent: no store (646 B).
    limit: '750 B',
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
    limit: '2.6 kB',
  },
]
