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
    // 28.9 kB → 28.95 kB (2026-10-24): Accordion is a Server Component too,
    // handing its items their name and icons itself, not through context (28.9 kB).
    // 28.95 kB → 29.4 kB (2026-10-27): shape themes reach more components:
    // FileInput is a Button labelling a hidden native input, with dropped files
    // and the chosen names (it was a bare input); Textarea and Menu render a
    // frame and a viewport; ScrollSpy follows sections in a scrolling panel;
    // Progress takes `loading` (29.38 kB).
    // 29.4 kB → 30.6 kB (2026-10-29): page transitions (ADR 0029):
    // PageTransition, PageShare and usePageNavigate, with their class maps,
    // rules CSS and navigation types (30.55 kB). Tree-shaken, they are 1.53 kB,
    // budgeted on their own below; apps that don't import them don't pay.
    // 30.6 kB → 31.8 kB (2026-10-29): page transitions' live exits (ADR 0029,
    // phase 4): the exit pass, the mode decision and back and forward held
    // through the Navigation API (31.74 kB).
    // 31.8 kB → 32.15 kB (2026-10-30): `<PageShare link>`, shared elements paired
    // by the link followed (ADR 0029 addendum), about 0.3 kB, and the
    // `greese` prop's island waits for an IntersectionObserver to tell which scroll reveals start out of view, where it measured each one in the commit: that forced a layout of the whole page in every commit with an island, a fifth of the homepage's script after it boots (ADR 0009 addendum) (32.09 kB).
    // 32.15 kB → 32.4 kB (2026-10-30): a live exit's styles come off when the
    // commit is seen (a MutationObserver), not two frames after the exit,
    // which put the members back on the old page while a heavy next page
    // rendered; a page that left live still plays the new page in; a page's
    // snapshots show only the screenful in view (ADR 0029 addendum) (32.33 kB).
    // 32.4 kB → 32.6 kB (2026-10-30): a live exit's styles come off at React's commit of the navigation (the hook's own update, in its transition), not at the first change the old page makes, which put members back on a homepage still mounting its sections; back and forward wait while the URL has moved (ADR 0029 addendum) (32.56 kB).
    // 32.6 kB → 33.4 kB (2026-10-31): route rules and a navigation's own options (ADR 0029 addendum): the pattern matcher, the resolver, the root variables and the hook's wiring, 0.7-0.75 kB over the 0.3-0.45 kB the plan estimated (33.34 kB).
    // 33.4 kB → 34.3 kB (2026-11-01): Carousel and CarouselSlide (ADR 0032), and
    // ScrollCarousel's vertical orientation (34.25 kB).
    // 34.3 → 34.55 kB (2026-11-02): Carousel's own controls and dots (CarouselPrevious, CarouselNext, CarouselIndicator with asChild), `announce` and the label functions, less its hash deep links, now the app's (34.51 kB).
    // 34.55 kB → 37.1 kB (2026-11-04): EditableField, which renders any of eleven controls from a value, plus ColorPicker's channel fields and eyedropper.
    // 37.1 kB → 37.6 kB (2026-11-05): ContextMenu, a menu anchored at a point or to an
    // element rather than owning a trigger, and useTokenColors, which resolves
    // color tokens for a canvas. Menu's own tree-shaken budget is unchanged
    // (3.37 kB of 3.4), so an app that imports Menu alone pays ~10 B of it: the
    // shared keyboard helper the two menus now both use (37.49 kB).
    // 37.6 kB → 37.9 kB (2026-11-05): a slider can show its value in a bubble
    // (`valueLabel`), which is a Tooltip given `open` and `describe`; and Slot no
    // longer lets a child's `undefined` clobber the Slot's own prop — about 10 B
    // every component pays, which fixes a Tooltip around any form control
    // describing nothing (37.82 kB).
    limit: '37.9 kB',
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
    // 34.25 kB → 34.4 kB (2026-10-26): greese.js takes per-target function values and function staggers, and reads CSS cubic-bezier() strings as eases (ADR 0008 addendum) (34.38 kB).
    // 34.4 kB → 34.8 kB (2026-10-27): the same FileInput, Textarea, Menu, ScrollSpy and Progress changes (34.75 kB).
    // 34.8 kB → 34.85 kB (2026-10-27): the same greese.js write-skip as the runtime's (34.8 kB).
    // 34.85 kB → 36 kB (2026-10-29): the same page transitions (35.97 kB).
    // 36 kB → 37.2 kB (2026-10-29): their live exits, as above (37.18 kB).
    // 37.2 kB → 37.25 kB (2026-10-30): selector rules' snapshot rules start
    // with `html`, so the browser tries them on the root only, not on every
    // element (37.21 kB; ADR 0029).
    // 37.25 kB → 37.6 kB (2026-10-30): the same link pairing and island (37.56 kB).
    // 37.6 kB → 37.8 kB (2026-10-30): the commit seen, as above (37.7 kB).
    // 37.8 kB → 37.85 kB (2026-10-30): the half turns' effect names and the
    // redrawn icons' paths, landed together with the above (37.8 kB + 2 B).
    // 37.85 kB → 37.95 kB (2026-10-30): the commit seen from React, as above (37.89 kB).
    // 37.95 kB → 38.05 kB (2026-10-31): Tooltip opens on a tap, and a tap elsewhere
    // closes it (ADR 0005 amendment), about 60-90 B (37.98 kB).
    // 38.05 kB → 38.8 kB (2026-10-31): route rules and a navigation's own options (ADR 0029 addendum): the pattern matcher, the resolver, the root variables and the hook's wiring, 0.7-0.75 kB over the 0.3-0.45 kB the plan estimated (38.75 kB).
    // 38.8 kB → 39.7 kB (2026-11-01): Carousel and CarouselSlide (ADR 0032), and
    // ScrollCarousel's vertical orientation (39.63 kB).
    // 39.7 kB → 39.75 kB (2026-11-01): reduced motion an app asks for (ADR 0033): greese.js's prefersReducedMotion and its check of what a timeline moves (39.73 kB).
    // 39.75 → 40.05 kB (2026-11-02): Carousel's own controls and dots (CarouselPrevious, CarouselNext, CarouselIndicator with asChild), `announce` and the label functions, less its hash deep links (39.99 kB).
    // 40.05 kB → 40.2 kB (2026-11-02): greese.js animates an element's text nodes: `text` types into them and splitText splits them where they are, keeping markup (ADR 0008 addendum), and a split link's underline (40.17 kB).
    // 40.2 kB → 40.3 kB (2026-11-03): configureBreakpoints() with no argument reads the stylesheet's breakpoints (--greese-breakpoint-keys and each value), so the JavaScript can't disagree with the CSS (ADR 0034); the computed-style reads share nothing with the rest (40.28 kB).
    // 40.3 kB → 40.5 kB (2026-11-03): greese.js gained killTweensOf and a target registry, which Timeline's own track bookkeeping writes, so the whole library carries it (ADR 0008 addendum) (40.38 kB).
    // 40.5 kB → 42.8 kB (2026-11-04): EditableField, which renders any of eleven controls from a value, plus ColorPicker's channel fields and eyedropper.
    // 42.8 kB → 43.3 kB (2026-11-05): ContextMenu, a menu anchored at a point or to an
    // element rather than owning a trigger, and useTokenColors, which resolves
    // color tokens for a canvas. Menu's own tree-shaken budget is unchanged
    // (3.37 kB of 3.4), so an app that imports Menu alone pays ~10 B of it: the
    // shared keyboard helper the two menus now both use (43.21 kB).
    // 43.3 kB → 43.7 kB (2026-11-05): the same slider bubble and Slot merge fix (43.63 kB).
    // 43.7 kB → 43.8 kB (2026-11-06): Input's `htmlSize` — the native `size`
    // attribute, which sets how many characters wide a field is now that it
    // imposes no width of its own, and which every input-based control
    // inherits — and Text falling back to body copy when no variant names a
    // type style (43.79 kB).
    limit: '43.8 kB',
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
    // 2.5 kB → 2.55 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (2514 B).
    limit: '2.55 kB',
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
    // 2.45 kB → 2.5 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (2471 B).
    limit: '2.5 kB',
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
    // 2.5 kB → 2.55 kB (2026-11-05): the Slot merge fix, which every component carries (2502 B).
    limit: '2.55 kB',
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
    // 2.65 kB → 2.7 kB (2026-10-30): eight half turns (`flipOver<Dir>`, `flipOverOut<Dir>`,
    // the Depth theme's page change; ADR 0029): more of the effect names this carries (2.66 kB).
    // 2.7 kB → 2.75 kB (2026-11-05): the Slot merge fix (2.71 kB).
    limit: '2.75 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Dialog }',
    path: 'dist/index.js',
    import: '{ Dialog }',
    ignore: ['react', 'react-dom'],
    // 3.25 kB → 3.3 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.3 kB → 3.45 kB (2026-10-21): greese ui's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.45 kB → 3.55 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.55 kB → 3.6 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3585 B).
    // 3.6 kB → 3.65 kB (2026-10-30): the `greese` prop's island waits for an IntersectionObserver to tell which scroll reveals start out of view, where it measured each one in the commit: that forced a layout of the whole page in every commit with an island, a fifth of the homepage's script after it boots (ADR 0009 addendum) (3.61 kB).
    limit: '3.65 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Menu, MenuItem }',
    path: 'dist/index.js',
    import: '{ Menu, MenuItem }',
    ignore: ['react', 'react-dom'],
    // 3.25 kB → 3.3 kB (2026-10-27): the items scroll in a viewport, so a
    // shape theme can draw the menu's border along its shape (3.26 kB).
    // 3.3 kB → 3.35 kB (2026-10-30): eight half turns (`flipOver<Dir>`, `flipOverOut<Dir>`,
    // the Depth theme's page change; ADR 0029): more of the effect names this carries (3.33 kB).
    // 3.35 kB → 3.4 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (3361 B).
    limit: '3.4 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { toast, Toaster }',
    path: 'dist/index.js',
    import: '{ toast, Toaster }',
    ignore: ['react', 'react-dom'],
    // 3.25 → 3.3 kB (2026-10-21): the resolver lists the CSS entrances from @greese/ui (generated from src/effects.ts) instead of keeping a regex of its own, about 15 B.
    // 3.3 kB → 3.35 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.35 kB → 3.5 kB (2026-10-21): greese ui's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.5 kB → 3.6 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.6 kB → 3.65 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3632 B).
    // 3.65 kB → 3.7 kB (2026-10-30): eight half turns (`flipOver<Dir>`, `flipOverOut<Dir>`,
    // the Depth theme's page change; ADR 0029): more of the effect names this carries (3.66 kB).
    limit: '3.7 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Slider }',
    path: 'dist/index.js',
    import: '{ Slider }',
    ignore: ['react', 'react-dom'],
    // New entry (2026-11-05): a slider can show its value in a bubble
    // (`valueLabel`), which is a Tooltip, so Slider now carries Tooltip and
    // the anchor utilities. Budgeted so that cost stays visible (3.71 kB).
    limit: '3.75 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Combobox }',
    path: 'dist/index.js',
    import: '{ Combobox }',
    ignore: ['react', 'react-dom'],
    // 4.75 kB → 4.8 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (4785 B).
    // 4.8 kB → 4.85 kB (2026-10-24): option ids looked up in a map, once per options list, where indexOf made long lists render in quadratic time (4.81 kB).
    // 4.85 kB → 4.9 kB (2026-10-30): the same island (4851 B).
    // 4.9 kB → 4.95 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (4924 B).
    // 4.95 kB → 5 kB (2026-11-06): Input's `htmlSize`, which Combobox is built on (4954 B).
    limit: '5 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { NumberField }',
    path: 'dist/index.js',
    import: '{ NumberField }',
    ignore: ['react', 'react-dom'],
    // 3.25 → 3.3 kB (2026-10-21): the resolver lists the CSS entrances from @greese/ui (generated from src/effects.ts) instead of keeping a regex of its own, about 15 B.
    // 3.3 kB → 3.35 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.35 kB → 3.5 kB (2026-10-21): greese ui's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.5 kB → 3.6 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.6 kB → 3.65 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3641 B).
    // 3.65 kB → 3.7 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (3671 B).
    // 3.7 kB → 3.75 kB (2026-11-04): the field re-reads its value when it is
    // left, so a controlled parent declining what was committed no longer leaves
    // the typed text sitting there (3701 B — one byte over, and the fix is
    // correctness, not a feature).
    limit: '3.75 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell }',
    path: 'dist/index.js',
    import: '{ Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell }',
    ignore: ['react', 'react-dom'],
    // 2.25 → 2.3 kB (2026-10-20): the `scope` option's static part (ADR 0017)
    // 2.3 kB → 2.35 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 2.35 kB → 2.55 kB (2026-10-21): greese ui's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
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
    // 3.85 kB → 3.95 kB (2026-11-05): the Slot merge fix, on top of an 8 B overage already in the tree (3.9 kB).
    limit: '3.95 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'ColorPicker',
    path: 'dist/index.js',
    import: '{ ColorPicker }',
    // 4.25 kB → 4.3 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (4265 B).
    // 4.3 kB → 4.35 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (4314 B).
    // 4.35 kB → 5.45 kB (2026-11-04): three opt-in parts of a working color picker — the eyedropper, numeric channel fields for rgb/hsl/hsb, and swatches the reader saves. The channel fields' HSL math and field table are the bulk of it (5.38 kB). Their buttons are plain `<button>`s, not IconButton, so a picker that shows none of them does not carry Button's variants: that alone was 0.65 kB.
    limit: '5.45 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'EditableField',
    path: 'dist/index.js',
    import: '{ EditableField }',
    // First entry (2026-11-04): one field that renders any of eleven controls,
    // so it pulls in Input, NumberField, Slider, Checkbox, Switch, Select,
    // Radio, SegmentedControl, Popover and ColorPicker. A panel built from it
    // was going to import most of those anyway; a page that imports it to show
    // one text field pays for the rest, which is the trade a dispatcher makes.
    limit: '14 kB',
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
    // 2.95 kB → 3 kB (2026-11-06): Input's `htmlSize`, which MaskedInput is built on (2977 B).
    limit: '3 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Carousel, CarouselSlide }',
    path: 'dist/index.js',
    import: '{ Carousel, CarouselSlide }',
    ignore: ['react', 'react-dom'],
    // 3.55 kB (2026-11-01): one slide at a time with CSS effects, keys and
    // swipes (ADR 0032); 3.49 kB at its first build, with hash deep links.
    // 3.55 → 3.75 kB (2026-11-02): its own controls and dots (CarouselPrevious, CarouselNext, CarouselIndicator with asChild), `announce` and the label functions; the hash deep links, now the app's, came out (3.7 kB).
    limit: '3.75 kB',
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
    // 3.55 kB → 3.7 kB (2026-10-21): greese ui's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.7 kB → 3.8 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.8 kB → 3.85 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3828 B).
    // 3.85 kB → 3.95 kB (2026-11-01): `orientation="vertical"` (measuring and scrolling on
    // either axis) and resetting its own reports when a move begins, so a controlled
    // `index` can always reach a slide again (ADR 0011): 67 B.
    // 3.95 kB → 4 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (3953 B).
    limit: '4 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Rating }',
    path: 'dist/index.js',
    import: '{ Rating }',
    ignore: ['react', 'react-dom'],
    // 2.5 → 2.75 kB (2026-10-19): half and quarter stars (`step`), with
    // pointer preview and drag-to-scrub, about 280 B (ADR 0011 addendum).
    // 2.75 kB → 3 kB (2026-10-21): greese ui's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3 kB → 3.05 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.05 kB → 3.1 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (3073 B).
    // 3.1 kB → 3.15 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3117 B).
    // 3.15 kB → 3.2 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (3153 B).
    limit: '3.2 kB',
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
    // 2.65 kB → 2.7 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (2670 B).
    limit: '2.7 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { Diff }',
    path: 'dist/index.js',
    import: '{ Diff }',
    ignore: ['react', 'react-dom'],
    // 2.25 kB → 2.3 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (2253 B).
    limit: '2.3 kB',
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
    // 2.3 kB → 2.35 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (2325 B).
    limit: '2.35 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { SpeedDial, SpeedDialAction }',
    path: 'dist/index.js',
    import: '{ SpeedDial, SpeedDialAction }',
    ignore: ['react', 'react-dom'],
    // 3 kB → 3.05 kB (2026-10-21): the resolver lists the built-in exit effects (generated from @greese/ui's effects.ts) so an overlay can leave with any effect: a built-in's is CSS, one from defineGreeseEffect() needs the runtime. Tens of bytes.
    // 3.05 kB → 3.25 kB (2026-10-21): greese ui's own glyphs are now @greese/icons' (ADR 0020), made by createIcon, which every icon shares: about 0.13 kB once, and each icon a little more than the bare svg it replaces.
    // 3.25 kB → 3.3 kB (2026-10-23): the 15 built-in wipes and pockets (ADR 0025): the
    // names of the entrances CSS can play, which every component's static part carries
    // to know when the runtime is needed, about 40 B.
    // 3.3 kB → 3.35 kB (2026-10-23): overlays leave with wipes and pockets too (ADR
    // 0025 addendum): the overlay exits' names every component carries, the 32 that
    // follow a direction written as prefixes times directions (3313 B).
    // 3.35 kB → 3.4 kB (2026-10-24): the three-dimensional effects (ADR 0025 addendum): ten more names of what CSS plays, which every component's static part carries (3354 B).
    // 3.4 kB → 4 kB (2026-10-27): the trigger is an IconButton and each action's
    // icon a Button, so they take a theme's button shape, depth and states: it
    // brings Button, which an app with a speed dial almost always has (3.98 kB).
    // 4 kB → 4.05 kB (2026-10-30): the same island (4.01 kB).
    // 4.05 kB → 4.1 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (4081 B).
    limit: '4.1 kB',
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
    // 2.35 kB → 2.4 kB (2026-10-27): sections in a scrolling panel, measured from its top (2.37 kB).
    // 2.4 kB → 2.45 kB (2026-10-30): eight half turns (`flipOver<Dir>`, `flipOverOut<Dir>`,
    // the Depth theme's page change; ADR 0029): more of the effect names this carries (2.41 kB).
    // 2.45 kB → 2.5 kB (2026-11-05): the Slot merge fix (2454 B).
    limit: '2.5 kB',
    modifyRolldownConfig: external,
  },
  {
    name: 'JS: tree-shaken { PageTransition, PageShare, usePageNavigate }',
    path: 'dist/index.js',
    import: '{ PageTransition, PageShare, usePageNavigate }',
    ignore: ['react', 'react-dom'],
    // Page transitions (ADR 0029): the components, the hook, the class maps,
    // the rules' CSS and the navigation types (1.53 kB).
    // 1.6 kB → 3 kB (2026-10-29): live exits (phase 4): finding a page and its
    // members, the CSS exit pass, the mode and order from the theme, and back
    // and forward held through the Navigation API (2.94 kB). Timelines load
    // greese.js lazily, with the runtime.
    // 3 kB → 3.4 kB (2026-10-30): `<PageShare link>` (ADR 0029 addendum):
    // naming the old page's end of a link at the click and the new page's as
    // it's inserted, through a MutationObserver (3.35 kB).
    // 3.4 kB → 3.6 kB (2026-10-30): a live exit's styles come off when the
    // commit is seen, not two frames after the exit; a live page still plays
    // the new page in; snapshots show the screenful in view (3.56 kB).
    // 3.6 kB → 3.8 kB (2026-10-30): a live exit's styles come off at React's commit of the navigation (the hook's own update, in its transition), not at the first change the old page makes, which put members back on a homepage still mounting its sections; back and forward wait while the URL has moved (ADR 0029 addendum) (3.75 kB).
    // 3.8 kB → 4.55 kB (2026-10-31): route rules and a navigation's own options (ADR 0029 addendum): the pattern matcher, the resolver, the root variables and the hook's wiring, 0.7-0.75 kB over the 0.3-0.45 kB the plan estimated (4.5 kB).
    limit: '4.55 kB',
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
    // 2.15 kB → 2.2 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (2161 B).
    limit: '2.2 kB',
    modifyRolldownConfig: external,
  },
  {
    // The hook itself plus greese.js's timeline, which it creates.
    // 6 kB → 6.1 kB (2026-10-26): greese.js takes per-target function values and function staggers, and reads CSS cubic-bezier() strings as eases (ADR 0008 addendum) (6.05 kB).
    name: 'JS: tree-shaken { useGreese } (with greese.js)',
    path: 'dist/index.js',
    import: '{ useGreese }',
    ignore: ['react', 'react-dom'],
    // 6.1 kB → 6.15 kB (2026-11-01): reduced motion an app asks for (ADR 0033): greese.js's prefersReducedMotion and its check of what a timeline moves (6.11 kB).
    // 6.15 kB → 6.3 kB (2026-11-02): greese.js animates an element's text nodes: `text` types into them and splitText splits them where they are, keeping markup (ADR 0008 addendum) (6.24 kB).
    // +greese.js's killTweensOf target registry (ADR 0008 addendum, 2026-11-03): 6.37 kB.
    limit: '6.5 kB',
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
    // 10.85 kB → 10.95 kB (2026-10-26): greese.js takes per-target function values and function staggers, and reads CSS cubic-bezier() strings as eases (ADR 0008 addendum), as above (10.91 kB).
    // 10.95 kB → 11 kB (2026-10-27): greese.js skips writing a style or attribute already at its value, so a target holding still costs no mutation (10.96 kB).
    // 11 kB → 11.05 kB (2026-10-29): playPageExit, a page's live exit timeline (ADR 0029, 11.03 kB).
    // 11.05 kB → 11.15 kB (2026-10-30): eight half turns (`flipOver<Dir>`, `flipOverOut<Dir>`,
    // the Depth theme's page change; ADR 0029): more of the effect names this carries (11.11 kB).
    // 11.15 kB → 11.25 kB (2026-11-01): reduced motion an app asks for (ADR 0033): greese.js's prefersReducedMotion and its check of what a timeline moves, read per element by the runtime (11.21 kB).
    // 11.25 kB → 11.4 kB (2026-11-02): greese.js animates an element's text nodes: `text` types into them and splitText splits them where they are, keeping markup (ADR 0008 addendum), and the runtime's text effects take markup (11.39 kB).
    // +greese.js's killTweensOf target registry, which Timeline's track bookkeeping writes (ADR 0008 addendum, 2026-11-03).
    limit: '11.6 kB',
  },
  // @greese/react/svg (ADR 0031) is an add-on, not part of the library: the
  // whole library with greese.js, as above, plus every SVG component and all
  // of @greese/svg, what an app that uses everything bundles.
  {
    name: 'JS: whole library, with greese.js and @greese/react/svg',
    // Two `import *`s in one entry collide in size-limit, so a file of its own.
    path: 'size/library-and-svg.js',
    ignore: ['react', 'react-dom'],
    modifyRolldownConfig: external,
    // 47.45 kB → 47.6 kB (2026-10-30): the commit seen from React, as above (47.53 kB).
    // 47.6 kB → 47.7 kB (2026-10-31): the same Tooltip taps (47.56-47.62 kB).
    // 47.7 kB → 48.3 kB (2026-10-31): route rules and a navigation's own options (ADR 0029 addendum): the pattern matcher, the resolver, the root variables and the hook's wiring, 0.7-0.75 kB over the 0.3-0.45 kB the plan estimated (48.28 kB).
    // 48.3 kB → 49.3 kB (2026-11-01): Carousel and CarouselSlide (ADR 0032), and
    // ScrollCarousel's vertical orientation (49.26 kB).
    // 49.3 kB → 49.35 kB (2026-11-01): reduced motion an app asks for (ADR 0033): greese.js's prefersReducedMotion and its check of what a timeline moves, and DrawPath's and MarqueePath's own check (49.32 kB).
    // 49.35 kB → 49.7 kB (2026-11-01): the filter primitive and preset components
    // (ADR 0031 §7) (49.66 kB).
    // 49.7 kB → 49.75 kB (2026-11-01): the `vars` prop (ADR 0031): custom properties by name, color tokens by their names (49.74 kB).
    // 49.75 → 50.1 kB (2026-11-02): Carousel's own controls and dots (CarouselPrevious, CarouselNext, CarouselIndicator with asChild), `announce` and the label functions, less its hash deep links (50.04 kB).
    // 50.1 kB → 50.2 kB (2026-11-02): greese.js animates an element's text nodes: `text` types into them and splitText splits them where they are, keeping markup (ADR 0008 addendum) (50.13 kB).
    // 50.2 kB → 50.25 kB (2026-11-03): cx takes class dictionaries and arrays of them, which every component carries (50229 B).
    // +greese.js's killTweensOf target registry, which Timeline's track bookkeeping writes (ADR 0008 addendum, 2026-11-03).
    // 50.5 kB → 52.9 kB (2026-11-04): EditableField, which renders any of eleven controls from a value, plus ColorPicker's channel fields and eyedropper.
    // 52.9 kB → 53.2 kB (2026-11-05): ContextMenu, a menu anchored at a point or to an
    // element rather than owning a trigger, and useTokenColors, which resolves
    // color tokens for a canvas. Menu's own tree-shaken budget is unchanged
    // (3.37 kB of 3.4), so an app that imports Menu alone pays ~10 B of it: the
    // shared keyboard helper the two menus now both use (53.09 kB).
    // 53.2 kB → 53.4 kB (2026-11-05): Chip's `size` prop — five size classes
    // and the variables they set (53.3 kB). The other two whole-library
    // budgets did not move; only this one was close enough to its limit.
    // 53.4 kB → 53.7 kB (2026-11-05): the same slider bubble and Slot merge fix (53.55 kB).
    limit: '53.7 kB',
  },
  // @greese/react/svg (ADR 0031): measured with @greese/svg in the bundle,
  // since it is what the components cost an app.
  {
    name: 'JS: @greese/react/svg { Path } (server-safe; slices without measuring)',
    path: 'dist/svg/index.js',
    import: '{ Path }',
    ignore: ['react', 'react-dom'],
    modifyRolldownConfig: external,
    // 1.9 kB → 2 kB (2026-11-01): the `vars` prop (ADR 0031): custom properties by name, color tokens by their names (1.96 kB).
    limit: '2 kB',
  },
  {
    name: 'JS: @greese/react/svg { DrawPath, MarqueePath }',
    path: 'dist/svg/index.js',
    import: '{ DrawPath, MarqueePath }',
    ignore: ['react', 'react-dom'],
    modifyRolldownConfig: external,
    // 2.8 kB → 2.95 kB (2026-11-01): the `vars` prop (ADR 0031): custom properties by name, color tokens by their names (2.9 kB).
    limit: '2.95 kB',
  },
  {
    name: 'JS: @greese/react/svg { Morph }',
    path: 'dist/svg/index.js',
    import: '{ Morph }',
    ignore: ['react', 'react-dom'],
    modifyRolldownConfig: external,
    // 3.8 kB → 3.81 kB (2026-11-01): tween() also reads the root's data-greese-motion (ADR 0033) (3.80 kB).
    // 3.81 kB → 3.95 kB (2026-11-01): the `vars` prop (ADR 0031): custom properties by name, color tokens by their names (3.92 kB).
    limit: '3.95 kB',
  },
  {
    name: 'JS: @greese/react/svg (everything)',
    path: 'dist/svg/index.js',
    import: '*',
    ignore: ['react', 'react-dom'],
    modifyRolldownConfig: external,
    // Includes Drawing's `greese` prop static part (shared with the
    // components) and all of @greese/svg (9.15 kB on its own).
    // 12.2 kB → 12.5 kB (2026-11-01): a component per filter primitive and preset
    // (ADR 0031 §7), sixteen thin wrappers over the builders (12.45 kB).
    // 12.5 kB → 12.6 kB (2026-11-01): the `vars` prop (ADR 0031): custom properties by name, color tokens by their names (12.57 kB).
    limit: '12.6 kB',
  },
]
