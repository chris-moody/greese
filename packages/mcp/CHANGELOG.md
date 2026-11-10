# @greese/mcp

## 0.1.2

### Patch Changes

- d01af8c: - **Carousel** and **CarouselSlide**: one slide at a time, changing with greese effects (`enter`, `exit`, `back`, or the theme's new `carousel` motion roles). It shows the slide it opens on from the first paint, with no transition, so a page that renders the slide its route names (`defaultIndex`, or a controlled `index` that follows the route, writing the address in `onIndexChange`) deep-links to it, server-rendered or not. Its own controls and dots: `controls` and `indicators` also take a node that uses **CarouselPrevious**, **CarouselNext** and **CarouselIndicator**, each a named button or, with `asChild`, your element (a router link) with the wiring, `aria-disabled` at the end, and its own look. Every name it reads out can be translated: `previousLabel`, `nextLabel`, `slideLabel` and `indicatorLabel`. `announce={false}` quiets the viewport for a page that announces slide changes itself.
  - **ScrollCarousel** is the scroll-snapping carousel: slides in a row, several in view. It runs vertically with `orientation="vertical"` (`ScrollCarouselOrientation`). A controlled `index` now always reaches a slide the user had scrolled past, and the buttons follow an app's reduced motion.
  - **Reduced motion an app asks for**: `<ThemeProvider motion="reduce">` (or `data-greese-motion="reduce"` on any element) reduces motion for its subtree whatever the system says. `prefersReducedMotion(el)` from `@greese/js` answers for your own code, and `MOTION_ATTR` from `@greese/ui` names the attribute.
  - **SVG styling**: `fill-*`, `stroke-*` and `stroke-width-*` utility classes, and a `vars` prop on every drawing component that sets custom properties, color tokens by name (`varsStyle`, `SvgVars` and `VarsProps` for your own).
  - Collapsible's content keeps its children's margins, so opening and closing no longer jumps at the end.
  - `pkg:@greese/ui/scss/slides`: the buttons and dots both carousels share, for theme authors.
  - `@greese/ui/style-manifest.json` is version 4: per block, each class's parent and the properties its rules set (`classes`), each state attribute's classes (`states`), and each variable's default, setters, the properties it ends up in and its type (`variableInfo`). Existing fields are unchanged.
  - **@greese/mcp** knows the new Carousel, ScrollCarousel's orientation, ThemeProvider's `motion` and the svg styling.
- Updated dependencies [d01af8c]
- Updated dependencies [0a4281e]
- Updated dependencies [ab9793d]
- Updated dependencies [2023ebd]
- Updated dependencies [43294bc]
- Updated dependencies [3598681]
- Updated dependencies [8e6c274]
- Updated dependencies [6a70a7e]
- Updated dependencies [0e921ad]
- Updated dependencies [a0e71e0]
- Updated dependencies [6f5cba2]
- Updated dependencies [3cb005c]
- Updated dependencies [538a019]
- Updated dependencies [ecbc037]
- Updated dependencies [6516f27]
- Updated dependencies [c0c4381]
- Updated dependencies [dc360d4]
- Updated dependencies [998e63f]
- Updated dependencies [4f43cc9]
- Updated dependencies [c069414]
  - @greese/ui@1.2.0

## 0.1.1

### Patch Changes

- 3a50fb7: Serves the color themes alongside the shape and motion themes, and describes `list_themes` as all of them.
- Updated dependencies [1f48cc2]
- Updated dependencies [914ba96]
  - @greese/ui@1.1.0

## 0.1.0

### Minor Changes

- 0f54188: New package: an MCP server for greese ui (`npx @greese/mcp`, ADR 0022). It gives coding assistants each component's props, classes and example code, plus tokens, icons and guides. It can also build theme CSS with `createTheme`, and it serves the shape themes and the page templates, all baked in at build time.

### Patch Changes

- 837d912: Require `zod` 4.6.6 or later: earlier versions can exhaust memory validating oversized collections (GHSA-mrhx-c7xc-m3w5).
- Updated dependencies [0cb3cbf]
- Updated dependencies [ef6188f]
- Updated dependencies [d5f0774]
- Updated dependencies [76471a6]
- Updated dependencies [846d9d3]
- Updated dependencies [d2f0b0d]
- Updated dependencies [24d69e4]
- Updated dependencies [bc388f4]
- Updated dependencies [42b1080]
- Updated dependencies [fb57e8d]
- Updated dependencies [9ddf302]
- Updated dependencies [dda476a]
- Updated dependencies [1c3769e]
- Updated dependencies [dd37a16]
- Updated dependencies [3f2d822]
- Updated dependencies [2ec4988]
- Updated dependencies [fafac8d]
- Updated dependencies [d2f0b0d]
- Updated dependencies [846d9d3]
- Updated dependencies [ce01b4d]
- Updated dependencies [57b06b5]
- Updated dependencies [1e2057f]
- Updated dependencies [e3a8296]
- Updated dependencies [7b0b8e0]
- Updated dependencies [d2f0b0d]
- Updated dependencies [d2f0b0d]
- Updated dependencies [9446966]
- Updated dependencies [d2f0b0d]
- Updated dependencies [fbaeb2a]
- Updated dependencies [d2f0b0d]
- Updated dependencies [c55f9f7]
- Updated dependencies [3916354]
- Updated dependencies [a742762]
- Updated dependencies [0a89c25]
- Updated dependencies [9446966]
- Updated dependencies [1f9779b]
- Updated dependencies [55d8757]
- Updated dependencies [174659b]
- Updated dependencies [d2f0b0d]
- Updated dependencies [d2f0b0d]
- Updated dependencies [acce602]
- Updated dependencies [d4b7cb1]
- Updated dependencies [4eeec0e]
- Updated dependencies [d2f0b0d]
  - @greese/ui@1.0.0
