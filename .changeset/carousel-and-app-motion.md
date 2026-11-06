---
'@greese/react': minor
'@greese/ui': minor
'@greese/js': minor
'@greese/svg': minor
'@greese/mcp': patch
---

- **Carousel** and **CarouselSlide**: one slide at a time, changing with greese effects (`enter`, `exit`, `back`, or the theme's new `carousel` motion roles). It shows the slide it opens on from the first paint, with no transition, so a page that renders the slide its route names (`defaultIndex`, or a controlled `index` that follows the route, writing the address in `onIndexChange`) deep-links to it, server-rendered or not. Its own controls and dots: `controls` and `indicators` also take a node that uses **CarouselPrevious**, **CarouselNext** and **CarouselIndicator**, each a named button or, with `asChild`, your element (a router link) with the wiring, `aria-disabled` at the end, and its own look. Every name it reads out can be translated: `previousLabel`, `nextLabel`, `slideLabel` and `indicatorLabel`. `announce={false}` quiets the viewport for a page that announces slide changes itself.
- **ScrollCarousel** is the scroll-snapping carousel: slides in a row, several in view. It runs vertically with `orientation="vertical"` (`ScrollCarouselOrientation`). A controlled `index` now always reaches a slide the user had scrolled past, and the buttons follow an app's reduced motion.
- **Reduced motion an app asks for**: `<ThemeProvider motion="reduce">` (or `data-greese-motion="reduce"` on any element) reduces motion for its subtree whatever the system says. `prefersReducedMotion(el)` from `@greese/js` answers for your own code, and `MOTION_ATTR` from `@greese/ui` names the attribute.
- **SVG styling**: `fill-*`, `stroke-*` and `stroke-width-*` utility classes, and a `vars` prop on every drawing component that sets custom properties, color tokens by name (`varsStyle`, `SvgVars` and `VarsProps` for your own).
- Collapsible's content keeps its children's margins, so opening and closing no longer jumps at the end.
- `pkg:@greese/ui/scss/slides`: the buttons and dots both carousels share, for theme authors.
- `@greese/ui/style-manifest.json` is version 4: per block, each class's parent and the properties its rules set (`classes`), each state attribute's classes (`states`), and each variable's default, setters, the properties it ends up in and its type (`variableInfo`). Existing fields are unchanged.
- **@greese/mcp** knows the new Carousel, ScrollCarousel's orientation, ThemeProvider's `motion` and the svg styling.
