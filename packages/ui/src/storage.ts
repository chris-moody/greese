/**
 * Values kept in the browser's storage, safely. Storage can be missing (on
 * the server), blocked (private browsing, site data turned off), full, or
 * hold something another version wrote; none of that should break a page. A
 * stored value:
 *
 * - falls back to an in-memory copy when storage can't be used, so the value
 *   still works for this page view;
 * - parses what it reads, and with `validate` refuses what isn't its shape,
 *   reading the fallback instead;
 * - tells its subscribers when it changes, in this tab (through any handle
 *   on the same key) and in other tabs (the `storage` event).
 *
 * Framework-free; `useStoredState()` in @greese/react is the React side.
 */

export interface StoredValueOptions<T> {
  /** `local` persists; `session` lasts for the tab. @default 'local' */
  area?: 'local' | 'session'
  /** Turns the value into stored text. @default JSON.stringify */
  serialize?: (value: T) => string
  /** Turns stored text back into a value. @default JSON.parse */
  parse?: (text: string) => unknown
  /** Whether what was read is a value of this shape; when not, the fallback is read instead. */
  validate?: (value: unknown) => value is T
}

export interface StoredValue<T> {
  readonly key: string
  /** The value: what's stored, or the fallback. The same object until it changes. */
  get(): T
  /** Stores a value, or a function of the current one. */
  set(value: T | ((current: T) => T)): void
  /** Forgets the stored value: `get()` reads the fallback again. */
  remove(): void
  /** Calls `listener` whenever the value changes, here or in another tab. Returns the unsubscribe. */
  subscribe(listener: () => void): () => void
}

type Area = 'local' | 'session'

/** Listeners by area and key, so every handle on a key hears every write in this tab. */
const listeners = new Map<string, Set<() => void>>()
/** What was written when storage couldn't take it, by area and key. */
const memory = new Map<string, string | null>()

const slot = (area: Area, key: string) => `${area}:${key}`

const storageOf = (area: Area): Storage | undefined => {
  try {
    return area === 'session' ? globalThis.sessionStorage : globalThis.localStorage
  } catch {
    // Reading the property itself throws when site data is blocked.
    return undefined
  }
}

const readText = (area: Area, key: string): string | null => {
  const id = slot(area, key)
  if (memory.has(id)) return memory.get(id)!
  try {
    return storageOf(area)?.getItem(key) ?? null
  } catch {
    return null
  }
}

const writeText = (area: Area, key: string, text: string | null): void => {
  const id = slot(area, key)
  try {
    const store = storageOf(area)
    if (!store) throw new Error('no storage')
    if (text === null) store.removeItem(key)
    else store.setItem(key, text)
    memory.delete(id)
  } catch {
    // Unavailable or full: keep it for this page view.
    memory.set(id, text)
  }
  listeners.get(id)?.forEach((listener) => listener())
}

/**
 * A value kept in localStorage (or sessionStorage) under `key`.
 *
 * ```ts
 * const theme = createStoredValue('app-theme', { accent: 'blue' }, {
 *   validate: (v): v is { accent: string } => typeof (v as any)?.accent === 'string',
 * })
 * theme.set((t) => ({ ...t, accent: 'pink' }))
 * ```
 */
export const createStoredValue = <T>(
  key: string,
  fallback: T,
  {
    area = 'local',
    serialize = JSON.stringify,
    parse = JSON.parse,
    validate,
  }: StoredValueOptions<T> = {}
): StoredValue<T> => {
  // The last text read and its value: `get()` returns the same object while
  // the text is unchanged, which useSyncExternalStore needs.
  let cachedText: string | null | undefined
  let cached: T = fallback

  const get = (): T => {
    const text = readText(area, key)
    if (text === cachedText) return cached
    cachedText = text
    if (text === null) return (cached = fallback)
    try {
      const value = parse(text)
      cached = !validate || validate(value) ? (value as T) : fallback
    } catch {
      cached = fallback
    }
    return cached
  }

  return {
    key,
    get,
    set: (value) => {
      const next = typeof value === 'function' ? (value as (current: T) => T)(get()) : value
      writeText(area, key, serialize(next))
    },
    remove: () => writeText(area, key, null),
    subscribe: (listener) => {
      const id = slot(area, key)
      const set = listeners.get(id) ?? new Set()
      set.add(listener)
      listeners.set(id, set)
      // Another tab's write (the event never fires in the tab that wrote).
      const onStorage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) listener()
      }
      globalThis.addEventListener?.('storage', onStorage)
      return () => {
        set.delete(listener)
        globalThis.removeEventListener?.('storage', onStorage)
      }
    },
  }
}
