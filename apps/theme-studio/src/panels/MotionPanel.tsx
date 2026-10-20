import type { JSX } from 'react'
import { Button, Heading, Stack, Text } from '@greese/react'
import { setIn } from '../edit.ts'
import { ValueRow } from '../fields.tsx'
import type { ThemeSpec } from '../spec.ts'

interface MotionPanelProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  onComponent: (name: string) => void
}

export const MotionPanel = ({
  spec,
  onChange,
  onComponent,
}: MotionPanelProps): JSX.Element => {
  const animated = Object.entries(spec.components ?? {}).filter(([, c]) => c.motion)
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Heading level={3} size="md">
          Every entrance
        </Heading>
        <Text size="sm" tone="muted">
          Tunes every <code>greese</code> prop entrance and every component default below.
          An instance’s own options still win.
        </Text>
        {(
          [
            ['duration', '0.5s'],
            ['delay', '0s'],
            ['ease', 'out'],
            ['distance', '1rem'],
            ['stagger', '0s'],
          ] as const
        ).map(([key, placeholder]) => (
          <ValueRow
            key={key}
            label={key}
            placeholder={placeholder}
            value={spec.motionDefaults?.[key] ?? ''}
            onChange={(v) => onChange(setIn(spec, ['motionDefaults', key], v))}
          />
        ))}
        <Text size="sm" tone="muted">
          Transition speeds and curves for every component are the duration and easing
          tokens, under Tokens.
        </Text>
      </Stack>
      <Stack gap={2}>
        <Heading level={3} size="md">
          Component defaults
        </Heading>
        {animated.length ? (
          animated.map(([name, c]) => (
            <div className="studio-row" key={name}>
              <Button size="sm" variant="ghost" onClick={() => onComponent(name)}>
                {name}
              </Button>
              <Text size="sm" tone="muted">
                {Object.entries(c.motion!)
                  .map(
                    ([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
                  )
                  .join(', ')}
              </Text>
            </div>
          ))
        ) : (
          <Text size="sm" tone="muted">
            None yet. Set one on a component’s Motion section.
          </Text>
        )}
      </Stack>
    </Stack>
  )
}
