# @greese/svg

## 0.2.0

### Minor Changes

- d01af8c: - **Carousel** and **CarouselSlide**: one slide at a time, changing with greese effects (`enter`, `exit`, `back`, or the theme's new `carousel` motion roles). It shows the slide it opens on from the first paint, with no transition, so a page that renders the slide its route names (`defaultIndex`, or a controlled `index` that follows the route, writing the address in `onIndexChange`) deep-links to it, server-rendered or not. Its own controls and dots: `controls` and `indicators` also take a node that uses **CarouselPrevious**, **CarouselNext** and **CarouselIndicator**, each a named button or, with `asChild`, your element (a router link) with the wiring, `aria-disabled` at the end, and its own look. Every name it reads out can be translated: `previousLabel`, `nextLabel`, `slideLabel` and `indicatorLabel`. `announce={false}` quiets the viewport for a page that announces slide changes itself.
  - **ScrollCarousel** is the scroll-snapping carousel: slides in a row, several in view. It runs vertically with `orientation="vertical"` (`ScrollCarouselOrientation`). A controlled `index` now always reaches a slide the user had scrolled past, and the buttons follow an app's reduced motion.
  - **Reduced motion an app asks for**: `<ThemeProvider motion="reduce">` (or `data-greese-motion="reduce"` on any element) reduces motion for its subtree whatever the system says. `prefersReducedMotion(el)` from `@greese/js` answers for your own code, and `MOTION_ATTR` from `@greese/ui` names the attribute.
  - **SVG styling**: `fill-*`, `stroke-*` and `stroke-width-*` utility classes, and a `vars` prop on every drawing component that sets custom properties, color tokens by name (`varsStyle`, `SvgVars` and `VarsProps` for your own).
  - Collapsible's content keeps its children's margins, so opening and closing no longer jumps at the end.
  - `pkg:@greese/ui/scss/slides`: the buttons and dots both carousels share, for theme authors.
  - `@greese/ui/style-manifest.json` is version 4: per block, each class's parent and the properties its rules set (`classes`), each state attribute's classes (`states`), and each variable's default, setters, the properties it ends up in and its type (`variableInfo`). Existing fields are unchanged.
  - **@greese/mcp** knows the new Carousel, ScrollCarousel's orientation, ThemeProvider's `motion` and the svg styling.
- ff2a101: `arcCenter(from, rx, ry, rotation, largeArc, sweep, to)`: an arc segment's ellipse (centre, radii scaled as browsers draw them, rotation) and the turn it draws, from the SVG spec's endpoint-to-center conversion. `arcToCubics` uses it.
- a82bb7b: Add `@greese/svg/boolean` with `subtractPath`: cut one path's area out of another and keep the curves, as one path with holes and separate pieces as subpaths, or trim open lines where the cutter covers them (`openPaths: 'trim'`).
- 854c23d: Add `@greese/svg/edit`: `convertSegment` turns a segment into another command, keeping its shape where it can (lines, quadratics and arcs to cubics, cubics to quadratics and arcs by fitting, shorthands to and from their full forms, lines to and from `H` and `V`); `setRelative` and `setSegmentRelative` write a path, or one segment, relative or absolute; `nodeType` and `setNodeType` read and make corner, smooth and symmetric nodes; and `freehandPath` turns a pointer's points into a few cubics (`smoothPoints`, then `fitCubics`, Schneider's method).
- 6f4ae96: `ease` takes any greese.js ease (`'back.out(2)'`, `'ease-in-out'`, bézier points) as well as `'linear'`, `'in'`, `'out'` and `'inOut'`: the curves now come from `@greese/js`, svg's one dependency (ADR 0040).
- a19d91a: Add `@greese/svg/markup` (Shaper's ADR 0037): `parseMarkup`, a parser that records where every node and attribute is (`nodeAtOffset` finds the element a caret is in) and throws a `MarkupError` with the line and column; `serializeMarkup` and `serializeMarkupWithRanges`, canonical pretty or minified output that records where each node lands; `sanitizeMarkup`, which takes out scripts, handlers, `javascript:` URLs and outside `href`s and says what it took; `hoistDefs`, which gathers definitions into one `<defs>`; `renameIds`, which renames clashing ids and rewrites every reference; and `adoptIds`, which carries editor ids across a reparse.
- c547781: Add `renameReferences(root, map)` and `countReferences(root, id)` to `@greese/svg/markup`: rewrite or count the references to ids without touching the ids themselves.
- 0b8f783: Add `@greese/svg/schema`: every SVG 2 element and filter primitive, with its category, where an editor shows it (`folder`, `layer`, `library` or `none`), whether it renders, what it may hold (`canContain`) and its attributes, each typed (length, paint, enum with its values, path data, transform, `viewBox`, href…) and marked when it's a presentation attribute (`elementSpec`, `attributeSpec`).

### Patch Changes

- 9c7105d: Harden `@greese/svg/markup`'s sanitizer (names by local name and case, script schemes hidden by whitespace or entities, animations that set links or handlers, outside `url()`s and `@import`, comments that end early in HTML, `<foreignObject>`'s HTML, a refused root), fix a parser hang on an unclosed doctype, keep `renameIds` from rewriting colours, match ids first in `adoptIds`, correct the schema's content model and presentation flags, and read `S` and `T` handles in `nodeType`.
- Updated dependencies [d01af8c]
- Updated dependencies [4242aa1]
- Updated dependencies [efb19d8]
- Updated dependencies [d914054]
- Updated dependencies [8a8dca5]
- Updated dependencies [f472d19]
- Updated dependencies [6b2da3f]
- Updated dependencies [5c2774b]
  - @greese/js@0.2.0

## 0.1.0

### Minor Changes

- d52ed6b: Add `@greese/svg`: type-safe SVG drawing and animation with no dependencies. Build paths and shapes, convert between them, measure them without a DOM, morph any shape into another (points and parts matched and aligned), draw, fill, drain and offset stroke slices by percent or run them as marquees, move elements along paths, and build gradients, filters (with `glow`, `goo`, `grain` and `distort` presets), clip paths and masks. Animations are properties on small controls that any tweener drives, greese.js included, or the built-in `tween()`. `@greese/react/svg` adds `Drawing`, `Path`, `DrawPath`, `MarqueePath`, `Morph`, `LinearGradient`, `RadialGradient`, `Filter`, `ClipPath` and `Mask`, and re-exports `@greese/svg`.
