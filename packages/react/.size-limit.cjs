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
 *
 * Sizes noted below before 2026-10-24's last entries were measured while the
 * lazy chunks' external paths were in the bundle (see `external`): they
 * include about 30 B of path that depended on the machine.
 */
const { dirname, resolve } = require('node:path')

const LAZY = /(greeseRuntime|Motion\/scope)\.js$/
// External under a fixed name: an external import is written as a path from
// the temporary bundle to the file, so its length (and every budget) would
// depend on where the machine keeps temporary files and the checkout.
const external = (config) => ({
  ...config,
  plugins: [
    ...[config.plugins ?? []].flat(),
    {
      name: 'greese-lazy-chunks',
      resolveId: (source, importer) => {
        const file = importer ? resolve(dirname(importer), source) : source
        const match = LAZY.exec(file)
        return match ? { id: `greese:${match[1]}`, external: true } : null
      },
    },
  ],
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
    // 25.5 → 26 kB (2026-10-19): createTheme's derived content colors
    // (contrast maths, about 0.4 kB), as on the ThemeProvider entry.
    // 26 → 26.25 kB (2026-10-20): createTheme's `extend` for new tokens
    // (ADR 0015) and breakpoints with added keys (ADR 0006), about 0.25 kB.
    // 26.25 → 27 kB (2026-10-20): the type system's defaults, which createTheme
    // writes into every theme (ADR 0016), and Text/Heading `variant`, about
    // 0.5 kB.
    // 27 → 27.5 kB (2026-10-21): the default colors are read from the palette
    // instead of written out as hex, so the nine hues they use travel with
    // createTheme (about 0.4 kB), the price of one source of truth.
    // 27.5 → 28 kB (2026-10-23): ScrollSpy, about 0.49 kB (27.33 kB without it).
    // 28 kB → 28.25 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025) and
    // useStoredState with createStoredValue, about 0.15 kB together (28.15 kB).
    // 28.25 kB → 28.35 kB (2026-10-23): wipes and pockets in every direction, arriving
    // and leaving (27 more effects, generated from one table of directions; ADR 0025
    // addendum): six more entrance names (28.32 kB).
    // 28.35 kB → 28.4 kB (2026-10-23): irises in eight directions (ADR 0025): eight
    // more entrance names CSS can play (28352 B).
    // 28.4 kB → 28.45 kB (2026-10-24): the three-dimensional effects (ADR 0025
    // addendum): ten more names of what CSS plays (28.41 kB after a fresh build).
    // 28.45 kB → 28.8 kB (2026-10-24): Header, Footer and FooterSection, and Accordion and Collapsible icons per state (28.76 kB).
    // 28.8 kB → 28.85 kB (2026-10-24): Footer leaves out a brand, sections or legal row that render nothing (a condition that came out false) and an AccordionItem's own icons replace the group's as a set (28.84 kB).
    // 28.85 kB → 28.9 kB (2026-10-24): Button and Collapsible are Server
    // Components: they block a loading or disabled press, and listen for a
    // toggle, without handlers of their own (28.88 kB).
    limit: '28.9 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: whole library, with greese.js',
    path: 'dist/index.js',
    import: '*',
    ignore: ['react', 'react-dom'],
    // 26 → 30.5 kB (2026-10-19): the ADR 0011 components, as above;
    // 30.5 → 31 kB the same day for createTheme's derived content colors.
    // 31 → 31.75 kB (2026-10-20): the type system's defaults, as above.
    // 31.75 → 32 kB the same day for the `scope` option's static part (ADR 0017).
    // 32 → 32.5 kB the same day, for the palette hues, as above.
    // 32.5 → 33 kB (2026-10-23): ScrollSpy, about 0.42 kB (32.27 kB without it).
    // 33 kB → 33.25 kB (2026-10-23): the same wipes, pockets and stored state (33.16
    // kB).
    // 33.25 kB → 33.3 kB (2026-10-23): irises in eight directions, as above (33.26 kB).
    // 33.3 kB → 33.35 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (33309 B).
    // 33.35 kB → 33.8 kB (2026-10-24): the same, with greese.js (33.79 kB).
    // 33.8 kB → 34.1 kB (2026-10-24): greese.js's kill() puts back the inline styles it found instead of pinning computed values, and callbacks fire once per repeat (ADR 0008 amendment); a hover keeps its resting box and ends when the pointer leaves the window (34.05 kB).
    // 34.1 kB → 34.15 kB (2026-10-24): the same Footer and AccordionItem fixes (34.12 kB).
    // 34.15 kB → 34.25 kB (2026-10-24): greese.js reads the colors browsers compute for color-mix() and the newer spaces (oklab(), oklch(), color(srgb)), which it switched halfway instead of blending (34.24 kB).
    limit: '34.25 kB',
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
    // 2.25 → 2.3 kB (2026-10-20): the `scope` option's static part (ADR 0017)
    // 2.3 kB → 2.4 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 2.4 kB → 2.45 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 2.45 kB → 2.5 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (2469 B).
    limit: '2.5 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Button }',
    path: 'dist/index.js',
    import: '{ Button }',
    ignore: ['react', 'react-dom'],
    // 2.25 kB → 2.3 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 2.3 kB → 2.35 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 2.35 kB → 2.4 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (2376 B).
    // 2.4 kB → 2.45 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (2407 B).
    limit: '2.45 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { TextField }',
    path: 'dist/index.js',
    import: '{ TextField }',
    ignore: ['react', 'react-dom'],
    // 2.25 → 2.3 kB (2026-10-20): the `scope` option's static part (ADR 0017)
    // 2.3 kB → 2.35 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 2.35 kB → 2.4 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 2.4 kB → 2.45 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (2416 B).
    // 2.45 kB → 2.5 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (2462 B).
    limit: '2.5 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Tabs, TabList, Tab, TabPanel }',
    path: 'dist/index.js',
    import: '{ Tabs, TabList, Tab, TabPanel }',
    ignore: ['react', 'react-dom'],
    // 2.5 kB → 2.6 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 2.6 kB → 2.65 kB (2026-10-23): irises in eight directions (ADR 0025): eight more
    // of those names (2604 B).
    limit: '2.65 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Dialog }',
    path: 'dist/index.js',
    import: '{ Dialog }',
    ignore: ['react', 'react-dom'],
    // 3.25 kB → 3.3 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.3 kB → 3.45 kB (2026-10-21): GreeseUI's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.45 kB → 3.55 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.55 kB → 3.6 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3585 B).
    limit: '3.6 kB',
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
    // 3.25 → 3.3 kB (2026-10-21): the resolver lists the CSS entrances from @greese/ui (generated from src/effects.ts) instead of keeping a regex of its own, about 15 B.
    // 3.3 kB → 3.35 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.35 kB → 3.5 kB (2026-10-21): GreeseUI's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.5 kB → 3.6 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.6 kB → 3.65 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3632 B).
    limit: '3.65 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Combobox }',
    path: 'dist/index.js',
    import: '{ Combobox }',
    ignore: ['react', 'react-dom'],
    // 4.75 kB → 4.8 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (4785 B).
    // 4.8 kB → 4.85 kB (2026-10-24): option ids looked up in a map, once per options list, where indexOf made long lists render in quadratic time (4.81 kB).
    limit: '4.85 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { NumberField }',
    path: 'dist/index.js',
    import: '{ NumberField }',
    ignore: ['react', 'react-dom'],
    // 3.25 → 3.3 kB (2026-10-21): the resolver lists the CSS entrances from @greese/ui (generated from src/effects.ts) instead of keeping a regex of its own, about 15 B.
    // 3.3 kB → 3.35 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.35 kB → 3.5 kB (2026-10-21): GreeseUI's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.5 kB → 3.6 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.6 kB → 3.65 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3641 B).
    limit: '3.65 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell }',
    path: 'dist/index.js',
    import: '{ Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell }',
    ignore: ['react', 'react-dom'],
    // 2.25 → 2.3 kB (2026-10-20): the `scope` option's static part (ADR 0017)
    // 2.3 kB → 2.35 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 2.35 kB → 2.55 kB (2026-10-21): GreeseUI's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 2.55 kB → 2.6 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 2.6 kB → 2.65 kB (2026-10-23): irises in eight directions (ADR 0025): eight more
    // of those names (2604 B).
    limit: '2.65 kB',
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
    // 2.25 → 2.75 kB (2026-10-19): createTheme derives each brand color's
    // WCAG-safe content color and strong shade (contrast maths, about
    // 0.4 kB), so setting `primary` alone gives a readable theme (ADR 0002).
    // 2.75 → 3.4 kB (2026-10-20): createTheme carries the type system's
    // defaults to write complete themes (ADR 0016).
    // 3.4 → 3.75 kB (2026-10-21): the default colors are read from the
    // palette, so the nine hues they use come with createTheme (ADR 0002).
    // 3.75 kB → 3.8 kB (2026-10-23): the `radius.round` token every theme now declares
    // (3.77 kB).
    // 3.8 kB → 3.85 kB (2026-10-24): the `track` color and the radius roles
    // (`corner`) among the default tokens createTheme carries (ADR 0025; 3.81 kB).
    limit: '3.85 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'ColorPicker',
    path: 'dist/index.js',
    import: '{ ColorPicker }',
    // 4.25 kB → 4.3 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (4265 B).
    limit: '4.3 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'MaskedInput',
    path: 'dist/index.js',
    import: '{ MaskedInput }',
    // 2.75 kB → 2.8 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 2.8 kB → 2.9 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 2.9 kB → 2.95 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (2919 B).
    limit: '2.95 kB',
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
    // 3.5 kB → 3.55 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.55 kB → 3.7 kB (2026-10-21): GreeseUI's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.7 kB → 3.8 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.8 kB → 3.85 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3828 B).
    limit: '3.85 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Rating }',
    path: 'dist/index.js',
    import: '{ Rating }',
    ignore: ['react', 'react-dom'],
    // 2.5 → 2.75 kB (2026-10-19): half and quarter stars (`step`), with
    // pointer preview and drag-to-scrub, about 280 B (ADR 0011 addendum).
    // 2.75 kB → 3 kB (2026-10-21): GreeseUI's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3 kB → 3.05 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.05 kB → 3.1 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (3073 B).
    // 3.1 kB → 3.15 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3117 B).
    limit: '3.15 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { OtpField }',
    path: 'dist/index.js',
    import: '{ OtpField }',
    ignore: ['react', 'react-dom'],
    // 2.5 kB → 2.6 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 2.6 kB → 2.65 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (2606 B).
    limit: '2.65 kB',
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
    // 2.25 kB → 2.3 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (2257 B).
    limit: '2.3 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { SpeedDial, SpeedDialAction }',
    path: 'dist/index.js',
    import: '{ SpeedDial, SpeedDialAction }',
    ignore: ['react', 'react-dom'],
    // 3 kB → 3.05 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.05 kB → 3.25 kB (2026-10-21): GreeseUI's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.25 kB → 3.3 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.3 kB → 3.35 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (3313 B).
    // 3.35 kB → 3.4 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3354 B).
    limit: '3.4 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { ScrollSpy }',
    path: 'dist/index.js',
    import: '{ ScrollSpy }',
    ignore: ['react', 'react-dom'],
    // Mostly what every component shares: Slot and the greese prop's static part.
    // 2.25 kB → 2.3 kB (2026-10-23): wipes and pockets in every direction, arriving and
    // leaving (27 more effects, generated from one table of directions; ADR 0025
    // addendum): the entrance names the static part carries (2.25 kB).
    // 2.3 kB → 2.35 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (2310 B).
    limit: '2.35 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { useStoredState }',
    path: 'dist/index.js',
    import: '{ useStoredState }',
    ignore: ['react', 'react-dom'],
    limit: '0.6 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Swap }',
    path: 'dist/index.js',
    import: '{ Swap }',
    ignore: ['react', 'react-dom'],
    // 2 kB → 2.1 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 2.1 kB → 2.15 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (2135 B).
    limit: '2.15 kB',
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
    name: 'JS: scope option (lazy chunk)',
    path: 'dist/components/Motion/scope.js',
    import: '*',
    // Loaded only when a `scope` is used (ADR 0017); no greese.js.
    limit: '1 kB',
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
    // 7.5 → 7.6 kB (2026-10-21): the built-in effects are @greese/ui's
    // (src/effects.ts), the one source the CSS is also written from; the
    // runtime keeps their kinds beside the keyframes, about 65 B.
    // 7.6 → 8.6 kB (2026-10-21): effects take arguments (`fadeIn(0.25, 0.8)`),
    // so the runtime carries the sequence parser's argument syntax and builds
    // combo effects from their base effects, about 0.9 kB. Lazy: only a prop
    // that needs JavaScript loads it.
    // 8.6 → 9.1 kB (2026-10-21): an overlay can leave with an effect defined at
    // run time, so the runtime sets its `translate` and `scale` from the same
    // `cssPlan()` the build uses for the built-ins, about 0.5 kB.
    // 9.1 → 9.15 kB (2026-10-23): `cssPlan()` lets an effect reveal with a mask
    // (wipes and pockets, which compose with a shape's clip-path; ADR 0025),
    // about 30 B.
    // 9.15 kB → 9.5 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025):
    // their definitions, about 0.3 kB.
    // 9.5 kB → 9.8 kB (2026-10-23): wipes and pockets in every direction, arriving and
    // leaving (27 more effects, generated from one table of directions; ADR 0025
    // addendum): their definitions (9.78 kB).
    // 9.8 kB → 9.85 kB (2026-10-23): irises in eight directions (ADR 0025), and a
    // built-in is never replaced by a defined effect: the lookup tries the built-ins
    // first (9.81 kB).
    // 9.85 kB → 9.9 kB (2026-10-24): a scroll reveal reads the element's box as the
    // page scrolls, since a shape's clip-path keeps IntersectionObserver's ratio
    // under 1 (ADR 0025; 9.86 kB).
    // 9.9 kB → 10.25 kB (2026-10-24): the 16 three-dimensional effects (ADR 0025 addendum, 2026-10-24): their definitions (10237 B).
    // 10.25 kB → 10.35 kB (2026-10-24): a hover lasts while the pointer is over where the element rests, so a lift doesn't bounce under a still pointer (10.33 kB).
    // 10.35 kB → 10.55 kB (2026-10-24): greese.js's kill() restores inline styles and callbacks fire once per repeat (ADR 0008 amendment; 10.53 kB).
    // 10.55 kB → 10.75 kB (2026-10-24): the 10.53 kB above was measured against a stale greese.js build; rebuilt, the kill() fix measures 10.65 kB. A hover also keeps its resting box while it settles back, and ends when the pointer leaves the window or the page loses focus (10.74 kB).
    // 10.75 kB → 10.85 kB (2026-10-24): greese.js reads oklab(), oklch() and color(srgb) colors, as above (10.84 kB).
    limit: '10.85 kB',
  },
]
