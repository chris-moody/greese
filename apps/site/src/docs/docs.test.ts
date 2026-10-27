import { createElement as h, Fragment, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { Button, Stack, Table, TableBody, type ButtonProps } from '@greese/react'
import { PlusIcon } from '@greese/icons'
import { declaredComponents, nameDeclarations } from '../../server/storyNames.ts'
import { controlKind, defaultValue } from './ArgsTable.tsx'
import { docsTarget } from './DocsLink.tsx'
import { exportOrder, metaComment, storyComments } from './load.ts'
import { blocks } from './Markdown.tsx'
import { PAGES, SECTIONS, neighbours, pageById } from './pages.ts'
import { plainHeading, slug, slugger } from './slug.ts'
import { storySnippet, toJsx } from './toJsx.ts'

describe('toJsx', () => {
  it('names the library by its exports and keeps props readable', () => {
    expect(
      toJsx(
        h(Button, { variant: 'outline', startIcon: h(PlusIcon), disabled: true }, 'Add')
      )
    ).toBe('<Button variant="outline" startIcon={<PlusIcon />} disabled>Add</Button>')
  })

  it('opens fragments passed as children and indents nested elements', () => {
    const element = h(
      Stack,
      { gap: 2 },
      h(Fragment, null, h(Button, null, 'One'), h(Button, null, 'Two'))
    )
    expect(toJsx(element)).toBe(
      '<Stack gap={2}>\n  <Button>One</Button>\n  <Button>Two</Button>\n</Stack>'
    )
  })

  it('keeps the fragment round several elements passed in one prop', () => {
    const footer = h(Fragment, null, h(Button, null, 'Cancel'), h(Button, null, 'Save'))
    expect(toJsx(h(Stack, { footer } as never))).toBe(
      '<Stack\n  footer={<>\n    <Button>Cancel</Button>\n    <Button>Save</Button>\n  </>}\n/>'
    )
  })

  it("names a story file's own component by its displayName, not its minified name", () => {
    const e = () => null
    ;(e as { displayName?: string }).displayName = 'Swatch'
    expect(toJsx(h(e, { role: 'primary' }))).toBe('<Swatch role="primary" />')
  })
})

describe('storySnippet', () => {
  it("puts the story inside its decorators, as Storybook's source does", () => {
    const snippet = storySnippet(undefined, Button, { children: 'Row' }, {}, [
      (Story) => h(TableBody, null, h(Story as () => ReactNode)),
      (Story) => h(Table, { caption: 'Invoices' }, Story() as never),
    ])
    expect(snippet).toBe(
      '<Table caption="Invoices">\n  <TableBody>\n    <Button>Row</Button>\n  </TableBody>\n</Table>'
    )
  })

  it("calls the story's render with the args shown", () => {
    const render = (args: Record<string, unknown>) =>
      h(Button, { tone: args.tone as ButtonProps['tone'] }, 'Go')
    expect(storySnippet(render, undefined, { tone: 'negative' }, {})).toBe(
      '<Button tone="negative">Go</Button>'
    )
  })
})

describe('Markdown', () => {
  it('splits paragraphs, lists (items may wrap) and fences', () => {
    expect(
      blocks(
        'One line\nwraps.\n\n- first\n  continues\n- second\n\n```tsx\n<Button />\n```'
      )
    ).toEqual([
      { kind: 'paragraph', text: 'One line wraps.' },
      { kind: 'list', ordered: false, items: ['first continues', 'second'] },
      { kind: 'code', language: 'tsx', text: '<Button />' },
    ])
  })
})

describe('DocsLink', () => {
  it("opens docs pages in the app, in the app's form or Storybook's", () => {
    expect(docsTarget('?path=/docs/guides-getting-started--docs')).toEqual({
      page: 'guides-getting-started',
      hash: '',
    })
    expect(docsTarget('/docs/forms-button#props')).toEqual({
      page: 'forms-button',
      hash: '#props',
    })
    expect(docsTarget('#setup')).toBeUndefined()
    expect(docsTarget('https://developer.mozilla.org/')).toBeUndefined()
  })
})

describe('controls', () => {
  it("chooses a control from the story's argTypes first, then the prop's type", () => {
    const variant = {
      type: 'ButtonVariant',
      options: ['solid', 'soft', 'outline', 'ghost', 'text'],
    }
    expect(controlKind(variant, undefined, undefined)).toBe('options')
    expect(controlKind(variant, { control: 'inline-radio' }, undefined)).toBe('radio')
    expect(controlKind({ type: 'boolean' }, undefined, undefined)).toBe('boolean')
    expect(controlKind({ type: 'ReactNode' }, undefined, 'Save')).toBe('text')
    expect(controlKind({ type: 'ReactNode' }, undefined, undefined)).toBeUndefined()
    expect(
      controlKind({ type: 'boolean' }, { control: false }, undefined)
    ).toBeUndefined()
  })

  it('shows a documented default while the story leaves the prop unset', () => {
    expect(defaultValue('radio', '"solid"')).toBe('solid')
    expect(defaultValue('boolean', 'false')).toBe(false)
    expect(defaultValue('number', '16')).toBe(16)
    expect(defaultValue('text', undefined)).toBeUndefined()
  })
})

describe('story files', () => {
  const source = `/** The meta's comment. */
const meta = { title: 'Forms/Button' }
export default meta

export const Playground = {}

/**
 * Every variant,
 * in every tone.
 */
export const Variants = {}
`
  it('reads the stories in source order, and the comment above each', () => {
    expect(exportOrder(source)).toEqual(['Playground', 'Variants'])
    expect(storyComments(source).get('Variants')).toBe('Every variant,\nin every tone.')
    expect(storyComments(source).has('Playground')).toBe(false)
    expect(metaComment(source)).toBe("The meta's comment.")
  })

  it('names the components a story file declares, and only those', () => {
    const code =
      'const Swatch = () => null\nexport const Playground = {}\nconst meta = {}\nfunction Tiles() {}'
    expect(declaredComponents(code)).toEqual(['Swatch', 'Playground', 'Tiles'])
    // Playground is an object: the guard leaves it alone at runtime.
    expect(nameDeclarations(code)).toContain(
      'if (typeof Swatch === \'function\' && !Swatch.displayName) Swatch.displayName = "Swatch"'
    )
  })
})

describe('pages', () => {
  it('opens on the introduction, and finds the rest by id', () => {
    expect(pageById(undefined)?.id).toBe('guides-introduction')
    expect(pageById('forms-button')?.title).toBe('Forms/Button')
    expect(pageById('nope')).toBeUndefined()
  })

  it('groups the sidebar by section, in the docs order, each page once', () => {
    expect(SECTIONS[0]!.name).toBe('Guides')
    expect(SECTIONS.flatMap((s) => s.pages).length).toBe(PAGES.length)
    const recipe = SECTIONS.find((s) => s.name === 'Forms')!.pages.find((p) => p.group)
    expect(recipe).toMatchObject({ label: 'React Hook Form', group: 'Recipes' })
  })

  it('links each page to its neighbours', () => {
    const { previous, next } = neighbours(pageById('guides-getting-started')!)
    expect(previous?.id).toBe('guides-introduction')
    expect(next?.id).toBe('guides-theming')
  })
})

describe('slug', () => {
  it("makes the ids GitHub (and so the guides' links) use", () => {
    expect(slug('Brand themes: createTheme')).toBe('brand-themes-createtheme')
    expect(slug('Where overrides land (cascade layers)')).toBe(
      'where-overrides-land-cascade-layers'
    )
    expect(plainHeading('`createTheme` and [links](#x)')).toBe('createTheme and links')
    const id = slugger()
    expect([id('Setup'), id('Setup'), id('Setup')]).toEqual([
      'setup',
      'setup-1',
      'setup-2',
    ])
  })
})
