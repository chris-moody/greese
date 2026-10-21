import { useState, type JSX } from 'react'
import {
  Badge,
  Button,
  Code,
  Field,
  Heading,
  Stack,
  Text,
  TextField,
  Textarea,
} from '@greese/react'
import { GROUPS, type GreeseLab } from '../greeseLab.ts'

/** One effect: its name, state, Play, and its keyframes as editable code. */
const Effect = ({
  lab,
  name,
  custom,
}: {
  lab: GreeseLab
  name: string
  custom?: boolean
}): JSX.Element => {
  const edited = lab.isSet(name)
  const error = lab.errors[name]
  return (
    <Stack gap={2} className="studio-effect">
      <Stack direction="row" gap={2} align="center" wrap="wrap">
        <Code>{name}</Code>
        {error ? (
          <Badge tone="negative" variant="soft">
            Invalid
          </Badge>
        ) : (
          edited && (
            <Badge tone="primary" variant="soft">
              {custom ? 'New' : 'Edited'}
            </Badge>
          )
        )}
        <span className="studio-effect-actions">
          {edited && (
            <Button
              size="sm"
              variant="ghost"
              tone="neutral"
              onClick={() => lab.reset(name)}
            >
              {custom ? 'Delete' : 'Reset'}
            </Button>
          )}
          <Button size="sm" variant="soft" onClick={() => lab.play(name)}>
            Play
          </Button>
        </span>
      </Stack>
      <Field
        label={`${name} keyframes`}
        hideLabel
        error={
          error && `${error} The theme keeps the last valid code until this is fixed.`
        }
      >
        <Textarea
          className="studio-effect-code"
          rows={Math.max(2, lab.codeOf(name).split('\n').length)}
          spellCheck={false}
          value={lab.codeOf(name)}
          onChange={(e) => lab.edit(name, e.currentTarget.value)}
        />
      </Field>
      {custom && (
        <TextField
          size="sm"
          label="Duration (seconds)"
          description="Optional: how long it runs unless the instance says."
          type="number"
          min={0.05}
          step={0.05}
          defaultValue={lab.effects[name]?.duration ?? ''}
          onChange={(e) => {
            const seconds = parseFloat(e.currentTarget.value)
            lab.setDuration(name, Number.isFinite(seconds) ? seconds : undefined)
          }}
        />
      )}
    </Stack>
  )
}

/** The form that adds a new effect to the theme. */
const NewEffect = ({ lab }: { lab: GreeseLab }): JSX.Element => {
  const [name, setName] = useState('')
  const [code, setCode] = useState("{\n  opacity: [0, 1],\n  y: ['2rem', '0px'],\n}")
  const [error, setError] = useState<string>()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const problem = lab.add(name.trim(), code)
        setError(problem)
        if (!problem) {
          lab.play(name.trim())
          setName('')
        }
      }}
    >
      <Stack gap={3}>
        <TextField
          label="Name"
          description="camelCase, like spinIn. Use it by name in any greese prop."
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value)
            setError(undefined)
          }}
          spellCheck={false}
          autoComplete="off"
        />
        <Field label="Keyframes" error={error}>
          <Textarea
            className="studio-effect-code"
            rows={5}
            spellCheck={false}
            value={code}
            onChange={(e) => {
              setCode(e.currentTarget.value)
              setError(undefined)
            }}
          />
        </Field>
        <div>
          <Button type="submit" disabled={!name.trim()}>
            Add effect
          </Button>
        </div>
      </Stack>
    </form>
  )
}

/**
 * The theme's effects. Every built-in with the keyframes it plays, as code you
 * can retune; below, effects of your own. They're part of the theme: saving
 * writes them to the theme file, builds a retuned entrance preset's
 * `@keyframes` into the CSS, and generates a module that defines them for the
 * app (see the Code tab).
 */
export const GreesePanel = ({ lab }: { lab: GreeseLab }): JSX.Element => (
  <Stack gap={5}>
    <Text variant="p3" tone="muted">
      Each effect is plain keyframes: property → [from, to], or a list of frames. Edit the
      code and the theme changes with it, in the preview, on the pages and in what Save
      writes. Distances are shown at their default, <Code>1rem</Code>; Reset returns an
      effect to the library’s.
    </Text>
    <Stack gap={3}>
      <Heading level={3} variant="h6">
        Your effects
      </Heading>
      {lab.custom.map((name) => (
        <Effect key={name} lab={lab} name={name} custom />
      ))}
      {!lab.custom.length && (
        <Text variant="p3" tone="muted">
          None yet. Add one below, then use its name anywhere an effect goes:{' '}
          <Code>{'greese="fadeIn,spinIn"'}</Code>.
        </Text>
      )}
      <NewEffect lab={lab} />
    </Stack>
    {!lab.defaults && <Text tone="muted">Loading the effects…</Text>}
    {GROUPS.map(([title, match]) => {
      const names = lab.names.filter(match)
      if (!names.length) return null
      return (
        <Stack gap={3} key={title}>
          <Heading level={3} variant="h6">
            {title}
          </Heading>
          {names.map((name) => (
            <Effect key={name} lab={lab} name={name} />
          ))}
        </Stack>
      )
    })}
  </Stack>
)
