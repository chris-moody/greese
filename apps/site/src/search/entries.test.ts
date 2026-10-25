import { describe, expect, it } from 'vitest'
import { ENTRIES, grouped, highlight, search, type SearchEntry } from './entries.ts'

const entry = (title: string, rest: Partial<SearchEntry> = {}): SearchEntry => ({
  group: 'Docs',
  title,
  href: `#${title}`,
  ...rest,
})

describe('search', () => {
  it('ranks a title that starts with the words above one that has them inside', () => {
    const entries = [
      entry('Card'),
      entry('Accordion'),
      entry('Accordion item'),
      entry('Car'),
    ]
    expect(search('acc', entries).map((e) => e.title)).toEqual([
      'Accordion',
      'Accordion item',
    ])
    expect(search('car', entries).map((e) => e.title)).toEqual(['Car', 'Card'])
  })

  it('needs every word, found in the title, hint, group or keywords', () => {
    const entries = [
      entry('Size', { hint: 'Bundle size', keywords: 'kb' }),
      entry('Speed'),
    ]
    expect(search('size kb', entries)).toHaveLength(1)
    expect(search('size speed', entries)).toHaveLength(0)
  })

  it('lists everything when nothing is typed', () => {
    expect(search('  ')).toBe(ENTRIES)
  })

  it('finds the docs pages, the templates and the studio', () => {
    expect(search('button')[0]).toMatchObject({ title: 'Button', group: 'Docs' })
    // A page of the app, not another site.
    expect(search('button')[0]!.href).toBe('/docs/forms-button')
    expect(search('finance')[0]).toMatchObject({ group: 'Templates' })
    expect(search('shapes').map((e) => e.group)).toContain('Theme Studio')
  })

  it("finds a guide's sections, and opens the guide there", () => {
    expect(search('dark mode flash')[0]).toMatchObject({
      group: 'In the docs',
      href: '/docs/guides-getting-started#dark-mode-without-a-flash',
    })
  })
})

describe('grouped', () => {
  it('keeps groups in the order of their best entry', () => {
    const groups = grouped([
      entry('a', { group: 'B' }),
      entry('b', { group: 'A' }),
      entry('c', { group: 'B' }),
    ])
    expect(groups.map(([g, list]) => [g, list.length])).toEqual([
      ['B', 2],
      ['A', 1],
    ])
  })
})

describe('highlight', () => {
  it('splits the title around the typed words, matches at odd places', () => {
    expect(highlight('Accordion item', 'acc it')).toEqual([
      '',
      'Acc',
      'ordion ',
      'it',
      'em',
    ])
    expect(highlight('Button', '')).toEqual(['Button'])
    expect(highlight('a.b', '.')).toEqual(['a', '.', 'b'])
  })
})
