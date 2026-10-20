import { useState, type JSX } from 'react'
import { Button, Segment, SegmentedControl, Select, Stack, Text } from '@greese/react'
import {
  breakpoints,
  typeCoreProps,
  typeExtraProps,
  typeVariants,
  typography,
  type TypeVariant,
} from '@greese/ui'
import { setIn } from '../edit.ts'
import { ValueRow } from '../fields.tsx'
import type { ThemeSpec } from '../spec.ts'

/** The smallest screen, then each breakpoint above it, smallest first. */
const POINTS = [
  'base',
  ...Object.entries(breakpoints)
    .filter(([, width]) => width > 0)
    .sort(([, a], [, b]) => a - b)
    .map(([key]) => key),
]

type Styles = Record<string, Record<string, string> | undefined>

const defaultsOf = (variant: TypeVariant): Styles =>
  typography[variant] as unknown as Styles

/**
 * What a property is at `point` if the theme doesn't set that exact point:
 * the last value set at or below it, the theme's replacing the default's at
 * the same point. Shown as the placeholder of an empty field.
 */
const fallback = (
  spec: ThemeSpec,
  variant: TypeVariant,
  point: string,
  prop: string
): string | undefined => {
  const own = (spec.typography?.[variant] ?? {}) as Styles
  const standard = defaultsOf(variant)
  let value: string | undefined
  for (const at of POINTS) {
    // `xs` is the same point as `base`.
    const std = standard[at]?.[prop] ?? (at === 'base' ? standard.xs?.[prop] : undefined)
    const candidate = (at === point ? undefined : own[at]?.[prop]) ?? std
    if (candidate !== undefined) value = candidate
    if (at === point) break
  }
  return value
}

/**
 * The type system's editor: pick a variant and a breakpoint, and set that
 * point's values. A value you leave empty keeps what it was (the placeholder
 * shows what that is); the rest of the variant, other breakpoints included,
 * stays as it is.
 */
export const TypographySection = ({
  spec,
  onChange,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
}): JSX.Element => {
  const [variant, setVariant] = useState<TypeVariant>('h1')
  const [point, setPoint] = useState('base')
  const [extra, setExtra] = useState('')
  const path = (prop: string) => ['typography', variant, point, prop]
  const own = ((spec.typography?.[variant] ?? {}) as Styles)[point] ?? {}
  const unsetExtras = Object.keys(typeExtraProps).filter((p) => !(p in own))
  const edited = !!spec.typography?.[variant]

  return (
    <Stack gap={3}>
      <Text variant="p3" tone="muted">
        Named text styles that change across breakpoints. A value set at a breakpoint
        applies from there up until a larger one sets another. Breakpoints are fixed when
        the stylesheet is built.
      </Text>
      <Stack direction="row" gap={2} align="end" wrap="wrap">
        <Select
          size="sm"
          aria-label="Variant"
          value={variant}
          onChange={(e) => setVariant(e.currentTarget.value as TypeVariant)}
        >
          {typeVariants.map((v) => (
            <option key={v} value={v}>
              {v}
              {spec.typography?.[v] ? ' •' : ''}
            </option>
          ))}
        </Select>
        {edited && (
          <Button
            size="sm"
            variant="ghost"
            tone="neutral"
            onClick={() => onChange(setIn(spec, ['typography', variant], undefined))}
          >
            Reset {variant}
          </Button>
        )}
      </Stack>
      <SegmentedControl
        label="Breakpoint"
        size="sm"
        value={point}
        onValueChange={setPoint}
      >
        {POINTS.map((p) => (
          <Segment key={p} value={p}>
            {p === 'base' ? 'base' : `${p} ${breakpoints[p as keyof typeof breakpoints]}`}
          </Segment>
        ))}
      </SegmentedControl>
      {Object.keys(typeCoreProps).map((prop) => (
        <ValueRow
          key={`${variant}-${point}-${prop}`}
          label={`${variant}-${prop}`}
          value={own[prop] ?? ''}
          placeholder={fallback(spec, variant, point, prop) ?? ''}
          onChange={(v) => onChange(setIn(spec, path(prop), v))}
        />
      ))}
      {Object.keys(own)
        .filter((prop) => prop in typeExtraProps)
        .map((prop) => (
          <Stack key={`${variant}-${point}-${prop}`} gap={1}>
            <ValueRow
              label={`${variant}-${prop}`}
              value={own[prop] ?? ''}
              onChange={(v) => onChange(setIn(spec, path(prop), v))}
            />
            <div>
              <Button
                size="sm"
                variant="ghost"
                tone="neutral"
                aria-label={`Remove ${variant}-${prop}`}
                onClick={() => onChange(setIn(spec, path(prop), undefined))}
              >
                Remove
              </Button>
            </div>
          </Stack>
        ))}
      {unsetExtras.length > 0 && (
        <form
          className="studio-add"
          onSubmit={(e) => {
            e.preventDefault()
            if (!extra) return
            onChange(setIn(spec, path(extra), 'inherit'))
            setExtra('')
          }}
        >
          <Select
            size="sm"
            aria-label={`Add a property to ${variant}`}
            value={extra}
            onChange={(e) => setExtra(e.currentTarget.value)}
          >
            <option value="">Add a property…</option>
            {unsetExtras.map((p) => (
              <option key={p} value={p}>
                {p} ({typeExtraProps[p as keyof typeof typeExtraProps]})
              </option>
            ))}
          </Select>
          <Button size="sm" variant="soft" type="submit" disabled={!extra}>
            Add
          </Button>
        </form>
      )}
    </Stack>
  )
}
