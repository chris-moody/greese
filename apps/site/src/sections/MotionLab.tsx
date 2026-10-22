import { useRef, useState, type JSX } from 'react'
import {
  Button,
  Card,
  Code,
  Grid,
  Heading,
  Slider,
  Stack,
  Text,
  TextField,
  useGreese,
  type GreeseProp,
} from '@greese/react'
import { effectNames, endsHidden, parseSequence } from '@greese/ui'
import { Section } from '../Section.tsx'

/** Every effect a sequence can name here: the built-ins plus src/effects.ts. */
const EFFECTS: string[] = [...effectNames, 'wobble']

/** Effects that hide the element: valid in a typed sequence, never offered in one tap. */
const LEAVING = new Set<string>(effectNames.filter(endsHidden))

/**
 * The examples reveal, then only add emphasis: nothing hides the card right
 * after it appears just to bring it back.
 */
const EXAMPLES = [
  'fadeIn+scaleIn,+1,wobble',
  'slideUp,-0.2,pop,rise+glow',
  'fadeStart+blurIn,+0.4,pop',
]

/** Names in a sequence that aren't effects (numbers are pauses). */
const unknown = (sequence: string): string[] =>
  parseSequence(sequence)
    .flatMap((step) => (typeof step === 'number' ? [] : step.map((call) => call.name)))
    .filter((name) => !EFFECTS.includes(name))

const Lab = (): JSX.Element => {
  const [sequence, setSequence] = useState(EXAMPLES[0]!)
  const [played, setPlayed] = useState({ key: 0, sequence: EXAMPLES[0]! })
  const bad = unknown(sequence)
  const play = (next = sequence) => {
    setSequence(next)
    setPlayed((p) => ({ key: p.key + 1, sequence: next }))
  }
  return (
    <Grid container columns={{ xs: 1, md: 2 }} gap={5} align="stretch">
      <Card padding={5} greese={{ inView: 'fadeStart' }}>
        <Stack gap={4}>
          <Heading level={3} variant="h5">
            Compose a sequence
          </Heading>
          <Text tone="muted">
            <Code>+</Code> plays effects together, <Code>,</Code> starts the next group, a
            number pauses, in seconds, and a negative one (<Code>-0.2</Code>) overlaps the
            next effect with the last.
          </Text>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!bad.length) play()
            }}
          >
            <Stack gap={3}>
              <TextField
                label="Sequence"
                value={sequence}
                onChange={(e) => setSequence(e.currentTarget.value)}
                error={bad.length ? `Not an effect: ${bad.join(', ')}` : undefined}
                spellCheck={false}
                autoComplete="off"
                greese={{ focus: 'glow' }}
              />
              <Stack direction="row" gap={2} wrap="wrap">
                <Button
                  type="submit"
                  disabled={bad.length > 0}
                  greese={{ hover: 'rise', press: 'squish' }}
                >
                  Play
                </Button>
                {EXAMPLES.slice(1).map((ex) => (
                  <Button
                    key={ex}
                    variant="soft"
                    tone="neutral"
                    onClick={() => play(ex)}
                    greese={{ hover: 'rise', press: 'squish' }}
                  >
                    {ex}
                  </Button>
                ))}
              </Stack>
            </Stack>
          </form>
          <Stack
            direction="row"
            gap={2}
            wrap="wrap"
            aria-label="Play one effect"
            role="group"
            greese={{ inView: 'fadeIn', stagger: 0.02 }}
          >
            {EFFECTS.filter((name) => !LEAVING.has(name)).map((name) => (
              <Button
                key={name}
                size="sm"
                variant="soft"
                tone="neutral"
                onClick={() => play(name)}
                greese={{ hover: 'rise', press: 'squish' }}
              >
                {name}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Card>
      <Card
        padding={5}
        variant="filled"
        className="site-stage"
        greese={{ inView: 'fadeEnd' }}
      >
        <Stack gap={4} align="center" justify="center" className="site-stage-inner">
          <Card
            key={played.key}
            variant="elevated"
            padding={5}
            className="site-stage-target"
            // Typed input is checked against EFFECTS above before it plays.
            greese={played.sequence as GreeseProp}
          >
            <Text weight="semibold">greese</Text>
          </Card>
          <Code className="site-stage-code">{`<Card greese="${played.sequence}" />`}</Code>
        </Stack>
      </Card>
    </Grid>
  )
}

const Interactions = (): JSX.Element => (
  <Card padding={5} greese={{ inView: 'fadeUp' }}>
    <Stack gap={4}>
      <Heading level={3} variant="h5">
        Hover, press and focus
      </Heading>
      <Text tone="muted">
        Interruptible: they play forward and reverse from wherever they are.
      </Text>
      <Stack direction="row" gap={2} wrap="wrap">
        <Button greese={{ hover: 'rise', press: 'squish' }}>rise + squish</Button>
        <Button variant="outline" greese={{ hover: 'tilt' }}>
          tilt
        </Button>
        <Button variant="soft" greese={{ hover: 'glow', focus: 'rise' }}>
          glow
        </Button>
        <Button variant="ghost" greese={{ hover: 'wobble', duration: 0.4 }}>
          wobble
        </Button>
      </Stack>
    </Stack>
  </Card>
)

const TextEffects = (): JSX.Element => (
  <Card padding={5} greese={{ inView: 'fadeUp', delay: 0.1 }}>
    <Stack gap={3}>
      <Heading level={3} variant="h5" greese={{ text: 'split', inView: 'fadeIn' }}>
        Split, typed and counted
      </Heading>
      <Text greese={{ text: 'type', inView: 'fadeIn' }}>
        Screen readers hear this once, while it types on.
      </Text>
      <Text
        variant="h2"
        weight="bold"
        greese={{ text: 'count', inView: 'fadeIn', duration: 1.6 }}
      >
        12480
      </Text>
    </Stack>
  </Card>
)

/** useGreese: state drives the animation; each change continues from where it is. */
const Follow = (): JSX.Element => {
  const [x, setX] = useState(40)
  const track = useRef<HTMLDivElement>(null)
  const puck = useRef<HTMLDivElement>(null)
  useGreese(
    (g) => {
      // The puck sits inset by its own offset on both sides of the track.
      const inset = (puck.current?.offsetLeft ?? 0) * 2
      const width =
        (track.current?.clientWidth ?? 0) - (puck.current?.offsetWidth ?? 0) - inset
      g.timeline().to(puck.current, {
        x: (width * x) / 100,
        duration: 0.6,
        ease: 'power3.out',
      })
    },
    [x]
  )
  return (
    <Card padding={5} greese={{ inView: 'fadeUp', delay: 0.2 }}>
      <Stack gap={4}>
        <Heading level={3} variant="h5">
          useGreese
        </Heading>
        <Text tone="muted">
          Dependencies re-run it, and everything it made reverts on unmount.
        </Text>
        <div ref={track} className="site-track">
          <div ref={puck} className="site-puck" />
        </div>
        <Slider
          aria-label="Position"
          value={x}
          onValueChange={setX}
          greese={{ focus: 'glow' }}
        />
      </Stack>
    </Card>
  )
}

/** Scopes: the parent orders the entrances inside it, however deep. */
const Scopes = (): JSX.Element => {
  const [gap, setGap] = useState(30)
  const [run, setRun] = useState(0)
  const stagger = Math.round((gap / 100) * 40) / 100
  return (
    <Card padding={5} greese={{ inView: 'fadeUp' }}>
      <Grid container columns={{ xs: 1, md: 2 }} gap={5} align="center">
        <Stack gap={4}>
          <Heading level={3} variant="h5">
            Scopes: one parent, one sequence
          </Heading>
          <Text tone="muted">
            A <Code>scope</Code> orders every entrance inside it, at any depth, in
            document order. Each piece says only how it enters; the parent says when. A
            scope inside a scope takes one place in the outer one.
          </Text>
          <Slider
            aria-label={`Stagger: ${stagger} seconds`}
            value={gap}
            onValueChange={setGap}
            greese={{ focus: 'glow' }}
          />
          <Text variant="caption" tone="muted">
            stagger {stagger}s
          </Text>
          <Code block>{`<Stack greese={{ scope: { stagger: ${stagger} } }}>
  <Heading greese={{ enter: 'fadeUp' }}>…</Heading>
  <Grid greese={{ scope: { stagger: ${Math.round(stagger * 50) / 100} } }}>
    <Card greese={{ enter: 'scaleIn' }}>…</Card>
  </Grid>
</Stack>`}</Code>
          <div>
            <Button
              variant="soft"
              onClick={() => setRun((n) => n + 1)}
              greese={{ hover: 'rise', press: 'squish' }}
            >
              Replay
            </Button>
          </div>
        </Stack>
        <Stack
          gap={3}
          className="site-scope-demo"
          greese={{
            scope: { stagger, delay: 0.05, inView: true, replay: `${run}-${stagger}` },
          }}
        >
          <Heading level={4} variant="h5" greese={{ enter: 'fadeUp' }}>
            Launch week
          </Heading>
          <Text variant="p3" tone="muted" greese={{ enter: 'fadeUp' }}>
            Three things to try, in order.
          </Text>
          <Grid
            container
            columns={3}
            gap={3}
            greese={{ scope: { stagger: Math.round(stagger * 50) / 100 } }}
          >
            {['Design', 'Build', 'Ship'].map((step) => (
              <Card key={step} padding={4} greese={{ enter: 'scaleIn' }}>
                <Text variant="s2" greese={{ enter: 'fadeIn' }}>
                  {step}
                </Text>
              </Card>
            ))}
          </Grid>
          <Button greese={{ enter: 'pop' }} style={{ alignSelf: 'start' }}>
            Continue
          </Button>
        </Stack>
      </Grid>
    </Card>
  )
}

export const MotionLab = (): JSX.Element => (
  <Section
    id="motion"
    eyebrow="Motion"
    title="One prop animates anything"
    intro={
      <>
        Every component takes <Code>greese</Code>: a preset that stays pure CSS, a
        composed sequence, your own effects, or a full greese.js timeline. Reduced motion
        is respected throughout.
      </>
    }
  >
    <Lab />
    <Scopes />
    <Grid container columns={{ xs: 1, md: 3 }} gap={4}>
      <Interactions />
      <TextEffects />
      <Follow />
    </Grid>
  </Section>
)
