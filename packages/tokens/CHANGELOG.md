# @sauce-ui/tokens

## 1.0.0

### Major Changes

- 0d736a8: 1.0.0: the first stable release of SauceUI.

### Minor Changes

- 29a566a: Foundations: design tokens (colour, space, radius, typography, shadow, z-index,
  motion, breakpoints) as CSS variables, Sass maps and TS constants; colour
  schemes via `useColorScheme` and `getSchemeScript`; scoped themes via
  `createTheme` and `ThemeProvider`; responsive-prop resolution; `Slot`,
  `useMediaQuery`, `useBreakpoint`, `useBreakpointValue`, `useControllableState`,
  `VisuallyHidden`; opt-in `base.css`.
- fcad516: Add the `onNegative` colour token, for content on negative (destructive) surfaces.
- 85f75c1: Add the `scrim` colour token, which dims the page behind modal dialogs and drawers.
- 7b2526f: Add the CSS-free Sass module `@sauce-ui/tokens/scss/maps`.
