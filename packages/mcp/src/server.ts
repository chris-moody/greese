import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { createTheme, cssVar, type ThemeOptions } from '@greese/ui'
import type { ComponentDoc, GreeseData } from './data.ts'
import { firstSentence, score, search } from './search.ts'

type Text = { content: Array<{ type: 'text'; text: string }>; isError?: boolean }
const text = (value: string): Text => ({ content: [{ type: 'text', text: value }] })
const error = (value: string): Text => ({ ...text(value), isError: true })

/** The closest names to a miss, so a typo gets a suggestion instead of a dead end. */
const suggest = (query: string, names: string[]): string => {
  const close = names
    .map((name) => ({ name, s: score(query, name, '') || (name.toLowerCase().startsWith(query.toLowerCase().slice(0, 3)) ? 1 : 0) }))
    .filter((c) => c.s)
    .sort((a, b) => b.s - a.s)
    .slice(0, 5)
    .map((c) => c.name)
  return close.length ? ` Did you mean: ${close.join(', ')}?` : ''
}

const findByName = <T>(items: T[], name: string, key: (item: T) => string): T | undefined =>
  items.find((item) => key(item) === name) ??
  items.find((item) => key(item).toLowerCase() === name.toLowerCase())

const cell = (value: string) => value.replace(/\|/g, '\\|').replace(/\n+/g, ' ')

/** A component as Markdown: what it is, its props, what a theme can target, and an example. */
export const componentMarkdown = (c: ComponentDoc, example = true): string => {
  const lines = [`# ${c.name}`, '', `Category: ${c.category}. Source: \`${c.file}\`.`, '', c.description, '']
  lines.push("```tsx", `import { ${c.name} } from '@greese/react'`, '```', '')
  if (c.props.length) {
    lines.push('## Props', '', '| Prop | Type | Default | Description |', '| --- | --- | --- | --- |')
    for (const p of c.props)
      lines.push(
        `| \`${p.name}\`${p.required ? ' (required)' : ''} | \`${cell(p.type)}\` | ${p.default === undefined ? '' : `\`${cell(p.default)}\``} | ${cell(p.description)} |`
      )
    lines.push(
      '',
      'Other props pass through to the root element (DOM attributes, `ref`, `className`, `style`). Every component also takes the `greese` motion prop.',
      ''
    )
  }
  if (c.styles) {
    const s = c.styles
    lines.push('## Styling', '', `Root class: \`.${s.className}\`.`)
    if (s.parts.length) lines.push(`Parts: ${s.parts.map((p) => `\`.${s.className}-${p}\``).join(', ')}.`)
    if (s.modifiers.length)
      lines.push(`Modifiers: ${s.modifiers.map((m) => `\`.${s.className}--${m}\``).join(', ')}.`)
    if (s.attributes.length) lines.push(`State attributes: ${s.attributes.map((a) => `\`${a}\``).join(', ')}.`)
    if (s.variables.length) lines.push(`Variables: ${s.variables.map((v) => `\`${v}\``).join(', ')}.`)
    lines.push(
      '',
      'Restyle it with the SCSS kit (`@include greese.component(' + c.name + ') { … }`), which writes into `@layer greese.overrides`, or with plain CSS on these classes.',
      ''
    )
  }
  if (example && c.example) lines.push('## Example (its stories file)', '', '```tsx', c.example.trim(), '```')
  return lines.join('\n')
}

/**
 * The GreeseUI MCP server: tools and resources over the data baked at build
 * time (ADR 0022). Connect it to any transport; the CLI uses stdio.
 */
export const createGreeseServer = (data: GreeseData): McpServer => {
  const server = new McpServer(
    { name: 'greese', version: data.version },
    {
      instructions:
        'GreeseUI is a mobile-first React 19 component library (@greese/react) styled by framework-free CSS (@greese/ui), with icons in @greese/icons and motion via the `greese` prop. Before writing UI code, look components up with get_component instead of guessing props, use tokens (list_tokens) rather than raw values, and use icons from @greese/icons (list_icons) rather than inline SVG. Templates (list_templates) are complete pages to start from.',
    }
  )

  const names = data.components.map((c) => c.name)

  server.registerTool(
    'list_components',
    {
      title: 'List components',
      description: 'Every GreeseUI React component, by docs category, with a one-line summary.',
      inputSchema: {
        category: z
          .string()
          .optional()
          .describe('Only this category: Layout, Forms, Content, Overlays, Navigation, Motion or Utilities.'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ category }) => {
      const chosen = data.components.filter(
        (c) => !category || c.category.toLowerCase() === category.toLowerCase()
      )
      if (!chosen.length) return error(`No components in category "${category}".`)
      const byCategory = new Map<string, ComponentDoc[]>()
      for (const c of chosen) byCategory.set(c.category, [...(byCategory.get(c.category) ?? []), c])
      const out = [...byCategory]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([cat, list]) => `## ${cat}\n${list.map((c) => `- **${c.name}**: ${firstSentence(c.description)}`).join('\n')}`)
      return text(out.join('\n\n'))
    }
  )

  server.registerTool(
    'get_component',
    {
      title: 'Get a component',
      description:
        "A component's documentation: description, every prop with its type, default and meaning, the classes, parts, modifiers and CSS variables a theme can target, and its stories file as working example code.",
      inputSchema: {
        name: z.string().describe('The component, as exported: Button, Dialog, TextField…'),
        example: z.boolean().optional().describe('Include the example code. Defaults to true.'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ name, example }) => {
      const c = findByName(data.components, name, (c) => c.name)
      return c
        ? text(componentMarkdown(c, example ?? true))
        : error(`No component named "${name}".${suggest(name, names)}`)
    }
  )

  server.registerTool(
    'search',
    {
      title: 'Search GreeseUI',
      description: 'Searches components, guides, templates and themes by keyword. Every word must match.',
      inputSchema: {
        query: z.string().min(1).describe('Words to look for: "date picker", "dark mode", "toast".'),
        limit: z.number().int().min(1).max(50).optional().describe('At most this many results. Defaults to 10.'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ query, limit }) => {
      const hits = search(data, query, limit ?? 10)
      return hits.length
        ? text(hits.map((h) => `- [${h.kind}] **${h.name}**: ${h.summary}`).join('\n'))
        : text(`Nothing matches "${query}". Try fewer or broader words.`)
    }
  )

  server.registerTool(
    'list_tokens',
    {
      title: 'List design tokens',
      description:
        'The design tokens and their CSS custom properties: colors (light and dark), space, radius, font, shadow, z-index, duration, easing, breakpoints, the palette and the type scale. Without a group, lists the groups.',
      inputSchema: {
        group: z.string().optional().describe('A group: color, space, radius, font, shadow, palette, typography, breakpoints…'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ group }) => {
      const groups = Object.keys(data.tokens)
      if (!group)
        return text(
          `Token groups: ${groups.join(', ')}.\n\nA token is used as \`var(--greese-<group>-<name>)\`, names in kebab-case: \`var(${cssVar('color', 'primaryStrong')})\`, \`var(${cssVar('space', '4')})\`. Palette colors are \`var(--greese-palette-<hue>-<shade>)\`.`
        )
      const values = data.tokens[group]
      if (values === undefined) return error(`No token group "${group}". Groups: ${groups.join(', ')}.`)
      const scalar = !['palette', 'typography', 'breakpoints'].includes(group)
      const rows =
        scalar && values && typeof values === 'object'
          ? Object.entries(values as Record<string, unknown>).map(
              ([name, value]) =>
                `- \`${cssVar(group as Parameters<typeof cssVar>[0], name)}\`: ${JSON.stringify(value)}`
            )
          : [ '```json', JSON.stringify(values, null, 2), '```' ]
      return text(`# ${group}\n\n${rows.join('\n')}`)
    }
  )

  server.registerTool(
    'list_icons',
    {
      title: 'List icons',
      description:
        'The icons in @greese/icons. Use these rather than inline <svg>: every GreeseUI icon lives in that package.',
      inputSchema: { query: z.string().optional().describe('Only icons whose name contains this.') },
      annotations: { readOnlyHint: true },
    },
    ({ query }) => {
      const icons = data.icons.filter((i) => !query || i.toLowerCase().includes(query.toLowerCase()))
      if (!icons.length) return text(`No icon matches "${query}". Add one to packages/icons/src/icons.tsx with createIcon().`)
      return text(
        `${icons.join(', ')}\n\n\`\`\`tsx\nimport { ${icons[0]} } from '@greese/icons'\n\n<Icon label="…"><${icons[0]} /></Icon>  // or as a Button's startIcon\n\`\`\``
      )
    }
  )

  server.registerTool(
    'create_theme',
    {
      title: 'Create a theme',
      description:
        "Runs @greese/ui's createTheme and returns the theme's CSS: every token, with your overrides. Setting a brand color also derives its readable content color and its strong shade.",
      inputSchema: {
        name: z.string().regex(/^[a-z][a-z0-9-]*$/i).describe('The theme name: data-greese-theme="<name>" applies it.'),
        options: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            'createTheme options besides name, e.g. { "color": { "primary": { "light": "#7c3aed", "dark": "#c4b5fd" } }, "radius": { "md": "12px" } }. Groups: color, space, radius, font, shadow, duration, easing, typography, extend.'
          ),
      },
      annotations: { readOnlyHint: true },
    },
    ({ name, options }) => {
      try {
        const theme = createTheme({ ...(options as Omit<ThemeOptions, 'name'>), name })
        return text(
          `\`\`\`css\n${theme.css}\n\`\`\`\n\nServe this after GreeseUI's styles and set \`data-greese-theme="${name}"\` on any element, or in React: \`<ThemeProvider theme={createTheme({ name: '${name}', … })}>\`.`
        )
      } catch (e) {
        return error(e instanceof Error ? e.message : String(e))
      }
    }
  )

  server.registerTool(
    'list_templates',
    {
      title: 'List templates',
      description: 'Complete page templates (finance, admin dashboard, email client, blog, SaaS, e-commerce…) built from GreeseUI components.',
      annotations: { readOnlyHint: true },
    },
    () =>
      text(
        data.templates.length
          ? data.templates.map((t) => `- **${t.id}**: ${firstSentence(t.description)}`).join('\n')
          : 'No templates in this build.'
      )
  )

  server.registerTool(
    'get_template',
    {
      title: 'Get a template',
      description: "A template's full source: a React page to copy and adapt.",
      inputSchema: { id: z.string().describe('The template, as list_templates names it.') },
      annotations: { readOnlyHint: true },
    },
    ({ id }) => {
      const t = findByName(data.templates, id, (t) => t.id)
      return t
        ? text(
            `# ${t.id}\n\n${t.description}\n\n\`\`\`tsx\n${t.source.trim()}\n\`\`\`${
              data.templateStyles
                ? `\n\nThe \`tpl-*\` classes it uses (templates.scss, shared by every template):\n\n\`\`\`scss\n${data.templateStyles.trim()}\n\`\`\``
                : ''
            }`
          )
        : error(`No template "${id}".${suggest(id, data.templates.map((t) => t.id))}`)
    }
  )

  server.registerTool(
    'list_themes',
    {
      title: 'List shape themes',
      description: 'Themes that reshape containers and buttons with clip-path and masks, and animate them.',
      annotations: { readOnlyHint: true },
    },
    () =>
      text(
        data.themes.length
          ? data.themes.map((t) => `- **${t.id}**: ${firstSentence(t.description)}`).join('\n')
          : 'No themes in this build.'
      )
  )

  server.registerTool(
    'get_theme',
    {
      title: 'Get a shape theme',
      description:
        "A shape theme's source: kit SCSS (compile after GreeseUI's styles, or read as a recipe) and its compiled CSS (@greese/ui/themes/<id>.css).",
      inputSchema: {
        id: z.string().describe('The theme, as list_themes names it.'),
        format: z.enum(['scss', 'css', 'both']).optional().describe('Which source. Defaults to scss.'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ id, format }) => {
      const t = findByName(data.themes, id, (t) => t.id)
      if (!t) return error(`No theme "${id}".${suggest(id, data.themes.map((t) => t.id))}`)
      const want = format ?? 'scss'
      const parts = [`# ${t.id}\n\n${t.description}\n\nUse it: \`import '@greese/ui/themes/${t.id}.css'\` after GreeseUI's styles.`]
      if (want !== 'css') parts.push(`\`\`\`scss\n${t.scss.trim()}\n\`\`\``)
      if (want !== 'scss') parts.push(`\`\`\`css\n${t.css.trim()}\n\`\`\``)
      return text(parts.join('\n\n'))
    }
  )

  server.registerResource(
    'guide',
    new ResourceTemplate('greese://guides/{name}', {
      list: () => ({
        resources: data.guides.map((g) => ({
          uri: `greese://guides/${g.name}`,
          name: g.name,
          title: g.title,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    { title: 'GreeseUI guides', description: 'Getting started, theming, styling, animation, utilities…', mimeType: 'text/markdown' },
    (uri, { name }) => {
      const g = data.guides.find((g) => g.name === name)
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: g?.text ?? `No guide "${String(name)}".` }] }
    }
  )

  server.registerResource(
    'component',
    new ResourceTemplate('greese://components/{name}', {
      list: () => ({
        resources: data.components.map((c) => ({
          uri: `greese://components/${c.name}`,
          name: c.name,
          description: firstSentence(c.description),
          mimeType: 'text/markdown',
        })),
      }),
    }),
    { title: 'GreeseUI components', description: 'One document per component: props, classes, example.', mimeType: 'text/markdown' },
    (uri, { name }) => {
      const c = data.components.find((c) => c.name === name)
      return {
        contents: [
          { uri: uri.href, mimeType: 'text/markdown', text: c ? componentMarkdown(c) : `No component "${String(name)}".` },
        ],
      }
    }
  )

  return server
}
