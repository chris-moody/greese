import { useMemo, useState, type JSX } from 'react'
import {
  Button,
  ColorPicker,
  Dialog,
  Segment,
  SegmentedControl,
  Stack,
  Text,
  TextField,
  Tooltip,
} from '@greese/react'
import { black, color, contentColor, palette, white, type ColorRole } from '@greese/ui'
import { getIn, setIn } from '../edit.ts'
import { resolveColor } from '../resolve.ts'
import type { RenderedColors } from '../protocol.ts'
import type { SchemeValue, ThemeSpec } from '../spec.ts'
import { estimate, isSet, kebab, pathOf, valueIn } from './ColorsSection.tsx'

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

/** The rows of swatches: every hue, then the two ends. */
const ROWS: Array<[name: string, shades: Array<[shade: string, hex: string]>]> = [
  ...Object.entries(palette).map(
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

/** `#rrggbb` of a rendered value, which may carry alpha. */
const opaque = (hex: string | undefined) => hex?.slice(0, 7).toLowerCase()

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

  return (
    <Dialog
      open={!!role}
      onOpenChange={(open) => !open && onClose()}
      size="lg"
      title={target ? `Color: ${kebab(target)}` : 'Color'}
      description="Pick a palette color, or make your own. Each mark is a role using that swatch in the scheme shown."
    >
      {target && (
        <Stack gap={4}>
          <Stack direction="row" gap={3} align="center" wrap="wrap">
            <SegmentedControl
              label="Scheme"
              size="sm"
              value={scheme}
              onValueChange={(v) => setScheme(v as Scheme)}
            >
              <Segment value="light">Light</Segment>
              <Segment value="dark">Dark</Segment>
            </SegmentedControl>
            {family.length > 1 && (
              <SegmentedControl
                label="Role"
                size="sm"
                value={target}
                onValueChange={(v) => setPicked(v as ColorRole)}
              >
                {family.map((r) => (
                  <Segment key={r} value={r}>
                    {r.endsWith('Strong') ? 'Strong' : r.endsWith('Content') ? 'Content' : 'Main'}
                  </Segment>
                ))}
              </SegmentedControl>
            )}
            {isSet(spec, target) && (
              <Button
                size="sm"
                variant="ghost"
                tone="neutral"
                onClick={() => onChange(setIn(spec, pathOf(target), undefined))}
              >
                Reset to default
              </Button>
            )}
          </Stack>

          <div className="studio-palette" role="group" aria-label="Palette">
            {ROWS.map(([name, shades]) => (
              <div className="studio-palette-row" key={name}>
                <Text variant="caption" tone="muted" className="studio-palette-name">
                  {name === 'ends' ? '' : name}
                </Text>
                {shades.map(([shade, hex]) => {
                  const label = name === 'ends' ? shade : `${name}-${shade}`
                  const roles = hexes.get(hex) ?? []
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
                            <span className="studio-palette-more">+{roles.length - 1}</span>
                          )}
                        </>
                      )}
                    </button>
                  )
                  return roles.length ? (
                    <Tooltip
                      key={shade}
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
                    <span key={shade} style={{ display: 'contents' }}>
                      {button}
                    </span>
                  )
                })}
              </div>
            ))}
          </div>

          <Stack gap={2}>
            <Text variant="p3" weight="semibold" tone="muted">
              Your own color
            </Text>
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
            {!isSet(spec, target) && getIn(spec, pathOf(target)) === undefined && (
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
