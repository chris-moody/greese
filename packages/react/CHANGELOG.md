# @greese/react

## 1.1.0

### Minor Changes

- 5a2c487: Page transitions can be set by route and by navigation. `usePageNavigate(navigate, { route })` reads each page's `PageRoute` (`to` and `from` rules by path pattern) and `navigate` and `onLinkClick` take `enter`, `exit`, `duration` and `ease`. A navigation's `mode` now beats a page's own, as documented.
- d1e328a: Tooltip opens on a tap on touch and pen screens, as well as running the trigger's own action; a tap on it again, a tap elsewhere or Escape closes it. Turn it off with `openOnTap={false}`.

### Patch Changes

- Updated dependencies [1f48cc2]
- Updated dependencies [914ba96]
  - @greese/ui@1.1.0

## 1.0.0

### Major Changes

- 0d736a8: 1.0.0: the first stable release of greese ui.

### Minor Changes

- 71e172f: Content, media and disclosure: `Text`, `Heading`, `Link`, `Code`, `Card`,
  `CardMedia`, `Image`, `Video`, `Embed`, `Icon`, `Avatar`, `AvatarGroup`,
  `Collapsible`, `Accordion`, `AccordionItem`, `Tabs`, `TabList`, `Tab`,
  `TabPanel`, `Alert`, `Badge`, `Chip`, `Spinner`, `Progress` and `Skeleton`.
- 9dd7e6d: Actions and forms: `Button`, `IconButton`, `ButtonGroup`, `ToggleButton`,
  `Field` (+ `useFieldControl`), `Input`, `TextField`, `Textarea`, `Select`,
  `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `Switch`, `Slider` and
  `FileInput`, all native elements restyled.
- 29a566a: Foundations: design tokens (color, space, radius, typography, shadow, z-index,
  motion, breakpoints) as CSS variables, Sass maps and TS constants; color
  schemes via `useColorScheme` and `getSchemeScript`; scoped themes via
  `createTheme` and `ThemeProvider`; responsive-prop resolution; `Slot`,
  `useMediaQuery`, `useBreakpoint`, `useBreakpointValue`, `useControllableState`,
  `VisuallyHidden`; opt-in `base.css`.
- 737f251: Layout primitives: `Box` (typed responsive style props), `Stack`, `Grid` and
  `GridItem` (with container-query spans), `Container`, `Center`, `Spacer`,
  `Divider`, `Show`/`Hide` and `AspectRatio`. Responsive variables are now
  registered as non-inheriting via `@property`.
- cc281c3: Overlays and navigation: `Dialog`, `Drawer`, `Popover`, `Tooltip`, `Menu`,
  `MenuItem`, `MenuSeparator`, `toast` + `Toaster`, `SidebarLayout`, `Sidebar`,
  `SidebarTrigger`, `AppBar`, `Breadcrumbs`, `BreadcrumbItem` and `Pagination`
  (+ `paginationRange`), plus `useAnchoredPopover` and `computeFallbackPosition`
  for anchoring custom overlays.
- bd79341: Ship per-component stylesheets (`@greese/react/css/<Component>.css`) and the
  public SCSS entry `pkg:@greese/react/scss`, whose breakpoint values can be
  reconfigured with `with ($breakpoints: …)`; `configureBreakpoints()` applies
  the same values to the hooks.
- 5870c2f: Add `Slottable`, so `asChild` components keep content they inject (icons,
  spinners), and `mapResponsive` for transforming responsive prop values.
- aef6381: **`Accordion` and `AccordionItem` are Server Components:** an FAQ ships no JavaScript. The Accordion hands its `name` (with `exclusive`) and its icons to the `AccordionItem`s among its children, in fragments and lists too, instead of through context. **Changed:** an `AccordionItem` inside a component of your own no longer picks them up; give it `name` and icons as its own props.
- 91e420f: **`AvatarGroup` and `BreadcrumbItem` are Server Components:** each now lives in a file of its own, without its sibling's `'use client'`. `Avatar` and `Breadcrumbs` stay client components.
- 0cb3cbf: Brand colors lead with `primary`. Components use `primary` for interactive emphasis and default to `tone="primary"`; `accent` is now a color of its own (pink by default), after `tertiary`, and every `tone` prop takes `primary`, `secondary`, `tertiary` and `accent`. `on<Color>` tokens are renamed `<color>Content` (`--greese-color-primary-content`). `createTheme` (and the SCSS kit's `tokens()`) derive a WCAG AA-safe content color and a strong shade from any brand color a theme sets, and the tokens package exports `contentColor`, `contrastRatio`, `luminance` and `deriveColors`. Scroll reveals now wait until an element is wholly in view and clear of the bottom edge.
- 0cb3cbf: Brand tones: every `tone` prop takes `primary`, `secondary` and `tertiary` (Button, IconButton, ToggleButton, Badge, Chip, Text, Heading, Link, Alert, Toast, Status, ChatBubble, Step, MenuItem, Stat), typed as the exported `BrandTone`. Chip gains a `tone` prop: a plain chip is tinted in it and a selectable one shows it when selected; without one, chips look as before. A pressed ToggleButton now shows its tone (the default `neutral` still presses to accent).
- ef6188f: Breakpoints can gain keys at build time: `@use 'pkg:@greese/ui/scss' with ($breakpoints: (…, tablet: 700px, …))` gives the new key responsive classes, and every breakpoint is now a custom property, `--greese-breakpoint-<key>`, in the built CSS. `configureBreakpoints({ tablet: 700 })` registers it for the hooks, `getBreakpointKeys()` lists the keys in effect, and `BreakpointKeys` can be augmented so `Responsive<T>` accepts it.
- 2e19c05: Button and IconButton take `href` to render an `<a>`, typed so a button has `onClick` or `href`, never both. New types: `ButtonActionProps`, `ButtonLinkProps`, `IconButtonActionProps`, `IconButtonLinkProps`, `DistributiveOmit`.
- 76471a6: Add a `text` Button variant (`greese-Button--text`): no box, in the surrounding text's color, with a faint tint on hover, so a button reads as plain text.
- 846d9d3: Color: `primary`, `secondary` and `tertiary` roles (each with `…Strong` and `on…`), and a palette of 22 hues × 11 shades like MUI's `colors`. `accent`, `accentStrong`, `onAccent` and `focusRing` now follow `primary` by default, so setting `primary` rebrands every component; the default colors are unchanged. Use the palette as `palette.lavender[600]` (or `import { lavender }`) in TypeScript, `lavender-600` or `greese.palette(lavender, 600)` in the SCSS kit, and `var(--greese-lavender-600)` with the opt-in `@greese/ui/palette.css`.
- 0cb3cbf: Add 18 components found missing in a component gap review: `Carousel` + `CarouselSlide` (native scroll snapping, buttons and dots), `Rating` (native radios, hover preview in CSS, read-only fractions), `Diff` (before/after with a range-input divider), `Steps` + `Step` (processes, and timelines without `current`: `direction`, `markers="dots"`, a Step's `prefix`), `OtpField` (one input with `autocomplete="one-time-code"`), `SpeedDial` + `SpeedDialAction` (Popover API), `Dock` + `DockItem`, `Countdown`, `ChatBubble`, `List` + `ListItem`, `Stat` + `StatGroup`, `Status`, `Indicator`, `Key`, `Fieldset`, `RadialProgress`, `Swap` and `TextRotate` (CSS only). Every one has the `greese` prop and its own docs page.
- f3f9eea: Component gaps: `Combobox` (searchable select, WAI-ARIA 1.2), `NumberField`
  (spinbutton with steppers), `DateField` (native date and time inputs), `Table`
  primitives (sortable headers, sticky header, stacked card layout on phones) and
  `SegmentedControl` + `Segment`.
- 0cb3cbf: `Grid` is now one component, as in MUI: `container` makes a grid and `size` (was GridItem's `span`) is how many columns a cell spans; one element can be both, to nest. `GridItem` is removed, and the old `container` (container queries) is now `containerQueries`. New `Tile`, a compact surface for grid cells, placeholders and drop zones. `Rating` takes `step` (1, 0.5 or 0.25) for half and quarter stars, with pointer preview and drag-to-choose on touch. `ChatBubble` has a tail pointing at its author. Every prop now has a description in the props tables.
- d2f0b0d: - **Three-dimensional effects:** base `turnX`, `turnY`, `hinge` and `depth` (a `transform` with its own perspective), and the combos `flipUp`, `flipDown`, `flipLeft`, `flipRight`, `flipOut<Dir>` (each its entrance reversed), `depthIn`, `depthOut`, `swingIn` and `swingOut`. Overlays leave with them: an exit now carries `transform` (and a swing's pivot), and the floating styles transition it.
  - **`xl` radius (24px)** on the radius scale.
  - **Shaped cards transition `translate` only when interactive**, as unshaped ones do, so the runtime's effects (a pocket's mask) stay in step with them.
- 24d69e4: `scaleIn` no longer fades, and `scaleOut` is its opposite (a scale down to 0.92, with no fade). `describeGreeseEffects()` returns every built-in effect as plain keyframes.
- 0cb3cbf: Faster style recalculation. Responsive props compile to one class per breakpoint that sets the property directly (`.greese-Stack--md-gap-2`, or `.greese-Stack--md-gap` reading an inline `--greese-stack-gap-md` for open-ended values), with no `var()` fallback chain, no "uses" class (`.greese-Stack--gap` is gone) and no `@property` registrations. Below a prop's smallest set breakpoint, the component's own styles now apply instead of being reset. The `greese` prop's presets share one set of rules, and stagger uses `sibling-index()` where supported. `responsivePropClass` is replaced by `responsiveValueClass`. The full stylesheet is 1.2 kB smaller.
- 27213fb: `Drawer` gains swipe-to-dismiss: drag the header (or a bottom sheet's new grab
  handle) toward the edge. On by default; `swipeToClose={false}` turns it off.
- bc388f4: Define the built-in effects once, in `@greese/ui` (`src/effects.ts`, exported as `builtInEffects` and from `@greese/ui/effects`), as base effects that animate one property each and combo effects made of them. Effects take arguments in a sequence: `fadeIn(0.25, 0.8)`, `fadeIn({ end: 0.8, duration: 1 })`, with `duration`, `offset` and `ease` on every call. There is no effect kind: an effect that ends at rest is a CSS preset, one that ends away from it is an overlay exit, so `exit` takes any effect and `GreesePreset`, `GreeseExit` and `GreeseInteraction` are removed. The kit gains `effect()`, which writes an effect's CSS as the built-ins have it, and `motion()` accepts all of them.
- fb57e8d: `@greese/ui` now holds all of greese ui's CSS: the stylesheet (`styles.css`, `base.css`, `css/<Name>.css`), the Sass kit (`@use 'pkg:@greese/ui/scss/kit'`) and `style-manifest.json`, with no framework attached, so plain HTML and other frameworks can use it. `@greese/react` is JavaScript only and depends on it; its `styles.css`, `base.css` and `css/*` paths still work, and its `component-styles.json` says which blocks each component renders.
- 328b9fd: Add the `greese` prop to every component that draws something: CSS-only entrance presets (also in Server Components), scroll reveals, hover/press/focus interactions, text effects (`type`, `count`, `split`), overlay exits and custom greese.js timelines, all respecting reduced motion. Effect names are camelCase (`fadeUp`, `scaleOut`). Effects compose in one string (`'fadeIn+scaleIn,+2,fadeOut'`: `+` together, `,` in turn, a number pauses), and `defineGreeseEffect()` adds your own, typed through `GreeseEffectRegistry`. Adds `<Motion>`, `useTimeline()`, `resolveGreese`/`withGreese`, `css/Motion.css`, and the `@greese/react/greese` opt-in that loads the runtime up front; otherwise it loads lazily on first use.
- 9ddf302: - **`Header`:** the page's header, with `brand`, navigation (children) and `actions`, sticky by default and `floating` (inset, rounded and raised) on request. A sticky header sets the page's scroll padding to its height (`--greese-header-height`, 3.5rem), so in-page links land with their target just below it, with no JavaScript and nothing for each section to declare.
  - **`Footer` and `FooterSection`:** a `brand` beside columns of links, each a `<nav>` named by its heading, over a `legal` row.
  - **Accordion and Collapsible icons:** `icon` (or `null` for none), `openIcon` for an icon per state, and `iconTransition` (`rotate`, `fade`, `none`); an Accordion sets them for every item, and an item's own win. The default chevron still turns, by `--greese-collapsible-icon-turn`.
  - **Hovers that move the element stay put under a still pointer:** a `greese` hover lasts while the pointer is over where the element rests, and an interactive Card's hit area reaches the 2px it rises, so neither bounces.
  - **`ContrastIcon`** in `@greese/icons`.
- dda476a: Every icon lives in `@greese/icons` (ADR 0020). `@greese/react` now depends on it and draws its own glyphs (close, menu, chevron, plus, minus, check, sort, star) with it, in place of its inline SVGs. `createIcon` takes `{ viewBox, strokeWidth, filled }`, and the package gains `ChevronLeft`, `Minus`, `Sort`, `CheckDash`, `StarFilled`, `Accessibility`, `Copy`, `Dots`, `Feather`, `Github`, `Layers`, `Motion`, `Phone`, `Replay` and `Server`. `Checkbox` and `Table` style their icons by path position; the `greese-Checkbox-check`, `greese-Checkbox-dash` and `greese-SortGlyph-*` classes are gone.
- dd37a16: New effects: `slideDown`, `slideRight`, `slideLeft`, `popIn` (CSS presets), `popOut`, and `fall`, the opposite of `rise`. `lift` is now `rise`, and `pop` no longer fades (`popIn` does). A negative number in a sequence (`'slideUp,-0.2,popIn'`) backs the next step up so it overlaps the last. A scope takes `replay`: change it and its entrances play again in place, without remounting. An `inView` scope that was already on screen is no longer left held.
- 3f2d822: Add `greese={{ scope }}`: a parent that orders every entrance inside it, at any depth, in document order (`stagger` apart, after `delay`, optionally held until it scrolls into view). A scope inside a scope takes one position in the outer one. It only sets each entrance's start time (`--greese-motion-scope`), so the entrances stay CSS animations; the code is a lazy chunk under 1 kB, loaded only when a scope is used, and components without one pay about 30 B.
- d88367b: `<PageShare link>` pairs shared elements by the link followed, with no ids: a list item morphs into the next page's hero, and back into the item linking to the page left (ADR 0029).
- 3636d28: **Live page exits (ADR 0029).** `PageTransition` takes `mode` (`auto`, `snapshot`, `live`), `order` and `stagger`: a live page's members (its elements with greese entrances) play their exits on the real page, the last first by default, while the router loads the next page, which then commits. `exit` also takes a sequence or a timeline map (selector → sequence), played by greese.js. Back and forward wait for a live exit where the browser can defer a traversal's commit (the Navigation API's precommit handler). The theme's `page-mode`, `page-exit-order` and `page-stagger` apply.
- 11b79bd: **Page transitions (ADR 0029).** `PageTransition` animates page changes with React 19.3's `<ViewTransition>` and greese's effects: the motion theme's page roles by default, or named effects per direction (`back`) and per transition type (`types`), and selector `rules` for parts of a page. `usePageNavigate(navigate)` takes any router's navigate and adds the transition types (`greese-page`, `greese-forward`/`greese-back`, `greese-deeper`/`-shallower`/`-sibling`), with `onLinkClick` for a router's links. `PageShare` morphs an element into its twin on the next page. `PageTransition` and `PageShare` are Server Components; before React 19.3 they render their children unchanged.
- 8e30414: **`Pagination` with `getHref` and a controlled `page` is a Server Component,** so a Server Component can now pass it `getHref` and `labels.page` (it couldn't before: functions don't cross into a client component). Buttons, and links that track their own page, are unchanged.
- 43530df: Add `Break` (a responsive line break with a configurable fallback), `ColorPicker`, `MaskedInput`, `AutoLayout` + `AutoLayoutItem` and `ActionSelect`. Attached `ButtonGroup`s now also join `Select` and `Input` frames.
- cf0aa77: Bundle greese.js: `@greese/react` now depends on `@greese/js` and re-exports `animate`, `timeline`, `ease`, `cubicBezier` and `splitText`.
- 7b0b8e0: Remove the font-size tokens (`--greese-font-size-*`, the `fontSize` group and export) and the `size` prop of `Text` and `Heading`: text sizes come from the type system's variants. `Text` takes a `variant`, `Heading` takes the variant of its level unless given another, and components read the variants' sizes. Migrate `size="sm"` to `variant="p3"` (`xs` to `caption`, `md` to `p2`, `lg` to `s2`, `xl` to `s1`, `2xl` to `h3`, `3xl` to `h2`, `4xl` to `h1`).
- 9446966: Add ScrollSpy: the same-page `#id` links inside it get `aria-current="location"` while their section is the one the page is scrolled to (the last one above `offset`, or the last at the bottom of the page), and `onActiveChange` reports its id. Works with any router's links; `currentSection()` is exported.
- fbaeb2a: **Shape themes reach more components.** Select, Textarea and OtpField's boxes take the field shape; collapsible headers become bars that take the small shape in every shape theme; menus, popovers and tooltips draw their border along the shape; an accordion item's panel (`.greese-AccordionItem > .greese-Collapsible-content`) takes the item's shape, not the `<details>`, which no longer adds padding of its own; Bevel and Ridge's switches get a track pointed at both ends to hold their diamond knob, and their diamond radios fit inside the radio's box, so a scroller's edge no longer cuts a point off; Extrude and Tilt's accordions drop the rules between items for a gap; toasts keep their tone's edge; chat bubbles are cut to Bevel and Folio with their tail; avatars are cut squares in Bevel and rounded squares in Soft and Extrude; Folio's status dots get a fold to their size. Extrude draws a button's lower edge in a shade of its own face at 3:1 or more against it (WCAG 1.4.11), so dark buttons show their depth too; it adds depth to alerts, tabs (the current one pressed in), progress fills, the chosen segment, code boxes, collapsible headers and the speed dial. Badges are opaque in every variant (`--greese-badge-surface`), so what they're pinned to doesn't show through.

  **Changed markup:**

  - `Textarea` renders a frame (`.greese-Textarea`) round the textarea (`.greese-Textarea-control`), like Input: `className` and `style` go to the frame, every other prop and `ref` to the textarea.
  - `FileInput` renders a frame (`.greese-FileInput`) with the native input visually hidden (`.greese-FileInput-control`), a greese ui Button as its label (`.greese-FileInput-button`) and the chosen files' names (`.greese-FileInput-files`). `className` and `style` go to the frame. New props: `buttonLabel` and `placeholder`. `--greese-file-height` and `--greese-file-padding` are gone (the Button's size sets them).
  - `Menu` scrolls an inner `.greese-Menu-viewport` (`role="none"`), not itself.
  - `SpeedDial`'s trigger is an IconButton and each `SpeedDialAction`'s icon a Button's look, so they take the theme's button shape, depth and states.

  **New:** `Progress` takes `loading`: the filled part runs with diagonal stripes in the bar's two colors, and the bar is `aria-busy`. `ScrollSpy` follows sections that scroll in a panel of their own, measured from the panel's top.

- 9446966: Add `createStoredValue()` (@greese/ui) and `useStoredState()` (@greese/react). They keep a value in localStorage or sessionStorage safely: in memory where storage is missing, blocked or full; parsed, with optional validation; shared by every reader of the key, in this tab and across tabs. `useColorScheme` now saves through it.
- d52ed6b: Add `@greese/svg`: type-safe SVG drawing and animation with no dependencies. Build paths and shapes, convert between them, measure them without a DOM, morph any shape into another (points and parts matched and aligned), draw, fill, drain and offset stroke slices by percent or run them as marquees, move elements along paths, and build gradients, filters (with `glow`, `goo`, `grain` and `distort` presets), clip paths and masks. Animations are properties on small controls that any tweener drives, greese.js included, or the built-in `tween()`. `@greese/react/svg` adds `Drawing`, `Path`, `DrawPath`, `MarqueePath`, `Morph`, `LinearGradient`, `RadialGradient`, `Filter`, `ClipPath` and `Mask`, and re-exports `@greese/svg`.
- d28d287: **`Table` and all its parts are Server Components:** a data table ships no JavaScript and hydrates about 25% faster. **Changed:** every `Table` now carries explicit `table`, `rowgroup`, `row`, `columnheader` and `cell` roles, not only stacked ones; they're redundant on a plain table and change nothing for assistive tech.
- 174659b: Effects can be retuned and added by a theme. The kit's `keyframes()` mixin replaces an entrance preset's `@keyframes` (or adds one), `defineGreeseEffect()` under a built-in's name now replaces that effect in the runtime, and `removeGreeseEffect()` forgets a definition.
- 0cb3cbf: Add the SCSS kit, `@use 'pkg:@greese/ui/scss/kit' as greese`: build-time theming that writes the `greese-` prefix for you and stops the build on unknown components, parts, modifiers, variables or tokens. `component()` with `part()`, `modifier()` and `vars()` restyles a component in the new `greese.overrides` layer (above component styles, below style props and the `greese` prop); `tokens()` and `theme(name)` compile token overrides and complete themes, as `createTheme` does; `motion()` and `motion-defaults()` give every instance of a component a CSS entrance, overlay exit and transition speeds. Ship `@greese/ui/style-manifest.json`, every component's classes, parts, modifiers, states and variables. `ThemeProvider`'s `theme` also takes a theme name, for themes whose CSS you load yourself.
- d2f0b0d: Themes reassign roles; they never overwrite tokens or effects (ADR 0025).

  - **Radius roles:** components read `--greese-corner-control`, `-field`, `-surface`, `-panel`, `-inset`, `-pill` and `-round` (the `corner` token group), each pointing at the radius scale, instead of the scale itself. A shape theme points the roles at `none`; `--greese-radius-md` stays 8px.
  - **Motion roles:** the kit's `motion-defaults()` assigns which effect plays where and which timing it takes: `theme` (the new `greese="theme"` entrance), `content` (tab panels' and an opening accordion's children), `rows` (table rows, a stagger apart; none by default), `toast`, `backdrop`, the overlay roles and their exits, `*-duration` (a duration token by name, or a time) and `enter-ease`/`exit-ease` (an easing token by name, or a curve). Effect names are checked, and the kit carries the assigned entrances' own keyframes.
  - **Built-ins keep their keyframes:** `defineGreeseEffect()` under a built-in's name is never played, and the kit's `effect()` and `keyframes()` refuse one. Name your effect and assign it instead.
  - **`'theme'`** is a `greese` entrance (`enter`, `inView`) that plays whatever the theme assigns, `fadeUp` in the base theme.

- acce602: Add the type system: the variants `p1`–`p3`, `h1`–`h6`, `s1`, `s2`, `caption` and `button`, each with a size, weight, letter spacing and line height (and optional `fontFamily`, `fontStyle`, `textTransform`, `fontFeatureSettings`, `fontVariationSettings`, `fontStretch`, `textWrap`, `wordSpacing`, `fontVariantNumeric`, named as the CSS properties in their JavaScript form) that change across breakpoints, as `--greese-type-<variant>-<css-property>` custom properties. `Text` and `Heading` take a `variant` (`Heading`'s `level` still sets the element), `.greese-Type--<variant>` styles any element, and `createTheme({ typography })`, the kit's `typography()` and `$typography` change the values. Buttons read the `button` variant.
- 0cb3cbf: Add `useGreese()`, greese.js tied to a component's lifetime: the build runs before paint with refs set, selector strings are scoped to a ref, dependencies re-run it (pausing or, with `revertOnUpdate`, reverting the last build), and everything made through it, including animations started in handlers, is reverted on unmount. `useTimeline()` now builds on it, so it also applies before paint. greese.js: timelines take a `scope` option (selector strings match inside that element), and `kill()` now restores properties animated with explicit keyframes or `fromTo`, whose originals were previously never read.
- d2f0b0d: Add built-in effects that reveal or hide with a mask, so they compose with a shape's clip-path:

  - **Wipes:** `wipe<Dir>` and `wipeOut<Dir>` in eight directions (`Right`, `Left`, `Up`, `Down`, `DownRight`, `DownLeft`, `UpRight`, `UpLeft`), plus `wipeOpenX/Y` and `wipeCloseX/Y` from and to the middle.
  - **Irises:** `irisIn` and `irisOut` from and to the middle, and `iris<Dir>` and `irisOut<Dir>` in the same eight directions, an opening in the element's proportions that closes toward that side or corner, or opens from it (each entrance is its exit reversed). Every iris opens to 142%, just past the far corner, so the whole run is visible change.
  - **Pockets:** `pocket<Dir>` and `pocketOut<Dir>` in the same eight directions, which rise out of, or sink into, a slot at one of the element's own edges.

  The leaving ones are overlay exits too: an overlay (Dialog, Drawer, Popover, Menu, Tooltip, Sidebar, SpeedDial) holds the exit's mask as it closes. An exit now sets everything an overlay moves to (`translate`, `scale`, `opacity` and its mask), so what it doesn't move stays put. Mask images use `black` and `transparent`, which survive the runtime's value mixing.

### Patch Changes

- Updated dependencies [29a566a]
- Updated dependencies [fcad516]
- Updated dependencies [85f75c1]
- Updated dependencies [7b2526f]
- Updated dependencies [0d736a8]
  - @greese/ui@1.0.0
- 08ef30f: - **`Button` renders in Server Components.** It used to wrap every click in a handler of its own, to ignore presses while loading or disabled, which a Server Component can't hand the browser, so `Button`, `IconButton`, `Alert` and the rest built on it threw there. It now blocks those presses without script: a loading button is `type="button"` (it can't submit or reset its form), a disabled `asChild` link leaves the tab order and the pointer, and only an `onClick` you pass (which only a client component can) is wrapped.
  - **`Combobox`** looks option ids up once per options list instead of once per option (long lists rendered in quadratic time), and keeps its text in step with the selected option's label rather than re-running on every render.
  - **`Carousel`** starts at `defaultIndex` once, with complete hook dependencies.
- 0cb3cbf: Carousel: the dots and buttons always reach their slide. A late update could scroll the view back to a slide it had passed, and browsers re-snapped a smooth scroll when layout changed mid-way, often a slide short. Only a controlled `index` from outside scrolls now; snapping is suspended while the carousel scrolls itself; the dots no longer change size (the active pill is drawn with `clip-path`); and any scroll still cut short is finished.
- 66eb0ba: **`Collapsible` is a Server Component.** It no longer carries `'use client'`: it only listens for its toggle when you pass `onOpenChange`, so without one it's plain `<details>`, shipping no JavaScript.
- 81f3fba: - **`Footer`** leaves out its brand, sections and legal row when they render nothing: a `null`, or a condition that came out `false`, no longer leaves an empty grid above the legal row.
  - **`AccordionItem`'s icons are a set:** an item that sets `icon` or `openIcon` uses its own pair and its own (or the default) transition, instead of mixing its icon with the group's open icon or the group's transition.
- cd9d411: Faster starts for many animations at once. greese.js holds every style write until its timeline has read its starting values, and adds `batch(fn)` to hold writes across timelines (the ticker batches each frame). The `greese` prop attaches each commit's elements in one batch, checks their positions together and reads RTL from the `dir` attribute, instead of forcing a style recalculation per element. An `inView` text effect on an element already in view now leaves its text alone; before, it showed the effect's first frame (a count stuck at `0`).
- 4418ecd: Fix `Hide` with both `above` and `below`: it now hides only between the two breakpoints instead of at every width.
- 66421c6: **`greese` hovers that move the element end cleanly.** Entering again while the element is still settling back keeps the box it rests in (it measured where it had moved to, so the lift could bounce again), a page scroll no longer shifts that box, and the hover ends when the pointer leaves the window or the page loses focus, instead of staying lifted.
- 426cb38: The `greese` prop's island tells which scroll reveals start out of view with an IntersectionObserver instead of measuring each one in the commit, which forced a layout of the whole page in every commit with an island (ADR 0009).
- f7bfb29: **`Menu`'s ArrowUp, with no item focused, goes to the last item** (it went to the one before it). Menu, Tabs and Combobox now share one rule for where the arrow keys, Home and End go.
- d211a7d: **`MenuItem`'s brand tones work:** `tone="primary"` (and `secondary`, `tertiary`, `accent`) now colors the item. Only `negative` applied before.
- 0974460: Fix modals where scrollbars take space (Windows, macOS with a mouse): the backdrop now covers the whole screen and end drawers reach the screen edge, without the page shifting. The scroll lock removes the scrollbar and pads the page by its width instead of reserving a gutter, which browsers don't paint the top layer over.
- 774caba: Page transitions: a live exit's styles come off when React commits the navigation, not at the first change the leaving page makes. A page that was still mounting or re-rendering as it left (a homepage mounting its sections in turn) put its members back on screen before the next page arrived. Back and forward, which a router hears outside the navigation's transition, still watch the page, but ignore what it adds and its attributes, and wait past the cap while the URL has moved.
- 15ba5cc: `usePageNavigate` takes a router's navigate as it is, React Router's `useNavigate()` included: it asks only for the path form (`(to, { replace })`), which an overloaded navigate satisfies. A history step (`page.navigate(-1)`) goes to the browser's history, which routers follow.
- ce01b4d: Page transitions: a live exit's styles come off when the new page has committed, not two frames after the exit, so members no longer flash back on the old page. A page that left live still plays the new page's entrance, over what the exit left of the old one fading out. A page's snapshots show only the screenful in view, so effects sized by the element (pockets, pops, flips) play on screen rather than across the whole page's height. What stays still while a page changes (a header named `'still'`) stays on top, so the page moves beneath it. New effects `flipOver<Dir>` and `flipOverOut<Dir>` turn half over with the back face hidden: a pair played together turns as one panel, the old page on its front and the new one on its back.
- 1e2057f: Page transitions' snapshot rules start with `html` (`html::view-transition-old(…)`): the snapshots belong to the root, and a selector with nothing before `::view-transition-*` was tried against every element at every style recalculation, about 15 ms of blocking time on a large page.
- 803395c: **Scroll reveals at the end of a page:** an `inView` element that ends the page (a footer) could stay hidden for good. Layout is fractional and scrolling whole pixels, so it can end a fraction of a pixel past the viewport, and was never "wholly in view". The check now allows a pixel's slack there.
- c907516: The `inView` reveal no longer waits for a tall element to fill half the viewport: one taller than half of it reveals once a fifth is showing.
- d2f0b0d: - **Scroll reveals work on shaped elements.** A reveal waited for IntersectionObserver to report the element 99% visible, which a shape's clip-path (its own or an ancestor's) prevents, so shaped pages never revealed. It now reads the element's box as the page scrolls, while any of it is in view.
  - **`track` color token:** the empty part of a progress bar, a slider and a radial progress, a step lighter than the borders in dark mode (steel 600), so it shows on the canvas and on surfaces.
  - **Hooks for the current tab and segment:** `--greese-tab-current-bg` and `--greese-tab-current-edge`, `--greese-segment-current-bg` and `--greese-segment-current-edge` (a color variant outlines them; unset, they look as before).
- d2f0b0d: - **`--greese-radius-round` token (`50%`)**, which the `round` radius role points at: knobs, thumbs, radios, step markers, avatars and status dots read the role, so a theme can square them.
  - **Tab panels and accordion content stay put** while their children enter, a stagger apart.
  - **Segmented control:** icons in a segment are centered with its text.
  - **AvatarGroup:** the group's `size` now applies to its avatars (each avatar's own size used to win), and it shows the one avatar left over instead of "+1".
- 0cb3cbf: Steps: on horizontal steps, a Step with `prefixBefore` no longer pushes its marker below the others; every step keeps a line's room for the prefix, so markers and the lines between them stay level.
- b938f2d: **`TextField` and `DateField` render in Server Components.** They only compose client components (Field, Input) and use no hooks themselves, so they no longer carry `'use client'`.
- Updated dependencies [0cb3cbf]
- Updated dependencies [ef6188f]
- Updated dependencies [d5f0774]
- Updated dependencies [76471a6]
- Updated dependencies [846d9d3]
- Updated dependencies [d2f0b0d]
- Updated dependencies [24d69e4]
- Updated dependencies [bc388f4]
- Updated dependencies [42b1080]
- Updated dependencies [fb57e8d]
- Updated dependencies [cd9d411]
- Updated dependencies [628bd6b]
- Updated dependencies [6562ec0]
- Updated dependencies [7e6ba00]
- Updated dependencies [cf0aa77]
- Updated dependencies [b9bb6d3]
- Updated dependencies [6b77493]
- Updated dependencies [46c6b6a]
- Updated dependencies [9ddf302]
- Updated dependencies [dda476a]
- Updated dependencies [a8b1cb0]
- Updated dependencies [1c3769e]
- Updated dependencies [dd37a16]
- Updated dependencies [3f2d822]
- Updated dependencies [2ec4988]
- Updated dependencies [fafac8d]
- Updated dependencies [d2f0b0d]
- Updated dependencies [846d9d3]
- Updated dependencies [ce01b4d]
- Updated dependencies [57b06b5]
- Updated dependencies [1e2057f]
- Updated dependencies [e3a8296]
- Updated dependencies [7b0b8e0]
- Updated dependencies [d2f0b0d]
- Updated dependencies [d2f0b0d]
- Updated dependencies [9446966]
- Updated dependencies [d2f0b0d]
- Updated dependencies [fbaeb2a]
- Updated dependencies [d2f0b0d]
- Updated dependencies [c55f9f7]
- Updated dependencies [3916354]
- Updated dependencies [a742762]
- Updated dependencies [0a89c25]
- Updated dependencies [9446966]
- Updated dependencies [1f9779b]
- Updated dependencies [55d8757]
- Updated dependencies [d52ed6b]
- Updated dependencies [dda476a]
- Updated dependencies [174659b]
- Updated dependencies [dda476a]
- Updated dependencies [d2f0b0d]
- Updated dependencies [d2f0b0d]
- Updated dependencies [acce602]
- Updated dependencies [0cb3cbf]
- Updated dependencies [d4b7cb1]
- Updated dependencies [4eeec0e]
- Updated dependencies [d2f0b0d]
  - @greese/ui@1.0.0
  - @greese/js@0.1.0
  - @greese/icons@0.1.0
  - @greese/svg@0.1.0
