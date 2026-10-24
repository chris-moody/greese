import type { CSSProperties } from 'react'

/**
 * The brand colors, each with a job on the site: primary for actions and
 * where you are, secondary for structure and navigation, tertiary for
 * measurements and results, accent for what's new or wants attention. Where a
 * set of equals is shown (the reasons, the stats), they take them in turn, so
 * a color theme shows all four.
 */
export const BRAND_TONES = ['primary', 'secondary', 'tertiary', 'accent'] as const

/** The `n`th brand color as `--site-tone` (fills and tints) and `--site-tone-strong` (text). */
export const toneStyle = (n: number): CSSProperties =>
  ({
    '--site-tone': `var(--greese-color-${BRAND_TONES[n % 4]})`,
    '--site-tone-strong': `var(--greese-color-${BRAND_TONES[n % 4]}-strong)`,
  }) as CSSProperties
