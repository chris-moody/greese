/**
 * Size budgets (brotli). See .claude/skills/greese-lightweight.
 *
 * The `greese` prop's runtime is a lazy chunk: components reach it through a
 * dynamic import, which app bundlers split into its own file, loaded only
 * when a prop needs JavaScript. size-limit doesn't split, so the runtime is
 * kept external for component entries and measured on its own below.
 *
 * Every component entry includes the `greese` prop's static part (resolver
 * and client island, about 0.75 kB, shared once by all components): budgets
 * rose by that much in ADR 0009.
 */
const external = (config) => ({
  ...config,
  external: [config.external, /greeseRuntime\.js$/].filter(Boolean),
})

module.exports = [
  {
    name: 'JS: whole library (components)',
    path: 'dist/index.js',
    import: '*',
    ignore: ['react', 'react-dom', '@greese/js'],
    // 22 → 25.5 kB (2026-10-19): 19 components from ADR 0011 (ScrollCarousel,
    // Rating, OtpField…), about 210 B each. Tree-shaking keeps them out of
    // apps that don't import them; per-component budgets are below.
    // 25.5 → 26 kB (2026-10-19): createTheme's derived content colours
    // (contrast maths, about 0.4 kB), as on the ThemeProvider entry.
    limit: '26 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: whole library, with greese.js',
    path: 'dist/index.js',
    import: '*',
    ignore: ['react', 'react-dom'],
    // 26 → 30.5 kB (2026-10-19): the ADR 0011 components, as above;
    // 30.5 → 31 kB the same day for createTheme's derived content colours.
    limit: '31 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { VisuallyHidden }',
    path: 'dist/index.js',
    import: '{ VisuallyHidden }',
    ignore: ['react', 'react-dom'],
    limit: '300 B',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Stack }',
    path: 'dist/index.js',
    import: '{ Stack }',
    ignore: ['react', 'react-dom'],
    limit: '2.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Button }',
    path: 'dist/index.js',
    import: '{ Button }',
    ignore: ['react', 'react-dom'],
    limit: '2.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { TextField }',
    path: 'dist/index.js',
    import: '{ TextField }',
    ignore: ['react', 'react-dom'],
    limit: '2.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Tabs, TabList, Tab, TabPanel }',
    path: 'dist/index.js',
    import: '{ Tabs, TabList, Tab, TabPanel }',
    ignore: ['react', 'react-dom'],
    limit: '2.5 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Dialog }',
    path: 'dist/index.js',
    import: '{ Dialog }',
    ignore: ['react', 'react-dom'],
    limit: '3.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Menu, MenuItem }',
    path: 'dist/index.js',
    import: '{ Menu, MenuItem }',
    ignore: ['react', 'react-dom'],
    limit: '3.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { toast, Toaster }',
    path: 'dist/index.js',
    import: '{ toast, Toaster }',
    ignore: ['react', 'react-dom'],
    limit: '3.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Combobox }',
    path: 'dist/index.js',
    import: '{ Combobox }',
    ignore: ['react', 'react-dom'],
    limit: '4.75 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { NumberField }',
    path: 'dist/index.js',
    import: '{ NumberField }',
    ignore: ['react', 'react-dom'],
    limit: '3.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell }',
    path: 'dist/index.js',
    import: '{ Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell }',
    ignore: ['react', 'react-dom'],
    limit: '2.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { ThemeProvider }',
    path: 'dist/index.js',
    import: '{ ThemeProvider }',
    ignore: ['react', 'react-dom'],
    limit: '1 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { ThemeProvider, createTheme } (includes default tokens)',
    path: 'dist/index.js',
    import: '{ ThemeProvider, createTheme }',
    ignore: ['react', 'react-dom'],
    // 2.25 → 2.75 kB (2026-10-19): createTheme derives each brand colour's
    // WCAG-safe content colour and strong shade (contrast maths, about
    // 0.4 kB), so setting `primary` alone gives a readable theme (ADR 0002).
    limit: '2.75 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'ColorPicker',
    path: 'dist/index.js',
    import: '{ ColorPicker }',
    limit: '4.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'MaskedInput',
    path: 'dist/index.js',
    import: '{ MaskedInput }',
    limit: '2.75 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { ScrollCarousel, ScrollCarouselSlide }',
    path: 'dist/index.js',
    import: '{ ScrollCarousel, ScrollCarouselSlide }',
    ignore: ['react', 'react-dom'],
    // 3.25 → 3.5 kB (2026-10-19): reaching the target slide reliably
    // (suspend snapping, check arrival, skip its own index echoes), about
    // 90 B; see the ADR 0011 ScrollCarousel addendum.
    limit: '3.5 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Rating }',
    path: 'dist/index.js',
    import: '{ Rating }',
    ignore: ['react', 'react-dom'],
    // 2.5 → 2.75 kB (2026-10-19): half and quarter stars (`step`), with
    // pointer preview and drag-to-scrub, about 280 B (ADR 0011 addendum).
    limit: '2.75 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { OtpField }',
    path: 'dist/index.js',
    import: '{ OtpField }',
    ignore: ['react', 'react-dom'],
    limit: '2.5 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Diff }',
    path: 'dist/index.js',
    import: '{ Diff }',
    ignore: ['react', 'react-dom'],
    limit: '2.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Countdown }',
    path: 'dist/index.js',
    import: '{ Countdown }',
    ignore: ['react', 'react-dom'],
    limit: '2.25 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { SpeedDial, SpeedDialAction }',
    path: 'dist/index.js',
    import: '{ SpeedDial, SpeedDialAction }',
    ignore: ['react', 'react-dom'],
    limit: '3 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Swap }',
    path: 'dist/index.js',
    import: '{ Swap }',
    ignore: ['react', 'react-dom'],
    limit: '2 kB',
    modifyRolldownConfig: external,
  },
  {
    // The hook itself plus greese.js's timeline, which it creates.
    name: 'JS: tree-shaken { useGreese } (with greese.js)',
    path: 'dist/index.js',
    import: '{ useGreese }',
    ignore: ['react', 'react-dom'],
    limit: '6 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: greese prop runtime (lazy chunk, with greese.js)',
    path: 'dist/components/Motion/greeseRuntime.js',
    import: '*',
    // 7 → 7.25 kB (2026-10-19): reads before writes in greese.js (buffered
    // style writes, batch()) and batched attachment, about 85 B, to stop
    // forcing a style recalculation per animated element (ADR 0008 addendum).
    // 7.25 → 7.5 kB (2026-10-19): scroll reveals wait until an element is
    // wholly in view and clear of the bottom edge, with a second observer for
    // elements the page can't scroll that far (near its end).
    limit: '7.5 kB',
  },
  {
    name: 'CSS: greese-ui.css',
    path: 'dist/greese-ui.css',
    rolldown: false,
    // 18 → 20 kB (2026-10-19): the ADR 0011 components' styles, about 2.9 kB
    // after cutting TextRotate to 6 items and ScrollCarousel's responsive gap.
    // Per-component CSS (css/<Name>.css) only ships what's imported.
    limit: '20 kB',
  },
  {
    name: 'CSS: base.css',
    path: 'dist/base.css',
    rolldown: false,
    limit: '1 kB',
  },
]
