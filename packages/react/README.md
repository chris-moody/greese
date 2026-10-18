# @greese-ui/react

Mobile-first, TypeScript-first React components. All styling is static CSS
compiled at build time and themed with CSS custom properties, so there is no
CSS-in-JS runtime.

```bash
npm install @greese-ui/react
```

```tsx
// Once, at your app root:
import '@greese-ui/react/base.css' // optional: reset + body defaults
import '@greese-ui/react/styles.css' // tokens + component styles
```

Requires React 19. `styles.css` styles only `.greese-*` classes. Import
`base.css` too if GreeseUI owns the whole page.

To ship only the CSS you use, import per-component stylesheets instead of
`styles.css`. Each one pulls in the shared core and the components it builds
on, and bundlers de-duplicate the shared parts:

```tsx
import '@greese-ui/react/css/Button.css'
import '@greese-ui/react/css/Dialog.css' // + IconButton, Button, VisuallyHidden
```

## Colour scheme

The scheme follows the OS by default. To let users choose:

```tsx
import { getSchemeScript, useColorScheme } from '@greese-ui/react'

// In <head>, so a saved choice applies before first paint:
<script dangerouslySetInnerHTML={{ __html: getSchemeScript() }} />

// Anywhere:
const { scheme, resolvedScheme, setScheme } = useColorScheme()
setScheme('dark') // 'light' | 'dark' | 'system'
```

## Themes

```tsx
import { createTheme, ThemeProvider } from '@greese-ui/react'

// At module scope: builds static CSS once.
const brand = createTheme({
  name: 'brand',
  color: { accent: { light: '#7c3aed', dark: '#c4b5fd' } },
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
  --greese-color-accent: #7c3aed;
}
```

Every library rule sits in `@layer greese.*`, so unlayered CSS in your app always
wins over it. You never need `!important`.

## Layout

`Box`, `Stack`, `Grid` + `GridItem`, `AutoLayout` + `AutoLayoutItem` (items
sized in columns that grow into spare room), `Container`, `Center`, `Spacer`,
`Divider`, `Show`/`Hide` and `AspectRatio`. They're all server-component safe
and accept `asChild`.

```tsx
<Container>
  <Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 2, md: 4 }} align="center">
    <Box p={4} maxW="40rem">…</Box>
  </Stack>
  <Grid minChildWidth="14rem" gap={4}>…</Grid>
  <Show above="md"><DesktopNav /></Show>
</Container>
```

Box style props (`m`, `p` and their `x`/`y`/`t`/`b`/`s`/`e` sides, `gap`,
`w`, `maxW`, `display`, `textAlign`) work on every layout component. Spacing
takes a scale token (`0`–`8`) or any CSS length. `<Grid container>` makes
`GridItem` spans respond to the grid's own width instead of the viewport.

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

Also: `Combobox` (searchable select), `NumberField` (spinbutton with
steppers), `DateField` (native date and time pickers), `MaskedInput` (formats
as you type: phones, cards, codes), `ColorPicker` (touch-friendly, with
opacity and swatches), `ActionSelect` (a button joined to a select),
`SegmentedControl`, and `Table` primitives with sortable headers and a stacked
card layout on phones.

`Field` connects its label, description and error to its control. Call
`useFieldControl()` to make your own controls Field-aware. On touch screens,
control text is never smaller than 16px (so iOS doesn't zoom) and hit areas
are at least 44px.

## Content

| Area | Components |
|---|---|
| **Typography** | `Text` (responsive size, tone, truncate), `Heading` (outline level separate from size), `Link`, `Code`, `Break` (a line break per breakpoint, with a fallback where it doesn't break) |
| **Media** | `Card` + `CardMedia`, `Image` (lazy by default, `priority` for LCP, CSS placeholder, fallback), `Video` (plays inline on iOS), `Embed`, `Icon`, `Avatar` + `AvatarGroup` |
| **Disclosure** | `Collapsible` and `Accordion` (native `<details>`; `exclusive` keeps one open with no JS), `Tabs` |
| **Feedback** | `Alert` (announces only when you ask), `Badge`, `Chip` (removable or selectable), `Spinner`, `Progress`, `Skeleton` |

## Overlays and navigation

| Area | Components |
|---|---|
| **Modal** | `Dialog`, `Drawer` (responsive `placement`: a bottom sheet on phones, a side panel on desktop). Native `<dialog>`: focus trapped and returned, page inert, scroll locked with CSS |
| **Anchored** | `Popover`, `Menu` + `MenuItem`, `Tooltip`. Popover API plus CSS anchor positioning; no positioning library |
| **Feedback** | `toast()` + `<Toaster />`: announced, pausable, and usable above open dialogs |
| **Navigation** | `SidebarLayout` + `Sidebar` + `SidebarTrigger` (off-canvas below a breakpoint, persistent above), `AppBar`, `Breadcrumbs`, `Pagination` |

```tsx
<Dialog trigger={<Button>Delete</Button>} title="Delete project?" footer={<Button tone="negative">Delete</Button>} />
<Menu trigger={<Button>Actions</Button>}><MenuItem onSelect={rename}>Rename</MenuItem></Menu>
toast({ title: 'Archived', action: { label: 'Undo', onClick: restore } })
```

## Motion: the `greese` prop and greese.js

Every component that draws something accepts `greese`:

```tsx
<Card greese="fade-up" />                                    // entrance preset: CSS only
<Stack greese={{ inView: 'fade-up', stagger: 0.05 }}>…</Stack> // reveal on scroll, children in turn
<Button greese={{ hover: 'lift', press: 'squish' }} />       // interactions
<Heading greese={{ text: 'split' }}>Served fast</Heading>    // text effects
<Dialog greese={{ enter: 'pop', exit: 'scale-out' }} … />    // overlay enter and exit
```

- **Entrance presets are pure CSS:** they render in Server Components and
  cost no JavaScript.
- **Everything else loads a small runtime plus greese.js** (about 6.4 kB,
  brotli) as a lazy chunk, the first time a prop needs it. Add
  `import '@greese-ui/react/greese'` at your entry to load it up front.
- **Reduced motion is respected throughout.**
- **`<Motion>` gives any element the prop.**
- **`useTimeline()`** ties a timeline to a component's lifetime.
- **greese.js** (`@greese-ui/greese`) is re-exported (`animate`, `timeline`,
  `ease`, `splitText`) for full keyframe timelines.

## Responsive values

Every responsive prop takes one value, or a value per breakpoint,
mobile-first, the same way MUI does:

| Breakpoint | `xs` | `sm` | `md` | `lg` | `xl` |
|---|---|---|---|---|---|
| min-width | 0 | 600px | 900px | 1200px | 1536px |

Prefer CSS-driven responsive props. When the rendered tree itself must change,
use `useBreakpoint()`, `useBreakpointValue()` or `useMediaQuery()`.

To use your own breakpoint values, recompile the SCSS and tell the hooks. The
keys stay `xs`–`xl`:

```scss
@use 'pkg:@greese-ui/react/scss' with (
  $breakpoints: (xs: 0px, sm: 480px, md: 768px, lg: 1024px, xl: 1440px)
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
