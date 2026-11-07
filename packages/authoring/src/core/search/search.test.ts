import { describe, expect, it } from 'vitest'
import { ExactSearchProvider } from './ExactSearchProvider.ts'
import { fuzzyScore, FuzzySearchProvider } from './FuzzySearchProvider.ts'
import { PrefixSearchProvider } from './PrefixSearchProvider.ts'

const names = ['Background', 'Layer 3', 'Back button', 'Button', 'buttonGroup', 'Logo']
const indexed = <P extends { index: (items: readonly string[]) => void }>(
  provider: P
): P => {
  provider.index(names)
  return provider
}
const by = (name: string) => name

describe('FuzzySearchProvider', () => {
  it('finds characters in order, not necessarily together', () => {
    expect(indexed(new FuzzySearchProvider(by)).search('lyr')).toEqual(['Layer 3'])
    expect(fuzzyScore('lyr', 'logo')).toBeNull()
  })

  it('ranks tight and word-start matches first', () => {
    expect(indexed(new FuzzySearchProvider(by)).search('btn')).toEqual([
      'Button',
      'buttonGroup',
      'Back button',
    ])
  })

  it('counts a camelCase capital as a word start', () => {
    expect(fuzzyScore('bg', 'buttongroup', 'buttonGroup')!).toBeGreaterThan(
      fuzzyScore('bg', 'background', 'background')! - 3
    )
    expect(indexed(new FuzzySearchProvider(by)).search('bg')[0]).toBe('buttonGroup')
  })

  it('returns everything, in order, for a blank query', () => {
    expect(indexed(new FuzzySearchProvider(by)).search('  ')).toEqual(names)
  })
})

describe('PrefixSearchProvider and ExactSearchProvider', () => {
  it('match a start, or anywhere, ignoring case', () => {
    expect(indexed(new PrefixSearchProvider(by)).search('BA')).toEqual([
      'Background',
      'Back button',
    ])
    expect(indexed(new ExactSearchProvider(by)).search('button')).toEqual([
      'Back button',
      'Button',
      'buttonGroup',
    ])
  })
})
