---
'@greese/react': minor
---

Add the SCSS kit, `@use 'pkg:@greese/ui/scss/kit' as greese`: build-time theming that writes the `greese-` prefix for you and stops the build on unknown components, parts, modifiers, variables or tokens. `component()` with `part()`, `modifier()` and `vars()` restyles a component in the new `greese.overrides` layer (above component styles, below style props and the `greese` prop); `tokens()` and `theme(name)` compile token overrides and complete themes, as `createTheme` does; `motion()` and `motion-defaults()` give every instance of a component a CSS entrance, overlay exit and transition speeds. Ship `@greese/ui/style-manifest.json`, every component's classes, parts, modifiers, states and variables. `ThemeProvider`'s `theme` also takes a theme name, for themes whose CSS you load yourself.
