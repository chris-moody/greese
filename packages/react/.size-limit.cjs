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
    ignore: ['react', 'react-dom', '@greese-ui/greese'],
    limit: '22 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: whole library, with greese.js',
    path: 'dist/index.js',
    import: '*',
    ignore: ['react', 'react-dom'],
    limit: '26 kB',
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
    limit: '2.25 kB',
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
    name: 'JS: greese prop runtime (lazy chunk, with greese.js)',
    path: 'dist/components/Motion/greeseRuntime.js',
    import: '*',
    limit: '7 kB',
  },
  {
    name: 'CSS: greese-ui.css',
    path: 'dist/greese-ui.css',
    rolldown: false,
    limit: '18 kB',
  },
  {
    name: 'CSS: base.css',
    path: 'dist/base.css',
    rolldown: false,
    limit: '1 kB',
  },
]
