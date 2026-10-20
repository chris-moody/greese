# ADR 0012: An optional icons package, and documenting every prop

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

**Icons.** The docs defined their icons, and a `Tile` placeholder, in a
fixtures file. Readers copying a story got code that imported things
GreeseUI doesn't ship. The library itself takes any icon (the conventions: "GreeseUI
ships no icons"), and that shouldn't change.

**Props tables.** Every row should say what a prop does. Many said only
"union", or nothing:

- the default docgen (`react-docgen`) couldn't print imported generic types,
  and lost descriptions of inherited props such as Box's `m`/`p`/`gap`;
- about 170 props had no description at all, or only `@default`, which
  isn't a description.

## Decisions

### 1. `@greese/icons`, separate and optional

`packages/icons`:

- line icons as React components, made by an exported `createIcon(name, d)`
  from 16 × 16 art (several paths separated by `|`);
- sized `1em` and stroked in `currentColor`, so they fit buttons and text
  with no CSS;
- decorative (`aria-hidden`) unless given a `title`, which makes them
  `role="img"`;
- each `createIcon` call is marked `/* @__PURE__ */`, so bundlers keep only
  the icons you import. One icon is 305 B; without the marks, one icon
  pulled in all of them (780 B).

**`@greese/react` never depends on it.** `verify:packages` checks this,
and that the icons render on the server. The docs, and anyone who wants a
consistent set, use it; everyone else brings their own.

### 2. The fixtures file holds data only

`apps/docs/stories/_shared/fixtures.tsx` keeps sample data (`art()`,
`countries`). Components come from the library: `Tile` became one (ADR 0011
addendum). Icons come from `@greese/icons`. Every story now shows code a
reader can copy.

### 3. Every prop has a description, and lint enforces it

- **The docgen:** Storybook uses `react-docgen-typescript`. It follows types
  across files, so inherited props keep their descriptions, and types read
  as written (`Responsive<SpaceValue>`).
- **The check:** `apps/docs/scripts/check-prop-docs.mjs`, part of
  `npm run lint -w docs`, uses the same parser. It fails on any prop that a
  component exported from the library declares without a description.
  Props from React or the DOM have their own docs and are left out.
- **The descriptions** were written for every gap. They say what the prop
  does: for the style props, which sides (logical: start/end), what values
  (space tokens or CSS lengths) and that they're responsive.

### 4. Docs page layout

- **No duplicate story:** the first story is the page's primary example,
  so the story list leaves it out (`<Stories includePrimary={false} />`).
- **Override examples** render in Storybook's `Source` block: a framed
  well with a Copy button, and syntax highlighting for CSS and SCSS.
  Storybook's highlighter has no SCSS, so `.storybook/scss-grammar.ts`
  registers a trimmed Prism grammar rather than adding a dependency.

## Consequences

- **A new package to version:** `@greese/icons` starts at 0.0.0 with a
  changeset. Its size budgets are 1.5 kB for every icon and 400 B for one
  tree-shaken.
- **Builds:** react-docgen-typescript runs the TypeScript checker, so
  Storybook builds are slower, in exchange for correct tables.
- **Adding a prop** now means writing its description; lint says so.

## Addendum (2026-10-19): clean snippets, a live editor, inline icons

**No `<React.Fragment key=".0">` in "Show code".** Stories that pass several
children through `args` write them as a fragment, and Storybook printed it
literally, `key` included. Components never needed it.
`.storybook/source.ts` unwraps fragment lines and outdents what they held,
for every story, as `parameters.docs.source.transform`.

**"Try it": editable, live examples.** Each component page shows its main
example as editable code that re-renders as you type.

- **How:** `react-live` (4.1.8, pinned; a docs dependency, not the
  library's) transpiles the JSX in the browser with Sucrase.
- **The seed** is Storybook's own generated snippet, collected from its
  `SNIPPET_RENDERED` event (`.storybook/snippets.ts`) and cleaned the same
  way.
- **In scope:** every GreeseUI export, every icon, React's hooks, and the
  sample data.
- **Behaviour:** syntax and runtime errors show under the code while the
  last good render stays. Reset restores the example.
- **Why not Storybook itself:** it has no editable source. Controls edit
  props only, and remain for that.
- **Why 4.1.8, not 5:** 5.0 was two weeks old.

**Icons sit inline in text.** `createIcon` gives each icon
`display: inline-block` and `vertical-align: -0.125em`. GreeseUI's
`base.css`, like most resets, makes every SVG a block, which stacked an icon
on its own line in a sentence. `style` still overrides it. A tree-shaken
icon went from 305 to 351 B (budget 400 B).

**The Icons page** (`Foundations/Icons`) has:

- examples of each styling route: size, color (`currentColor`), stroke,
  fill, and a gradient through `url(#id)`;
- a gallery that copies an icon's import or name, and collects icons with
  **+** to copy as a name list or as one import line.
