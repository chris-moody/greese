# GreeseUI

A mobile-first, TypeScript-first React 19 component library with
zero-runtime CSS (SCSS + CSS custom properties) and few dependencies. It
also contains greese.js, a small animation library.

| Package                         | Path                |
| ------------------------------- | ------------------- |
| `@greese-ui/react`              | `packages/react`    |
| `@greese-ui/tokens`             | `packages/tokens`   |
| `@greese-ui/greese` (greese.js) | `packages/greese`   |
| `@greese-ui/icons` (optional)   | `packages/icons`    |
| Storybook docs                  | `apps/docs`         |
| e2e, visual, Lighthouse         | `apps/playground`   |
| Theme Studio (`npm run studio`) | `apps/theme-studio` |
| Homepage (GitHub Pages)         | `apps/site`         |

## Before changing anything

Load the **`greese-conventions`** skill. It's the rule set, and it links the
ADRs in `docs/adr/` that govern each area. Then use the skill for the task:

| Task                                    | Skill                     | Agent                         |
| --------------------------------------- | ------------------------- | ----------------------------- |
| New or ported component                 | `greese-new-component`    | `greese-component-builder`    |
| Change or fix a component               | `greese-update-component` | `greese-component-builder`    |
| Styles, tokens, theming                 | `greese-styles`           | `greese-stylist`              |
| Animation, greese.js, the `greese` prop | `greese-animation`        | —                             |
| Size, dependencies, performance         | `greese-lightweight`      | `greese-size-guardian`        |
| Checking work before calling it done    | `greese-verify`           | `greese-reviewer` (read-only) |
| Docs, guides, ADRs, plan                | (conventions → Docs)      | `greese-docs-keeper`          |
| Committing                              | `commit`                  | —                             |

## House rules

- **Use npm**, not yarn.
- **Commits** are one-line Conventional Commits (`commit` skill). Never add
  `Co-authored-by` or any attribution trailer.
- **Don't push or publish** unless asked. Publishing is deferred.
- **Every exported component has its own story page,** parts like
  AccordionItem included; docs lint enforces it.
- **No new runtime dependencies** without an ADR.
- **Budgets are only raised deliberately,** with the reason stated.
- **Report gate results faithfully,** failures and skips included.
