import type { CSSProperties } from 'react'

/**
 * The inline style that gives an element an environment's hue. The accent
 * color itself is derived from it in the stylesheet, on the element that sets
 * it, so it follows the color scheme without JavaScript.
 */
export const accentStyle = (hue: number | undefined, style?: CSSProperties) =>
  (hue === undefined ? style : { ...style, '--greese-authoring-accent-hue': hue }) as
    CSSProperties | undefined
