---
'@greese/ui': minor
'@greese/react': patch
---

- **Scroll reveals work on shaped elements.** A reveal waited for IntersectionObserver to report the element 99% visible, which a shape's clip-path (its own or an ancestor's) prevents, so shaped pages never revealed. It now reads the element's box as the page scrolls, while any of it is in view.
- **`track` color token:** the empty part of a progress bar, a slider and a radial progress, a step lighter than the borders in dark mode (steel 600), so it shows on the canvas and on surfaces.
- **Hooks for the current tab and segment:** `--greese-tab-current-bg` and `--greese-tab-current-edge`, `--greese-segment-current-bg` and `--greese-segment-current-edge` (a color variant outlines them; unset, they look as before).
