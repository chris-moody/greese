---
name: greese-verify
description: The full greese ui quality gate list with exact commands, what each proves, how to read failures, and the visual-baseline workflow. Use before declaring any change done, before committing, and when a CI gate fails.
---

# Verifying greese ui changes

Writing the tests is `greese-testing`; this is the gate list for afterwards.
Run from the repo root. Scale the gates to the change, but never skip one
that the change can affect. Report results faithfully: if something failed
or was skipped, say so.

## Fast loop (while working)

```bash
npx tsc --noEmit -p packages/react          # or packages/js, apps/docs
cd packages/react && npx vitest run src/components/<area>.test.tsx
npx playwright test e2e/<area>.spec.ts      # in apps/playground, after building
```

## Full gates (before done)

```bash
npx turbo run build check-types lint test size test:e2e --force
npm run format:check
npm run build -w docs && npm run test:visual -w playground
cd apps/playground && npx lhci autorun && cd ../..
VERIFY_TMP=<scratch dir> npm run verify:packages
```

| Gate              | Proves                                                                                                                                      | Typical failure                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `build`           | TS compiles; CSS compiles; every rendered class has a stylesheet; every stylesheet is in `greese.css`; Storybook builds                     | "Classes with no stylesheet", "Stylesheets missing from styles/index.scss"                                  |
| `check-types`     | Types across packages, scripts and stories                                                                                                  | A prop renamed without updating stories                                                                     |
| `lint`            | ESLint (zero warnings), stylelint, docs **story coverage**                                                                                  | Raw colors, `--_vars`, irregular whitespace, a component without a story                                    |
| `format:check`    | Prettier formatting, everywhere but generated files (`.prettierignore`)                                                                     | `npm run format` fixes it                                                                                   |
| `test`            | Unit + axe; coverage gate on `resolveResponsive`                                                                                            |                                                                                                             |
| `size`            | Budgets (`packages/react/.size-limit.cjs`, `packages/ui/.size-limit.cjs`, `packages/js/.size-limit.json`)                                   | See `greese-lightweight`                                                                                    |
| `test:e2e`        | Real layout, focus, top layer, touch, in 5 projects                                                                                         | If many unrelated tests hang for the same minutes at once, it was the machine (sleep), not the code; re-run |
| `test:visual`     | Every story × light/dark × phone/desktop, against baselines                                                                                 | A story changed: re-record and _look_                                                                       |
| Lighthouse        | Perf/a11y/best practices ≥ 0.95, LCP < 2.5 s, TBT < 100 ms, CLS < 0.05 on every playground page (exceptions in `lighthouserc.cjs`)          | New playground pages must be added to `lighthouserc.cjs`                                                    |
| `verify:packages` | The packed tarballs work as a consumer installs them (Node ESM/SSR, types, SCSS, per-component CSS, Vite bundling, greese.js without a DOM) | A new package not added to the pack list                                                                    |

## Visual baselines

```bash
npm run build -w docs
cd apps/playground
npx playwright test -c playwright.visual.config.ts --update-snapshots -g "<story-id-prefix>"
npm run test:visual   # then compare twice for stability
```

- Baselines live in `e2e/__screenshots__/{platform}/{phone|desktop}/`. Only
  macOS (darwin) baselines can be recorded locally; Linux ones come from the
  CI Visual workflow's `update` run.
- When story IDs change (renamed or moved stories), delete the old baselines
  for them.
- The visual suite runs with `prefers-reduced-motion: reduce`, so motion
  stories snapshot their final state.
- `e2e/scrollbars.spec.ts` runs Chromium with real, space-taking scrollbars
  (other engines skip it). Use it for anything touching the scroll lock or
  edge-anchored overlays.
- **Always open a sample of new screenshots**, in light and dark, phone and
  desktop. They have caught stretched badges, invisible dark swatches,
  wrapped text and missing stylesheets that every other gate passed.

## Local Storybook

`npm run dev -w docs` (port 6006), or `npx storybook dev -p 6007 --no-open`
in `apps/docs`. If `index.json` reports "Unable to index files" after heavy
edits, restart the server. The static build is the reference.
