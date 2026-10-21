import type { JSX } from 'react'
import {
  Button,
  Card,
  Code,
  Heading,
  Stack,
  Text,
  TextField,
  type GreeseProp,
} from '@greese/react'
import { EXAMPLES, type GreeseLab } from './greeseLab.ts'

/**
 * The Greese tab's main area: type a sequence, play it, replay it. The card on
 * the stage wears it, so you see exactly what `greese="…"` does.
 */
export const GreeseStage = ({ lab }: { lab: GreeseLab }): JSX.Element => {
  const bad = lab.unknown.length > 0
  return (
    <div className="studio-stage">
      <Stack gap={4} className="studio-stage-controls">
        <Heading level={2} variant="h5">
          Compose a sequence
        </Heading>
        <Text tone="muted" variant="p3">
          <Code>+</Code> plays effects together, <Code>,</Code> starts the next group, a
          number pauses, in seconds, and a negative one (<Code>-0.2</Code>) overlaps the
          next effect with the last.
        </Text>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!bad) lab.play()
          }}
        >
          <Stack gap={3}>
            <TextField
              label="Sequence"
              value={lab.sequence}
              onChange={(e) => lab.setSequence(e.currentTarget.value)}
              error={bad ? `Not an effect: ${lab.unknown.join(', ')}` : undefined}
              spellCheck={false}
              autoComplete="off"
            />
            <Stack direction="row" gap={2} wrap="wrap">
              <Button type="submit" disabled={bad}>
                {lab.played.key === 0 ? 'Play' : 'Replay'}
              </Button>
              {EXAMPLES.map((example) => (
                <Button
                  key={example}
                  variant="soft"
                  tone="neutral"
                  onClick={() => lab.play(example)}
                >
                  {example}
                </Button>
              ))}
            </Stack>
          </Stack>
        </form>
      </Stack>
      <Card padding={5} variant="filled" className="site-stage studio-stage-card">
        <Stack gap={4} align="center" justify="center" className="site-stage-inner">
          <Card
            key={lab.played.key}
            variant="elevated"
            padding={5}
            className="site-stage-target"
            // The sequence is checked against the effect names before it plays.
            greese={lab.played.shown as GreeseProp}
          >
            <Text weight="semibold">greese</Text>
          </Card>
          <Code className="site-stage-code">{`<Card greese="${lab.played.sequence}" />`}</Code>
        </Stack>
      </Card>
    </div>
  )
}
