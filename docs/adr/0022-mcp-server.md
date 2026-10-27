# ADR 0022: An MCP server for greese ui, `@greese/mcp`

- **Status:** Accepted
- **Date:** 2026-10-23

## Context

Coding assistants write a lot of the UI code people ship. Without help they
guess at greese ui: prop names from other libraries, class names that don't
exist, tokens by memory, inline `<svg>` icons. Everything they need is already
in the repository, but spread out:

- props and their TSDoc in `packages/react`;
- classes, parts, modifiers and variables in the style manifest (ADR 0010);
- tokens in `@greese/ui`;
- icons in `@greese/icons`;
- guides and stories in `apps/docs`;
- themes and templates in `apps/site`.

The Model Context Protocol (MCP) is the standard way to hand an assistant
tools and documents like these.

## Decision

**A new package, `@greese/mcp`** (`packages/mcp`), runs a stdio MCP server:

```sh
npx @greese/mcp
```

**Data is baked at build time, not read at run time.** `scripts/build-data.ts`
gathers everything into `dist/data.json`:

- the component docs, from `react-docgen-typescript` (the parser the docs and
  the prop-docs lint already use);
- each component's style entry from `@greese/ui/style-manifest.json`;
- its stories file, as example code;
- the tokens, imported from `@greese/ui`;
- the icon names;
- the guides;
- the shape themes' SCSS and CSS;
- the templates' source.

The published package therefore never reads the repository, and it answers
for the version it was built from.

**Tools:**

- `list_components`;
- `get_component` (props, classes, example);
- `search` (components, guides, templates);
- `list_tokens`;
- `list_icons`;
- `create_theme` (runs `createTheme`, returns CSS);
- `list_templates` and `get_template`;
- `list_themes` and `get_theme`.

**Resources:** each guide is a resource (`greese://guides/<name>`), and so is
each component's doc (`greese://components/<Name>`).

**Two runtime dependencies, here only:**

- `@modelcontextprotocol/sdk` (the official SDK);
- `zod` (the SDK's schema peer).

They are dependencies of `@greese/mcp` alone. No browser package gains a
dependency, and nothing in `@greese/react`, `@greese/ui` or `@greese/js`
changes size. Hand-rolling JSON-RPC over stdio was the alternative. It was
rejected because the protocol still changes (capabilities, schemas, transports),
and the SDK tracks those changes for us.

## Consequences

- `@greese/mcp` depends on `@greese/ui` at run time, for `createTheme`.
- Its build runs after `@greese/ui`'s (turbo `^build`), because it reads the
  style manifest.
- Answers are only as good as the TSDoc. The prop-docs lint (ADR 0012) already
  requires a description on every prop.
- A component, guide, template or theme added later reaches the server on its
  next build, with nothing to register.
