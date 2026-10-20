---
'@greese-ui/tokens': minor
'@greese-ui/react': minor
---

Colour: `primary`, `secondary` and `tertiary` roles (each with `…Strong` and `on…`), and a palette of 22 hues × 11 shades like MUI's `colors`. `accent`, `accentStrong`, `onAccent` and `focusRing` now follow `primary` by default, so setting `primary` rebrands every component; the default colours are unchanged. Use the palette as `palette.lavender[600]` (or `import { lavender }`) in TypeScript, `lavender-600` or `greese.palette(lavender, 600)` in the SCSS kit, and `var(--greese-lavender-600)` with the opt-in `@greese-ui/tokens/palette.css`.
