# @sauce-ui/react

Mobile-first, TypeScript-first React components. All styling is static CSS
compiled at build time and themed with CSS custom properties, so there is no
CSS-in-JS runtime.

```bash
npm install @sauce-ui/react
```

```tsx
// Once, at your app root:
import '@sauce-ui/react/base.css' // optional: reset + body defaults
import '@sauce-ui/react/styles.css' // tokens + component styles
```

Requires React 19. `styles.css` styles only `.sauce-*` classes. Import
`base.css` too if SauceUI owns the whole page.

## Colour scheme

The scheme follows the OS by default. To let users choose:

```tsx
import { getSchemeScript, useColorScheme } from '@sauce-ui/react'

// In <head>, so a saved choice applies before first paint:
<script dangerouslySetInnerHTML={{ __html: getSchemeScript() }} />

// Anywhere:
const { scheme, resolvedScheme, setScheme } = useColorScheme()
setScheme('dark') // 'light' | 'dark' | 'system'
```

## Themes

```tsx
import { createTheme, ThemeProvider } from '@sauce-ui/react'

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
  --sauce-color-accent: #7c3aed;
}
```

Every library rule sits in `@layer sauce.*`, so unlayered CSS in your app always
wins over it. You never need `!important`.

## Layout

`Box`, `Stack`, `Grid` + `GridItem`, `Container`, `Center`, `Spacer`,
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

`Field` connects its label, description and error to its control. Call
`useFieldControl()` to make your own controls Field-aware. On touch screens,
control text is never smaller than 16px (so iOS doesn't zoom) and hit areas
are at least 44px.

## Content

| Area | Components |
|---|---|
| **Typography** | `Text` (responsive size, tone, truncate), `Heading` (outline level separate from size), `Link`, `Code` |
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

## Responsive values

Every responsive prop takes one value, or a value per breakpoint,
mobile-first, the same way MUI does:

| Breakpoint | `xs` | `sm` | `md` | `lg` | `xl` |
|---|---|---|---|---|---|
| min-width | 0 | 600px | 900px | 1200px | 1536px |

Prefer CSS-driven responsive props. When the rendered tree itself must change,
use `useBreakpoint()`, `useBreakpointValue()` or `useMediaQuery()`.

## Utilities

- `Slot` and `composeRefs` power `asChild`.
- `useControllableState` supports controlled and uncontrolled state.
- `cx` joins class names.
- `VisuallyHidden` hides content visually but keeps it for screen readers.
