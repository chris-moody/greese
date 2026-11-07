import type { SearchProvider, SearchTextAccessor } from './searchProvider.types.ts'

interface IndexedEntry<T> {
  text: string
  item: T
}

/**
 * Case-insensitive "starts with" search — cheap, fully predictable, no
 * ranking. Good for short, structured names (ids, enum-like labels, command
 * palettes) where fuzzy near-misses would be surprising rather than helpful.
 */
export class PrefixSearchProvider<T> implements SearchProvider<T> {
  private entries: IndexedEntry<T>[] = []

  constructor(private readonly getText: SearchTextAccessor<T>) {}

  index(items: readonly T[]): void {
    this.entries = items.map((item) => ({ text: this.getText(item).toLowerCase(), item }))
  }

  search(query: string): T[] {
    const needle = query.trim().toLowerCase()
    if (!needle) return this.entries.map((entry) => entry.item)
    return this.entries
      .filter((entry) => entry.text.startsWith(needle))
      .map((entry) => entry.item)
  }

  dispose(): void {
    this.entries = []
  }
}
