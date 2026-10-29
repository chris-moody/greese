import { useEffect, useState, type JSX } from 'react'
import {
  Button,
  Card,
  Code,
  Heading,
  PageTransition,
  Stack,
  Text,
  TextField,
  usePageNavigate,
  type GreeseProp,
} from '@greese/react'
import { EXAMPLES, type GreeseLab } from './greeseLab.ts'
import { pageRoleVars, pageRules } from './pagePreview.ts'
import type { ThemeSpec } from './spec.ts'

const PAGES = [
  { title: 'Overview', body: 'Where you start: the page that leaves.' },
  { title: 'Details', body: 'One step deeper: the page that arrives.' },
  { title: 'Settings', body: 'Another step: back plays the back roles.' },
] as const

/**
 * The theme's page transitions, played here: its page roles (set on the
 * editor's root while this is shown, since snapshots inherit from the root)
 * and its rules for parts of a page. Three pages on one URL, so each change
 * names its own direction.
 */
const StagePages = ({ spec }: { spec: ThemeSpec }): JSX.Element => {
  const [at, setAt] = useState(0)
  const page = usePageNavigate((to) => {
    if (typeof to === 'string') setAt(Number(to.slice(1)))
  })
  const vars = JSON.stringify(pageRoleVars(spec))
  useEffect(() => {
    const root = document.documentElement.style
    const set = Object.entries(JSON.parse(vars) as Record<string, string>)
    for (const [name, value] of set) root.setProperty(name, value)
    return () => set.forEach(([name]) => root.removeProperty(name))
  }, [vars])
  const go = (to: number) =>
    page.navigate(`#${to}`, {
      types: ['greese-page', to < at ? 'greese-back' : 'greese-forward'],
    })
  const current = PAGES[at]!
  return (
    <Stack gap={3} className="studio-stage-pages">
      <Heading level={2} variant="h5">
        Change pages
      </Heading>
      <PageTransition rules={pageRules(spec)}>
        <Card padding={5} variant="elevated">
          <Stack gap={2}>
            <Text weight="semibold">{current.title}</Text>
            <Text variant="p3" tone="muted">
              {current.body}
            </Text>
          </Stack>
        </Card>
      </PageTransition>
      <Stack direction="row" gap={2}>
        <Button size="sm" variant="soft" disabled={at === 0} onClick={() => go(at - 1)}>
          Back
        </Button>
        <Button size="sm" disabled={at === PAGES.length - 1} onClick={() => go(at + 1)}>
          Next
        </Button>
      </Stack>
    </Stack>
  )
}

/**
 * The Motion tab's main area: type a sequence, play it, replay it. The card on
 * the stage wears it, so you see exactly what `greese="…"` does.
 */
export const GreeseStage = ({
  lab,
  spec,
}: {
  lab: GreeseLab
  /** The theme being edited: its page transitions play on the stage. */
  spec: ThemeSpec
}): JSX.Element => {
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
            greese={lab.played.sequence as GreeseProp}
          >
            <Text weight="semibold">greese</Text>
          </Card>
          <Code className="site-stage-code">{`<Card greese="${lab.played.sequence}" />`}</Code>
        </Stack>
      </Card>
      <StagePages spec={spec} />
    </div>
  )
}
