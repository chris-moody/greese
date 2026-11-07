import type { SearchProvider, SearchTextAccessor } from './searchProvider.types.ts'

interface IndexedEntry<T> {
  text: string
  item: T
}

/** Where a character starts a word: after a separator, or an upper case letter after a lower. */
const isWordStart = (text: string, original: string, i: number): boolean =>
  i === 0 ||
  /[\s_\-./:]/.test(text[i - 1]!) ||
  (original[i] !== text[i] && original[i - 1] === text[i - 1])

/**
 * How well `query` matches `text` as a subsequence: its characters in order,
 * not necessarily together. Null when they don't all appear. Higher is
 * better: a run of consecutive characters, a match at a word's start, and an
 * early first match each score; gaps cost a little. Both are lower case;
 * `original` keeps the text's case, for camelCase word starts.
 */
export const fuzzyScore = (
  query: string,
  text: string,
  original = text
): number | null => {
  let score = 0
  let from = 0
  let previous = -2
  for (const ch of query) {
    const at = text.indexOf(ch, from)
    if (at < 0) return null
    score += 1
    if (at === previous + 1) score += 3
    if (isWordStart(text, original, at)) score += 2
    if (previous >= 0) score -= Math.min(at - previous - 1, 3) * 0.1
    previous = at
    from = at + 1
  }
  // An earlier first match ranks a little higher; so does a shorter text.
  return score - text.indexOf(query[0]!) * 0.01 - text.length * 0.001
}

/**
 * Fuzzy, ranked search: a query matches when its characters appear in order
 * (`lyr` finds "Layer 3"), best matches first. The default for "type
 * anything" boxes over names people chose (library assets, layers), where
 * the exact spelling is rarely remembered. A small scorer of our own rather
 * than a dependency (ADR 0035).
 *
 * ```ts
 * const search = new FuzzySearchProvider<Asset>((asset) => asset.name)
 * search.index(assets)
 * search.search('btn') // "Button", "Back button", …
 * ```
 */
export class FuzzySearchProvider<T> implements SearchProvider<T> {
  private entries: Array<IndexedEntry<T> & { original: string }> = []

  constructor(private readonly getText: SearchTextAccessor<T>) {}

  index(items: readonly T[]): void {
    this.entries = items.map((item) => {
      const original = this.getText(item)
      return { text: original.toLowerCase(), original, item }
    })
  }

  search(query: string): T[] {
    const needle = query.trim().toLowerCase().replace(/\s+/g, '')
    if (!needle) return this.entries.map((entry) => entry.item)
    return this.entries
      .map((entry, order) => ({
        entry,
        order,
        score: fuzzyScore(needle, entry.text, entry.original),
      }))
      .filter((r): r is typeof r & { score: number } => r.score !== null)
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .map((r) => r.entry.item)
  }

  dispose(): void {
    this.entries = []
  }
}
