# GreeseUI

A mobile-first, framework-agnostic component system: zero-runtime CSS (SCSS +
CSS custom properties) in `@greese/ui` that works in plain HTML, a small
animation library, greese.js (`@greese/js`), and framework packages such as
`@greese/react` (React 19) that render the same markup. More frameworks
(Svelte, Vue, Angular) are planned (ADR 0014).

| Package                                        | Path              |
| ---------------------------------------------- | ----------------- |
| `@greese/ui` (CSS, tokens, kit)                | `packages/ui`     |
| `@greese/react`                                | `packages/react`  |
| `@greese/js` (greese.js)                       | `packages/js`     |
| `@greese/icons`                                | `packages/icons`  |
| `@greese/mcp` (MCP server)                     | `packages/mcp`    |
| Docs source (stories, MDX); Storybook          | `apps/docs`       |
| e2e, visual, Lighthouse                        | `apps/playground` |
| Web app: `/`, `/docs`, `/studio`, `/templates` | `apps/site`       |

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
| Tests: unit, e2e, visual, Lighthouse    | `greese-testing`          | `greese-test-engineer`        |
| Checking work before calling it done    | `greese-verify`           | `greese-reviewer` (read-only) |
| Docs, guides, ADRs                      | (conventions → Docs)      | `greese-docs-keeper`          |
| Committing                              | `commit`                  | —                             |

## House rules

- **Use npm**, not yarn.
- **Commits** are one-line Conventional Commits (`commit` skill). Never add
  `Co-authored-by` or any attribution trailer.
- **Don't push or publish** unless asked. Publishing is deferred.
- **Every exported component has its own story page,** parts like
  AccordionItem included; docs lint enforces it.
- **Icons live in `@greese/icons`.** Never inline an `<svg>` icon or write a
  one-off `<Svg>` component: add it to `packages/icons/src/icons.tsx` (ADR 0020;
  ESLint enforces it).
- **No new runtime dependencies** without an ADR.
- **Budgets are only raised deliberately,** with the reason stated.
- **Report gate results faithfully,** failures and skips included.
- **Testing** is documented in one place: `docs/testing/README.md`.
