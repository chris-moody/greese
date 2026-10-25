import { describe, expect, it } from 'vitest'
import { slug } from '../src/docs/slug.ts'
import { compareTitles, docsOrder, docsPages, mdxHeadings, storyId } from './docsIndex.ts'

describe('docsIndex', () => {
  it('makes ids as Storybook does', () => {
    expect(storyId('Forms/Recipes/React Hook Form')).toBe('forms-recipes-react-hook-form')
    expect(storyId('Guides/greese.js')).toBe('guides-greese-js')
  })

  it('lists each docs page once, from story files and MDX', () => {
    const { pages } = docsPages()
    const ids = pages.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toContain('content-accordionitem')
    expect(ids).toContain('guides-getting-started')
  })

  it("reads the order from Storybook's preview, where it's written once", () => {
    const order = docsOrder()
    expect(order[0]).toBe('Guides')
    expect(order[1]).toContain('Getting started')
    expect(docsOrder("storySort: { order: ['B', ['y', 'x'], 'A',] }")).toEqual([
      'B',
      ['y', 'x'],
      'A',
    ])
  })

  it('sorts as storySort does: listed names first, the rest alphabetically', () => {
    const titles = [
      'Forms/Button',
      'Guides/Theming',
      'Zebra/A',
      'Guides/Introduction',
      'Forms/Alert',
    ]
    const order = ['Guides', ['Introduction', 'Theming'], 'Forms']
    expect([...titles].sort(compareTitles(order))).toEqual([
      'Guides/Introduction',
      'Guides/Theming',
      'Forms/Alert',
      'Forms/Button',
      'Zebra/A',
    ])
  })

  it('makes a story file with an MDX page of its own that MDX page', () => {
    const icons = docsPages().pages.find((p) => p.id === 'foundations-icons')
    expect(icons).toMatchObject({ kind: 'mdx', file: 'foundations/Icons.mdx' })
    const button = docsPages().pages.find((p) => p.id === 'forms-button')
    expect(button).toMatchObject({ kind: 'component', file: 'forms/Button.stories.tsx' })
  })

  it("lists an MDX page's sections, not the code blocks' lines", () => {
    expect(
      mdxHeadings(
        '# Title\n\n## Light and dark\n\n```md\n## not a heading\n```\n### `createTheme`'
      )
    ).toEqual([
      ['Light and dark', 'light-and-dark'],
      ['createTheme', 'createtheme'],
    ])
  })

  // The page gives a heading the id of its text alone (src/docs/MdxPage.tsx),
  // which matches GitHub's only while no guide repeats a heading.
  it('finds no guide that repeats a heading', () => {
    for (const page of docsPages().pages)
      for (const [text, id] of page.headings ?? [])
        expect(id, page.title).toBe(slug(text))
  })
})
