import type { JSX } from 'react'
import { Button, Menu, MenuItem, MenuSeparator } from '@greese-ui/react'
import { color } from '@greese-ui/tokens'
import { getIn } from './edit.ts'
import { resolveColor } from './fields.tsx'
import { applyPreset, PRESETS, randomPreset, type Preset } from './presets.ts'
import type { SchemeValue, ThemeSpec } from './spec.ts'

const BRAND = ['primary', 'secondary', 'tertiary', 'accent'] as const

const dot = (value: SchemeValue | undefined, fallback: string) =>
  resolveColor(typeof value === 'object' ? value.light : (value ?? fallback)) ?? fallback

/** Which preset the theme's colours and radii are, if any. */
const matching = (spec: ThemeSpec): Preset | undefined =>
  PRESETS.find(
    (p) =>
      JSON.stringify(getIn(spec, ['tokens', 'color']) ?? {}) ===
        JSON.stringify(p.color) &&
      JSON.stringify(getIn(spec, ['tokens', 'radius']) ?? {}) ===
        JSON.stringify(p.radius ?? {})
  )

const Dots = ({ preset }: { preset: Preset }) => (
  <span className="studio-theme-dots" aria-hidden="true">
    {BRAND.map((role) => (
      <span
        key={role}
        style={{ background: dot(preset.color[role], color[role].light) }}
      />
    ))}
  </span>
)

/**
 * The starting themes, in a header menu: each replaces the theme's colours
 * and radii and keeps component and motion edits. Random picks four
 * different hues.
 */
export const ThemeMenu = ({
  spec,
  onChange,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
}): JSX.Element => {
  const current = matching(spec)
  return (
    <Menu
      trigger={
        <Button size="sm" variant="soft" tone="neutral">
          {current ? <Dots preset={current} /> : null}
          Theme: {current?.label ?? 'Custom'}
        </Button>
      }
    >
      <MenuItem onSelect={() => onChange(applyPreset(spec, randomPreset()))}>
        Random
      </MenuItem>
      <MenuSeparator />
      {PRESETS.map((preset) => (
        <MenuItem
          key={preset.id}
          onSelect={() => onChange(applyPreset(spec, preset))}
          aria-current={current?.id === preset.id || undefined}
        >
          <Dots preset={preset} />
          {preset.label}
        </MenuItem>
      ))}
    </Menu>
  )
}
