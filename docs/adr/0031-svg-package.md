# ADR 0031: `@greese/svg`, and its React components in `@greese/react/svg`

- **Status:** Accepted
- **Date:** 2026-10-30
- **Amends:** ADR 0014 (a fifth published package; `@greese/react` gains a
  dependency and an entry point)

## Context

greese ui animates boxes: the `greese` prop, greese.js and page transitions
all move whole elements. SVG artwork needs different operations:

- building paths, and converting between shapes and paths;
- morphing one shape into another;
- drawing strokes on, filling and draining them, and running dashes along
  them with `stroke-dasharray`;
- moving an element along a path;
- writing gradients, filters, clip paths and masks.

Each of these is a small piece of geometry that apps keep rewriting, or that
pulls in a large animation library.

[mkr](https://chris-moody.github.io/mkr) (2017–2018) had them as
constructs:

- `drw`: a path builder with `slice`, which mapped a percent range to dashes;
- `arc`, `star` and `rgplygn`: shapes;
- `grdnt`, `clp` and `msk`: definitions.

Each construct was a mutable object wrapping one element, with getters and
setters that GSAP tweened. That model holds up. What doesn't:

- the constructs needed TweenMax and a DOM;
- they measured with `getTotalLength()`, which fails on elements that aren't
  rendered;
- their slice maths was "slightly off" (its own comment) at the ends.

## Decision

**A new package, `@greese/svg`**:

- no dependencies, no framework, ESM, `sideEffects: false`;
- published with the others;
- its entry is 9.2 kB brotli, tree-shaken per function (`dashes` alone is
  0.5 kB, `morph` 2.8 kB), with budgets in `packages/svg/.size-limit.json`.

It doesn't depend on `@greese/js`, so either can be used without the other.

1. **Geometry is pure and needs no DOM.** Parsing, normalizing to cubics,
   measuring, sampling, morph matching and dash maths all run in Node:

   - for tests;
   - for server rendering;
   - for elements that aren't rendered.

   `measure()` prefers a declared `pathLength`, then the DOM's
   `getTotalLength()`, then its own flattening.

2. **One input type.** Every function that takes a path accepts a
   `PathInput`: path data, typed segments, a builder, or a shape spec (a
   discriminated union: `circle`, `rect`, `star`…). Angles are degrees
   clockwise from the top, and circles start at the top, so strokes draw like
   a clock hand. This is mkr's convention.
3. **Slices are percent of length, written for `pathLength="100"`.** With
   that attribute, `dashes()` needs no measuring, so a slice renders on the
   server and animates with CSS.

   - **One dash and one gap where possible.** A simple slice is written that
     way, offset by its start, so CSS transitions and Web Animations
     interpolate between two slices exactly.
   - **Sampled keyframes for the rest.** Wrapping and repeated slices change
     how many dashes they need as they move. `strokeKeyframes()` samples
     them.
   - **No stray dots at the ends.** An empty slice at either end moves its
     zero-length dash just off the path, so round caps draw no dot. An empty
     slice in the middle still can, and the guide says so.

4. **Morphing matches structure.** Both shapes become cubics. Missing
   subpaths grow from their partner's centroid. The longest curves are split
   until the counts match, which leaves each shape exactly as it was. A
   closed target is turned, and reversed if that's closer, to the pairing
   whose points travel least.

   `matchPaths()` returns the two strings with identical commands, so any
   number tweener can morph them. That includes greese.js's `mix`, with no
   coupling between the packages.

5. **Animation through controls, not an engine.**
   - **Controls.** `strokeControl`, `morphControl`, `followControl` and
     `gradientControl` are objects whose numeric properties write to the
     element. That is mkr's pattern, and greese.js's object adapter tweens
     them as they are.
   - **A fallback driver.** For pages with no animation library, a 60-line
     `tween()` drives the controls. It respects `prefers-reduced-motion` and
     can be awaited.
   - **No engine of its own.** The package doesn't grow timelines; greese.js
     has them.
6. **Definitions are data.** Gradients, filter primitives and presets, clip
   paths and masks are built as `SvgNode` (tag, attributes, children). The
   same node becomes:

   - markup, with `toMarkup`;
   - DOM, with `toElement` and `define`;
   - React elements, with `toReact`, which maps hyphenated attributes to
     React's props.

   Future framework packages render the same nodes.

7. **Filters are written as what they mean.** The primitives' options name
   the attributes plainly: `flood({ color, opacity })` writes `flood-color`
   and `flood-opacity`, `blur({ deviation })` writes `stdDeviation`,
   `offset({ x, y })` writes `dx` and `dy`, and `turbulence`'s
   `frequency`, `octaves` and `stitch` write `baseFrequency`, `numOctaves`
   and `stitchTiles`. In React each primitive is a component of its own,
   `FeFlood` for `feFlood` and so on, with the same names as props, and
   `Filter` takes them as children. A filter reads top to bottom as the
   markup it makes, and an array of nodes never stands in for children.

**`@greese/react/svg`**, a separate entry point so the main entry's budget is
untouched:

- **What it has.** `Drawing`, `Path`, `DrawPath`, `MarqueePath`, `Morph`,
  `LinearGradient`, `RadialGradient`, `Filter` with its primitives
  (`FeGaussianBlur`, `FeOffset`, `FeFlood`, `FeDropShadow`, `FeComposite`,
  `FeBlend`, `FeMerge`, `FeMergeNode`, `FeColorMatrix`, `FeTurbulence`,
  `FeDisplacementMap`, `FeMorphology`) and presets (`Glow`, `Goo`, `Grain`,
  `Distort`), `ClipPath` and `Mask`, and every `@greese/svg` export
  re-exported.
- **Server-safe where it can be.** `Path` and the definitions render on the
  server; slices use `pathLength="100"`.
- **Client components** (ADR 0027):
  - `DrawPath` and `MarqueePath` run on Web Animations. They render their
    resting state, so without JavaScript, and under reduced motion, the stroke
    shows its final state.
  - `Morph` writes `d` itself on each frame, with no React render per frame.
    With `progress`, it's pure and renders on the server.
- **The `greese` prop.** `Drawing`, the `<svg>` root, takes it.
- **No CSS.** The components render no `greese-*` classes, so `@greese/ui`
  gains nothing and they have no Styling section.

## Consequences

- Five published packages. `verify:packages` packs and installs
  `@greese/svg` and imports `@greese/react/svg` as a consumer would.
  `@greese/svg` is versioned on its own, like `@greese/js`.
- The docs' lint scripts (story coverage and prop descriptions), the web
  app's docgen and Storybook's aliases include `packages/react/src/svg`.
  Every component there needs its own story page, as the components do.
- A component in `@greese/react/svg` isn't checked by `greeseCoverage.ts`,
  which covers the main entry. Only `Drawing` draws a box, and it takes the
  prop.
- Not done:
  - path boolean operations (union, intersection);
  - text on a path;
  - shape-preserving morphs (which keep the area);
  - SMIL.

  Each would be a separate addition with its own budget.
