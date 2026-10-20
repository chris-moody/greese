import { useState, type JSX } from 'react'
import { Alert, Button, Stack, Text, TextField } from '@greese/react'
import { breakpoints as defaults } from '@greese/ui'
import { ValueRow } from '../fields.tsx'
import { breakpointsOf, type ThemeSpec } from '../spec.ts'

const BUILT_IN = Object.keys(defaults)

/** The spec with these breakpoints; the defaults themselves are no setting. */
const withBreakpoints = (spec: ThemeSpec, list: Array<[string, number]>): ThemeSpec => {
  const standard = Object.entries(defaults)
  const same =
    list.length === standard.length &&
    list.every(([key, width]) => defaults[key as keyof typeof defaults] === width)
  const { breakpoints: _old, ...rest } = spec
  return same ? rest : { ...rest, breakpoints: Object.fromEntries(list) }
}

/**
 * The breakpoints the stylesheet is built with. Media queries can't read
 * variables, so a change rebuilds the whole stylesheet (a few seconds in the
 * browser); the preview uses the result, and so does the generated file. Keys
 * can be added: each gets responsive classes and `--greese-breakpoint-<key>`.
 */
export const BreakpointsSection = ({
  spec,
  onChange,
  building,
}: {
  spec: ThemeSpec
  onChange: (spec: ThemeSpec) => void
  building: boolean
}): JSX.Element => {
  const list = breakpointsOf(spec)
  const [key, setKey] = useState('')
  const [width, setWidth] = useState('')
  const [problem, setProblem] = useState<string>()

  const add = () => {
    const name = key.trim().toLowerCase()
    if (!name) return
    if (!/^[a-z0-9]+$/.test(name)) return setProblem('One word: letters and digits.')
    if (list.some(([k]) => k === name)) return setProblem(`${name} already exists.`)
    const px = Number(width)
    if (!Number.isInteger(px) || px <= 0) return setProblem('A width in px, above 0.')
    if (list.some(([, w]) => w === px)) return setProblem(`${px}px is taken.`)
    onChange(withBreakpoints(spec, [...list, [name, px]]))
    setKey('')
    setWidth('')
    setProblem(undefined)
  }

  return (
    <Stack gap={2}>
      <Text variant="p3" tone="muted">
        Media queries can&apos;t read variables, so changing a breakpoint rebuilds the
        whole stylesheet with it. Each key, added ones too, gets responsive classes (
        <code className="studio-mono">gap=&#123;&#123; tablet: 3 &#125;&#125;</code>) and
        a custom property,{' '}
        <code className="studio-mono">--greese-breakpoint-&lt;key&gt;</code>. The built-in
        keys stay; use a new key to add one.
      </Text>
      {building && (
        <Alert tone="info" title="Rebuilding the stylesheet…">
          The preview updates when it&apos;s done.
        </Alert>
      )}
      {list.map(([k, w]) => (
        <Stack key={k} gap={1}>
          {k === 'xs' ? (
            <div className="studio-row">
              <Text variant="p3" className="studio-row-label">
                breakpoint-xs
              </Text>
              <code className="studio-mono">0px</code>
            </div>
          ) : (
            <ValueRow
              label={`breakpoint-${k}`}
              value={String(w)}
              onChange={(v) => {
                if (!/^\d+$/.test(v)) return
                onChange(
                  withBreakpoints(
                    spec,
                    list.map(([name, px]) => [name, name === k ? Number(v) : px])
                  )
                )
              }}
            />
          )}
          {!BUILT_IN.includes(k) && (
            <div>
              <Button
                size="sm"
                variant="ghost"
                tone="neutral"
                aria-label={`Remove breakpoint-${k}`}
                onClick={() =>
                  onChange(
                    withBreakpoints(
                      spec,
                      list.filter(([name]) => name !== k)
                    )
                  )
                }
              >
                Remove
              </Button>
            </div>
          )}
        </Stack>
      ))}
      <form
        className="studio-add"
        onSubmit={(e) => {
          e.preventDefault()
          add()
        }}
      >
        <TextField
          label="New breakpoint name"
          hideLabel
          size="sm"
          placeholder="Add a breakpoint: name"
          value={key}
          spellCheck={false}
          error={problem}
          onChange={(e) => {
            setKey(e.currentTarget.value)
            setProblem(undefined)
          }}
        />
        <TextField
          label="New breakpoint width"
          hideLabel
          size="sm"
          placeholder="px"
          inputMode="numeric"
          value={width}
          onChange={(e) => setWidth(e.currentTarget.value)}
        />
        <Button size="sm" variant="soft" type="submit">
          Add
        </Button>
      </form>
    </Stack>
  )
}
