---
'@greese/ui': minor
'@greese/react': minor
---

Keep a theme in your source as a folder of SCSS modules, take a theme's layers back from part of a page, and build utilities from Sass (ADR 0034).

- `@greese/ui/theme-files`: a theme as data (Theme Studio's JSON) and the SCSS it becomes. `specToLayout()` writes the documented layout: `main.scss`, `_settings.scss`, a module per token group, per component, for motion, shapes and utilities, each editable alone. `specToScss()` still writes one file. Theme Studio writes the layout by default (`GREESE_THEME_OUTPUT=layout,scss,css` chooses), and leaves alone any layout file whose first line you deleted.
- Every setting has a place in the layout. `_settings.scss` always holds the breakpoints, and builds greese ui's stylesheet (`_library.scss`) and utility classes (`utilities/_index.scss`) with them whenever they differ from the library's (`$library`, `$utilities`), so changing one moves every media query. Every token group's file and the type system's list the defaults the theme leaves alone, commented, and the motion file its options. A shape's sizes are a `$shapes` map at the top of its file (`shapesCss()` takes a size writer). `specToLayout(spec, source, { components })` keeps loading component files of your own, and Theme Studio passes them.
- The kit: `tokens()` calls add up, so a second call writes only what it changes instead of restating the theme. A `tokens()`, `typography()`, `motion-defaults()` or `page-transitions()` call that sets nothing writes nothing. `scope($name)` is `theme($name)`, or the page for `null`, `false` or `''`.
- The stylesheet declares its breakpoints once, from the ones it's built with, and their keys in order (`--greese-breakpoint-keys`). `configureBreakpoints()` in `@greese/react` reads them when called with no argument.
- Theme layers can be taken back. `.greese-reset-color`, `-shape` and `-motion`, and `.greese-reset` for all three, work on any element (defaults in the opt-in `css/resets.css`, also `@greese/react/css/resets.css`). The kit's `reset(…)` declares a layer's defaults in any rule, and inside `component()` leaves that component out of the layer's theme rules for the rest of the build. Every theme rule the kit writes carries a zero-specificity guard for its layer (`reset-guard()`, `themed()`). `component(Name, $layer: …)` files styles under a layer other than shape.
- `pkg:@greese/ui/scss/utilities`: `utilities.classes($groups, $only, $prefix)` writes the utility classes from Sass, with the build's breakpoints, from the same table as `utilities.css`.
- `pkg:@greese/ui/scss/core` and `pkg:@greese/ui/scss/components/<Name>`, for a Sass build that picks its components.
- The shape themes are regenerated with the guards (about 4% larger).
