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
