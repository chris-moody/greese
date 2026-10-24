# @greese/react

Mobile-first, TypeScript-first React components. All styling is static CSS
compiled at build time and themed with CSS custom properties, so there is no
CSS-in-JS runtime. The CSS is [`@greese/ui`](../ui), which this package
depends on (with [`@greese/js`](../js), for the `greese` prop), so one install
is enough.

```bash
npm install @greese/react
```

```tsx
// Once, at your app root:
import '@greese/react/base.css' // optional: reset + body defaults
import '@greese/react/styles.css' // @greese/ui: tokens + component styles
```

Requires React 19. `styles.css` styles only `.greese-*` classes. Import
`base.css` too if GreeseUI owns the whole page.

To ship only the CSS you use, import per-component stylesheets instead of
`styles.css`. Each one pulls in the shared core and the components it builds
on, and bundlers de-duplicate the shared parts:

```tsx
import '@greese/react/css/Button.css'
import '@greese/react/css/Dialog.css' // + IconButton, Button, VisuallyHidden
```

## Color scheme

The scheme follows the OS by default. To let users choose:

```tsx
import { getSchemeScript, useColorScheme } from '@greese/react'

// In <head>, so a saved choice applies before first paint:
;<script dangerouslySetInnerHTML={{ __html: getSchemeScript() }} />

// Anywhere:
const { scheme, resolvedScheme, setScheme } = useColorScheme()
setScheme('dark') // 'light' | 'dark' | 'system'
```

## Themes

No provider is needed to use GreeseUI: the styles load once and every component works. `ThemeProvider` is optional. Reach for it only to apply a `createTheme()` theme, or to force a color scheme, on all or part of the page.

```tsx
import { createTheme, ThemeProvider } from '@greese/react'

// At module scope: builds static CSS once.
const brand = createTheme({
  name: 'brand',
  color: { primary: { light: '#7c3aed', dark: '#c4b5fd' } },
  radius: { md: '12px' },
})

<ThemeProvider theme={brand}>…</ThemeProvider>
<ThemeProvider scheme="dark">…force dark for this section…</ThemeProvider>
```

The provider adds no layout box (`display: contents`). Use `asChild` to scope
your own element instead. Providers can be nested. Themes replace each other
rather than stacking, so to extend a theme, create a new one with more
overrides.

You can also theme in plain CSS, with no JavaScript:

```css
:root {
  --greese-color-primary: #7c3aed;
}
```

Every library rule sits in `@layer greese.*`, so unlayered CSS in your app always
wins over it. You never need `!important`.

## Component overrides: the SCSS kit and Theme Studio

The kit is `@greese/ui`'s (install it too to `@use` it directly).

The SCSS kit compiles a theme of tokens, component overrides and theme-wide
motion in your build. You write component, part and modifier names; it adds
the `greese-` prefix, and stops the build on names the library doesn't have:

```scss
@use 'pkg:@greese/ui/scss/kit' as greese;

@include greese.tokens(
  (
    color: (
      primary: (
        light: #7c3aed,
        dark: #c4b5fd,
      ),
    ),
  )
);

@include greese.component(Button) {
  font-weight: 700;
  @include greese.vars(
    (
      tone: greese.token(color, positive),
    )
  );
  @include greese.modifier(outline) {
    border-width: 2px;
  }
}

@include greese.component(Card) {
  @include greese.motion(
    (
      enter: fade-up,
    )
  ); // every Card, in CSS
}
```

Overrides land in `@layer greese.overrides`. They beat component styles, and
style props and the `greese` prop still beat them per instance. Compile with
Sass's `NodePackageImporter`. A named `greese.theme(brand) { … }` works with
`<ThemeProvider theme="brand">`.

`@greese/ui/style-manifest.json` lists every component's classes,
parts, modifiers, states and variables. Theme Studio (`npm run studio` in
this repository) edits a theme visually and writes the SCSS and CSS. See
**Guides/Styling components** in the docs.

## Icons

GreeseUI ships no icon set: every icon slot takes any `ReactNode`. The
optional `@greese/icons` package has the line icons these docs use, sized
to text and drawn in `currentColor`:

```tsx
import { SearchIcon } from '@greese/icons'

;<IconButton label="Search">
  <SearchIcon />
</IconButton>
```

## Layout

`Box`, `Stack`, `Grid` (`container` for a grid, `size` for a cell), `Tile`, `AutoLayout` + `AutoLayoutItem` (items
sized in columns that grow into spare room), `Container`, `Center`, `Spacer`,
`Divider`, `Show`/`Hide` and `AspectRatio`. They're all server-component safe
and accept `asChild`.

```tsx
<Container>
  <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 2, md: 4 }} align="center">
    <Box p={4} maxW="40rem">
      …
    </Box>
  </Stack>
  <Grid container minChildWidth="14rem" gap={4}>
    …
  </Grid>
  <Show above="md">
    <DesktopNav />
  </Show>
</Container>
```

Box style props (`m`, `p` and their `x`/`y`/`t`/`b`/`s`/`e` sides, `gap`,
`w`, `maxW`, `display`, `textAlign`) work on every layout component. Spacing
takes a scale token (`0`–`8`) or any CSS length. `<Grid container containerQueries>`
makes its cells' `size`s respond to the grid's own width instead of the viewport.

## Forms

Every control is the native element, restyled. Keyboard handling, autofill,
`FormData` submission and phone pickers all work, and `ref` reaches the real
input, so `react-hook-form`'s `register()` needs no adapters.

```tsx
<TextField label="Email" type="email" name="email" required error={errors.email} />
<Field label="Country"><Select name="country" placeholder="Choose…">…</Select></Field>
<CheckboxGroup label="Notify me" name="notify"><Checkbox value="email" label="Email" /></CheckboxGroup>
<RadioGroup label="Plan" name="plan" direction={{ xs: 'column', md: 'row' }}>…</RadioGroup>
<Switch label="Beta features" name="beta" />
<Button type="submit" loading={saving}>Save</Button>
<IconButton label="Close"><XIcon /></IconButton>
```

The controls on their own: `Input` (a styled native input, with adornments),
`Textarea` (grows with its content), `Radio` (inside `RadioGroup`), `Slider`
(a native range), `FileInput` (the platform picker, camera included on
phones), `ToggleButton` (on or off, `aria-pressed`) and `ButtonGroup`
(related buttons, attached or spaced).

Also: `Combobox` (searchable select), `NumberField` (spinbutton with
steppers), `DateField` (native date and time pickers), `MaskedInput` (formats
as you type: phones, cards, codes), `ColorPicker` (touch-friendly, with
opacity and swatches), `ActionSelect` (a button joined to a select),
`SegmentedControl`, and `Table` primitives with sortable headers and a stacked
card layout on phones. `Rating` (stars on native radios; whole, half or quarter steps; any fraction read-only),
`OtpField` (one-time codes: one input, so SMS autofill and paste work),
`Fieldset` (a native group with a legend), and `Swap` (a toggle that swaps two
icons).

`Field` connects its label, description and error to its control. Call
`useFieldControl()` to make your own controls Field-aware. On touch screens,
control text is never smaller than 16px (so iOS doesn't zoom) and hit areas
are at least 44px.

## Content

| Area             | Components                                                                                                                                                                                                                              |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Typography**   | `Text` (responsive size, tone, truncate), `Heading` (outline level separate from size), `Link`, `Code`, `Break` (a line break per breakpoint, with a fallback where it doesn't break)                                                   |
| **Media**        | `Card` + `CardMedia`, `Image` (lazy by default, `priority` for LCP, CSS placeholder, fallback), `Video` (plays inline on iOS), `Embed`, `Icon`, `Avatar` + `AvatarGroup`                                                                |
| **Disclosure**   | `Collapsible` and `Accordion` (native `<details>`; `exclusive` keeps one open with no JS; an icon of yours, or one per state), `Tabs`                                                                                                   |
| **Feedback**     | `Alert` (announces only when you ask), `Badge`, `Chip` (removable or selectable), `Spinner`, `Progress`, `RadialProgress`, `Skeleton`, `Status` (a state dot), `Countdown`                                                              |
| **Data display** | `Stat` + `StatGroup`, `List` + `ListItem`, `ChatBubble`, `Key`, `Indicator` (a badge or dot on a corner), `Diff` (a before/after slider), `ScrollCarousel` + `ScrollCarouselSlide` (native scroll snapping), `TextRotate` (CSS-only rotating words) |

## Overlays and navigation

| Area           | Components                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Modal**      | `Dialog`, `Drawer` (responsive `placement`: a bottom sheet on phones, a side panel on desktop). Native `<dialog>`: focus trapped and returned, page inert, scroll locked with CSS                                                                                                                                                                                                                                                                                                                      |
| **Anchored**   | `Popover`, `Menu` + `MenuItem`, `Tooltip`. Popover API plus CSS anchor positioning; no positioning library                                                                                                                                                                                                                                                                                                                                                                                             |
| **Feedback**   | `toast()` + `<Toaster />`: announced, pausable, and usable above open dialogs                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Navigation** | `SidebarLayout` + `Sidebar` + `SidebarTrigger` (off-canvas below a breakpoint, persistent above), `AppBar`, `Header` (brand, navigation and actions, sticky or `floating`; in-page links land below it), `Footer` + `FooterSection` (columns of links and a legal row), `Breadcrumbs`, `Pagination`, `ScrollSpy` (marks the link to the section the page is on), `Steps` + `Step` (processes, and timelines: `direction`, `markers`, a step's `prefix`), `Dock` + `DockItem` (a bottom bar for phones) |
| **Actions**    | `SpeedDial` + `SpeedDialAction` (a floating action button with a popover of actions)                                                                                                                                                                                                                                                                                                                                                                                                                   |

```tsx
<Dialog trigger={<Button>Delete</Button>} title="Delete project?" footer={<Button tone="negative">Delete</Button>} />
<Menu trigger={<Button>Actions</Button>}><MenuItem onSelect={rename}>Rename</MenuItem></Menu>
toast({ title: 'Archived', action: { label: 'Undo', onClick: restore } })
```

## Motion: the `greese` prop and greese.js

Every component that draws something accepts `greese`:

```tsx
<Card greese="fadeUp" />                                     // entrance preset: CSS only
<Stack greese={{ inView: 'fadeUp', stagger: 0.05 }}>…</Stack> // reveal on scroll, children in turn
<Button greese={{ hover: 'rise', press: 'squish' }} />       // interactions
<Heading greese={{ text: 'split' }}>Served fast</Heading>    // text effects
<Dialog greese={{ enter: 'pop', exit: 'scaleOut' }} … />     // overlay enter and exit
<Card greese="fadeIn+scaleIn,+2,fadeOut" />                  // sequence: + together, comma next, number pause
```

Define your own effects with `defineGreeseEffect('wobble', { rotate: [0, -6, 6, 0] })`
and use them by name, alone or in sequences.

- **Entrance presets are pure CSS:** they render in Server Components and
  cost no JavaScript.
- **Everything else loads a small runtime plus greese.js** (about 9.8 kB,
  brotli) as a lazy chunk, the first time a prop needs it. Add
  `import '@greese/react/greese'` at your entry to load it up front.
- **Reduced motion is respected throughout.**
- **`<Motion>` gives any element the prop.**
- **`useGreese()`** ties greese.js to a component:
  scoped selectors, dependencies, and everything reverted on unmount,
  including animations started in handlers. `useTimeline()` is its
  one-timeline shortcut.
- **greese.js** (`@greese/js`) is re-exported (`animate`, `timeline`,
  `ease`, `splitText`) for full keyframe timelines.

## Responsive values

Every responsive prop takes one value, or a value per breakpoint,
mobile-first:

| Breakpoint | `xs` | `sm`  | `md`  | `lg`   | `xl`   |
| ---------- | ---- | ----- | ----- | ------ | ------ |
| min-width  | 0    | 600px | 900px | 1200px | 1536px |

Prefer CSS-driven responsive props. When the rendered tree itself must change,
use `useBreakpoint()`, `useBreakpointValue()` or `useMediaQuery()`.
To keep state in localStorage, safely (on the server, with storage blocked or
full) and in step across components and tabs, use `useStoredState()`; outside
React, `createStoredValue()` from `@greese/ui`.

To use your own breakpoint values, recompile the SCSS and tell the hooks. The
keys stay `xs`–`xl`:

```scss
@use 'pkg:@greese/ui/scss' with (
  $breakpoints: (
    xs: 0px,
    sm: 480px,
    md: 768px,
    lg: 1024px,
    xl: 1440px,
  )
);
```

```ts
configureBreakpoints({ sm: 480, md: 768, lg: 1024, xl: 1440 })
```

## Utilities

- `Slot` and `composeRefs` power `asChild`.
- `useControllableState` supports controlled and uncontrolled state.
- `cx` joins class names.
- `VisuallyHidden` hides content visually but keeps it for screen readers.
