import type { JSX } from 'react'
import { Heading, Stack, Text } from '@greese/react'
import { setIn } from '../edit.ts'
import { ValueRow } from '../fields.tsx'
import type { GreeseLab } from '../greeseLab.ts'
import type { ThemeSpec } from '../spec.ts'
import { EffectsSection } from './EffectsSection.tsx'

interface MotionPanelProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  /** The theme's effects and the stage they play on. */
  lab: GreeseLab
}

/** The motion roles (the kit's `motion-defaults()`), with the base theme's choice. */
const ROLES = [
  ['theme', 'fade-up'],
  ['content', 'a short rise'],
  ['rows', 'none'],
  ['toast', 'a short rise'],
  ['backdrop', 'a fade'],
  ['overlay', 'a fade from its origin'],
  ['dialog', 'overlay’s'],
  ['popover', 'overlay’s'],
  ['tooltip', 'overlay’s'],
  ['drawer', 'a slide from its edge'],
  ['overlay-exit', 'a fade toward its origin'],
  ['dialog-exit', 'overlay-exit’s'],
  ['popover-exit', 'overlay-exit’s'],
  ['tooltip-exit', 'overlay-exit’s'],
  ['drawer-exit', 'a slide to its edge'],
  ['content-duration', 'normal'],
  ['rows-duration', 'slow'],
  ['overlay-duration', 'fast'],
  ['toast-duration', 'normal'],
  ['backdrop-duration', 'normal'],
  ['exit-duration', 'fast'],
  ['enter-ease', 'enter'],
  ['exit-ease', 'exit'],
] as const

export const MotionPanel = ({ spec, onChange, lab }: MotionPanelProps): JSX.Element => {
  return (
    <Stack gap={5}>
      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Every entrance
        </Heading>
        <Text variant="p3" tone="muted">
          Tunes every <code>greese</code> prop entrance and every component’s default. An
          instance’s own options still win.
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
        <Text variant="p3" tone="muted">
          Transition speeds and curves for every component are the duration and easing
          tokens, under Tokens. A motion theme leaves them as they are.
        </Text>
      </Stack>
      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Roles
        </Heading>
        <Text variant="p3" tone="muted">
          Which effect plays where, and which timing it takes: an effect by name (
          <code>wipe-up</code>), a duration token (<code>slow</code>) or an easing token (
          <code>enter</code>), or a value of your own. The effects and tokens keep their
          own values; a role only points at one. A component’s or an instance’s own motion
          still wins.
        </Text>
        {ROLES.map(([key, placeholder]) => (
          <ValueRow
            key={key}
            label={key}
            placeholder={placeholder}
            value={spec.motionDefaults?.[key] ?? ''}
            onChange={(v) => onChange(setIn(spec, ['motionDefaults', key], v))}
          />
        ))}
      </Stack>
      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Scopes
        </Heading>
        <Text variant="p3" tone="muted">
          A <code>scope</code> on a parent orders every entrance inside it, at any depth:{' '}
          <code>greese={'{{ scope: { stagger: 0.1, delay: 0.2 } }}'}</code>. Members start
          in document order; a scope inside a scope takes one place in the outer one. Each
          entrance still uses the duration, ease and distance above, so a theme tunes a
          whole sequence at once. See “Motion scope” in a component’s preview.
        </Text>
      </Stack>
      <EffectsSection lab={lab} />
    </Stack>
  )
}
