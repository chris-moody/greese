import type { JSX } from 'react'
import { Heading, Stack, Text } from '@greese/react'
import { radius } from '@greese/ui'
import { getIn, setIn } from '../edit.ts'
import { ValueRow } from '../fields.tsx'
import type { ThemeSpec } from '../spec.ts'

/** Choices per radius token, each shown as the corner it draws. */
const OPTIONS = ['0', '2px', '4px', '6px', '8px', '12px', '16px', '24px']

/** What each token rounds, so the choice means something. */
const USES: Record<string, string> = {
  sm: 'Badges, chips, checkboxes',
  md: 'Buttons, fields, menus',
  lg: 'Cards, dialogs, sheets',
}

export const RadiusSection = ({
  spec,
  onChange,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
}): JSX.Element => (
  <Stack gap={3}>
    <Heading level={3} size="md">
      Radius
    </Heading>
    {(['sm', 'md', 'lg'] as const).map((key) => {
      const path = ['tokens', 'radius', key]
      const value = (getIn(spec, path) as string | undefined) ?? ''
      const chosen = value || radius[key]
      return (
        <Stack gap={2} key={key}>
          <Text size="sm">
            <code className="studio-mono">{key}</code>{' '}
            <Text asChild tone="muted" size="sm">
              <span>{USES[key]}</span>
            </Text>
          </Text>
          <div className="studio-radii" role="group" aria-label={`Radius ${key}`}>
            {OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className="studio-radius"
                aria-pressed={chosen === option}
                aria-label={option === '0' ? 'Square' : option}
                title={option}
                onClick={() =>
                  onChange(setIn(spec, path, option === radius[key] ? undefined : option))
                }
              >
                <span style={{ borderStartStartRadius: option }} />
              </button>
            ))}
          </div>
          <ValueRow
            label={`--greese-radius-${key}`}
            value={value}
            placeholder={radius[key]}
            onChange={(v) => onChange(setIn(spec, path, v))}
          />
        </Stack>
      )
    })}
  </Stack>
)
