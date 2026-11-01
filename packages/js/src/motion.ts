/**
 * Whether motion is reduced for `target`: by the system
 * (`prefers-reduced-motion: reduce`), or by the app, with
 * `data-greese-motion="reduce"` on the element or an ancestor. A target that
 * isn't an element (a plain object, a control) asks the document's root.
 */
export const prefersReducedMotion = (target?: unknown): boolean =>
  (typeof matchMedia == 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches) ||
  // `document` first: outside a browser, `Element` doesn't exist either.
  (typeof document != 'undefined' &&
    !!(target instanceof Element ? target : document.documentElement).closest(
      "[data-greese-motion='reduce']"
    ))
