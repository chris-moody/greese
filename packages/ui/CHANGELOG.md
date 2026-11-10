# @greese/ui

## 1.2.0

### Minor Changes

- d01af8c: - **Carousel** and **CarouselSlide**: one slide at a time, changing with greese effects (`enter`, `exit`, `back`, or the theme's new `carousel` motion roles). It shows the slide it opens on from the first paint, with no transition, so a page that renders the slide its route names (`defaultIndex`, or a controlled `index` that follows the route, writing the address in `onIndexChange`) deep-links to it, server-rendered or not. Its own controls and dots: `controls` and `indicators` also take a node that uses **CarouselPrevious**, **CarouselNext** and **CarouselIndicator**, each a named button or, with `asChild`, your element (a router link) with the wiring, `aria-disabled` at the end, and its own look. Every name it reads out can be translated: `previousLabel`, `nextLabel`, `slideLabel` and `indicatorLabel`. `announce={false}` quiets the viewport for a page that announces slide changes itself.
  - **ScrollCarousel** is the scroll-snapping carousel: slides in a row, several in view. It runs vertically with `orientation="vertical"` (`ScrollCarouselOrientation`). A controlled `index` now always reaches a slide the user had scrolled past, and the buttons follow an app's reduced motion.
  - **Reduced motion an app asks for**: `<ThemeProvider motion="reduce">` (or `data-greese-motion="reduce"` on any element) reduces motion for its subtree whatever the system says. `prefersReducedMotion(el)` from `@greese/js` answers for your own code, and `MOTION_ATTR` from `@greese/ui` names the attribute.
  - **SVG styling**: `fill-*`, `stroke-*` and `stroke-width-*` utility classes, and a `vars` prop on every drawing component that sets custom properties, color tokens by name (`varsStyle`, `SvgVars` and `VarsProps` for your own).
  - Collapsible's content keeps its children's margins, so opening and closing no longer jumps at the end.
  - `pkg:@greese/ui/scss/slides`: the buttons and dots both carousels share, for theme authors.
  - `@greese/ui/style-manifest.json` is version 4: per block, each class's parent and the properties its rules set (`classes`), each state attribute's classes (`states`), and each variable's default, setters, the properties it ends up in and its type (`variableInfo`). Existing fields are unchanged.
  - **@greese/mcp** knows the new Carousel, ScrollCarousel's orientation, ThemeProvider's `motion` and the svg styling.
- ab9793d: - **`Chip` takes a `size`**: `xs` through `xl`, setting the height, the inline
  padding and the text size together, and scaling the remove button with them
  so a small chip still fits one.

  ```tsx
  <Chip size="sm" tone="secondary">
    Featured
  </Chip>
  ```

  A chip's scale is its own, not the shared control scale: a chip is a label
  rather than something you type in, so it runs smaller than an input of the
  same name and needs no 44px floor (its toggle and remove buttons keep
  theirs). `md` is the size every chip already was, so nothing moves.

  The four values arrive as per-instance variables —
  `--greese-chip-height`, `--greese-chip-padding`, `--greese-chip-font` and
  `--greese-chip-remove` — so one of them can be overridden on a chip, or
  across an area, without picking a different size.

  Every chip now carries a `greese-Chip--size-*` class. A test asserting that a
  plain chip had no modifier class at all needs to say "only its size" instead.

- 2023ebd: Styles for EditableField's and NumberField's clear buttons, the textarea field, and ScrollCarousel's strip.
- 3598681: `pkg:@greese/ui/scss/breakpoints`: `container-set($set, $container)` writes Stack's, Grid's and AutoLayout's responsive props again for breakpoints measured against a named container instead of the viewport. `responsive-prop` takes a breakpoint set and a container name for it; the built CSS is unchanged.
- 8e6c274: - **`ContextMenu`**: a menu opened at the pointer, or hung off an element as a
  submenu. `Menu` is a menu _button_ — it owns a trigger and its own open
  state, and has nowhere to put a right-click — so this takes the other shape:
  the caller decides when and where it opens, and `anchor` carries both.

  ```tsx
  const [at, setAt] = useState<ContextMenuPoint | null>(null)

  <div onContextMenu={(e) => { e.preventDefault(); setAt({ top: e.clientY, left: e.clientX }) }}>…</div>
  <ContextMenu anchor={at} onClose={() => setAt(null)}>
    <MenuItem onSelect={rename}>Rename</MenuItem>
    <MenuSeparator />
    <MenuItem tone="negative" onSelect={remove}>Delete</MenuItem>
  </ContextMenu>
  ```

  Pass coordinates for a menu at the pointer, an element for a submenu, or
  `null` to close it — one prop, because where it opens and whether it is open
  are the same question. Point anchoring works by putting a zero-size element
  at the coordinates and anchoring to that, so there is no second positioning
  path: it is the same CSS anchor positioning, flip-to-fit included, that every
  other overlay uses.

  The items are `MenuItem` and `MenuSeparator`, unchanged — they close the menu
  they were chosen in, whichever of the two it is. The keyboard pattern is
  shared with `Menu`: arrows and Home/End move, type-ahead jumps, Tab and
  Escape close. It is a popover, so it draws above any dialog or panel and
  light-dismisses; focus moves to the first item on open and returns to where
  it was on close.

  - **`useTokenColors`**: resolved values for color tokens, for the one case that
    cannot use `var()` — drawing to a `<canvas>`.

    ```tsx
    const canvas = useRef<HTMLCanvasElement>(null)
    const [line, grid] = useTokenColors(canvas, 'primary', 'border')
    ```

    Everywhere else, naming the token in CSS is better and this hook is the wrong
    tool: the browser resolves it, nothing reads the palette in JavaScript, and a
    scheme change re-paints without a re-render. SVG counts as CSS — `fill` and
    `stroke` take a `var()` directly. A canvas has no CSS, and its context wants
    a real color string.

    Values are read from a live element, so they are whatever the cascade
    resolved there, a `ThemeProvider scheme` on an ancestor included, and they
    are re-read when the scheme changes. Roles a theme added through `extend`
    work alongside the built-in ones. The result is a tuple in the order given,
    stable while the values are, so it is safe in a dependency list.

  - `@greese/ui` gains the `greese-ContextMenu` block: a `greese-Menu` surface
    that sizes to its own items, since it has no trigger whose width to match.

- 6a70a7e: - **`NumberField`'s steppers stack.** Two buttons side by side cost about
  3.5rem of a field's width, which is most of a row in a dense panel; a caret
  above a caret costs one button's width. `steppers` picks the layout:
  `stacked` (the default), `split`, or `none` for a field changed only by
  typing and the keyboard.

  - **`NumberStepper`**: a minus at one end, a plus at the other, the value
    between them — the quantity-picker shape, where the two directions are far
    enough apart to hit without looking.

    ```tsx
    <NumberStepper label="Guests" min={1} max={12} defaultValue={2} />
    ```

    It is a `NumberField` throughout: same parsing, clamping, snapping and
    keyboard. Only the layout differs, so there is one implementation to keep
    right.

  - **`size` reaches every form control.** `Checkbox`, `Radio`, `RadioGroup`,
    `Switch`, `Slider` and `ColorPicker` take the same `xs`–`xl` scale that
    `Input`, `Select` and `Button` already did, setting font size, padding and
    the control's own box. A `RadioGroup`'s size reaches its radios through a
    custom property, so a radio inside needs none of its own.

    This is what `EditableField size` was missing: it passed its size to the
    text controls and silently dropped it for the rest, so a column of mixed
    fields came out ragged. Every control it renders now takes it.

  - **`Dialog` and `Drawer` take `hideClose`.** For a dialog dismissed some
    other visible way — a navigation drawer with its own toggle. Escape, a click
    outside and a swipe still close it; none of those is discoverable on its
    own, so a dialog that asks something keeps its button.

  - **`--greese-dialog-padding`** sets a dialog's inset, beside the
    `--greese-dialog-width` that was already there, so a drawer whose rows run
    edge to edge can say so.

  - **Buttons take the bold weight** (700, was 600): a button's label is the
    thing you act on, and it now reads as such against the semibold headings.

- 0e921ad: Copy text from anything. `copyToClipboard(text)` in `@greese/ui` uses the Clipboard API and falls back to a selected textarea where it's missing or refused, rejecting only when both fail. `useCopyToClipboard()` in `@greese/react` copies and holds the outcome (`status`, `copied`) for a moment, and `CopyToClipboard` puts it on any element: its one child copies on click, gets `data-copy-status`, and the outcome is announced. A function child gets the state, to show a check once copied.
- 6f5cba2: - **`EditableField`**: one field that renders whichever control a value asks
  for — `text`, `number`, `range`, `color`, `knob`, `checkbox`, `switch`,
  `radio`, `select`, `choice` (radios while the options are few, a dropdown
  when they are many) or `segmented`. It is for a panel built from data, where
  what is being edited decides the control: a property inspector, a settings
  sheet. Leave `type` out and a string, number or boolean picks its own, a hex
  string included.

  It is a row by default — the name on one side, the control on the other — so
  a column of them lines up down a panel; `layout="column"` stacks instead. It
  adds the things such a panel needs and a single control does not:

  - **`indeterminate`**, for a field standing in for several things that
    disagree: the control shows a placeholder instead of a value, and choosing
    one still reports it normally.
  - **`unit`**, the `px` or `%` or `°` after the number.
  - **`numDecimals`**, with a `step` finer than it widening the limit instead
    of rounding away the values the field's own arrows produce.
  - **focus selects the value**, because a field in a panel of them is read far
    more often than edited, and the edit is usually a replacement.
  - **`allowEmpty`**, so an emptied number or a cleared color reports `null`
    rather than being forced to a number.

  Controlled or uncontrolled, like every other greese input. The dial is a part
  of it rather than a component of its own.

  - **ColorPicker** gains three parts a working picker needs:

    - **`channels`** — numeric fields for the formats you name (`rgb`, `hsl`,
      `hsb`), so a known value can be typed rather than hunted for. They all
      edit one color, and a grey keeps the hue it came in with.
    - **`eyedropper`** — samples any pixel on screen. The button appears only
      where the browser has the EyeDropper API, so the hex field stays the way
      to enter a color you already know.
    - **`onSwatchesChange`** — makes the swatches a collection the reader keeps,
      with buttons that save the current color and clear the row.

    Its own small buttons are plain `<button>`s rather than IconButton, so a
    picker showing none of them does not carry Button's variants: 0.65 kB.

  - **NumberField fix:** a controlled field whose parent declines what was
    committed — a cleared field where empty means nothing, a value the parent
    clamps itself — was left showing the text that was typed rather than the
    value still in force. It now re-reads the value the moment the field is
    left. Found while giving EditableField's number type its `allowEmpty`
    default, where clearing a field left it looking empty while it still held
    a number.

  - **Budgets raised deliberately:** `ColorPicker` 4.35 → 5.45 kB (5.38 kB
    measured), the channel fields' HSL math and field table being the bulk of
    it. `EditableField` enters at 14 kB (10.87 kB measured): it reaches eleven
    controls, and a panel built from it would have imported most of them anyway.
    The whole-library budgets and `greese.css` rise by the new component.

  A number or color field reports `null` only with `allowEmpty`, and its
  `onValueChange` is declared as a method, so a handler that takes the value
  alone (`(value: number) => void`) fits where the field can't be cleared.

- 538a019: - **138 icons**, taking `@greese/icons` from 52 to 190. They come from porting a
  real app off another icon set, so they are the ones an application interface
  actually reaches for rather than a guess at a useful set: arrows and chevrons
  in all four directions, playback (`Play`, `Pause`, `Stop`, `PlayCircle`,
  `StopCircle`, `SkipBack`, `Volume`, `VolumeOff`, `Timer`, `Hourglass`),
  status (`CheckCircle`, `CloseCircle`, `AlertCircle`, `Warning`, `Block`,
  `PlusCircle`, `MinusCircle`), shapes (`Circle`, `CircleFilled`, `Rectangle`,
  `Triangle`, `Hexagon`, `PlusSquare`, `MinusSquare`), text formatting
  (`Italic`, `Underline`, `Strikethrough`, `AlignLeft`, `AlignCenter`,
  `AlignRight`, `AlignJustify`), layout (`Grid`, `GridOff`, `Columns`, `Rows`,
  `Fullscreen`, `FullscreenExit`, `ZoomIn`, `ZoomOut`), and
  `Eye`, `EyeOff`, `Lock`, `LockOpen`, `Link`, `LinkOff`, `ExternalLink`,
  `Code`, `Braces`, `Brackets`, `DotsVertical`, `Grip`, `SwapHorizontal`,
  `SwapVertical`, `SearchOff`, `ChevronUp` — and the rest of what an app's
  chrome needs: `Pencil`, `Share`, `Users`, `Image`, `Palette`, `Brush`,
  `Refresh`, `Undo`, `Redo`, `Loop`, `History`, `Flag`, `Flask`, `Ruler`,
  `Move`, `Target`, `Globe`, `Camera`, `Film`, `MusicNote`, `Playlist`,
  `BarChart`, `LineChart`, `Timeline`, `Gradient`, `PaintBucket`, `Eyedropper`,
  `Wand`, `Sparkle`, `Pin`, `PinFilled`, `HeartFilled`, `ThumbUp`, `ThumbDown`,
  `Trophy`, `Fire`, `Gift`, `Robot`, `Brain`, `Face`, `FaceSad`, `Gamepad`,
  `Wrench`, `Bug`, `Anchor`, `Chip`, `Coin` and more.

  All line art on the existing 16 × 16 grid at the set's own stroke, so they sit
  beside the originals. The docs' icon gallery is built from the exports, so
  they appear there with no page to write.

  - **A test over the whole set**: every icon renders, draws at least one path,
    and its path data starts with a move and holds only path syntax. The file is
    hand-authored, and a typo makes a path the browser silently drops.

  - **`touch-action-*` and `scrollbar-width-*` utility classes** (`@greese/ui`),
    in the effects group beside `cursor` and `user-select`. Both are whole-element
    concerns a dense interface needs and had to reach for a stylesheet for: a tool
    surface that pans and zooms has to stop the browser scrolling it, and a panel
    that scrolls inside a packed layout needs its scrollbar out of the way.

  - **Budget raised deliberately:** `icons: every icon` 2.35 → 7 kB (6.66 kB
    measured), because the set nearly quadrupled. `icons: one icon, tree-shaken`
    is unchanged at 400 B (386 B measured), which is the budget that matters to a
    consumer — importing one icon still costs one icon, and the PURE marks keep
    it that way.

- ecbc037: Stop `Input` forcing a twenty-character minimum width, and add `htmlSize`.

  A text field could never be narrower than about twenty characters, however
  little room the layout had for it. The cause was the frame's flex automatic
  minimum size: a flex item's minimum is its content's min-content width, and an
  `<input>`'s min-content width is whatever `size` says — twenty characters by
  default, a number nobody chose. `.greese-Input` set no `min-inline-size`, so
  that default became a floor every ancestor had to honour. A field holding three
  digits took as much room as one holding a sentence.

  `.greese-Input` now sets `min-inline-size: 0`. It still fills its container —
  a Field, a table cell, a flex row — but it imposes no floor of its own and
  shrinks to whatever the layout can give it.

  `htmlSize` is the native `size` attribute, renamed because `size` here is the
  control scale (`sm`/`md`/`lg`). Set it and the field is that many characters
  wide and the frame hugs it, overriding a container's `flex: 1`:

  ```tsx
  <Input htmlSize={7} defaultValue="#4f46e5" />
  <EditableField label="Degrees" type="number" htmlSize={3} />
  ```

  It reaches `TextField`, `NumberField`, `NumberStepper`, `MaskedInput` and
  `Combobox` through `InputProps`, and `EditableField`'s text and number rows take
  it directly.

  `Textarea` and `Select` have the same missing `min-inline-size: 0` on their
  frames; they are untouched here.

  The measure is in `ch` as well (`--greese-input-size`, which the React
  component sets): `size` alone measures in the font's average character, which
  is narrower than its digits, so `htmlSize={7}` clipped `#4f46e5`. A measured
  field doesn't shrink below its measure in a crowded row either.

- 6516f27: - **`Slider` can show its value**: `valueLabel="auto"` puts it in a bubble
  above the thumb while the slider is hovered, focused or dragged, `always`
  keeps it up, and `unit` goes after the number.

  ```tsx
  <Field label="Blend weight">
    <Slider value={weight} onValueChange={setWeight} valueLabel="auto" unit="%" />
  </Field>
  ```

  The bubble is a `Tooltip`, so it is the same surface, placement, flip-to-fit
  and motion as every other floating thing — not a second implementation. It
  hangs off a zero-size anchor sitting at the thumb rather than off the input,
  so it follows the value instead of floating over the middle of the track; the
  thumb's travel is inset by half its width at each end, which the anchor's
  `calc()` accounts for.

  It is **off by default**, and deliberately: the filled part of the track is a
  custom property written straight to the element, so an uncontrolled slider
  does not re-render as it moves, and showing the number gives that up. You opt
  into the cost.

  The bubble is presentational (`role="presentation"`, no `aria-describedby`).
  A range input already announces its value, so a bubble repeating it would be
  announced twice; with a `unit` the slider sets `aria-valuetext` instead, which
  is the one place a unit can be spoken.

  - **`Tooltip` takes `open` and `describe`.** `open` drives it from outside —
    `true` keeps it up, `false` turns it off entirely — and replaces the hover,
    focus and tap behaviour, so the tooltip shows exactly when you say. A
    controlled tooltip shows and hides at once rather than through the hover
    delay, because a delay belongs to hovering. `describe={false}` makes it
    presentational, for a trigger that already exposes the same thing.

  - **Fix: `Slot` no longer lets a child's `undefined` clobber the Slot's own
    prop.** A prop the child did not set is not an override, but spreading it
    overwrote the value anyway. Every greese control passes
    `useFieldControl()`'s `aria-describedby` straight through, and it is
    `undefined` outside a `Field` — so a `Tooltip` around a `Switch`, a `Slider`
    or any other control wrote its id onto the trigger and then erased it, and
    described nothing at all. Costs about 10 B in every component.

  - `@greese/ui` gains `greese-Slider-wrap` and `greese-Slider-thumbAnchor`,
    present only when a slider shows its value, so a plain slider's markup is
    unchanged.

- 998e63f: Keep a theme in your source as a folder of SCSS modules, take a theme's layers back from part of a page, and build utilities from Sass (ADR 0034).

  - `@greese/ui/theme-files`: a theme as data (Theme Studio's JSON) and the SCSS it becomes. `specToLayout()` writes the documented layout: `main.scss`, `_settings.scss`, a module per token group, per component, for motion, shapes and utilities, each editable alone. `specToScss()` still writes one file. Theme Studio writes the layout by default (`GREESE_THEME_OUTPUT=layout,scss,css` chooses), and leaves alone any layout file whose first line you deleted.
  - Every setting has a place in the layout. `_settings.scss` always holds the breakpoints, and builds greese ui's stylesheet (`_library.scss`) and utility classes (`utilities/_index.scss`) with them whenever they differ from the library's (`$library`, `$utilities`), so changing one moves every media query. Every token group's file and the type system's list the defaults the theme leaves alone, commented, and the motion file its options. A shape's sizes are a `$shapes` map at the top of its file (`shapesCss()` takes a size writer). `specToLayout(spec, source, { components })` keeps loading component files of your own, and Theme Studio passes them.
  - The kit: `tokens()` calls add up, so a second call writes only what it changes instead of restating the theme. A `tokens()`, `typography()`, `motion-defaults()` or `page-transitions()` call that sets nothing writes nothing. `scope($name)` is `theme($name)`, or the page for `null`, `false` or `''`.
  - The stylesheet declares its breakpoints once, from the ones it's built with, and their keys in order (`--greese-breakpoint-keys`). `configureBreakpoints()` in `@greese/react` reads them when called with no argument.
  - Theme layers can be taken back. `.greese-reset-color`, `-shape` and `-motion`, and `.greese-reset` for all three, work on any element (defaults in the opt-in `css/resets.css`, also `@greese/react/css/resets.css`). The kit's `reset(…)` declares a layer's defaults in any rule, and inside `component()` leaves that component out of the layer's theme rules for the rest of the build. Every theme rule the kit writes carries a zero-specificity guard for its layer (`reset-guard()`, `themed()`). `component(Name, $layer: …)` files styles under a layer other than shape.
  - `pkg:@greese/ui/scss/utilities`: `utilities.classes($groups, $only, $prefix)` writes the utility classes from Sass, with the build's breakpoints, from the same table as `utilities.css`.
  - `pkg:@greese/ui/scss/core` and `pkg:@greese/ui/scss/components/<Name>`, for a Sass build that picks its components.
  - The shape themes are regenerated with the guards (about 4% larger).

### Patch Changes

- 0a4281e: A ScrollCarousel's or Carousel's button at an end, already invisible, no longer takes pointer events, so clicks reach what it covers.
- 43294bc: **Fix: `EditableField`'s colour picker took clicks while closed.** Its popover
  declared `display: grid` unconditionally, and an author `display` beats the
  user agent's `[popover]:not(:popover-open) { display: none }` — so the closed
  popover stayed laid out and hit-testable. Invisible, because the overlay exit
  sets `opacity: 0`, and sitting over the controls, taking the presses meant for
  them: pickers appeared to open themselves. `display` is scoped to
  `:popover-open` now.

  A test guards the whole kit against the same mistake. It finds the classes that
  land on a popover from two sources that can't drift — the `:not(:popover-open)`
  rule `floating.enter-exit` emits for each overlay root, and the `className` a
  component hands an overlay — and fails on any `display` declared on one of them
  without its open state. The docked `Sidebar` is the one exception, and it is
  qualified by its layout class so it can never match an off-canvas sidebar.

  If you set `display` on a popover of your own, scope it to `:popover-open`.

- a0e71e0: Let `--greese-dialog-padding` set a dialog's or drawer's inset. The base rule
  already read it, but every drawer placement and the full-size dialog set
  `padding-block` separately from the raw `--greese-space-5`, so the variable had
  no effect on exactly the surfaces that most often want to run edge to edge — a
  navigation drawer whose rows are full-width targets. Each of those now reads the
  variable too.

  Set, it is the padding verbatim; unset, the default still keeps a full-height
  drawer's content clear of a notch or a home indicator, so an app that opts into
  `0` is opting out of that floor as well.

- 3cb005c: Let an `EditableField` color swatch fill its row, like every other control.

  The swatch was a 1.75rem square pinned to the end of the row while the text,
  number and select rows beside it took all the slack. In a panel of fields that
  read as a mistake: the one field whose whole job is to show a value you can
  only see — the color itself — showed the least of it, and was the smallest
  thing to hit.

  It now stretches like a text field, with its old square size as a floor: the
  button has no content of its own, so nothing else would stop it collapsing to
  a sliver in a narrow panel.

- c0c4381: A checked Switch's thumb stays inside its track at every size (a fixed 1rem overshot the small one by 2px, which a scrolling container clipped), and a Dialog's body leaves room for focus rings at its edges.
- dc360d4: `Text` with no `variant` is body copy (`p1`), and its `tone` and `weight` show again.

  `Text` now always carries a type variant, `greese-Type--p1` when none is named.
  The variant classes come after `Text`'s in the stylesheet and set `color` and
  `font-weight` themselves, so they beat `.greese-Text--<tone>` and
  `.greese-Text--<weight>`: `<Text tone="muted">` rendered in the body colour and
  `<Text weight="bold">` at the variant's weight. The tone and weight classes are
  now doubled with `.greese-Text`, so they win. A `tone` also wins over a named
  variant (`<Text variant="caption" tone="muted">` is muted), which it never did.

- 4f43cc9: A theme now applies its `font.body` to its own scope. `body` reads `--greese-font-body` from `:root`, so a theme on a `ThemeProvider` wrapper set the variable but text kept inheriting the default font from `<body>`.
- c069414: The `xs` control size is 1.5rem (24px) on every control and every pointer: Button, IconButton, ToggleButton, Select, Input, Combobox and ActionSelect all line up at it, where it was 1rem and each grew to its own content (19 to 30px). Its inline padding is `--greese-space-2`. A Select's line no longer grows it on touch, a Combobox's toggle fits inside an `xs` field, and EditableField's colour swatch is its size's height on every pointer (it gets a `greese-EditableField--size-*` class), with a 44px hit area on touch.

## 1.1.0

### Minor Changes

- 1f48cc2: Ship the color themes: `@greese/ui/themes/{greese,ocean,sunset,forest,grape,mono,candy}.css` (and `.scss` for the kit). Each sets the brand colors and tinted neutrals in both schemes, and nothing else, so it composes with any shape or motion theme.
- 914ba96: PageTransition styles play a route's or a navigation's own effects and pace (`greese-PageTransition--route-enter`, `--route-exit`, `--route-pace`).

## 1.0.0

### Major Changes

- 0d736a8: 1.0.0: the first stable release of greese ui.

### Minor Changes

- 29a566a: Foundations: design tokens (color, space, radius, typography, shadow, z-index,
  motion, breakpoints) as CSS variables, Sass maps and TS constants; color
  schemes via `useColorScheme` and `getSchemeScript`; scoped themes via
  `createTheme` and `ThemeProvider`; responsive-prop resolution; `Slot`,
  `useMediaQuery`, `useBreakpoint`, `useBreakpointValue`, `useControllableState`,
  `VisuallyHidden`; opt-in `base.css`.
- fcad516: Add the `onNegative` color token, for content on negative (destructive) surfaces.
- 85f75c1: Add the `scrim` color token, which dims the page behind modal dialogs and drawers.
- 7b2526f: Add the CSS-free Sass module `@greese/ui/scss/maps`.
- 0cb3cbf: Brand colors lead with `primary`. Components use `primary` for interactive emphasis and default to `tone="primary"`; `accent` is now a color of its own (pink by default), after `tertiary`, and every `tone` prop takes `primary`, `secondary`, `tertiary` and `accent`. `on<Color>` tokens are renamed `<color>Content` (`--greese-color-primary-content`). `createTheme` (and the SCSS kit's `tokens()`) derive a WCAG AA-safe content color and a strong shade from any brand color a theme sets, and the tokens package exports `contentColor`, `contrastRatio`, `luminance` and `deriveColors`. Scroll reveals now wait until an element is wholly in view and clear of the bottom edge.
- ef6188f: Breakpoints can gain keys at build time: `@use 'pkg:@greese/ui/scss' with ($breakpoints: (…, tablet: 700px, …))` gives the new key responsive classes, and every breakpoint is now a custom property, `--greese-breakpoint-<key>`, in the built CSS. `configureBreakpoints({ tablet: 700 })` registers it for the hooks, `getBreakpointKeys()` lists the keys in effect, and `BreakpointKeys` can be augmented so `Responsive<T>` accepts it.
- 76471a6: Add a `text` Button variant (`greese-Button--text`): no box, in the surrounding text's color, with a faint tint on hover, so a button reads as plain text.
- 846d9d3: Color: `primary`, `secondary` and `tertiary` roles (each with `…Strong` and `on…`), and a palette of 22 hues × 11 shades like MUI's `colors`. `accent`, `accentStrong`, `onAccent` and `focusRing` now follow `primary` by default, so setting `primary` rebrands every component; the default colors are unchanged. Use the palette as `palette.lavender[600]` (or `import { lavender }`) in TypeScript, `lavender-600` or `greese.palette(lavender, 600)` in the SCSS kit, and `var(--greese-lavender-600)` with the opt-in `@greese/ui/palette.css`.
- d2f0b0d: - **Three-dimensional effects:** base `turnX`, `turnY`, `hinge` and `depth` (a `transform` with its own perspective), and the combos `flipUp`, `flipDown`, `flipLeft`, `flipRight`, `flipOut<Dir>` (each its entrance reversed), `depthIn`, `depthOut`, `swingIn` and `swingOut`. Overlays leave with them: an exit now carries `transform` (and a swing's pivot), and the floating styles transition it.
  - **`xl` radius (24px)** on the radius scale.
  - **Shaped cards transition `translate` only when interactive**, as unshaped ones do, so the runtime's effects (a pocket's mask) stay in step with them.
- bc388f4: Define the built-in effects once, in `@greese/ui` (`src/effects.ts`, exported as `builtInEffects` and from `@greese/ui/effects`), as base effects that animate one property each and combo effects made of them. Effects take arguments in a sequence: `fadeIn(0.25, 0.8)`, `fadeIn({ end: 0.8, duration: 1 })`, with `duration`, `offset` and `ease` on every call. There is no effect kind: an effect that ends at rest is a CSS preset, one that ends away from it is an overlay exit, so `exit` takes any effect and `GreesePreset`, `GreeseExit` and `GreeseInteraction` are removed. The kit gains `effect()`, which writes an effect's CSS as the built-ins have it, and `motion()` accepts all of them.
- 42b1080: Add tokens the system doesn't have: `greese.tokens((), $extend: (color: (brand-ink: …), space: (9: 4rem)))` in the SCSS kit and `createTheme({ extend })` declare `--greese-<group>-<name>` (a color in both schemes), and `token()` and component variables accept them afterwards. Names that already exist and unknown groups still fail.
- fb57e8d: `@greese/ui` now holds all of greese ui's CSS: the stylesheet (`styles.css`, `base.css`, `css/<Name>.css`), the Sass kit (`@use 'pkg:@greese/ui/scss/kit'`) and `style-manifest.json`, with no framework attached, so plain HTML and other frameworks can use it. `@greese/react` is JavaScript only and depends on it; its `styles.css`, `base.css` and `css/*` paths still work, and its `component-styles.json` says which blocks each component renders.
- 9ddf302: - **`Header`:** the page's header, with `brand`, navigation (children) and `actions`, sticky by default and `floating` (inset, rounded and raised) on request. A sticky header sets the page's scroll padding to its height (`--greese-header-height`, 3.5rem), so in-page links land with their target just below it, with no JavaScript and nothing for each section to declare.
  - **`Footer` and `FooterSection`:** a `brand` beside columns of links, each a `<nav>` named by its heading, over a `legal` row.
  - **Accordion and Collapsible icons:** `icon` (or `null` for none), `openIcon` for an icon per state, and `iconTransition` (`rotate`, `fade`, `none`); an Accordion sets them for every item, and an item's own win. The default chevron still turns, by `--greese-collapsible-icon-turn`.
  - **Hovers that move the element stay put under a still pointer:** a `greese` hover lasts while the pointer is over where the element rests, and an interactive Card's hit area reaches the 2px it rises, so neither bounces.
  - **`ContrastIcon`** in `@greese/icons`.
- dda476a: Every icon lives in `@greese/icons` (ADR 0020). `@greese/react` now depends on it and draws its own glyphs (close, menu, chevron, plus, minus, check, sort, star) with it, in place of its inline SVGs. `createIcon` takes `{ viewBox, strokeWidth, filled }`, and the package gains `ChevronLeft`, `Minus`, `Sort`, `CheckDash`, `StarFilled`, `Accessibility`, `Copy`, `Dots`, `Feather`, `Github`, `Layers`, `Motion`, `Phone`, `Replay` and `Server`. `Checkbox` and `Table` style their icons by path position; the `greese-Checkbox-check`, `greese-Checkbox-dash` and `greese-SortGlyph-*` classes are gone.
- dd37a16: New effects: `slideDown`, `slideRight`, `slideLeft`, `popIn` (CSS presets), `popOut`, and `fall`, the opposite of `rise`. `lift` is now `rise`, and `pop` no longer fades (`popIn` does). A negative number in a sequence (`'slideUp,-0.2,popIn'`) backs the next step up so it overlaps the last. A scope takes `replay`: change it and its entrances play again in place, without remounting. An `inView` scope that was already on screen is no longer left held.
- 3f2d822: Add `greese={{ scope }}`: a parent that orders every entrance inside it, at any depth, in document order (`stagger` apart, after `delay`, optionally held until it scrolls into view). A scope inside a scope takes one position in the outer one. It only sets each entrance's start time (`--greese-motion-scope`), so the entrances stay CSS animations; the code is a lazy chunk under 1 kB, loaded only when a scope is used, and components without one pay about 30 B.
- 2ec4988: **The motion themes change pages too (ADR 0029).** Snappy pops pages away and in; Gentle fades the old page while the new one comes into focus; Wipe wipes the next page over the last, from the right going forward and the left going back; Pocket sinks pages into a slot at their foot and raises the next out of it (and the reverse going back); Depth turns pages like the faces of a cube. Each theme's page duration, ease, stagger (and Snappy's exit order) match its story.
- d2f0b0d: Overlays take their motion from the theme. Popovers, menus, tooltips, dialogs, drawers, the sidebar and speed-dial actions no longer carry transitions or `@starting-style` of their own. Each component only says what it is and where it opens from (`--greese-overlay-origin`), and reads its motion from a role the theme assigns:

  - **Arriving:** `--greese-motion-overlay`, or one kind's: `-dialog`, `-popover` (menus and speed-dial actions too), `-tooltip`, `-drawer` (the sidebar too), over `--greese-motion-overlay-duration`. The base theme fades in from the origin; a drawer slides from its edge.
  - **Leaving:** `--greese-motion-overlay-exit-*`, or one kind's (`--greese-motion-dialog-exit-*`…), over `--greese-motion-exit-duration` and `-exit-ease`. One transition remains, which keeps a closing overlay rendered while its exit plays.
  - **Scrim and toasts:** `--greese-motion-backdrop` and `--greese-motion-toast`, with their `-duration`.

  A component's `motion()` in the kit, or an instance's `greese` prop, overrides its role.

- 846d9d3: Add the `greese.overrides` cascade layer, between `greese.components` and `greese.utilities`, to `LAYER_ORDER`. `scss/maps` now also exports every token's default (`$color`, `$scalars`) and the layer order (`$layer-order`), for build-time themes.
- 57b06b5: **Page transitions, in CSS (ADR 0029).** Every built-in effect plays on a view transition's snapshots: `greese-PageTransition--enter-<name>` on the new page, `greese-PageTransition--exit-<name>` on the old one (exits now have `@keyframes` from rest, `cssPlan().leave`), and `greese-PageTransition--theme` / `--theme-back` follow the theme. `motion-defaults()` gains the page roles (`page`, `page-exit`, `page-back`, `page-back-exit`, `page-duration`, `page-ease`, `share-duration`, `share-ease`, `page-stagger`, `page-exit-order`, `page-mode`), and the kit gains `page-transitions()` for selector rules. Under reduced motion greese snapshots don't animate.
- e3a8296: `greese-PageTransition--enter-none` and `--exit-none` keep one side of a page transition still while the other plays.
- 7b0b8e0: Remove the font-size tokens (`--greese-font-size-*`, the `fontSize` group and export) and the `size` prop of `Text` and `Heading`: text sizes come from the type system's variants. `Text` takes a `variant`, `Heading` takes the variant of its level unless given another, and components read the variants' sizes. Migrate `size="sm"` to `variant="p3"` (`xs` to `caption`, `md` to `p2`, `lg` to `s2`, `xl` to `s1`, `2xl` to `h3`, `3xl` to `h2`, `4xl` to `h1`).
- d2f0b0d: - **Scroll reveals work on shaped elements.** A reveal waited for IntersectionObserver to report the element 99% visible, which a shape's clip-path (its own or an ancestor's) prevents, so shaped pages never revealed. It now reads the element's box as the page scrolls, while any of it is in view.
  - **`track` color token:** the empty part of a progress bar, a slider and a radial progress, a step lighter than the borders in dark mode (steel 600), so it shows on the canvas and on surfaces.
  - **Hooks for the current tab and segment:** `--greese-tab-current-bg` and `--greese-tab-current-edge`, `--greese-segment-current-bg` and `--greese-segment-current-edge` (a color variant outlines them; unset, they look as before).
- d2f0b0d: - **`--greese-radius-round` token (`50%`)**, which the `round` radius role points at: knobs, thumbs, radios, step markers, avatars and status dots read the role, so a theme can square them.
  - **Tab panels and accordion content stay put** while their children enter, a stagger apart.
  - **Segmented control:** icons in a segment are centered with its text.
  - **AvatarGroup:** the group's `size` now applies to its avatars (each avatar's own size used to win), and it shows the one avatar left over instead of "+1".
- 9446966: Add ScrollSpy: the same-page `#id` links inside it get `aria-current="location"` while their section is the one the page is scrolled to (the last one above `offset`, or the last at the bottom of the page), and `onActiveChange` reports its id. Works with any router's links; `currentSection()` is exported.
- d2f0b0d: Export the partials the components are written with, for theme authors (ADR 0021): `pkg:@greese/ui/scss/mixins` (`up`, `down`, `hover`, `focus-ring`, `touch-target`, `motion-safe`, `component-root`), `pkg:@greese/ui/scss/tones` (`$tones`, `$brand`), `pkg:@greese/ui/scss/floating` (`surface`, `anchored`, `enter-exit`) and `pkg:@greese/ui/scss/controls` (`$sizes`, `frame`, `focused`, `no-zoom-font`). Each is the module the library itself loads, so a build's own `$breakpoints` reach them.
- fbaeb2a: **Shape themes reach more components.** Select, Textarea and OtpField's boxes take the field shape; collapsible headers become bars that take the small shape in every shape theme; menus, popovers and tooltips draw their border along the shape; an accordion item's panel (`.greese-AccordionItem > .greese-Collapsible-content`) takes the item's shape, not the `<details>`, which no longer adds padding of its own; Bevel and Ridge's switches get a track pointed at both ends to hold their diamond knob, and their diamond radios fit inside the radio's box, so a scroller's edge no longer cuts a point off; Extrude and Tilt's accordions drop the rules between items for a gap; toasts keep their tone's edge; chat bubbles are cut to Bevel and Folio with their tail; avatars are cut squares in Bevel and rounded squares in Soft and Extrude; Folio's status dots get a fold to their size. Extrude draws a button's lower edge in a shade of its own face at 3:1 or more against it (WCAG 1.4.11), so dark buttons show their depth too; it adds depth to alerts, tabs (the current one pressed in), progress fills, the chosen segment, code boxes, collapsible headers and the speed dial. Badges are opaque in every variant (`--greese-badge-surface`), so what they're pinned to doesn't show through.

  **Changed markup:**

  - `Textarea` renders a frame (`.greese-Textarea`) round the textarea (`.greese-Textarea-control`), like Input: `className` and `style` go to the frame, every other prop and `ref` to the textarea.
  - `FileInput` renders a frame (`.greese-FileInput`) with the native input visually hidden (`.greese-FileInput-control`), a greese ui Button as its label (`.greese-FileInput-button`) and the chosen files' names (`.greese-FileInput-files`). `className` and `style` go to the frame. New props: `buttonLabel` and `placeholder`. `--greese-file-height` and `--greese-file-padding` are gone (the Button's size sets them).
  - `Menu` scrolls an inner `.greese-Menu-viewport` (`role="none"`), not itself.
  - `SpeedDial`'s trigger is an IconButton and each `SpeedDialAction`'s icon a Button's look, so they take the theme's button shape, depth and states.

  **New:** `Progress` takes `loading`: the filled part runs with diagonal stripes in the bar's two colors, and the bar is `aria-busy`. `ScrollSpy` follows sections that scroll in a panel of their own, measured from the panel's top.

- d2f0b0d: Add shapes (ADR 0024). `@greese/ui/shapes` is a build-time compiler: each shape is points anchored to the box, in percentages, pixels and named parameters. It compiles to one clip and a border ring from the same geometry. Registered `@property` parameters animate hover, press, focus and entrance, so borders never come apart from the shape and transforms carry both.

  It also ships presets (bevel, notch, tag, hexagon, slant, dog-ear, ticket, zigzag, shield) and four shape themes, `@greese/ui/themes/{bevel,ticket,ridge,folio}.css` (and `.scss`), for any color theme. Each shape is a `greese-shape-<name>` class too.

- 9446966: Add `createStoredValue()` (@greese/ui) and `useStoredState()` (@greese/react). They keep a value in localStorage or sessionStorage safely: in memory where storage is missing, blocked or full; parsed, with optional validation; shared by every reader of the key, in this tab and across tabs. `useColorScheme` now saves through it.
- 55d8757: Add the `@greese/ui/scss/config` Sass entry: the build's settings (`$breakpoints`, `$typography`) alone, emitting no CSS, so a theme can be compiled against a custom build without compiling the whole stylesheet again.
- 174659b: Effects can be retuned and added by a theme. The kit's `keyframes()` mixin replaces an entrance preset's `@keyframes` (or adds one), `defineGreeseEffect()` under a built-in's name now replaces that effect in the runtime, and `removeGreeseEffect()` forgets a definition.
- d2f0b0d: Theme layers (ADR 0025).

  - **Tabs:** the current tab has a tinted background over its underline, and a tab panel enters each time its tab is chosen.
  - **Effects:** mask properties count as at rest, so an effect can wipe or reveal with a mask; its last step is kept.
  - **Shapes:** `SHAPE_TARGETS` covers Input, SegmentedControl, Segment, Tab, AccordionItem, Status, Avatar, SpeedDial, Popover, Menu, Tooltip and Toast, with targets that only clip, per-component focus, and smaller features for small buttons.
  - **Theme files:** shape themes set no colors and have square corners, and four motion themes are new: `@greese/ui/themes/{snappy,gentle,wipe,pocket}.css`.

- d2f0b0d: Themes reassign roles; they never overwrite tokens or effects (ADR 0025).

  - **Radius roles:** components read `--greese-corner-control`, `-field`, `-surface`, `-panel`, `-inset`, `-pill` and `-round` (the `corner` token group), each pointing at the radius scale, instead of the scale itself. A shape theme points the roles at `none`; `--greese-radius-md` stays 8px.
  - **Motion roles:** the kit's `motion-defaults()` assigns which effect plays where and which timing it takes: `theme` (the new `greese="theme"` entrance), `content` (tab panels' and an opening accordion's children), `rows` (table rows, a stagger apart; none by default), `toast`, `backdrop`, the overlay roles and their exits, `*-duration` (a duration token by name, or a time) and `enter-ease`/`exit-ease` (an easing token by name, or a curve). Effect names are checked, and the kit carries the assigned entrances' own keyframes.
  - **Built-ins keep their keyframes:** `defineGreeseEffect()` under a built-in's name is never played, and the kit's `effect()` and `keyframes()` refuse one. Name your effect and assign it instead.
  - **`'theme'`** is a `greese` entrance (`enter`, `inView`) that plays whatever the theme assigns, `fadeUp` in the base theme.

- acce602: Add the type system: the variants `p1`–`p3`, `h1`–`h6`, `s1`, `s2`, `caption` and `button`, each with a size, weight, letter spacing and line height (and optional `fontFamily`, `fontStyle`, `textTransform`, `fontFeatureSettings`, `fontVariationSettings`, `fontStretch`, `textWrap`, `wordSpacing`, `fontVariantNumeric`, named as the CSS properties in their JavaScript form) that change across breakpoints, as `--greese-type-<variant>-<css-property>` custom properties. `Text` and `Heading` take a `variant` (`Heading`'s `level` still sets the element), `.greese-Type--<variant>` styles any element, and `createTheme({ typography })`, the kit's `typography()` and `$typography` change the values. Buttons read the `button` variant.
- d4b7cb1: Add utility classes (ADR 0019): about 2,300 single-purpose classes named for the property and the value (`p-4`, `pt-3`, `ms-2`, `display-flex`, `text-center`, `justify-content-between`, `bg-primary`), with breakpoint and `hover` variants, in `@layer greese.utilities`. `@greese/ui/utilities.css` is the whole set; `greese-utilities --content "src/**/*.tsx" --out utilities.css`, `greeseUtilities()` from `@greese/ui/vite`, and `purgeUtilities()` write only the classes your source uses.
- 4eeec0e: Add the `white` and `black` color tokens (`--greese-color-white`, `--greese-color-black`, and `white` and `black` exports with the palette), and build every default color from the palette: the greys, content colors, scrim and shadows too. The dark content ink is now `steel-999`.
- d2f0b0d: Add built-in effects that reveal or hide with a mask, so they compose with a shape's clip-path:

  - **Wipes:** `wipe<Dir>` and `wipeOut<Dir>` in eight directions (`Right`, `Left`, `Up`, `Down`, `DownRight`, `DownLeft`, `UpRight`, `UpLeft`), plus `wipeOpenX/Y` and `wipeCloseX/Y` from and to the middle.
  - **Irises:** `irisIn` and `irisOut` from and to the middle, and `iris<Dir>` and `irisOut<Dir>` in the same eight directions, an opening in the element's proportions that closes toward that side or corner, or opens from it (each entrance is its exit reversed). Every iris opens to 142%, just past the far corner, so the whole run is visible change.
  - **Pockets:** `pocket<Dir>` and `pocketOut<Dir>` in the same eight directions, which rise out of, or sink into, a slot at one of the element's own edges.

  The leaving ones are overlay exits too: an overlay (Dialog, Drawer, Popover, Menu, Tooltip, Sidebar, SpeedDial) holds the exit's mask as it closes. An exit now sets everything an overlay moves to (`translate`, `scale`, `opacity` and its mask), so what it doesn't move stays put. Mask images use `black` and `transparent`, which survive the runtime's value mixing.

### Patch Changes

- d5f0774: **A disabled link styled as a button can't be clicked without script:** `.greese-Button` that isn't a `<button>` lets the pointer pass through while `aria-disabled="true"`, as Button's server-safe press blocking needs.
- 24d69e4: `scaleIn` no longer fades, and `scaleOut` is its opposite (a scale down to 0.92, with no fade). `describeGreeseEffects()` returns every built-in effect as plain keyframes.
- 1c3769e: **An interactive Card no longer bounces under a pointer resting on its lower edge.** The strip that keeps its hit area under the pointer after it rises was clipped by the card's `overflow: hidden`, and reached only 1px past a border. An interactive card now doesn't clip its overflow (CardMedia rounds its own corners where it bleeds to an edge, so media looks the same), and the strip reaches 4px.
- fafac8d: A named theme's page roles (`motion-defaults()` inside `theme(name)`) also go on the root while the theme is on the page (`:root:has([data-greese-theme='<name>'])`), so a theme scoped to an element, with `ThemeProvider` say, reaches the view transition snapshots, which inherit from the root.
- ce01b4d: Page transitions: a live exit's styles come off when the new page has committed, not two frames after the exit, so members no longer flash back on the old page. A page that left live still plays the new page's entrance, over what the exit left of the old one fading out. A page's snapshots show only the screenful in view, so effects sized by the element (pockets, pops, flips) play on screen rather than across the whole page's height. What stays still while a page changes (a header named `'still'`) stays on top, so the page moves beneath it. New effects `flipOver<Dir>` and `flipOverOut<Dir>` turn half over with the back face hidden: a pair played together turns as one panel, the old page on its front and the new one on its back.
- 1e2057f: Page transitions' snapshot rules start with `html` (`html::view-transition-old(…)`): the snapshots belong to the root, and a selector with nothing before `::view-transition-*` was tried against every element at every style recalculation, about 15 ms of blocking time on a large page.
- c55f9f7: **Shaped buttons keep their size on touch screens.** Under Bevel, Ticket, Ridge and Folio, buttons and chips no longer grow to 44 × 44px on coarse pointers, so a theme never changes layout (a phone header's icon buttons ran off the screen). The shape's border no longer draws offset across a button on touch screens: it reset `inset` but kept the touch target's `translate` and size. `ShapeTarget`'s `touch` option still grows an element that asks for it.
- 3916354: A shape theme that cuts tabs (Bevel, Ticket, Ridge) draws the current tab's edge along its shape, as it does the chosen segment's: with a color variant that outlines it (Outline), the ring follows the cut corners instead of being cut off by them.
- a742762: A docked `Sidebar` no longer stays off canvas in apps whose CSS is minified by lightningcss (Vite's default): it folded the docked rule's `translate: none; scale: none; transform: none` into `transform` alone, and the off-canvas `translate` came back.
- 0a89c25: **A docked `Sidebar` shows under every motion theme.** Above its breakpoint it's never open as a popover, so a theme's drawer exit applied to it: Snappy's scaled it to nothing, and a wipe's or pocket's mask could hide it. The docked column now puts scale, transform and mask back to rest, as it already did opacity and translate.
- 1f9779b: **`createStoredValue` (and `useStoredState`) hears only its own storage area from other tabs:** a `sessionStorage` write no longer wakes a `localStorage` value with the same key, and the other way round.
