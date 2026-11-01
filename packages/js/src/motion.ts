/**
 * Whether motion is reduced for `target`: by the system
 * (`prefers-reduced-motion: reduce`), or by the app, with
 * `data-greese-motion="reduce"` on the element or an ancestor. A target that
 * isn't an element (a plain object, a control) asks the document's root.
 */
export const prefersReducedMotion = (target?: unknown): boolean => {
  if (
    typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  )
    return true
  if (typeof document === 'undefined') return false
  const el =
    typeof Element !== 'undefined' && target instanceof Element
      ? target
      : document.documentElement
  return !!el.closest("[data-greese-motion='reduce']")
}
