import type { JSX } from 'react'

/**
 * The few glyphs GreeseUI draws itself (dismiss and remove buttons). The
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
    <path className="greese-SortGlyph-up" d="M5 6.5L8 3.5l3 3" />
    <path className="greese-SortGlyph-down" d="M5 9.5l3 3 3-3" />
  </svg>
)

/** A five-point star, for Rating. Filled with `currentColor`. */
export const StarGlyph = (): JSX.Element => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.5l2.94 6.08 6.56.82-4.83 4.6 1.22 6.5L12 17.27 6.11 20.5l1.22-6.5-4.83-4.6 6.56-.82z" />
  </svg>
)

/** A tick, for completed Steps. */
export const CheckGlyph = (): JSX.Element => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
)
