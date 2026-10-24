export interface ListKeys {
  /** The key to the previous item. @default 'ArrowUp' */
  prev?: string
  /** The key to the next item. @default 'ArrowDown' */
  next?: string
  /** Home and End go to the first and last item. @default true */
  edges?: boolean
}

/**
 * Where a key moves in a list of `count` items from `current` (-1 for none):
 * the next or previous item, wrapping at the ends (from none, the first or the
 * last), the first or last with Home and End, or undefined for any other key.
 * Menus, tabs and listboxes share it; each moves focus or its active option.
 */
export const listTarget = (
  key: string,
  current: number,
  count: number,
  { prev = 'ArrowUp', next = 'ArrowDown', edges = true }: ListKeys = {}
): number | undefined => {
  if (!count) return undefined
  if (key === next) return current < 0 ? 0 : (current + 1) % count
  if (key === prev) return current < 0 ? count - 1 : (current - 1 + count) % count
  if (edges && key === 'Home') return 0
  if (edges && key === 'End') return count - 1
  return undefined
}
