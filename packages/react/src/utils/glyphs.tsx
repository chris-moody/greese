import type { JSX } from 'react'

/**
 * The few glyphs SauceUI draws itself (dismiss and remove buttons). The
 * library stays icon-agnostic: anything user-facing takes your icons.
 */
export const CloseGlyph = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M4 4l8 8M12 4l-8 8" />
  </svg>
)

/** Hamburger, for the default SidebarTrigger. */
export const MenuGlyph = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
  </svg>
)

/** Chevron pointing toward the inline start (mirrored in RTL by CSS). */
export const ChevronGlyph = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M10 3.5L5.5 8l4.5 4.5" />
  </svg>
)

/** Plus and minus, for NumberField's steppers. */
export const PlusGlyph = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M8 3.5v9M3.5 8h9" />
  </svg>
)

export const MinusGlyph = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M3.5 8h9" />
  </svg>
)

/** Up and down arrows for sortable table headers; CSS highlights one. */
export const SortGlyph = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path className="sauce-SortGlyph-up" d="M5 6.5L8 3.5l3 3" />
    <path className="sauce-SortGlyph-down" d="M5 9.5l3 3 3-3" />
  </svg>
)
