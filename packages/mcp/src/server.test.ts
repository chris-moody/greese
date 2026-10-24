import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { GreeseData } from './data.ts'
import { score, search } from './search.ts'
import { createGreeseServer } from './server.ts'

const data: GreeseData = {
  version: '0.0.0',
  components: [
    {
      name: 'Button',
      category: 'Forms',
      description: 'A native button with variants and tones. Loading keeps its width.',
      file: 'packages/react/src/components/Button/Button.tsx',
      props: [
        {
          name: 'variant',
          type: '"solid" | "ghost"',
          required: false,
          default: 'solid',
          description: 'Its emphasis.',
        },
        {
          name: 'label',
          type: 'string',
          required: true,
          description: 'The accessible name.',
        },
      ],
      styles: {
        className: 'greese-Button',
        parts: ['icon'],
        modifiers: ['solid', 'ghost'],
        attributes: ['[data-loading]'],
        variables: ['--greese-button-bg'],
      },
      example: 'export const Playground = {}',
    },
    {
      name: 'Dialog',
      category: 'Overlays',
      description: 'A modal dialog on native <dialog>.',
      file: 'packages/react/src/components/Dialog/Dialog.tsx',
      props: [],
    },
  ],
  tokens: {
    color: { primary: { light: '#000', dark: '#fff' } },
    space: { '4': '1rem' },
    palette: { red: { 500: '#f00' } },
  },
  icons: ['CloseIcon', 'MenuIcon', 'SaveIcon'],
  guides: [
    {
      name: 'Theming',
      title: 'Theming',
      text: '# Theming\n\nDark mode and createTheme.',
    },
  ],
  themes: [
    { id: 'bevel', description: 'Cut corners. Animated.', scss: '.a{}', css: '.a{}' },
  ],
  templates: [
    {
      id: 'Finance',
      description: 'A finance dashboard.',
      source: 'export const Finance = () => null',
    },
  ],
}

let client: Client

beforeEach(async () => {
  const [a, b] = InMemoryTransport.createLinkedPair()
  await createGreeseServer(data).connect(a)
  client = new Client({ name: 'test', version: '0' })
  await client.connect(b)
})

afterEach(() => client.close())

const call = async (name: string, args: Record<string, unknown> = {}) => {
  const result = (await client.callTool({ name, arguments: args })) as {
    content: Array<{ text: string }>
    isError?: boolean
  }
  return { text: result.content.map((c) => c.text).join('\n'), isError: !!result.isError }
}

describe('the GreeseUI MCP server', () => {
  it('offers its tools, with instructions for the assistant', async () => {
    const { tools } = await client.listTools()
    expect(tools.map((t) => t.name).sort()).toEqual([
      'create_theme',
      'get_component',
      'get_template',
      'get_theme',
      'list_components',
      'list_icons',
      'list_templates',
      'list_themes',
      'list_tokens',
      'search',
    ])
    expect(tools.every((t) => t.annotations?.readOnlyHint)).toBe(true)
    expect(client.getInstructions()).toMatch(/get_component/)
  })

  it('lists components by category, and filters', async () => {
    expect((await call('list_components')).text).toMatch(
      /## Forms\n- \*\*Button\*\*: A native button with variants and tones\./
    )
    const overlays = await call('list_components', { category: 'overlays' })
    expect(overlays.text).toMatch(/Dialog/)
    expect(overlays.text).not.toMatch(/Button/)
    expect((await call('list_components', { category: 'Nope' })).isError).toBe(true)
  })

  it('documents a component: props, classes and example', async () => {
    const { text } = await call('get_component', { name: 'button' })
    expect(text).toMatch(/^# Button/)
    expect(text).toMatch(/\| `label` \(required\) \| `string` \|/)
    expect(text).toMatch(/\| `variant` \| `"solid" \\\| "ghost"` \| `solid` \|/)
    expect(text).toMatch(/`.greese-Button--ghost`/)
    expect(text).toMatch(/```tsx\nexport const Playground/)
    expect(
      (await call('get_component', { name: 'Button', example: false })).text
    ).not.toMatch(/Playground/)
  })

  it('suggests a name for a miss', async () => {
    const miss = await call('get_component', { name: 'Butto' })
    expect(miss.isError).toBe(true)
    expect(miss.text).toMatch(/Did you mean: Button/)
  })

  it('searches every kind of document', async () => {
    expect((await call('search', { query: 'dark mode' })).text).toMatch(
      /\[guide\] \*\*Theming\*\*/
    )
    expect((await call('search', { query: 'finance' })).text).toMatch(
      /\[template\] \*\*Finance\*\*/
    )
    expect((await call('search', { query: 'zzz' })).text).toMatch(/Nothing matches/)
  })

  it('lists tokens as custom properties', async () => {
    expect((await call('list_tokens')).text).toMatch(
      /Token groups: color, space, palette/
    )
    expect((await call('list_tokens', { group: 'color' })).text).toMatch(
      /`--greese-color-primary`/
    )
    expect((await call('list_tokens', { group: 'palette' })).text).toMatch(
      /"500": "#f00"/
    )
    expect((await call('list_tokens', { group: 'nope' })).isError).toBe(true)
  })

  it('lists icons, filtered', async () => {
    const { text } = await call('list_icons', { query: 'save' })
    expect(text).toMatch(/^SaveIcon\n/)
    expect(text).toMatch(/import \{ SaveIcon \} from '@greese\/icons'/)
  })

  it("creates a theme's CSS, and reports a bad value", async () => {
    const ok = await call('create_theme', {
      name: 'brand',
      options: { color: { primary: '#7c3aed' }, radius: { md: '12px' } },
    })
    expect(ok.text).toMatch(/--greese-color-primary: #7c3aed/)
    expect(ok.text).toMatch(/data-greese-theme="brand"/)
    const bad = await call('create_theme', {
      name: 'brand',
      options: { radius: { md: '1px; }' } },
    })
    expect(bad.isError).toBe(true)
  })

  it('serves templates and themes', async () => {
    expect((await call('list_templates')).text).toMatch(/\*\*Finance\*\*/)
    expect((await call('get_template', { id: 'finance' })).text).toMatch(
      /export const Finance/
    )
    expect((await call('get_theme', { id: 'bevel', format: 'both' })).text).toMatch(
      /```scss[\s\S]*```css/
    )
    expect((await call('get_theme', { id: 'nope' })).isError).toBe(true)
  })

  it('serves guides and components as resources', async () => {
    const { resources } = await client.listResources()
    expect(resources.map((r) => r.uri)).toEqual(
      expect.arrayContaining(['greese://guides/Theming', 'greese://components/Button'])
    )
    const guide = await client.readResource({ uri: 'greese://guides/Theming' })
    expect(guide.contents[0]).toMatchObject({
      text: expect.stringMatching(/createTheme/),
    })
  })
})

describe('search scoring', () => {
  it('needs every word, and ranks a name above a body', () => {
    expect(score('date picker', 'DateField', 'A date input')).toBe(0)
    expect(score('date', 'DateField', 'x')).toBeGreaterThan(
      score('date', 'Other', '', 'date')
    )
    expect(search(data, '')).toEqual([])
  })
})
