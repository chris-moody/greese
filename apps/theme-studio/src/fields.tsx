import { useState, type JSX } from 'react'
import { Button, Input, Stack, Text, TextField } from '@greese/react'
import { color, palette, type PaletteHue, type PaletteShade } from '@greese/ui'
import type { Declarations, SchemeValue } from './spec.ts'

/** `#abc`/`#aabbcc` only: what `<input type="color">` can show. */
const HEX = /^#([0-9a-f]{3}){1,2}$/i

const expand = (hex: string) =>
  hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join('')}` : hex

/** Every palette name, `lavender-600`, which the kit compiles to its color. */
const PALETTE_NAMES = Object.entries(palette).flatMap(([hue, shades]) =>
  Object.keys(shades).map((shade) => `${hue}-${shade}`)
)

/**
 * The hex a value shows as: itself, a palette name's color, or a color
 * role's default in `scheme` (`var(--greese-color-primary)`). Undefined for
 * what can't be resolved here (`color-mix()`, `oklch()`).
 */
export const resolveColor = (
  value: string,
  scheme: 'light' | 'dark' = 'light',
  depth = 0
): string | undefined => {
  if (HEX.test(value)) return expand(value)
  const [, hue, shade] = /^([a-z]+)-(\d+)$/.exec(value) ?? []
  if (hue && hue in palette)
    return palette[hue as PaletteHue][Number(shade) as PaletteShade]
  const [, role] = /^var\(--greese-color-([a-z-]+)\)$/.exec(value) ?? []
  const camel = role?.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  if (camel && camel in color && depth < 3)
    return resolveColor(color[camel as keyof typeof color][scheme], scheme, depth + 1)
  return undefined
}

/** Suggestions for every color field: the palette's names. Render once. */
export const PaletteOptions = (): JSX.Element => (
  <datalist id="studio-palette">
    {PALETTE_NAMES.map((name) => (
      <option key={name} value={name} />
    ))}
  </datalist>
)

/**
 * A color swatch plus free text, so palette names (`lavender-600`), `rgb()`,
 * `var()` and `color-mix()` work too. The swatch shows `rendered`, the color
 * as the preview draws it (alpha over a checkerboard), when it's known; the
 * picker behind it sets a hex.
 */
export const ColorInput = ({
  label,
  value,
  placeholder,
  rendered,
  scheme = 'light',
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  /** The color as the preview renders it: `#rrggbb[aa]`. */
  rendered?: string
  scheme?: 'light' | 'dark'
  onChange: (value: string) => void
}): JSX.Element => {
  const shown = value || placeholder
  const paint = rendered ?? resolveColor(shown, scheme)
  return (
    <Input
      aria-label={label}
      size="sm"
      list="studio-palette"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.currentTarget.value)}
      spellCheck={false}
      title={rendered ? `${shown} renders as ${rendered}` : shown}
      startAdornment={
        <span className="studio-swatch studio-checker">
          <span style={{ background: paint ?? 'transparent' }} />
          <input
            type="color"
            aria-label={`${label} picker`}
            value={(paint ?? '#000000').slice(0, 7)}
            onChange={(e) => onChange(e.currentTarget.value)}
          />
        </span>
      }
    />
  )
}

/** A light/dark pair, or one value for both. */
export const SchemeInput = ({
  label,
  value,
  fallback,
  color,
  rendered,
  onChange,
}: {
  label: string
  value: SchemeValue | undefined
  fallback: { light: string; dark: string } | string
  color?: boolean
  /** Each scheme's color as the preview renders it, for the swatches. */
  rendered?: { light: string; dark: string }
  onChange: (value: SchemeValue | undefined) => void
}): JSX.Element => {
  const pair = typeof value === 'string' ? { light: value, dark: value } : value
  const base =
    typeof fallback === 'string' ? { light: fallback, dark: fallback } : fallback
  const set = (scheme: 'light' | 'dark', v: string) => {
    const next = { light: pair?.light ?? '', dark: pair?.dark ?? '', [scheme]: v }
    if (!next.light && !next.dark) return onChange(undefined)
    // A pair needs both sides: fill the untouched one with its default.
    onChange({ light: next.light || base.light, dark: next.dark || base.dark })
  }
  const field = (scheme: 'light' | 'dark') =>
    color ? (
      <ColorInput
        label={`${label}, ${scheme}`}
        value={pair?.[scheme] ?? ''}
        placeholder={base[scheme]}
        rendered={rendered?.[scheme]}
        scheme={scheme}
        onChange={(v) => set(scheme, v)}
      />
    ) : (
      <PlainInput
        label={`${label}, ${scheme}`}
        value={pair?.[scheme] ?? ''}
        placeholder={base[scheme]}
        onChange={(v) => set(scheme, v)}
      />
    )
  return (
    // Colors stack: the label above, light and dark each wide enough for a
    // full value (`color-mix(…)`, `#rrggbbaa`).
    <div className={color ? 'studio-row studio-row--stack' : 'studio-row'}>
      <Text size="sm" className="studio-row-label">
        {label}
      </Text>
      <div className="studio-pair">
        {field('light')}
        {field('dark')}
      </div>
    </div>
  )
}

export const PlainInput = ({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}): JSX.Element => (
  <Input
    aria-label={label}
    size="sm"
    value={value}
    placeholder={placeholder}
    spellCheck={false}
    onChange={(e) => onChange(e.currentTarget.value)}
  />
)

/**
 * One labelled value on a row: tokens, variables, motion options. The
 * `--greese-` prefix every one shares is left off the label.
 */
export const ValueRow = ({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
}): JSX.Element => {
  const shown = label.replace(/^--greese-/, '')
  return (
    <div className="studio-row">
      <Text size="sm" className="studio-row-label">
        {shown}
      </Text>
      <PlainInput
        label={shown}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  )
}

/** Free-form CSS declarations: a row per property, plus one to add. */
export const DeclarationsEditor = ({
  label,
  value,
  onChange,
}: {
  label: string
  value: Declarations | undefined
  onChange: (value: Declarations) => void
}): JSX.Element => {
  const [draft, setDraft] = useState('')
  const entries = Object.entries(value ?? {})
  const add = () => {
    const property = draft.trim()
    if (!property) return
    onChange({ ...value, [property]: value?.[property] ?? '' })
    setDraft('')
  }
  return (
    <Stack gap={2}>
      {entries.map(([property, v]) => (
        <div className="studio-row" key={property}>
          <code className="studio-row-label">{property}</code>
          <div className="studio-pair">
            <PlainInput
              label={`${label} ${property}`}
              value={v}
              onChange={(next) => onChange({ ...value, [property]: next })}
            />
            <Button
              size="sm"
              variant="ghost"
              tone="neutral"
              aria-label={`Remove ${property}`}
              onClick={() => {
                const { [property]: _removed, ...rest } = value ?? {}
                onChange(rest)
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
      <form
        className="studio-add"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <TextField
          label={`Add a property to ${label}`}
          hideLabel
          size="sm"
          placeholder="Add a property: box-shadow, --greese-…"
          value={draft}
          spellCheck={false}
          onChange={(e) => setDraft(e.currentTarget.value)}
        />
        <Button size="sm" variant="soft" type="submit">
          Add
        </Button>
      </form>
    </Stack>
  )
}
