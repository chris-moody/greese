# GreeseUI

Mobile-first, TypeScript-first React components with zero-runtime styling:
static CSS compiled at build time, themed with CSS custom properties.

| Package | |
|---|---|
| [`@greese-ui/react`](packages/react) | Components, hooks, and the compiled stylesheet |
| [`@greese-ui/tokens`](packages/tokens) | Design tokens as CSS variables, Sass maps, and TS constants |

Plan and architecture: [docs/plans/DEVELOPMENT_PLAN.md](docs/plans/DEVELOPMENT_PLAN.md).

## Workspace

| Path | |
|---|---|
| `packages/react`, `packages/tokens` | Published packages |
| `packages/eslint-config`, `packages/typescript-config` | Internal shared config |
| `apps/docs` | Storybook. Uses the library **source**, so edits hot-reload |
| `apps/playground` | Vite app that uses the **built** `dist/`, the same way a real consumer does. Playwright e2e and perf benchmarks run against it |
| `apps/site` | The greese homepage (GitHub Pages), built with GreeseUI from the **built** `dist/`. Its numbers come from `npm run stats -w site` and the benchmark |

## Setup

Requires Node 24 (`nvm use`) and npm.

```bash
npm install
npx playwright install chromium   # once, for e2e
```

## Commands

| Command | |
|---|---|
| `npm run dev` | Storybook on :6006 and the playground dev server |
| `npm run build` | Builds every package and app (turbo, cached) |
| `npm test` | Unit tests (Vitest + jsdom) |
| `npm run test:e2e` | Real-browser tests (Playwright, mobile and desktop) on :4310 |
| `npm run check-types` / `npm run lint` | |
| `npm run size` | Fails if the bundle-size budgets in `packages/react/.size-limit.json` are exceeded |
| `npm run test:visual` | Visual regression for every story (builds Storybook first) |
| `npm run lighthouse -w playground` | Lighthouse budgets on the playground pages (after `npm run build`) |
| `npm run verify:packages` | Packs both packages and checks them in a clean consumer project |
| `npm run bench -w playground` | GreeseUI vs MUI performance benchmark |
| `npm run changeset` | Records a release note for a change to a published package |

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
to npm (`.github/workflows/release.yml`). `@greese-ui/react` and
`@greese-ui/tokens` share one version number.

## Documentation

Run `npm run dev` and open http://localhost:6006. You'll find guides (getting
started, theming, responsive props, accessibility, migrating from MUI), a docs
page for every component, and live stories. Decisions are recorded in
[docs/adr](docs/adr).

## Homepage

`apps/site` is a static site for GitHub Pages. `.github/workflows/pages.yml`
publishes it on pushes to `main` (or run it by hand), with Storybook at
`/storybook/`. Enable it once under Settings → Pages → Source: GitHub
Actions. To refresh its numbers, rebuild, run `npm run stats -w site`, and
re-run the benchmark with `node bench/run.ts --json ../site/src/data/bench.json`
in `apps/playground`. `npm run lighthouse -w site` checks it against the same
budgets as the playground.

## Docs hosting

`firebase deploy --only hosting` publishes `apps/docs/storybook-static`, so run
`npm run build` first.
