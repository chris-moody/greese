/**
 * Color theme variants: how a color theme's colors are worn, beside which
 * colors they are (ADR 0025). Part of the color layer, so any color theme
 * takes any variant, and a shape or motion theme goes with either.
 *
 * A variant reassigns the colors each component's variants draw with, in
 * `modifiers` and `styles` (custom properties included): never the color
 * tokens, and never component SCSS, which is the shape layer's, so the two
 * always compose. With a shape theme, a border is the shape's ring
 * (`--greese-shape-ring`), so the variant sets that too.
 *
 * `npm run themes -w site` writes each as `@greese/ui/themes/<id>.scss` and
 * `.css`.
 */
import type { ComponentSpec, ThemeSpec } from './spec.ts'

export interface ColorVariant {
  id: string
  label: string
  /** What it looks like, in a sentence or two: the theme files' header. */
  description: string
  /** What it sets on each component: modifiers and root declarations only. */
  components: Record<string, Pick<ComponentSpec, 'modifiers' | 'styles'>>
}

const tint = (tone: string, amount: number) =>
  `color-mix(in oklab, var(${tone}) ${amount}%, transparent)`

/**
 * What a part that was outlined is filled with: a neutral a step from the
 * page, so it shows on the canvas and on surfaces alike (the surface itself is
 * often the page).
 */
const FILL =
  'color-mix(in oklab, var(--greese-color-border) 65%, var(--greese-color-surface))'

/** A button variant drawn in its tone's outline: tone text, a faint fill, a tone border. */
const outlinedButton = {
  '--greese-button-fg': 'var(--greese-button-tone)',
  '--greese-button-bg': tint('--greese-button-tone', 6),
  '--greese-button-border': 'var(--greese-button-tone)',
  '--greese-button-bg-hover': tint('--greese-button-tone', 14),
  '--greese-button-bg-active': tint('--greese-button-tone', 22),
}

const OUTLINE: ColorVariant = {
  id: 'outline',
  label: 'Outline',
  description:
    'Outline: drawn rather than filled. Solid and soft buttons and badges, soft alerts, filled and elevated cards and tiles, avatars, the current tab and segment, toasts and tooltips are outlined in their color, with text to match over a faint or neutral fill; what was outlined is filled instead.',
  components: {
    Button: {
      modifiers: {
        solid: outlinedButton,
        soft: {
          ...outlinedButton,
          '--greese-button-bg': 'transparent',
          '--greese-button-border': tint('--greese-button-tone', 45),
        },
        // Outlined before: filled now.
        outline: {
          '--greese-button-fg': 'var(--greese-button-on-tone)',
          '--greese-button-bg': 'var(--greese-button-tone)',
          '--greese-button-border': 'transparent',
          '--greese-button-bg-hover':
            'color-mix(in oklab, var(--greese-button-tone), var(--greese-button-on-tone) 14%)',
          '--greese-button-bg-active':
            'color-mix(in oklab, var(--greese-button-tone), var(--greese-button-on-tone) 24%)',
        },
      },
    },
    Badge: {
      modifiers: {
        solid: {
          color: 'var(--greese-badge-tone)',
          'background-color': tint('--greese-badge-tone', 8),
          'border-color': 'var(--greese-badge-tone)',
        },
        soft: {
          'background-color': 'transparent',
          'border-color': tint('--greese-badge-tone', 55),
        },
        outline: {
          color: 'var(--greese-badge-tone-on)',
          'background-color': 'var(--greese-badge-tone)',
          'border-color': 'var(--greese-badge-tone)',
        },
      },
    },
    Alert: {
      modifiers: {
        soft: {
          'background-color': 'var(--greese-color-canvas)',
          'border-color': 'var(--greese-alert-tone)',
        },
        outline: {
          'background-color': tint('--greese-alert-tone', 14),
          'border-color': 'transparent',
        },
      },
    },
    Card: {
      modifiers: {
        filled: {
          'background-color': 'transparent',
          border: '1px solid var(--greese-color-border-strong)',
          '--greese-shape-ring': 'var(--greese-color-border-strong)',
        },
        elevated: {
          'background-color': 'var(--greese-color-canvas)',
          border: '1px solid var(--greese-color-border-strong)',
          'box-shadow': 'none',
          '--greese-shape-ring': 'var(--greese-color-border-strong)',
        },
        outline: {
          'background-color': FILL,
          'border-color': 'transparent',
          '--greese-shape-ring': 'transparent',
        },
      },
    },
    Tile: {
      styles: {
        'background-color': FILL,
        'border-color': 'transparent',
      },
      modifiers: {
        filled: {
          'background-color': 'transparent',
          'border-color': 'var(--greese-color-border-strong)',
        },
      },
    },
    // Drawn inside the box (an outline inset by its width): no size change,
    // and no box-shadow a shape theme may use for depth.
    Avatar: {
      styles: {
        'background-color': 'transparent',
        outline: '1.5px solid color-mix(in oklab, currentcolor 70%, transparent)',
        'outline-offset': '-1.5px',
      },
    },
    Toast: {
      styles: {
        'background-color': 'var(--greese-color-canvas)',
        border: '1px solid var(--greese-toast-tone)',
        'border-inline-start-width': '3px',
      },
    },
    // The current tab and the chosen segment: outlined in the primary color
    // (the library's hooks for them), not tinted or raised.
    Tab: {
      styles: {
        '--greese-tab-current-bg': 'transparent',
        '--greese-tab-current-edge': 'inset 0 0 0 1.5px var(--greese-color-primary)',
      },
    },
    Segment: {
      styles: {
        '--greese-segment-current-bg': 'transparent',
        '--greese-segment-current-edge': 'inset 0 0 0 1.5px var(--greese-color-primary)',
      },
    },
    Tooltip: {
      styles: {
        color: 'var(--greese-color-fg)',
        'background-color': 'var(--greese-color-surface-overlay)',
        border: '1px solid var(--greese-color-fg)',
      },
    },
  },
}

export const VARIANTS: ColorVariant[] = [OUTLINE]

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** The variant a theme wears, if any. */
export const variantIn = (spec: ThemeSpec): ColorVariant | undefined =>
  VARIANTS.find((v) =>
    Object.entries(v.components).every(([name, c]) =>
      Object.entries(c).every(([field, value]) =>
        same(spec.components?.[name]?.[field as keyof ComponentSpec], value)
      )
    )
  )

/** The theme without its variant: the fields it wrote go; everything else stays. */
export const withoutVariant = (spec: ThemeSpec): ThemeSpec => {
  const current = variantIn(spec)
  if (!current) return spec
  const components = Object.fromEntries(
    Object.entries(spec.components ?? {}).flatMap(([name, c]) => {
      const next = { ...c }
      for (const field of Object.keys(current.components[name] ?? {}))
        delete next[field as keyof ComponentSpec]
      return Object.keys(next).length ? [[name, next]] : []
    })
  )
  return { ...spec, components }
}

/** A variant in place of any other; colors, shapes and motion stay. */
export const applyVariant = (
  spec: ThemeSpec,
  variant: ColorVariant | undefined
): ThemeSpec => {
  const base = withoutVariant(spec)
  if (!variant) return base
  const components = { ...base.components }
  for (const [name, c] of Object.entries(variant.components))
    components[name] = { ...components[name], ...structuredClone(c) }
  return { ...base, components }
}

/** A theme of only a variant: what its files hold. */
export const variantOnlySpec = (variant: ColorVariant): ThemeSpec =>
  applyVariant({}, variant)
