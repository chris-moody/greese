---
'@greese/ui': minor
'@greese/react': minor
---

`@greese/ui` now holds all of greese ui's CSS: the stylesheet (`styles.css`, `base.css`, `css/<Name>.css`), the Sass kit (`@use 'pkg:@greese/ui/scss/kit'`) and `style-manifest.json`, with no framework attached, so plain HTML and other frameworks can use it. `@greese/react` is JavaScript only and depends on it; its `styles.css`, `base.css` and `css/*` paths still work, and its `component-styles.json` says which blocks each component renders.
