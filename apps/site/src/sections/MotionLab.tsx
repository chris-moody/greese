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
import { Section } from '../Section.tsx'

/** Every effect a sequence can name here: the built-ins plus src/effects.ts. */
const EFFECTS = [
  'fadeIn',
  'fadeUp',
  'fadeDown',
  'fadeStart',
  'fadeEnd',
  'scaleIn',
  'blurIn',
  'slideUp',
  'pop',
  'fadeOut',
  'fadeOutUp',
  'fadeOutDown',
  'scaleOut',
  'blurOut',
  'lift',
  'squish',
  'tilt',
  'glow',
  'wobble',
  'rise',
  'float',
]

/** Effects that hide the element: valid in a typed sequence, never offered in one tap. */
const LEAVING = new Set(['fadeOut', 'fadeOutUp', 'fadeOutDown', 'scaleOut', 'blurOut'])

/**
 * The examples reveal, then only add emphasis: nothing hides the card right
 * after it appears just to bring it back.
 */
const EXAMPLES = [
  'fadeIn+scaleIn,+1,wobble',
  'fadeStart+blurIn,pop',
  'rise,+0.4,lift+glow',
]

/** Names in a sequence that aren't effects (numbers are pauses). */
const unknown = (sequence: string): string[] =>
  sequence
    .split(/[,+]/)
    .map((s) => s.trim())
    .filter((s) => s && !/^\d*\.?\d+$/.test(s) && !EFFECTS.includes(s))

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
            <Code>+</Code> plays effects together, <Code>,</Code> starts the next group,
            and a number pauses, in seconds.
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
                  greese={{ hover: 'lift', press: 'squish' }}
                >
                  Play
                </Button>
                {EXAMPLES.slice(1).map((ex) => (
                  <Button
                    key={ex}
                    variant="soft"
                    tone="neutral"
                    onClick={() => play(ex)}
                    greese={{ hover: 'lift', press: 'squish' }}
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
                greese={{ hover: 'float', press: 'squish' }}
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
        <Button greese={{ hover: 'lift', press: 'squish' }}>lift + squish</Button>
        <Button variant="outline" greese={{ hover: 'tilt' }}>
          tilt
        </Button>
        <Button variant="soft" greese={{ hover: 'glow', focus: 'lift' }}>
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
    <Grid container columns={{ xs: 1, md: 3 }} gap={4}>
      <Interactions />
      <TextEffects />
      <Follow />
    </Grid>
  </Section>
)
