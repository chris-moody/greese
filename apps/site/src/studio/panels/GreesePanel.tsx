import type { JSX } from 'react'
import { Badge, Button, Code, Field, Heading, Stack, Text, Textarea } from '@greese/react'
import { GROUPS, type GreeseLab } from '../greeseLab.ts'

/**
 * Every built-in effect and the keyframes it plays, as code you can edit. An
 * edit changes what that effect does in the sequences the stage plays (here
 * only: the library's own effects stay as they are). To keep one in an app,
 * copy it into `defineGreeseEffect('name', { keyframes: … })` under a new name.
 */
export const GreesePanel = ({ lab }: { lab: GreeseLab }): JSX.Element => (
  <Stack gap={5}>
    <Text variant="p3" tone="muted">
      Each effect is plain keyframes: property → [from, to], or a list of frames. Edit the
      code and press Play; the stage on the right uses your version in any sequence that
      names it. Distances are shown at their default, <Code>1rem</Code>.
    </Text>
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
            <Stack gap={2} key={name} className="studio-effect">
              <Stack direction="row" gap={2} align="center" wrap="wrap">
                <Code>{name}</Code>
                {name in lab.edits && (
                  <Badge tone={lab.errors[name] ? 'negative' : 'primary'} variant="soft">
                    {lab.errors[name] ? 'Invalid' : 'Edited'}
                  </Badge>
                )}
                <span className="studio-effect-actions">
                  {name in lab.edits && (
                    <Button
                      size="sm"
                      variant="ghost"
                      tone="neutral"
                      onClick={() => lab.reset(name)}
                    >
                      Reset
                    </Button>
                  )}
                  <Button size="sm" variant="soft" onClick={() => lab.play(name)}>
                    Play
                  </Button>
                </span>
              </Stack>
              <Field label={`${name} keyframes`} hideLabel error={lab.errors[name]}>
                <Textarea
                  className="studio-effect-code"
                  rows={Math.max(2, lab.codeOf(name).split('\n').length)}
                  spellCheck={false}
                  value={lab.codeOf(name)}
                  onChange={(e) => lab.edit(name, e.currentTarget.value)}
                />
              </Field>
            </Stack>
          ))}
        </Stack>
      )
    })}
  </Stack>
)
