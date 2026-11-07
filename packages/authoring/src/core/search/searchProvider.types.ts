/**
 * Generic search-strategy interface — list components across the authoring
 * framework (library panels, layer trees, asset pickers, ...) consume this
 * instead of hand-rolling `.filter()` text matching, so a panel can pick
 * whichever algorithm fits its data (see `FuzzySortProvider`/
 * `PrefixSearchProvider`/`ExactSearchProvider`) without any UI-side change.
 * See `useSearchProvider` for the per-data-source caching contract callers
 * are expected to use rather than constructing/indexing a provider by hand.
 */
export interface SearchProvider<T> {
  /**
   * (Re)build the index from the current collection. Cheap to call whenever
   * the collection actually changes, but never free — callers should gate
   * this on the collection's identity changing (see `useSearchProvider`),
   * not call it on every render.
   */
  index(items: readonly T[]): void
  /** Query the current index. An empty/blank query returns every indexed item, in index order. */
  search(query: string): T[]
  /** Release any resources the index holds. Most providers are pure in-memory and treat this as a reset. */
  dispose(): void
}

/** Extracts the text a `SearchProvider` matches a query against, for one item. */
export type SearchTextAccessor<T> = (item: T) => string
