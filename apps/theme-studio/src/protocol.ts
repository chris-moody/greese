import type { ColorScheme } from '@greese/react'

/** Messages from the studio to the preview iframe. */
export type ToPreview =
  /**
   * The theme's CSS. `full`: it's the whole stylesheet, built for the theme's
   * own breakpoints (`breakpoints`, which the components' JavaScript also
   * follows), so the preview drops the prebuilt one.
   */
  | { type: 'css'; css: string; full?: boolean; breakpoints?: Record<string, number> }
  | { type: 'scope'; theme?: string; scheme: ColorScheme }
  | { type: 'inspect'; on: boolean }
  /** Outline every instance of this component (`Button`), or none. */
  | { type: 'highlight'; block?: string }
  /** Remount the gallery so entrances play again. */
  | { type: 'replay' }
  /** The component to show above the gallery, from the Components tab. */
  | { type: 'feature'; block: string }

export interface Picked {
  /** The component the clicked element belongs to: `Button`. */
  block: string
  /** Every `greese-*` class on the element. */
  classes: string[]
  /** The block's variables and their computed values on that element. */
  variables: Record<string, string>
}

/** Every color role as the preview renders it, per scheme, as hex (`#rrggbb[aa]`). */
export interface RenderedColors {
  light: Record<string, string>
  dark: Record<string, string>
}

/** Messages from the preview to the studio. */
export type FromPreview =
  { type: 'ready' } | ({ type: 'pick' } & Picked) | ({ type: 'colors' } & RenderedColors)
