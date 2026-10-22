import { useState, type JSX } from 'react'
import { Badge, Field, Heading, Select, Stack, Text } from '@greese/react'
import { getIn, setIn } from '../edit.ts'
import { DeclarationsEditor, SchemeInput, ValueRow } from '../fields.tsx'
import { blockNames, blocks } from '../manifest.ts'
import type { Picked } from '../protocol.ts'
import {
  motionChoices,
  type Declarations,
  type SchemeValue,
  type ThemeSpec,
} from '../spec.ts'

const Chips = ({
  label,
  items,
}: {
  label: string
  items: string[]
}): JSX.Element | null =>
  items.length ? (
    <div className="studio-row">
      <Text variant="p3" className="studio-row-label">
        {label}
      </Text>
      <div className="studio-chips">
        {items.map((item) => (
          <Badge key={item} tone="neutral" variant="outline">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  ) : null

interface ComponentsPanelProps {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  component: string
  onComponent: (name: string) => void
  /** The element last picked with Inspect, if it was this component. */
  picked?: Picked
}

export const ComponentsPanel = ({
  spec,
  onChange,
  component,
  onComponent,
  picked,
}: ComponentsPanelProps): JSX.Element => {
  const info = blocks[component]!
  const base = ['components', component]
  const [target, setTarget] = useState('root')
  const targets = [
    'root',
    ...info.modifiers.map((m) => `modifier:${m}`),
    ...info.parts.map((p) => `part:${p}`),
  ]
  const current = targets.includes(target) ? target : 'root'
  const [kind, name] = current.split(':') as ['root' | 'modifier' | 'part', string?]
  const declPath = kind === 'root' ? [...base, 'styles'] : [...base, `${kind}s`, name!]
  const set = (path: string[], value: unknown) => onChange(setIn(spec, path, value))
  const get = (path: string[]) => (getIn(spec, path) as string | undefined) ?? ''
  const choices = motionChoices(spec)
  const prefix = '--greese-'
  const live = picked?.block === component ? picked : undefined

  return (
    <Stack gap={5}>
      <Field label="Component">
        <Select
          size="sm"
          value={component}
          onChange={(e) => onComponent(e.currentTarget.value)}
        >
          {blockNames.map((n) => (
            <option key={n} value={n}>
              {n}
              {spec.components?.[n] ? ' •' : ''}
            </option>
          ))}
        </Select>
      </Field>

      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Classes
        </Heading>
        <Text variant="p3" tone="muted">
          From <code>css/{info.stylesheet}.css</code>. In the kit, write the names without
          the prefix: <code>component({component})</code>.
        </Text>
        <Chips label="Root" items={[info.className]} />
        <Chips label="Parts" items={info.parts} />
        <Chips label="Modifiers" items={info.modifiers} />
        <Chips label="States" items={info.attributes} />
        <Chips label="Responsive" items={Object.keys(info.responsive)} />
        {live && <Chips label="Picked" items={live.classes} />}
      </Stack>

      {info.variables.length > 0 && (
        <Stack gap={2}>
          <Heading level={3} variant="h6">
            Variables
          </Heading>
          <Text variant="p3" tone="muted">
            {live
              ? 'Placeholders show the picked element’s computed values.'
              : 'Pick an element with Inspect to see current values.'}
          </Text>
          {info.variables.map((v) => {
            const path = [...base, 'vars', v.slice(prefix.length)]
            const value = getIn(spec, path) as SchemeValue | undefined
            const computed = live?.variables[v] ?? ''
            return typeof value === 'object' ? (
              <SchemeInput
                key={v}
                label={v}
                value={value}
                fallback={computed}
                onChange={(next) => set(path, next)}
              />
            ) : (
              <ValueRow
                key={v}
                label={v}
                value={value ?? ''}
                placeholder={computed}
                onChange={(next) => set(path, next)}
              />
            )
          })}
        </Stack>
      )}

      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Styles
        </Heading>
        <Field label="Target">
          <Select
            size="sm"
            value={current}
            onChange={(e) => setTarget(e.currentTarget.value)}
          >
            {targets.map((t) => (
              <option key={t} value={t}>
                {t === 'root'
                  ? `.${info.className}`
                  : t.startsWith('modifier:')
                    ? `.${info.className}--${t.slice(9)}`
                    : `.${info.className}-${t.slice(5)}`}
              </option>
            ))}
          </Select>
        </Field>
        <DeclarationsEditor
          label={current}
          value={getIn(spec, declPath) as Declarations | undefined}
          onChange={(next) => set(declPath, Object.keys(next).length ? next : undefined)}
        />
      </Stack>

      <Stack gap={2}>
        <Heading level={3} variant="h6">
          Motion
        </Heading>
        <Text variant="p3" tone="muted">
          A default for every {component}. An instance’s own <code>greese</code> entrance
          replaces it. Pure CSS; off under reduced motion.
        </Text>
        <div className="studio-row">
          <Text variant="p3" className="studio-row-label">
            enter
          </Text>
          <Select
            size="sm"
            aria-label="Entrance"
            value={get([...base, 'motion', 'enter'])}
            onChange={(e) => set([...base, 'motion', 'enter'], e.currentTarget.value)}
          >
            <option value="">None</option>
            {choices.enter.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </div>
        <div className="studio-row">
          <Text variant="p3" className="studio-row-label">
            exit (overlays)
          </Text>
          <Select
            size="sm"
            aria-label="Exit"
            value={get([...base, 'motion', 'exit'])}
            onChange={(e) => set([...base, 'motion', 'exit'], e.currentTarget.value)}
          >
            <option value="">Default</option>
            {choices.exit.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </div>
        {(
          [
            ['duration', '0.5s'],
            ['delay', '0s'],
            ['ease', 'out'],
            ['distance', '1rem'],
          ] as const
        ).map(([key, placeholder]) => (
          <ValueRow
            key={key}
            label={key}
            placeholder={placeholder}
            value={get([...base, 'motion', key])}
            onChange={(v) => set([...base, 'motion', key], v)}
          />
        ))}
        {(['fast', 'normal', 'slow'] as const).map((speed) => (
          <ValueRow
            key={speed}
            label={`transition ${speed}`}
            placeholder={`--greese-duration-${speed}`}
            value={get([...base, 'motion', 'durations', speed])}
            onChange={(v) => set([...base, 'motion', 'durations', speed], v)}
          />
        ))}
      </Stack>
    </Stack>
  )
}
