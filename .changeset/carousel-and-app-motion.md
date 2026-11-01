---
'@greese/react': minor
'@greese/ui': minor
'@greese/js': minor
'@greese/svg': minor
---

- **Carousel** and **CarouselSlide**: one slide at a time, changing with greese effects (`enter`, `exit`, `back`, or the theme's new `carousel` motion roles), and deep-linkable: a slide with an `id` shows before the first paint when the page opens on `#<id>`, a link to it moves there, and `syncHash` keeps the address on the slide shown.
- **ScrollCarousel** runs vertically with `orientation="vertical"`. A controlled `index` now always reaches a slide the user had scrolled past, and the buttons follow an app's reduced motion.
- **Reduced motion an app asks for**: `<ThemeProvider motion="reduce">` (or `data-greese-motion="reduce"` on any element) reduces motion for its subtree whatever the system says. `prefersReducedMotion(el)` from `@greese/js` answers for your own code.
- **SVG styling**: `fill-*`, `stroke-*` and `stroke-width-*` utility classes, and a `vars` prop on every drawing component that sets custom properties, color tokens by name.
- Collapsible's content keeps its children's margins, so opening and closing no longer jumps at the end.
- `pkg:@greese/ui/scss/slides`: the buttons and dots both carousels share, for theme authors.
