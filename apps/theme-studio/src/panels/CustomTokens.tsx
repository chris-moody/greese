import { useState, type JSX } from 'react'
import { Button, Stack, Text, TextField } from '@greese/react'
import { scalarTokens } from '@greese/ui'
import { getIn, setIn } from '../edit.ts'
import { SchemeInput, ValueRow } from '../fields.tsx'
import type { RenderedColors } from '../protocol.ts'
import { isCustomToken, type SchemeValue, type ThemeSpec } from '../spec.ts'

const kebab = (value: string): string =>
  value.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)

const NAME = /^[a-z0-9][a-z0-9-]*$/

/** What a new token starts as: the group's last value, so it's valid there. */
const starter = (group: string): SchemeValue => {
  if (group === 'color') return { light: '#6b7280', dark: '#9ca3af' }
  const values = Object.entries(scalarTokens).find(([g]) => kebab(g) === group)?.[1]
  return Object.values(values ?? {}).at(-1) ?? '0'
}

/**
 * The tokens a theme adds to one group, and a row to add another. A new token
 * becomes `--greese-<group>-<name>` (the kit's `$extend`): it can't share a
 * name with one the system has, and it's a variable to use in CSS and in
 * component overrides.
 */
export const CustomTokens = ({
  spec,
  onChange,
  group,
  rendered,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  /** Kebab-case group: `color`, `radius`, `font-size`… */
  group: string
  rendered?: RenderedColors
}): JSX.Element => {
  const [draft, setDraft] = useState('')
  const [problem, setProblem] = useState<string>()
  const own = Object.entries(spec.tokens?.[group] ?? {}).filter(([key]) =>
    isCustomToken(group, key)
  )

  const add = () => {
    const key = draft.trim().toLowerCase()
    if (!key) return
    if (!NAME.test(key)) return setProblem('Use lower-case letters, digits and -.')
    const exists = !isCustomToken(group, key) || own.some(([k]) => k === key)
    if (exists) return setProblem(`${group}-${key} already exists.`)
    onChange(setIn(spec, ['tokens', group, key], starter(group)))
    setDraft('')
    setProblem(undefined)
  }

  return (
    <Stack gap={2}>
      {own.length > 0 && (
        <Text size="sm" weight="semibold" tone="muted">
          Added to {group}
        </Text>
      )}
      {own.map(([key, value]) => {
        const path = ['tokens', group, key]
        const remove = (
          <Button
            size="sm"
            variant="ghost"
            tone="neutral"
            aria-label={`Remove ${group}-${key}`}
            onClick={() => onChange(setIn(spec, path, undefined))}
          >
            Remove
          </Button>
        )
        return group === 'color' ? (
          <Stack key={key} gap={1}>
            <SchemeInput
              label={`${group}-${key}`}
              color
              value={getIn(spec, path) as SchemeValue | undefined}
              fallback={typeof value === 'string' ? value : value.light}
              rendered={
                rendered?.light[key] && rendered.dark[key]
                  ? { light: rendered.light[key], dark: rendered.dark[key] }
                  : undefined
              }
              onChange={(v) => onChange(setIn(spec, path, v))}
            />
            <div>{remove}</div>
          </Stack>
        ) : (
          <Stack key={key} gap={1}>
            <ValueRow
              label={`${group}-${key}`}
              value={typeof value === 'string' ? value : value.light}
              onChange={(v) => onChange(setIn(spec, path, v))}
            />
            <div>{remove}</div>
          </Stack>
        )
      })}
      <form
        className="studio-add"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <TextField
          label={`Add a ${group} token`}
          hideLabel
          size="sm"
          placeholder={`Add a ${group} token: name`}
          value={draft}
          spellCheck={false}
          error={problem}
          onChange={(e) => {
            setDraft(e.currentTarget.value)
            setProblem(undefined)
          }}
        />
        <Button size="sm" variant="soft" type="submit">
          Add
        </Button>
      </form>
    </Stack>
  )
}
