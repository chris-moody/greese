import { useId, useState, type JSX } from 'react'
import { Badge, Stack, Text } from '@greese/react'
import { AA, color, contentColor, contrastRatio, type ColorRole } from '@greese/ui'
import { derivedContent, derivedStrong } from '../derived.ts'
import { getIn, setIn } from '../edit.ts'
import { resolveColor, SchemeInput } from '../fields.tsx'
import type { RenderedColors } from '../protocol.ts'
import type { SchemeValue, ThemeSpec } from '../spec.ts'

const kebab = (value: string): string =>
  value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

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
const ON_CANVAS = new Set<ColorRole>([
  'fg',
  'fgMuted',
  'positive',
  'warning',
  'info',
  'focusRing',
])

/** Roles with no text drawn on or in them. */
const NO_TEXT = new Set<ColorRole>(['border', 'borderStrong', 'scrim'])

/** WCAG's minimum: 4.5:1 for text, 3:1 for a focus indicator (a UI component). */
const minimumFor = (role: ColorRole) => (role === 'focusRing' ? 3 : AA)

/** Roles drawn on, and so given a content color the chip previews. */
const hasContent = (role: ColorRole): boolean => `${role}Content` in color

interface PanelProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  /** Each color as the preview renders it (`#rrggbb[aa]`), once it has reported. */
  rendered?: RenderedColors
}

const pathOf = (role: string) => ['tokens', 'color', kebab(role)]

/** A role's value in one scheme: the theme's, else the default. */
const valueIn = (spec: ThemeSpec, role: ColorRole, scheme: Scheme): string => {
  const own = getIn(spec, pathOf(role)) as SchemeValue | undefined
  if (own !== undefined) return typeof own === 'string' ? own : own[scheme]
  return color[role][scheme]
}

const isSet = (spec: ThemeSpec, role: string) => getIn(spec, pathOf(role)) !== undefined

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
const estimate = (
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

const grade = (ratio: number, min: number) =>
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
  open,
  controls,
  onToggle,
}: {
  spec: ThemeSpec
  rendered?: RenderedColors
  role: ColorRole
  open: boolean
  controls: string
  onToggle: () => void
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
      aria-expanded={open}
      aria-controls={controls}
      data-set={isSet(spec, role) || undefined}
      aria-label={`${kebab(role)}: light ${halves[0]!.code ?? 'unknown'}, dark ${halves[1]!.code ?? 'unknown'}${worst ? `, contrast ${worst.toFixed(1)} to 1` : ''}`}
      onClick={onToggle}
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
 * The color editor: a grid of chips, and under it the fields for the one
 * you open. For a brand color that includes its strong and content colors,
 * which stay automatic until you set them. Chips and swatches show what the
 * preview renders, measured there, so they always match it.
 */
export const ColorsSection = ({ spec, onChange, rendered }: PanelProps): JSX.Element => {
  const [open, setOpen] = useState<ColorRole>()
  const id = useId()
  const field = (role: ColorRole, auto?: { light: string; dark: string }) => (
    <SchemeInput
      key={role}
      label={kebab(role)}
      color
      value={getIn(spec, pathOf(role)) as SchemeValue | undefined}
      fallback={auto ?? color[role]}
      rendered={rendered && { light: rendered.light[role]!, dark: rendered.dark[role]! }}
      onChange={(v) => onChange(setIn(spec, pathOf(role), v))}
    />
  )
  /** What the kit derives from a brand color the theme set, per scheme, as placeholders. */
  const derived = (
    role: ColorRole,
    make: (hex: string, scheme: Scheme) => string | undefined
  ) => {
    if (!isSet(spec, role)) return undefined
    const out = { light: '', dark: '' }
    for (const scheme of ['light', 'dark'] as const) {
      const hex =
        rendered?.[scheme][role]?.slice(0, 7) ??
        resolveColor(valueIn(spec, role, scheme), scheme)
      const value = hex && make(hex, scheme)
      if (!value) return undefined
      out[scheme] = value
    }
    return out
  }
  return (
    <Stack gap={4}>
      <Text size="sm" tone="muted">
        Each chip shows the color as the preview renders it, light and dark, with its full
        code (eight digits when it has transparency, shown over a checkerboard) and text
        in its content color. The badge is the weaker contrast of the two. Set a brand
        color and its content and strong colors follow, readable (WCAG AA) in both
        schemes.
      </Text>
      {GROUPS.map(([title, roles]) => (
        <Stack gap={2} key={title}>
          <Text size="sm" weight="semibold" tone="muted">
            {title}
          </Text>
          <div className="studio-chips-grid">
            {roles.map((role) => (
              <Chip
                key={role}
                spec={spec}
                rendered={rendered}
                role={role}
                open={open === role}
                controls={id}
                onToggle={() => setOpen(open === role ? undefined : role)}
              />
            ))}
          </div>
          {open && roles.includes(open) && (
            <div id={id} className="studio-chip-editor">
              {field(open)}
              {`${open}Strong` in color &&
                field(`${open}Strong` as ColorRole, derived(open, derivedStrong))}
              {hasContent(open) &&
                field(`${open}Content` as ColorRole, derived(open, derivedContent))}
              {isSet(spec, open) && (
                <Text size="xs" tone="muted">
                  Strong and content are derived from {kebab(open)} until you set them.
                </Text>
              )}
            </div>
          )}
        </Stack>
      ))}
    </Stack>
  )
}
