/** Class names keyed by whether to include them: `{ 'greese-Button--active': active }`. */
export type ClassDictionary = Record<string, boolean | null | undefined>

/** What `cx` takes: a class name, a falsy value to skip, a dictionary, or a list of these. */
export type ClassValue =
  string | false | null | undefined | ClassDictionary | ClassValue[]

/**
 * Joins truthy class names, and the keys of dictionaries whose values are
 * truthy, in order. In-house so the package keeps zero runtime dependencies.
 *
 * ```ts
 * cx('greese-Button', { 'greese-Button--active': active }, className)
 * cx({ 'greese-Chip': true, 'greese-Chip--selected': selected })
 * cx(['greese-Card', { 'greese-Card--raised': raised }])
 * ```
 */
export const cx = (...classes: ClassValue[]): string => {
  let out = ''
  for (const c of classes) {
    const s =
      !c || typeof c == 'string'
        ? c
        : Array.isArray(c)
          ? cx(...c)
          : Object.keys(c)
              .filter((k) => c[k])
              .join(' ')
    if (s) out = out ? `${out} ${s}` : s
  }
  return out
}
