import type { Meta, StoryObj } from '@storybook/react-vite'
import type { JSX } from 'react'
import { color, contrastRatio, type ColorRole } from '@greese/ui'
import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from '@greese/react'
import { PaletteTables } from './PaletteTables.tsx'

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

/** The roles, grouped as the Color page explains them, brand colors in order. */
const GROUPS: Array<[title: string, roles: ColorRole[]]> = [
  [
    'Brand',
    [
      'primary',
      'primaryStrong',
      'primaryContent',
      'secondary',
      'secondaryStrong',
      'secondaryContent',
      'tertiary',
      'tertiaryStrong',
      'tertiaryContent',
      'accent',
      'accentStrong',
      'accentContent',
      'focusRing',
    ],
  ],
  [
    'Surfaces and text',
    [
      'canvas',
      'surface',
      'surfaceOverlay',
      'fg',
      'fgMuted',
      'border',
      'borderStrong',
      'scrim',
    ],
  ],
  ['Status', ['positive', 'negative', 'negativeContent', 'warning', 'info']],
]

/** A `…Content` role's color: `primaryContent` sits on `primary`. */
const contentOf = (role: ColorRole): ColorRole | undefined =>
  role.endsWith('Content') ? (role.slice(0, -'Content'.length) as ColorRole) : undefined

/**
 * One scheme's color: a square swatch, resolved inside that scheme so roles
 * that point at others (`focusRing`) show what they resolve to, with the
 * token's value under it, and, for content colors, their WCAG contrast.
 */
const Swatch = ({ role, scheme }: { role: ColorRole; scheme: 'light' | 'dark' }) => {
  const on = contentOf(role)
  const ratio = on && contrastRatio(color[role][scheme], color[on][scheme])
  return (
    <div data-greese-scheme={scheme} className="color-cell">
      <div
        className="color-swatch"
        style={{ background: `var(--greese-color-${kebab(role)})` }}
        aria-hidden="true"
      />
      <code className="color-code">{color[role][scheme]}</code>
      {ratio && (
        <Text variant="caption" tone="muted">
          {ratio.toFixed(2)}:1 on {on}
        </Text>
      )}
    </div>
  )
}

const RoleTable = ({
  title,
  roles,
}: {
  title: string
  roles: ColorRole[]
}): JSX.Element => (
  <Table caption={`${title} colors`} stackBelow="sm">
    <TableHead>
      <TableRow>
        <TableHeaderCell>Var</TableHeaderCell>
        <TableHeaderCell>Color light</TableHeaderCell>
        <TableHeaderCell>Color dark</TableHeaderCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {roles.map((role) => (
        <TableRow key={role}>
          <TableCell label="Var">
            <code className="color-var">--greese-color-{kebab(role)}</code>
          </TableCell>
          <TableCell label="Color light">
            <Swatch role={role} scheme="light" />
          </TableCell>
          <TableCell label="Color dark">
            <Swatch role={role} scheme="dark" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
)

const Roles = (): JSX.Element => (
  <Stack gap={6}>
    {GROUPS.map(([title, roles]) => (
      <RoleTable key={title} title={title} roles={roles} />
    ))}
    <style>{`
      .color-cell { display: inline-grid; justify-items: start; gap: var(--greese-space-1); padding: var(--greese-space-2); border-radius: var(--greese-radius-md); color: var(--greese-color-fg); background: var(--greese-color-canvas); }
      .color-swatch { inline-size: 2.75rem; aspect-ratio: 1; border: 1px solid var(--greese-color-border); border-radius: var(--greese-radius-sm); }
      .color-code, .color-var { font: var(--greese-type-caption-font-size) / 1.3 var(--greese-font-mono); overflow-wrap: anywhere; }
    `}</style>
  </Stack>
)

/** Shown on Foundations/Color (Color.mdx), which embeds these stories. */
const meta = {
  title: 'Foundations/Color',
  tags: ['!autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Every color role, a table per group: its variable, then its light and dark colors. */
export const RoleTokens: Story = {
  name: 'Roles',
  render: () => <Roles />,
}

/** The palette, a table per hue. Click a shade to copy its reference. */
export const Palette: Story = {
  render: () => <PaletteTables />,
}
