# @greese/mcp

An [MCP](https://modelcontextprotocol.io) server for GreeseUI. It gives a
coding assistant the facts it needs to write GreeseUI code instead of guessing
them:

- the components;
- their props;
- the classes a theme can target;
- tokens and icons;
- the guides;
- the shape themes;
- complete page templates.

It answers for the GreeseUI version it was built with.

## Set up

Claude Code:

```sh
claude mcp add greese -- npx -y @greese/mcp
```

Any client that takes a JSON config (Claude Desktop, Cursor, VS Code…):

```json
{
  "mcpServers": {
    "greese": { "command": "npx", "args": ["-y", "@greese/mcp"] }
  }
}
```

It runs over stdio and needs Node 24 or later.

## Tools

| Tool                               | What it returns                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `list_components`                  | Every component by docs category, one line each                                                                  |
| `get_component`                    | A component's description, every prop (type, default, meaning), its classes, parts, modifiers and CSS variables, and its stories file as example code |
| `search`                           | Components, guides, templates and themes that match some words                                                   |
| `list_tokens`                      | Design tokens as CSS custom properties, by group                                                                 |
| `list_icons`                       | The icons in `@greese/icons`                                                                                     |
| `create_theme`                     | The CSS of a theme built with `createTheme(options)`                                                             |
| `list_templates`, `get_template`   | Page templates (finance, admin dashboard, email client, blog, SaaS, store) and their source                      |
| `list_themes`, `get_theme`         | Shape themes (clip-path and masks), as kit SCSS or compiled CSS                                                  |

## Resources

- `greese://guides/<name>`: the guides (Getting started, Theming, Styling…).
- `greese://components/<Name>`: one document per component.

## Programmatic use

```ts
import { createGreeseServer, loadData } from '@greese/mcp'

const server = createGreeseServer(loadData()) // an McpServer: connect any transport
```

See ADR 0022 for how it's built.
