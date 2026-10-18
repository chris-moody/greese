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
