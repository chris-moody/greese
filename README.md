# GreeseUI

Mobile-first, TypeScript-first React components with zero-runtime styling:
static CSS compiled at build time, themed with CSS custom properties.

| Package                           |                                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| [`@greese/ui`](packages/ui)       | The CSS and design tokens: the stylesheet, per-component CSS, custom properties, Sass kit. No framework needed |
| [`@greese/react`](packages/react) | React components, styled by `@greese/ui`                                                                       |
| [`@greese/js`](packages/js)       | greese.js, the animation library behind the `greese` prop                                                      |
| [`@greese/icons`](packages/icons) | Optional line icons; GreeseUI takes any icons                                                                  |

`@greese/react` depends on `@greese/ui` and `@greese/js`, so one install is
enough. `@greese/ui` works in plain HTML, and is what the planned Svelte, Vue
and Angular packages will share ([ADR 0014](docs/adr/0014-framework-agnostic-packages.md)).
Homepage, docs and Theme Studio: <https://chris-moody.github.io/greese/>.
Source: <https://github.com/chris-moody/greese>.

Scope, phases and standing decisions: [ADR 0013](docs/adr/0013-project-scope-and-phases.md); every decision is in [docs/adr](docs/adr).

## Workspace

| Path                                                   |                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui`                                          | `@greese/ui`: the CSS, tokens and Sass kit, framework-free. Component styles are edited here                                                                                                                                                                                                            |
| `packages/react`, `packages/js`, `packages/icons`      | The other published packages                                                                                                                                                                                                                                                                            |
| `packages/eslint-config`, `packages/typescript-config` | Internal shared config                                                                                                                                                                                                                                                                                  |
| `apps/docs`                                            | The docs' source: stories and MDX guides, run by Storybook (`npm run dev -w docs`) for authoring and visual tests. Uses the library **source**, so edits hot-reload                                                                                                                                     |
| `apps/playground`                                      | Vite app that uses the **built** `dist/`, the same way a real consumer does. Playwright e2e and perf benchmarks run against it                                                                                                                                                                          |
| `apps/site`                                            | The web app, built with GreeseUI from the **built** `dist/`: the homepage at `/`, the docs at `/docs` (rendered from `apps/docs`' stories and MDX), Theme Studio at `/studio` (`npm run studio`; edits a theme file) and the templates. Its numbers come from `npm run stats -w site` and the benchmark |

## Setup

Requires Node 24 (`nvm use`) and npm.

```bash
npm install
npx playwright install chromium firefox webkit   # once, for e2e
```

## Commands

| Command                                |                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                          | Storybook on :6006 and the playground dev server                               |
| `npm run build`                        | Builds every package and app (turbo, cached)                                   |
| `npm test`                             | Unit tests (Vitest + jsdom)                                                    |
| `npm run test:e2e`                     | Real-browser tests (Playwright): the playground in five projects, and the site |
| `npm run check-types` / `npm run lint` |                                                                                |
| `npm run size`                         | Fails if a bundle-size budget (each package's `.size-limit.*`) is exceeded     |
| `npm run test:visual`                  | Visual regression for every story (builds Storybook first)                     |
| `npm run lighthouse -w playground`     | Lighthouse budgets on the playground pages (after `npm run build`)             |
| `npm run test:dashboard`               | Local dashboard that runs the suites and reports their timings (:4410)         |
| `npm run verify:packages`              | Packs both packages and checks them in a clean consumer project                |
| `npm run bench -w playground`          | Render benchmark (the numbers on the homepage)                                 |
| `npm run changeset`                    | Records a release note for a change to a published package                     |

How the tests are organised, written and run: [docs/testing](docs/testing/README.md).

## Commits

Commits follow [Conventional Commits](https://www.conventionalcommits.org) as one
line, `type(scope): subject`, with no body or trailers:

```
feat(react): add Stack with responsive direction and gap props
```

`commitlint.config.mjs` holds the rules, including the allowed types and
scopes. A git hook (husky, installed by `npm install`) checks every commit
locally, and CI checks pull requests. The full guide is in
[.claude/skills/commit/SKILL.md](.claude/skills/commit/SKILL.md), which Claude
Code also uses as its `/commit` skill.

## Releasing

Changesets on `main` produce a "Version Packages" PR, and merging it publishes
to public npm under `@greese`, with provenance
(`.github/workflows/release.yml`). `@greese/react` and
`@greese/ui` share one version number. Before the first release:
create the `@greese` npm organisation and add an npm automation token as
the repository secret `NPM_TOKEN`.

## Documentation

Run `npm run dev` and open http://localhost:6006. You'll find guides (getting
started, theming, responsive props, accessibility, animation, utility classes), a docs
page for every component, and live stories. Decisions are recorded in
[docs/adr](docs/adr).

## GitHub Pages

`.github/workflows/pages.yml` publishes the web app to
<https://chris-moody.github.io/greese/> on pushes to `main` (or run it by
hand):

| Path      | App                                                                                         |
| --------- | ------------------------------------------------------------------------------------------- |
| `/`       | The homepage, `apps/site`                                                                   |
| `/studio` | Theme Studio, a route of the same app: it compiles in the browser and keeps the theme there |
| `/docs`   | The docs, a route of the same app, rendered from `apps/docs`' stories and MDX (ADR 0028)    |

The app builds for `/<repository>/` (the workflow sets `GREESE_BASE`) and routes by path;
the build also writes `studio/index.html`, a copy per docs page and template, and `404.html`,
so a direct visit to any of them works on Pages. Enable Pages once under Settings → Pages →
Source: GitHub Actions.

The docs are pages of the app, under its header and in the theme you're wearing: edit a
story or a guide in `apps/docs` and the app's dev server (`npm run studio`) shows it. Storybook
isn't deployed; it stays the place to author stories and the source of the visual tests.

To refresh the homepage's numbers, rebuild, run `npm run stats -w site`, and
re-run the benchmark with `node bench/run.ts --json ../site/src/data/bench.json`
in `apps/playground`. `npm run lighthouse -w site` checks it against the same
budgets as the playground.
