import { useMemo, useState, type CSSProperties, type JSX } from 'react'
import {
  Badge,
  Button,
  ColorPicker,
  Dialog,
  Segment,
  SegmentedControl,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextField,
  Tooltip,
} from '@greese/react'
import {
  black,
  color,
  contentColor,
  contrastRatio,
  palette,
  white,
  type ColorRole,
} from '@greese/ui'
import { setIn } from '../edit.ts'
import { resolveColor } from '../resolve.ts'
import type { RenderedColors } from '../protocol.ts'
import type { SchemeValue, ThemeSpec } from '../spec.ts'
import {
  colorName,
  estimate,
  grade,
  isSet,
  kebab,
  minimumFor,
  NO_TEXT,
  ON_CANVAS,
  over,
  pathOf,
  hasContent,
  valueIn,
} from './ColorsSection.tsx'

type Scheme = 'light' | 'dark'

/**
 * Two letters for each role, drawn over the swatches it's assigned to: brand
 * colors first, in the order they're listed (a swatch shows the first).
 */
const ABBREVIATIONS: Record<ColorRole, string> = {
  primary: 'Pr',
  primaryStrong: 'P+',
  primaryContent: 'Pc',
  secondary: 'Se',
  secondaryStrong: 'S+',
  secondaryContent: 'Sc',
  tertiary: 'Te',
  tertiaryStrong: 'T+',
  tertiaryContent: 'Tc',
  accent: 'Ac',
  accentStrong: 'A+',
  accentContent: 'Ax',
  canvas: 'Cv',
  surface: 'Sf',
  surfaceOverlay: 'Ov',
  fg: 'Fg',
  fgMuted: 'Fm',
  border: 'Bd',
  borderStrong: 'Bs',
  track: 'Tk',
  focusRing: 'Fr',
  positive: 'Po',
  negative: 'Ne',
  negativeContent: 'Nx',
  warning: 'Wa',
  info: 'In',
  white: 'Wh',
  black: 'Bk',
  scrim: 'Sm',
}

/** The roles that move together: a brand color with its strong and content colors. */
const familyOf = (role: ColorRole): ColorRole[] => {
  const base = role.replace(/(Strong|Content)$/, '') as ColorRole
  return [base, `${base}Strong` as ColorRole, `${base}Content` as ColorRole].filter(
    (r) => r in color
  )
}

/** Hues that read as neutral: they go last, before white and black. */
const NEUTRALS = new Set(['steel', 'gray', 'silver', 'ash', 'taupe'])

/**
 * One group per hue: the spectrum in order, then the neutrals, then white and
 * black together. From md up each group is a column, so the spectrum fills the
 * width; below it each is a row of its shades, lightest first, one under the
 * next (studio.scss lays them out; the order here serves both).
 */
const COLUMNS: Array<[name: string, shades: Array<[shade: string, hex: string]>]> = [
  ...Object.entries(palette)
    .filter(([name]) => !NEUTRALS.has(name))
    .map(
      ([name, shades]) =>
        [name, Object.entries(shades)] as [string, Array<[string, string]>]
    ),
  ...Object.entries(palette)
    .filter(([name]) => NEUTRALS.has(name))
    .map(
      ([name, shades]) =>
        [name, Object.entries(shades)] as [string, Array<[string, string]>]
    ),
  [
    'ends',
    [
      ['white', white],
      ['black', black],
    ],
  ],
]
const SHADE_COUNT = Object.keys(Object.values(palette)[0]!).length

/** `#rrggbb` of a rendered value, which may carry alpha. */
const opaque = (hex: string | undefined) => hex?.slice(0, 7).toLowerCase()

type Pair = { label: string; background: string; text: string; min: number }

/** The color and content pairs that matter for a role, in one scheme, as drawn. */
const pairsFor = (role: ColorRole, get: (r: ColorRole) => string | undefined): Pair[] => {
  const base = role.replace(/(Strong|Content)$/, '') as ColorRole
  const out: Pair[] = []
  const add = (bg: ColorRole, fg: ColorRole, min = minimumFor(fg)) => {
    const b = get(bg)
    const t = get(fg)
    if (b && t)
      out.push({ label: `${kebab(fg)} on ${kebab(bg)}`, background: b, text: t, min })
  }
  if (hasContent(base)) {
    add(base, `${base}Content` as ColorRole, 4.5)
    if (`${base}Strong` in color)
      add(`${base}Strong` as ColorRole, `${base}Content` as ColorRole, 4.5)
  } else if (ON_CANVAS.has(role)) add('canvas', role)
  else if (NO_TEXT.has(role)) {
    if (role !== 'scrim') add('canvas', role, 3)
  } else add(role, 'fg', 4.5)
  return out
}

/**
 * The editor for one color role: the whole palette, each swatch marked with the
 * roles that use it in the scheme you're editing, then the color picker for a
 * value of your own. Marks follow the theme as it changes. A brand color's
 * strong and content colors are one tap away (their own role, same dialog).
 */
export const ColorDialog = ({
  spec,
  onChange,
  rendered,
  role,
  onClose,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  rendered?: RenderedColors
  /** The role being opened; undefined keeps the dialog closed. */
  role: ColorRole | undefined
  onClose: () => void
}): JSX.Element => {
  const [scheme, setScheme] = useState<Scheme>('light')
  const [picked, setPicked] = useState<ColorRole>()
  const target = picked && role && familyOf(role).includes(picked) ? picked : role

  /** Every role's color in this scheme, as the preview renders it. */
  const hexes = useMemo(() => {
    const byHex = new Map<string, ColorRole[]>()
    for (const r of Object.keys(color) as ColorRole[]) {
      const hex = opaque(rendered?.[scheme][r] ?? estimate(spec, r, scheme))
      if (hex) byHex.set(hex, [...(byHex.get(hex) ?? []), r])
    }
    return byHex
  }, [spec, rendered, scheme])

  const assign = (value: string) => {
    if (!target) return
    const light = scheme === 'light' ? value : valueIn(spec, target, 'light')
    const dark = scheme === 'dark' ? value : valueIn(spec, target, 'dark')
    onChange(setIn(spec, pathOf(target), { light, dark } satisfies SchemeValue))
  }

  const current = target ? valueIn(spec, target, scheme) : ''
  const currentHex = opaque(
    (target && rendered?.[scheme][target]) || resolveColor(current, scheme)
  )
  const family = role ? familyOf(role) : []
  const pairs = target
    ? (() => {
        const labelled = new Map<string, Array<ReturnType<typeof result>>>()
        function result(scheme: Scheme, p: Pair) {
          const get = (r: ColorRole) => rendered?.[scheme][r] ?? estimate(spec, r, scheme)
          const canvas = get('canvas') ?? '#ffffff'
          const ground = over(p.background, canvas)
          return {
            scheme,
            min: p.min,
            background: p.background,
            text: p.text,
            ratio: contrastRatio(over(p.text, ground), ground),
          }
        }
        for (const scheme of ['light', 'dark'] as const) {
          const get = (r: ColorRole) => rendered?.[scheme][r] ?? estimate(spec, r, scheme)
          for (const p of pairsFor(target, get))
            labelled.set(p.label, [...(labelled.get(p.label) ?? []), result(scheme, p)])
        }
        return [...labelled].map(([label, results]) => ({ label, results }))
      })()
    : []
  const controls = (
    <Stack direction="row" gap={3} align="center" wrap="wrap" className="px-5 pt-5">
      {target ? `Color: ${colorName(target)}` : 'Color'}
      {target && (
        <>
          {family.length > 1 && (
            <SegmentedControl
              label="Role"
              size="xs"
              value={target}
              onValueChange={(v) => setPicked(v as ColorRole)}
            >
              {family.map((r) => (
                <Segment key={r} value={r}>
                  {r.endsWith('Strong')
                    ? 'Strong'
                    : r.endsWith('Content')
                      ? 'Content'
                      : 'Main'}
                </Segment>
              ))}
            </SegmentedControl>
          )}
          <SegmentedControl
            label="Scheme"
            size="xs"
            value={scheme}
            onValueChange={(v) => setScheme(v as Scheme)}
          >
            <Segment value="light">Light</Segment>
            <Segment value="dark">Dark</Segment>
          </SegmentedControl>
          {isSet(spec, target) && (
            <Button
              size="sm"
              variant="ghost"
              tone="neutral"
              onClick={() => onChange(setIn(spec, pathOf(target), undefined))}
            >
              Reset
            </Button>
          )}
        </>
      )}
    </Stack>
  )

  return (
    <Dialog
      className="p-0 studio-color-dialog"
      open={!!role}
      onOpenChange={(open) => !open && onClose()}
      size="xl"
      title={controls}
    >
      {target && (
        <Stack gap={4}>
          <Tabs defaultValue="palette">
            <TabList aria-label="Color source" className="px-5">
              <Tab value="palette">Palette</Tab>
              <Tab value="custom">Custom</Tab>
            </TabList>
            <TabPanel value="palette">
              <div
                className="studio-palette"
                role="group"
                aria-label="Palette"
                style={
                  {
                    '--studio-palette-groups': COLUMNS.length,
                    '--studio-palette-shades': SHADE_COUNT,
                  } as CSSProperties
                }
              >
                {COLUMNS.flatMap(([name, shades]) =>
                  shades.map(([shade, hex]) => {
                    const label = name === 'ends' ? shade : `${name}-${shade}`
                    const all = hexes.get(hex) ?? []
                    // The role being edited leads, so its mark is the one shown.
                    const roles = all.includes(target)
                      ? [target, ...all.filter((r) => r !== target)]
                      : all
                    const button = (
                      <button
                        type="button"
                        className="studio-palette-swatch"
                        style={{ background: hex, color: contentColor(hex) }}
                        data-current={currentHex === hex || undefined}
                        aria-pressed={currentHex === hex}
                        aria-label={`${label} ${hex}${
                          roles.length ? `, used by ${roles.map(kebab).join(', ')}` : ''
                        }`}
                        title={roles.length ? undefined : `${label} ${hex}`}
                        onClick={() => assign(name === 'ends' ? hex : `${name}-${shade}`)}
                      >
                        {roles.length > 0 && (
                          <>
                            <span>{ABBREVIATIONS[roles[0]!]}</span>
                            {roles.length > 1 && (
                              <span className="studio-palette-more">
                                +{roles.length - 1}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    )
                    return roles.length ? (
                      <Tooltip
                        key={`${name}-${shade}`}
                        delay={150}
                        content={
                          <>
                            <strong>
                              {label} {hex}
                            </strong>
                            {roles.map((r) => (
                              <div key={r}>
                                {ABBREVIATIONS[r]} {kebab(r)}
                              </div>
                            ))}
                          </>
                        }
                      >
                        {button}
                      </Tooltip>
                    ) : (
                      <span key={`${name}-${shade}`} style={{ display: 'contents' }}>
                        {button}
                      </span>
                    )
                  })
                )}
              </div>
            </TabPanel>
            <TabPanel value="custom">
              <Stack gap={3} className="px-5">
                <ColorPicker
                  label={`${kebab(target)}, ${scheme}`}
                  value={currentHex ?? '#000000'}
                  onValueChange={(hex) => assign(hex)}
                />
                <TextField
                  size="sm"
                  label={`${kebab(target)}, ${scheme}, as written`}
                  description="A palette name, a hex, or any CSS color: rgb(), oklch(), color-mix(), var()."
                  value={current}
                  spellCheck={false}
                  onChange={(e) => assign(e.currentTarget.value)}
                />
              </Stack>
            </TabPanel>
          </Tabs>

          <Stack gap={2} className="px-5 pb-5">
            <Text variant="p3" weight="semibold" tone="muted">
              Contrast (WCAG)
            </Text>
            {pairs.length === 0 && (
              <Text variant="caption" tone="muted">
                No text is drawn with {kebab(target)}.
              </Text>
            )}
            {pairs.map(({ label, results }) => (
              <div className="studio-contrast-row" key={label}>
                <span>{label}</span>
                {results.map(({ scheme: s, ratio, min, background, text }) => (
                  <span className="studio-contrast-cell" key={s}>
                    <span
                      className="studio-contrast-sample"
                      style={{ background, color: text }}
                      aria-hidden="true"
                    >
                      Aa
                    </span>
                    {s}{' '}
                    {ratio === undefined ? (
                      '?'
                    ) : (
                      <Badge tone={ratio >= min ? 'positive' : 'warning'} variant="soft">
                        {grade(ratio, min)} {ratio.toFixed(1)}
                      </Badge>
                    )}
                  </span>
                ))}
              </div>
            ))}
            {!isSet(spec, target) && (
              <Text variant="caption" tone="muted">
                Not set: this is {kebab(target)}&apos;s default
                {target.endsWith('Strong') || target.endsWith('Content')
                  ? ', derived from the main color until you set it'
                  : ''}
                .
              </Text>
            )}
          </Stack>
        </Stack>
      )}
    </Dialog>
  )
}
