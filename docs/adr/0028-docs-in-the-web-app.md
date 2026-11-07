# ADR 0028: The docs are pages of the web app

- **Status:** Accepted
- **Date:** 2026-10-25
- **Supersedes:** ADR 0018's 2026-10-24 addendum (the docs as Storybook,
  copied into the app's build and linked to)

## Context

The docs were Storybook, deployed beside the web app at `/storybook/`, and
the app linked to them. Following a link was a jump to another site: a
different header (Storybook's), no search of the app's, and none of the
visitor's choices (the theme they wear, its colour scheme, its shapes and
motion, all kept in local storage) on the other side.

The docs' content is already data the app can read: 125 story files (CSF)
and 12 MDX pages in `apps/docs/stories`. Theme Studio already rendered the
stories in the app through Storybook's portable-stories API.

## Decisions

### 1. The app renders the docs from their source, at `/docs/<page>`

A route like the studio's and the templates', in the same header, under the
same `ThemeProvider` and stored settings as every page. No iframe and no
second app: examples render in the page and wear the page's theme.

- **Pages and order** come from the files at build time
  (`server/docsIndex.ts`, `virtual:greese-docs`): a story file is a
  component's page, unless it's tagged `!autodocs` or an MDX page documents
  it with `<Meta of>`, as in Storybook. The order is Storybook's own
  `storySort.order`, read from `.storybook/preview.tsx` (Storybook parses it
  statically, so it must stay a literal there).
- **Component pages** follow Storybook's generated page: title, description
  (the story file's meta comment, else the component's TSDoc), the first
  story, its props with controls, "Try it" (react-live), the other stories
  with their comments and code, and the Styling section.
- **Props** are read by react-docgen-typescript with Storybook's options
  (`server/docgen.ts`, `virtual:greese-docgen`): about 1.5 s for the
  library, redone when a component changes. Literal unions come through as
  options, so a `ControlSize` prop gets a control.
- **Stories** are composed with `composeStories` (args, decorators, render,
  `parameters.layout`), loaded per page. `play` functions don't run, as in
  Storybook's docs.
- **"Show code"** is the story's output as JSX, decorators included (as
  Storybook's source), named from the library's exports. A function arg
  prints as written: the build tags each with its source text
  (`Symbol.for('greese.source')`). A story whose render keeps state (calls
  a hook, or hands an element a handler of its own), or whose file defines
  the stateful component it shows, can't be printed from its output: it
  shows its source instead, as a module that runs on its own, with the
  imports and the file's own declarations it uses, `const args = … as const`
  when it reads them, and the render as `export const <Story>`
  (`apps/docs/.storybook/storySource.ts`, set as
  `parameters.docs.source.code`, which Storybook shows too).
  `src/docs/storySource.test.ts` type-checks every such snippet and fails
  on any do-nothing callback (`onX: () => {}`) in a story. Components a story
  file defines get a `displayName` at build (`server/storyNames.ts`), so a
  minified build still prints `Swatch`, not `e`.
- **MDX** compiles in the app's build (`@mdx-js/rollup`, with remark-gfm, as
  Storybook's config). `@storybook/addon-docs/blocks` resolves to the app's
  own blocks (`src/docs/blocks.tsx`): `Meta`, `Canvas`, `Controls`, `Source`,
  `Subheading`, the ones the docs use. Headings get GitHub's slugs, so the
  guides' `#links` land, and Storybook-style links (`?path=/docs/…`) open
  the app's page.

### 2. Search, navigation and the theme come with the app

The header gets a Docs link and the phone menu a Docs section; the search
finds every page and every guide's sections, and opens them without a page
load. Nothing on the docs reads settings of its own: the theme, scheme,
layers and effects reach it as they reach the homepage.

### 3. Storybook stays, for authoring and visual tests

`apps/docs` is still where stories and guides are written, and Storybook
(`npm run dev -w docs`) still runs them and feeds the visual tests. It's no
longer deployed or linked: the docs a visitor reads are the app's.

### 4. Costs

- **The homepage** loads none of it: the docs are lazy chunks, a page's
  stories and MDX are loaded when it opens. The search's index (now with
  the guides' headings) is 18 kB, fetched when the browser is idle.
- **The library's chunk had to change.** The docs import the whole library
  (to name its components and run "Try it"), so every module became shared
  by two lazy pages, and the `greese` group (shared by two chunks or more)
  put all of it in the chunk the homepage loads first; the 2026-10-24
  `effects-runtime` fix, in the `react` group with its dependencies, did
  the same through the library's barrel. Now `greese` holds only what the
  homepage can reach (`homepageReaches` in vite.config.ts: index.html, its
  lazy sections, not the routes' pages), effects-runtime with it; the rest
  stays with the pages that use it. Measured 2026-10-25 against the last
  commit, same machine, Lighthouse medians: the homepage loads 494 kB of
  JavaScript (was 526 kB), LCP 2.53 s (unchanged), performance 0.95.
- **The blank-page guard was widened.** A chunk holding CommonJS modules
  (React's, read from the module graph, since the code is minified by
  then) on an import cycle blanks the page the same way the runtime helpers
  did ("require_react is not a function"); `server/runtimeChunk.ts` now
  fails the build for either. One of the configurations tried here built,
  passed the old guard and rendered nothing.
- **New development dependencies of the app** (not of any published
  package): `@mdx-js/rollup`; and, already in the repository for the docs,
  react-docgen-typescript, react-live, prism-react-renderer, remark-gfm,
  react-hook-form (a recipe's) and `@types/mdx`.

## Consequences

- **A story or guide must render in the app too.** Stories may use args,
  argTypes (`control`, `options`), decorators, render and
  `parameters.layout`; MDX may use the five blocks above. A Storybook API
  beyond those (`useArgs`, loaders, another block) needs adding to
  `src/docs` first.
- **Tests:** `src/docs/docs.test.ts` (the code generator, Markdown,
  links, controls, story files' comments, the sidebar),
  `server/docsIndex.test.ts` (pages, order, headings; no guide repeats a
  heading, which the page's ids rely on), `e2e/docs.spec.ts` (a page under
  the app's header and theme, a scheme that stays, controls, search into a
  guide's section, the phone sheet). Every page and example was opened in a
  production build with no errors (2026-10-25: 134 pages, 298 snippets).
- **GitHub Pages** serves `docs/<page>/index.html` copies of the app, so a
  direct visit works without rewrites.

## Addendum (2026-11-07): Try it's scope is one list, and a test runs it

Try it broke twice the same way. `@greese/react/svg` (2026-10-31) and then
`@greese/authoring` were missing from the lists the docs draw names from, so
their pages' Try it threw `ReferenceError: Highlighted is not defined` in dev.
In the built site they named the component by its minified function name: as
`<u>`, an HTML element, that didn't even throw. Three more faults turned up on
the same pages: a story's own environment printed as `<Provider>`, a `Map`
prop printed as `{}`, and two motion pages named helpers not in scope.

- **One list:** `src/docs/liveScope.ts` holds the packages (`LIBRARY`), which
  name components in "Show code" (`toJsx.ts`), and the editor's scope
  (`LIVE_SCOPE`). A package with docs pages is added there, once.
- **An environment in scope:** `AuthoringProvider` is a fresh, empty
  authoring environment. A page needing a prepared one passes its own through
  `parameters.tryIt.scope`. The environment's Provider has a `displayName`, so
  it prints by name in a minified build.
- **`toJsx` writes `Map` and `Set` props** as `new Map([...])` and `new Set([...])`.
- **`src/docs/liveScope.test.tsx`** takes each component page's Try it code as
  the page does, with the `storyNames` plugin as in the build. It fails when
  the code names a component not in scope, or one named only by a function's
  own `name`, which a production build minifies. It also fails when the code
  throws as it compiles and renders under react-live. It runs in jsdom.
- **A page's contents list leaves out an example's own headings.** A closed
  `Dialog` in a story still renders its `<h2 id>`, and HierarchicalList's
  "Delete folder?" showed up as a section of its pages.
