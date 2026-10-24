# ADR 0013: Project scope, phases and standing decisions

- **Status:** Accepted
- **Date:** 2026-10-20, recording decisions made from 2026-10-17
- **Amended by:** [ADR 0014](0014-framework-agnostic-packages.md), which
  renames the packages to `@greese/*` and makes the CSS framework-free.
- **Replaces:** the development plan, which is no longer kept in the
  repository. This ADR keeps what the other ADRs, the skills and the agents
  rely on from it.

## Context

GreeseUI was built in phases from a development plan. Other ADRs refer to
those phases ("Phase 2's e2e tests…"), and the plan's goals and project-wide
decisions (React floor, browser baseline, licence) were recorded nowhere
else. Plans now stay local, so the parts with lasting value live here.

## Goals and non-goals

**Goals:**

- zero runtime style generation: CSS is compiled at build time, and
  components only toggle classes and set custom properties (ADR 0001);
- MUI-like responsive props, such as
  `<Stack direction={{ xs: 'column', md: 'row' }} gap={{ xs: 2, lg: 4 }} />`;
- theming through CSS custom properties: light, dark and custom themes,
  nested themes, and overrides in plain CSS (ADR 0002);
- mobile-first: small screens first, touch targets that grow on coarse
  pointers, safe-area insets respected;
- strict TypeScript, typed responsive props and tokens;
- no runtime dependencies beyond the `react` and `react-dom` peers (later:
  the project's own `@greese/*` packages);
- SSR and React Server Components work, because nothing is injected at
  render;
- accessible by default, following the WAI-ARIA Authoring Practices.

**Non-goals (v1):**

- a general `sx` prop for arbitrary CSS objects, which would bring the
  runtime cost back; typed style props cover the common cases;
- a data grid, a full calendar date picker and charts: separate efforts, as
  separate packages if ever;
- browsers older than the Baseline 2024 target below.

## Phases

The phase numbers other ADRs cite:

| Phase | Scope                                                 | Done       | Decisions         |
| ----- | ----------------------------------------------------- | ---------- | ----------------- |
| 0     | Repo reshaping: npm workspaces, build, CI, Changesets | 2026-10-17 | This ADR          |
| 1     | Foundations: tokens, theming, the responsive core     | 2026-10-17 | ADR 0001, 0002    |
| 2     | Layout primitives and the MUI benchmark               | 2026-10-17 | ADR 0001          |
| 3     | Actions and forms                                     | 2026-10-17 | ADR 0003          |
| 4     | Content, media and disclosure                         | 2026-10-17 | ADR 0004          |
| 5     | Overlays and navigation                               | 2026-10-17 | ADR 0005          |
| 6     | Hardening, docs, quality gates, 1.0.0                 | 2026-10-17 | ADR 0006          |
| 7     | Component gaps (1.1.0)                                | 2026-10-18 | ADR 0007          |
| —     | Components ported from GLOP                           | 2026-10-18 | ADR 0007 addendum |
| —     | greese.js                                             | 2026-10-18 | ADR 0008          |
| —     | The `greese` prop                                     | 2026-10-18 | ADR 0009          |
| —     | SCSS kit, style manifest, Theme Studio                | 2026-10-19 | ADR 0010          |
| —     | Component gap review                                  | 2026-10-19 | ADR 0011          |
| —     | `@greese/icons` and the docs rules                    | 2026-10-19 | ADR 0012          |
| —     | Repository, npm metadata, the three apps on Pages     | 2026-10-20 | This ADR, 0010    |
| —     | Framework-agnostic packages: `@greese/ui`, `js`       | 2026-10-20 | ADR 0014          |
| —     | Breakpoint keys; extensible tokens                    | 2026-10-20 | ADR 0006, 0015    |
| —     | Typography system                                     | 2026-10-20 | ADR 0016          |
| —     | Motion scopes                                         | 2026-10-20 | ADR 0017          |
| —     | One web app: the homepage and Theme Studio            | 2026-10-20 | ADR 0018          |
| —     | Utility classes, purged by what the source uses       | 2026-10-21 | ADR 0019          |
| —     | ScrollSpy; an MCP server, `@greese/mcp`               | 2026-10-23 | ADR 0022          |
| —     | Shape themes and page templates                       | 2026-10-23 | ADR 0023          |
| —     | Shapes: one geometry, animated parameters, editor     | 2026-10-23 | ADR 0024          |
| —     | Theme layers: colors, shapes, motion themes           | 2026-10-23 | ADR 0025          |
| —     | Header, Footer, anchors and steady hovers             | 2026-10-24 | ADR 0026          |

When a new body of work lands, add a row here; that's the status record the
skills and agents keep up to date.

## Standing decisions

| Question           | Decision                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Publish target     | Public npm under `@greese`, with provenance. The npm org and the `NPM_TOKEN` secret wait for the first release                       |
| React floor        | React 19 only                                                                                                                        |
| Browser baseline   | Baseline 2024 (`@property`, container queries and cascade layers; ADR 0001)                                                          |
| Docs hosting       | GitHub Pages (`.github/workflows/pages.yml`): the homepage at `/`, Storybook at `/storybook/`, the hosted Theme Studio at `/studio/` |
| Repository         | <https://github.com/chris-moody/greese>; each published package's `repository`, `homepage` and `bugs` point there                    |
| Licence            | MIT                                                                                                                                  |
| Package manager    | npm workspaces                                                                                                                       |
| TypeScript         | Pinned to `~6.0` until typescript-eslint supports TS 7                                                                               |
| ESLint             | Stays on 9 until eslint-plugin-react supports 10                                                                                     |
| Icons              | Components take icons as `ReactNode`; the optional `@greese/icons` package is separate and never imported by the library (ADR 0012)  |
| Private registries | None: installing needs only the public npm registry                                                                                  |

## Deferred

- Publishing 1.0.0: needs the npm org and `NPM_TOKEN`; the Release workflow
  then publishes on the next push to `main`. The first push replaces the
  remote's generated initial commit (a LICENSE), so it needs
  `--force-with-lease`.
- Enabling Pages: Settings → Pages → Source: GitHub Actions, once.
- Linux visual baselines: run the Visual workflow with `update` and commit
  its `linux-baselines` artifact.
- Custom breakpoint _keys_ (values are already configurable through the SCSS
  entry), and the non-goals above.

## Consequences

- Phase references in ADRs 0001–0007 resolve to the table above.
- The skills and agents treat the phase table as the project's status
  record, in place of the plan.
