/**
 * Whether the app reduces motion for `target`: `data-greese-motion="reduce"`
 * on it or an ancestor. A target that isn't an element (a plain object, a
 * control) asks the document's root. Checked by `nodeType`, not `instanceof
 * Element`, so an element from an iframe counts.
 */
export const appReducesMotion = (target?: unknown): boolean =>
  // `document` first: outside a browser, there are no elements either.
  typeof document != 'undefined' &&
  !!(
    (target as Node | null)?.nodeType == 1
      ? (target as Element)
      : document.documentElement
  ).closest("[data-greese-motion='reduce']")

/**
 * Whether motion is reduced for `target`: by the system
 * (`prefers-reduced-motion: reduce`), or by the app, with
 * `data-greese-motion="reduce"` on the element or an ancestor. A target that
 * isn't an element (a plain object, a control) asks the document's root.
 */
export const prefersReducedMotion = (target?: unknown): boolean =>
  (typeof matchMedia == 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches) ||
  appReducesMotion(target)
