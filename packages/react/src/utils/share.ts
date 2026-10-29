/**
 * Shared elements' view-transition names and classes (ADR 0029): the
 * `greese` prop's `share` and page transitions both use them. Pure, so they
 * run in Server Components.
 */

/** A short, stable hash: the same text gets the same name on the server and in the browser. */
export const hash = (text: string): string => {
  let h = 5381
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/** What pairs a shared element across pages: a key, or a group and an id. */
export type ShareKey = string | readonly [group: string, id: string]

/**
 * A shared element's view-transition name, from a key that means the same
 * thing on both pages: `'hero'`, or `['template', id]`. Characters a CSS name
 * can't hold become `-`, with a hash of the key so two keys never meet.
 */
export const shareName = (key: ShareKey): string => {
  const [group, id] = typeof key === 'string' ? ['share', key] : key
  const text = `${group}-${id}`
  const safe = text.replace(/[^A-Za-z0-9_-]/g, '-')
  return `greese-share-${safe}${safe === text ? '' : `-${hash(text)}`}`
}

/** The view-transition classes of a shared element's morph: every share's, and its group's. */
export const shareClasses = (key: ShareKey): string => {
  const group = typeof key === 'string' ? 'share' : key[0]
  return `greese-PageTransition greese-PageTransition--share greese-share-${group.replace(/[^A-Za-z0-9_-]/g, '-')}`
}
