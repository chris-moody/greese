/**
 * `@greese/ui/theme-files`: a theme as data (`ThemeSpec`, the JSON Theme
 * Studio saves) and the SCSS it becomes, for any tool that makes or keeps
 * themes. `specToLayout()` writes the documented layout, a folder of SCSS
 * modules to keep in your source (ADR 0034); `specToScss()` one file. Pure,
 * with no dependencies: Node and the browser both run it.
 */
export * from './spec.ts'
export * from './scssModule.ts'
