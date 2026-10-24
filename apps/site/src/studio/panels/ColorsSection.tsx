import { useState, type JSX } from 'react'
import { Badge, Stack, Text } from '@greese/react'
import { AA, color, contentColor, contrastRatio, type ColorRole } from '@greese/ui'
import { getIn } from '../edit.ts'
import { resolveColor } from '../resolve.ts'
import type { RenderedColors } from '../protocol.ts'
import type { SchemeValue, ThemeSpec } from '../spec.ts'
import { ColorDialog } from './ColorDialog.tsx'
import { kebab } from '../naming.ts'

export const colorName = (value: string): string =>
  value.replace(/[A-Z][a-z]*/g, () => '')

type Scheme = 'light' | 'dark'

/** The groups, brand first, in order. */
const GROUPS: Array<[title: string, roles: ColorRole[]]> = [
  ['Brand', ['primary', 'secondary', 'tertiary', 'accent']],
  [
    'Base',
    ['canvas', 'surface', 'surfaceOverlay', 'fg', 'fgMuted', 'border', 'borderStrong'],
  ],
  ['Status', ['positive', 'negative', 'warning', 'info']],
  ['Other', ['focusRing', 'scrim']],
]

/**
 * Roles used as text, icons or outlines on the canvas, rather than as a
 * background: their chips show them on the canvas and grade that contrast.
 */
export const ON_CANVAS = new Set<ColorRole>([
  'fg',
  'fgMuted',
  'positive',
  'warning',
  'info',
  'focusRing',
])

/** Roles with no text drawn on or in them. */
export const NO_TEXT = new Set<ColorRole>(['border', 'borderStrong', 'scrim'])

/** WCAG's minimum: 4.5:1 for text, 3:1 for a focus indicator (a UI component). */
export const minimumFor = (role: ColorRole) => (role === 'focusRing' ? 3 : AA)

/** Roles drawn on, and so given a content color the chip previews. */
export const hasContent = (role: ColorRole): boolean => `${role}Content` in color

interface PanelProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  /** Each color as the preview renders it (`#rrggbb[aa]`), once it has reported. */
  rendered?: RenderedColors
}

export const pathOf = (role: string) => ['tokens', 'color', kebab(role)]

/** A role's value in one scheme: the theme's, else the default. */
export const valueIn = (spec: ThemeSpec, role: ColorRole, scheme: Scheme): string => {
  const own = getIn(spec, pathOf(role)) as SchemeValue | undefined
  if (own !== undefined) return typeof own === 'string' ? own : own[scheme]
  return color[role][scheme]
}

export const isSet = (spec: ThemeSpec, role: string) =>
  getIn(spec, pathOf(role)) !== undefined

/** `#rrggbbaa` laid over an opaque `#rrggbb`, as the eye sees it. */
export const over = (top: string, bottom: string): string => {
  if (top.length !== 9) return top
  const a = parseInt(top.slice(7, 9), 16) / 255
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(ch(top, i) * a + ch(bottom, i) * (1 - a))
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

/**
 * Before the preview reports, an estimate from the theme's values: palette
 * names and hex resolve; the content color the kit derives is predicted.
 */
export const estimate = (
  spec: ThemeSpec,
  role: ColorRole,
  scheme: Scheme
): string | undefined => {
  const value = resolveColor(valueIn(spec, role, scheme), scheme)
  if (!role.endsWith('Content') || isSet(spec, role)) return value
  const main = role.slice(0, -'Content'.length) as ColorRole
  const mainHex = resolveColor(valueIn(spec, main, scheme), scheme)
  return isSet(spec, main) && mainHex ? contentColor(mainHex) : value
}

/** A role in one scheme: what to paint, what ink to draw, and the contrast. */
const sample = (
  spec: ThemeSpec,
  rendered: RenderedColors | undefined,
  role: ColorRole,
  scheme: Scheme
) => {
  const get = (r: ColorRole) => rendered?.[scheme][r] ?? estimate(spec, r, scheme)
  const canvas = get('canvas') ?? '#ffffff'
  const self = get(role)
  const onCanvas = ON_CANVAS.has(role)
  const ink = hasContent(role) ? get(`${role}Content` as ColorRole) : get('fg')
  const background = onCanvas ? canvas : self
  const text = onCanvas ? self : ink
  const ground = background && over(background, canvas)
  const ratio =
    ground && text && !NO_TEXT.has(role)
      ? contrastRatio(over(text, ground), ground)
      : undefined
  return { background, text, code: self, ratio }
}

export const grade = (ratio: number, min: number) =>
  min < AA
    ? ratio >= min
      ? 'UI'
      : 'Low'
    : ratio >= 7
      ? 'AAA'
      : ratio >= AA
        ? 'AA'
        : 'Low'

/** One role as a chip: light and dark halves, "Aa" in the ink, each full color code. */
const Chip = ({
  spec,
  rendered,
  role,
  onOpen,
}: {
  spec: ThemeSpec
  rendered?: RenderedColors
  role: ColorRole
  onOpen: () => void
}) => {
  const halves = (['light', 'dark'] as const).map((scheme) => ({
    scheme,
    ...sample(spec, rendered, role, scheme),
  }))
  const ratios = halves.map((h) => h.ratio).filter((r): r is number => !!r)
  const worst = ratios.length ? Math.min(...ratios) : undefined
  return (
    <button
      type="button"
      className="studio-chip"
      aria-haspopup="dialog"
      data-set={isSet(spec, role) || undefined}
      aria-label={`${kebab(role)}: light ${halves[0]!.code ?? 'unknown'}, dark ${halves[1]!.code ?? 'unknown'}${worst ? `, contrast ${worst.toFixed(1)} to 1` : ''}`}
      onClick={onOpen}
    >
      <span className="studio-chip-swatches">
        {halves.map((h) => (
          <span key={h.scheme} className="studio-chip-half">
            <span className="studio-chip-paint studio-checker" aria-hidden="true">
              <span style={{ background: h.background, color: h.text }}>
                {NO_TEXT.has(role) ? '' : 'Aa'}
              </span>
            </span>
            <code className="studio-chip-code">{h.code ?? '?'}</code>
          </span>
        ))}
      </span>
      <span className="studio-chip-label">
        <span>{kebab(role)}</span>
        {worst && (
          <Badge tone={worst >= minimumFor(role) ? 'positive' : 'warning'} variant="soft">
            {grade(worst, minimumFor(role))} {worst.toFixed(1)}
          </Badge>
        )}
      </span>
    </button>
  )
}

/**
 * The color editor: a grid of chips. Opening one shows its dialog, with the
 * whole palette, each swatch marked with the roles that use it, and the
 * color picker for custom values. Chips show what the preview renders,
 * measured there, so they always match it.
 */
export const ColorsSection = ({ spec, onChange, rendered }: PanelProps): JSX.Element => {
  const [open, setOpen] = useState<ColorRole>()
  return (
    <Stack gap={4}>
      <Text variant="p3" tone="muted">
        Each chip shows the color as the preview renders it, light and dark, with its full
        code (eight digits when it has transparency, shown over a checkerboard) and text
        in its content color. The badge is the weaker contrast of the two. Open a chip to
        choose from the palette or make your own. Set a brand color and its content and
        strong colors follow, readable (WCAG AA) in both schemes.
      </Text>
      {GROUPS.map(([title, roles]) => (
        <Stack gap={2} key={title}>
          <Text variant="p3" weight="semibold" tone="muted">
            {title}
          </Text>
          <div className="studio-chips-grid">
            {roles.map((role) => (
              <Chip
                key={role}
                spec={spec}
                rendered={rendered}
                role={role}
                onOpen={() => setOpen(role)}
              />
            ))}
          </div>
        </Stack>
      ))}
      <ColorDialog
        spec={spec}
        onChange={onChange}
        rendered={rendered}
        role={open}
        onClose={() => setOpen(undefined)}
      />
    </Stack>
  )
}
