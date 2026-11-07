import type { SearchProvider, SearchTextAccessor } from './searchProvider.types.ts'

interface IndexedEntry<T> {
  text: string
  item: T
}

/**
 * Case-insensitive substring search — no ranking, no typo tolerance: a query
 * either occurs in the text or it doesn't. Good for exact-recall use cases
 * (the user already knows the name they're looking for) where fuzzy
 * near-misses would just add noise.
 */
export class ExactSearchProvider<T> implements SearchProvider<T> {
  private entries: IndexedEntry<T>[] = []

  constructor(private readonly getText: SearchTextAccessor<T>) {}

  index(items: readonly T[]): void {
    this.entries = items.map((item) => ({ text: this.getText(item).toLowerCase(), item }))
  }

  search(query: string): T[] {
    const needle = query.trim().toLowerCase()
    if (!needle) return this.entries.map((entry) => entry.item)
    return this.entries
      .filter((entry) => entry.text.includes(needle))
      .map((entry) => entry.item)
  }

  dispose(): void {
    this.entries = []
  }
}
