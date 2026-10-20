import type { JSX } from 'react'
import { Button, Menu, MenuItem, MenuSeparator } from '@greese/react'
import { color } from '@greese/ui'
import { getIn } from './edit.ts'
import { resolveColor } from './fields.tsx'
import { applyPreset, PRESETS, randomPreset, type Preset } from './presets.ts'
import type { RenderedColors } from './protocol.ts'
import type { SchemeValue, ThemeSpec } from './spec.ts'

const BRAND = ['primary', 'secondary', 'tertiary', 'accent'] as const

const dot = (value: SchemeValue | undefined, fallback: string) =>
  resolveColor(typeof value === 'object' ? value.light : (value ?? fallback)) ?? fallback

/** Which preset the theme's colors and radii are, if any. */
const matching = (spec: ThemeSpec): Preset | undefined =>
  PRESETS.find(
    (p) =>
      JSON.stringify(getIn(spec, ['tokens', 'color']) ?? {}) ===
        JSON.stringify(p.color) &&
      JSON.stringify(getIn(spec, ['tokens', 'radius']) ?? {}) ===
        JSON.stringify(p.radius ?? {})
  )

/** The four brand colors, as swatches. */
const Dots = ({ colors }: { colors: string[] }) => (
  <span className="studio-theme-dots" aria-hidden="true">
    {colors.map((background, i) => (
      <span key={i} style={{ background }} />
    ))}
  </span>
)

const presetColors = (preset: Preset) =>
  BRAND.map((role) => dot(preset.color[role], color[role].light))

/**
 * The brand colors of the theme being edited: as the preview renders them
 * once it has reported (so `var()`, `oklch()` and alpha are right), else
 * read from the theme.
 */
const currentColors = (spec: ThemeSpec, rendered?: RenderedColors) =>
  BRAND.map(
    (role) =>
      rendered?.light[role]?.slice(0, 7) ??
      dot(
        getIn(spec, ['tokens', 'color', role]) as SchemeValue | undefined,
        color[role].light
      )
  )

/**
 * The starting themes, in a header menu: each replaces the theme's colors
 * and radii and keeps component and motion edits. Random picks four
 * different hues. The button shows the four brand colors and the name of the
 * theme being edited: a starting theme's, or "Custom" with its own colors.
 */
export const ThemeMenu = ({
  spec,
  onChange,
  rendered,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  rendered?: RenderedColors
}): JSX.Element => {
  const current = matching(spec)
  return (
    <Menu
      trigger={
        <Button size="sm" variant="soft" tone="neutral">
          <Dots colors={currentColors(spec, rendered)} />
          {current?.label ?? 'Custom'}
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
          <Dots colors={presetColors(preset)} />
          {preset.label}
        </MenuItem>
      ))}
    </Menu>
  )
}
