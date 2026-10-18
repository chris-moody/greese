# SauceUI

A mobile-first, TypeScript-first React 19 component library with
zero-runtime CSS (SCSS + CSS custom properties) and few dependencies. It
also contains sauce.js, a small animation library.

| Package                      | Path              |
| ---------------------------- | ----------------- |
| `@sauce-ui/react`            | `packages/react`  |
| `@sauce-ui/tokens`           | `packages/tokens` |
| `@sauce-ui/sauce` (sauce.js) | `packages/sauce`  |
| Storybook docs               | `apps/docs`       |
| e2e, visual, Lighthouse      | `apps/playground` |

## Before changing anything

Load the **`sauce-conventions`** skill. It's the rule set, and it links the
ADRs in `docs/adr/` that govern each area. Then use the skill for the task:

| Task                                  | Skill                    | Agent                        |
| ------------------------------------- | ------------------------ | ---------------------------- |
| New or ported component               | `sauce-new-component`    | `sauce-component-builder`    |
| Change or fix a component             | `sauce-update-component` | `sauce-component-builder`    |
| Styles, tokens, theming               | `sauce-styles`           | `sauce-stylist`              |
| Animation, sauce.js, the `sauce` prop | `sauce-animation`        | —                            |
| Size, dependencies, performance       | `sauce-lightweight`      | `sauce-size-guardian`        |
| Checking work before calling it done  | `sauce-verify`           | `sauce-reviewer` (read-only) |
| Docs, guides, ADRs, plan              | (conventions → Docs)     | `sauce-docs-keeper`          |
| Committing                            | `commit`                 | —                            |

## House rules

- **Use npm**, not yarn.
- **Commits** are one-line Conventional Commits (`commit` skill). Never add
  `Co-authored-by` or any attribution trailer.
- **Don't push or publish** unless asked. Publishing is deferred.
- **Every exported component has a story;** docs lint enforces it.
- **No new runtime dependencies** without an ADR.
- **Budgets are only raised deliberately,** with the reason stated.
- **Report gate results faithfully,** failures and skips included.
