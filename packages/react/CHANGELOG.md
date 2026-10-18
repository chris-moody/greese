# @greese-ui/react

## 1.0.0

### Major Changes

- 0d736a8: 1.0.0: the first stable release of GreeseUI.

### Minor Changes

- 71e172f: Content, media and disclosure: `Text`, `Heading`, `Link`, `Code`, `Card`,
  `CardMedia`, `Image`, `Video`, `Embed`, `Icon`, `Avatar`, `AvatarGroup`,
  `Collapsible`, `Accordion`, `AccordionItem`, `Tabs`, `TabList`, `Tab`,
  `TabPanel`, `Alert`, `Badge`, `Chip`, `Spinner`, `Progress` and `Skeleton`.
- 9dd7e6d: Actions and forms: `Button`, `IconButton`, `ButtonGroup`, `ToggleButton`,
  `Field` (+ `useFieldControl`), `Input`, `TextField`, `Textarea`, `Select`,
  `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `Switch`, `Slider` and
  `FileInput`, all native elements restyled.
- 29a566a: Foundations: design tokens (colour, space, radius, typography, shadow, z-index,
  motion, breakpoints) as CSS variables, Sass maps and TS constants; colour
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
- bd79341: Ship per-component stylesheets (`@greese-ui/react/css/<Component>.css`) and the
  public SCSS entry `pkg:@greese-ui/react/scss`, whose breakpoint values can be
  reconfigured with `with ($breakpoints: …)`; `configureBreakpoints()` applies
  the same values to the hooks.
- 5870c2f: Add `Slottable`, so `asChild` components keep content they inject (icons,
  spinners), and `mapResponsive` for transforming responsive prop values.

### Patch Changes

- Updated dependencies [29a566a]
- Updated dependencies [fcad516]
- Updated dependencies [85f75c1]
- Updated dependencies [7b2526f]
- Updated dependencies [0d736a8]
  - @greese-ui/tokens@1.0.0
