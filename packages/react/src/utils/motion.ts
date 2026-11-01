import { MOTION_ATTR } from '@greese/ui'

/**
 * Whether motion is reduced for `el`: by the system
 * (`prefers-reduced-motion: reduce`), or by the app, with
 * `data-greese-motion="reduce"` on it or an ancestor (ThemeProvider's
 * `motion`). Without an element, the document's root decides.
 */
export const prefersReducedMotion = (el?: Element | null): boolean =>
  (typeof matchMedia === 'function' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches) ||
  (typeof document !== 'undefined' &&
    !!(el ?? document.documentElement).closest(`[${MOTION_ATTR}='reduce']`))
