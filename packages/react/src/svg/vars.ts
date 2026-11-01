import type { CSSProperties } from 'react'

/**
 * Custom properties for a drawing, by name: `{ accent: 'primary', size: 4 }`
 * sets `--accent` and `--size` (a name may also be written `--accent`).
 */
export type SvgVars = Readonly<Record<string, string | number>>

/**
 * `vars` as inline custom properties, ahead of `style`, which wins. A bare
 * word may name a color token (`primary`, `fg-muted`): it becomes the token's
 * variable, falling back to itself, so a CSS word (`gold`, `none`) still
 * works and no token list ships.
 */
export const varsStyle = (
  vars: SvgVars | undefined,
  style?: CSSProperties
): CSSProperties | undefined =>
  vars
    ? ({
        ...Object.fromEntries(
          Object.entries(vars).map(([name, v]) => [
            name.startsWith('--') ? name : `--${name}`,
            typeof v == 'string' && /^[a-z][a-z\d-]*$/.test(v)
              ? `var(--greese-color-${v}, ${v})`
              : v,
          ])
        ),
        ...style,
      } as CSSProperties)
    : style

/** The `vars` prop, shared by the drawing components. */
export interface VarsProps {
  /**
   * Custom properties for this element and what's inside it, by name:
   * `vars={{ accent: 'primary', size: 4 }}` sets `--accent` (a color token by
   * its name, or any CSS value) and `--size`, for `fill: var(--accent)` in a
   * class, a child or `style`. Merged ahead of the component's own styles
   * and `style`, so `style` wins.
   */
  vars?: SvgVars
}
