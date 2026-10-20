import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  Card,
  Dialog,
  Grid,
  Heading,
  Motion,
  Stack,
  Text,
  defineGreeseEffect,
  type GreeseProp,
  type GreesePreset,
} from '@greese/react'
import { art } from '../_shared/fixtures.tsx'

/** Remounts its children so entrances can be watched again. */
const Replay = ({ children }: { children: ReactNode }) => {
  const [key, setKey] = useState(0)
  return (
    <Stack gap={4}>
      <div>
        <Button
          size="sm"
          variant="outline"
          tone="neutral"
          onClick={() => setKey((k) => k + 1)}
        >
          Replay
        </Button>
      </div>
      <div key={key}>{children}</div>
    </Stack>
  )
}

/**
 * Mounts its child without motion, then with it on each click: for effects
 * that end hidden, so the story's resting state stays the same.
 */
const PlayOnClick = ({
  greese,
  children,
}: {
  greese: GreeseProp
  children: (greese: GreeseProp | undefined) => ReactNode
}) => {
  const [key, setKey] = useState(0)
  return (
    <Stack gap={4}>
      <div>
        <Button
          size="sm"
          variant="outline"
          tone="neutral"
          onClick={() => setKey((k) => k + 1)}
        >
          Play
        </Button>
      </div>
      <div key={key}>{children(key ? greese : undefined)}</div>
    </Stack>
  )
}

// Custom effects: define them once, in client code, then use them by name.
// The augmentation makes the names type-check and autocomplete.
declare module '@greese/react' {
  interface GreeseEffectRegistry {
    wobble: true
    rise: true
    spin: true
  }
}

defineGreeseEffect('wobble', {
  keyframes: { rotate: [0, -6, 6, -3, 0] },
  duration: 0.6,
})
defineGreeseEffect('rise', ({ distance }) => ({
  y: [`calc(${distance} * 3)`, '0rem'],
  opacity: [0, 1],
}))
defineGreeseEffect('spin', {
  keyframes: { rotate: [0, 360] },
  duration: 0.8,
  ease: 'inOut',
})

const meta = {
  title: 'Motion/greese prop',
  component: Motion,
  args: { greese: 'fadeUp', children: 'Any element, animated with the greese prop' },
  argTypes: {
    greese: {
      control: 'select',
      options: [
        'fadeIn',
        'fadeUp',
        'fadeDown',
        'fadeStart',
        'fadeEnd',
        'scaleIn',
        'blurIn',
        'slideUp',
        'pop',
        'fadeIn+scaleIn',
        'fadeUp,wobble',
        'rise,+0.3,spin',
      ],
    },
  },
  render: (args) => (
    <Replay>
      <Motion
        {...args}
        style={{ padding: '1rem', border: '1px solid var(--greese-color-border)' }}
      />
    </Replay>
  ),
} satisfies Meta<typeof Motion>
export default meta

type Story = StoryObj<typeof meta>

/** `<Motion>` gives any element the prop; every GreeseUI component has it already. */
export const Playground: Story = {}

const presets: GreesePreset[] = [
  'fadeIn',
  'fadeUp',
  'fadeDown',
  'fadeStart',
  'fadeEnd',
  'scaleIn',
  'blurIn',
  'slideUp',
  'pop',
]

/** Entrance presets played alone are pure CSS: they render on the server and need no JavaScript. */
export const Presets: Story = {
  render: () => (
    <Replay>
      <Grid container minChildWidth="10rem" gap={3}>
        {presets.map((preset, i) => (
          <Card key={preset} greese={{ enter: preset, delay: i * 0.05, duration: 0.6 }}>
            <Text weight="semibold">{preset}</Text>
          </Card>
        ))}
      </Grid>
    </Replay>
  ),
}

/** `stagger` animates the children one after another. */
export const Stagger: Story = {
  render: () => (
    <Replay>
      <Stack gap={2} greese={{ enter: 'fadeStart', stagger: 0.06, distance: '2rem' }}>
        {['Design', 'Build', 'Test', 'Ship', 'Celebrate'].map((step) => (
          <Card key={step} variant="filled">
            {step}
          </Card>
        ))}
      </Stack>
    </Replay>
  ),
}

/**
 * A `scope` orders the entrances inside it, at any depth: each member starts
 * `stagger` seconds after the one before it in the page, and a scope inside a
 * scope takes one place in the outer one.
 */
export const Scope: Story = {
  render: () => (
    <Replay>
      <Stack gap={3} greese={{ scope: { stagger: 0.12, delay: 0.1 } }}>
        <Heading level={2} greese={{ enter: 'fadeUp' }}>
          A section that plays in order
        </Heading>
        <Text greese={{ enter: 'fadeUp' }}>
          Each piece declares only its own entrance; the section decides when it starts.
        </Text>
        <Grid
          container
          columns={{ xs: 1, md: 3 }}
          gap={3}
          greese={{ scope: { stagger: 0.06 } }}
        >
          {['One', 'Two', 'Three'].map((n) => (
            <Card key={n} greese={{ enter: 'scaleIn' }}>
              <Stack gap={1}>
                <Heading level={3} variant="h6" greese={{ enter: 'fadeIn' }}>
                  Card {n}
                </Heading>
                <Text variant="p3" tone="muted" greese={{ enter: 'fadeIn' }}>
                  Starts after the card above it.
                </Text>
              </Stack>
            </Card>
          ))}
        </Grid>
        <Button greese={{ enter: 'pop' }}>Get started</Button>
      </Stack>
    </Replay>
  ),
}

/** `inView` waits until each card scrolls into view. Scroll down. */
export const ScrollReveal: Story = {
  render: () => (
    <Stack gap={4}>
      <Text tone="muted">Scroll down: cards out of view reveal as they arrive.</Text>
      <div style={{ blockSize: '70vh' }} />
      {[1, 2, 3, 4].map((n) => (
        <Card key={n} greese={{ inView: n % 2 ? 'fadeUp' : 'scaleIn' }}>
          <Heading level={3} variant="h6">
            Card {n}
          </Heading>
        </Card>
      ))}
    </Stack>
  ),
}

/**
 * Compose effects in one string: `+` plays effects together, `,` starts the
 * next group when the previous one ends, and a number is a pause in seconds.
 * Sequences run in greese.js. Under reduced motion each effect is a cut, but
 * pauses still wait.
 */
export const Sequences: Story = {
  render: () => (
    <Grid container minChildWidth="14rem" gap={3}>
      {(
        [
          ['fadeIn+scaleIn', 'Together'],
          ['fadeStart,pop', 'One after the other'],
          ['blurIn,+0.4,pop', 'With a pause'],
        ] as const
      ).map(([sequence, label]) => (
        <Replay key={sequence}>
          <Card greese={sequence}>
            <Text weight="semibold">{label}</Text>
            <Text tone="muted" variant="p3">
              <code>{sequence}</code>
            </Text>
          </Card>
        </Replay>
      ))}
    </Grid>
  ),
}

/** `'fadeIn+scaleIn,+2,fadeOut'`: in together, wait two seconds, fade out (and stay out). */
export const InWaitOut: Story = {
  name: 'In, wait, out',
  render: () => (
    <PlayOnClick greese="fadeIn+scaleIn,+2,fadeOut">
      {(greese) => (
        <Card greese={greese}>
          <Text weight="semibold">Saved</Text>
          <Text tone="muted" variant="p3">
            <code>fadeIn+scaleIn,+2,fadeOut</code>
          </Text>
        </Card>
      )}
    </PlayOnClick>
  ),
}

/** The leaving effects, for sequences: `fadeOut`, `fadeOutUp`, `fadeOutDown`, `scaleOut`, `blurOut`. */
export const LeavingEffects: Story = {
  render: () => (
    <PlayOnClick greese="fadeIn">
      {(played) => (
        <Grid container minChildWidth="10rem" gap={3}>
          {(['fadeOut', 'fadeOutUp', 'fadeOutDown', 'scaleOut', 'blurOut'] as const).map(
            (effect) => (
              <Card key={effect} greese={played && `+0.3,${effect}`}>
                <Text weight="semibold">{effect}</Text>
              </Card>
            )
          )}
        </Grid>
      )}
    </PlayOnClick>
  ),
}

/**
 * `defineGreeseEffect(name, effect)` adds your own effects: keyframes, a
 * function of `{ el, distance, rtl }` returning keyframes, or
 * `{ keyframes, duration, ease }` with defaults the prop's options override.
 * Names are strings, so Server Components can use them too; define them in
 * client code. This file defines `wobble`, `rise` and `spin`.
 */
export const CustomEffects: Story = {
  render: () => (
    <Stack direction="row" gap={3} wrap="wrap" align="center">
      <Replay>
        <Card greese="fadeUp,wobble">
          <code>fadeUp,wobble</code>
        </Card>
      </Replay>
      <Replay>
        <Card greese={{ enter: 'rise', distance: '1.5rem' }}>
          <code>rise</code>
        </Card>
      </Replay>
      <Replay>
        <Card greese="rise,+0.3,spin">
          <code>rise,+0.3,spin</code>
        </Card>
      </Replay>
      <Button greese={{ hover: 'wobble', duration: 0.4 }}>Hover: wobble</Button>
    </Stack>
  ),
}

/** Hover (mouse and pen only), press and focus play and reverse; interrupt them mid-way. */
export const Interactions: Story = {
  render: () => (
    <Stack direction="row" gap={3} wrap="wrap" align="center">
      <Button greese={{ hover: 'lift', press: 'squish' }}>Lift + squish</Button>
      <Button variant="outline" greese={{ hover: 'tilt' }}>
        Tilt
      </Button>
      <Button variant="soft" greese={{ hover: 'glow', focus: 'lift' }}>
        Glow (focus lifts)
      </Button>
      <Card
        interactive
        greese={{
          hover: {
            y: [0, -6],
            boxShadow: ['0 0 0 transparent', '0 12px 24px rgb(0 0 0 / 0.18)'],
          },
        }}
      >
        Custom keyframes
      </Card>
    </Stack>
  ),
}

/** Text effects animate a hidden copy; screen readers read the real text once. */
export const TextEffects: Story = {
  render: () => (
    <Replay>
      <Stack gap={3}>
        <Heading level={2} greese={{ text: 'split' }}>
          Served fast, everywhere
        </Heading>
        <Text variant="s2" greese={{ text: 'type' }}>
          Typed on, one letter at a time.
        </Text>
        <Stack direction="row" gap={2} align="center">
          <Text variant="h3" weight="bold" greese={{ text: 'count', duration: 1.5 }}>
            12480
          </Text>
          <Badge tone="positive">orders</Badge>
        </Stack>
      </Stack>
    </Replay>
  ),
}

/** Overlays play `enter` each time they open and restyle their exit with `exit`. */
export const Overlays: Story = {
  render: () => (
    <Dialog
      trigger={<Button>Open</Button>}
      title="Pop in, scale out"
      greese={{ enter: 'pop', exit: 'scaleOut' }}
    >
      <Text>Close it to see the exit.</Text>
    </Dialog>
  ),
}

/** Full control: fill a greese.js timeline for the element. */
export const CustomTimeline: Story = {
  render: () => (
    <Replay>
      <Motion
        asChild
        greese={{
          timeline: (tl, el) =>
            tl
              .from(el, { scale: 0.6, opacity: 0, duration: 0.4, ease: 'back.out(2)' })
              .to(el, { rotate: 8, duration: 0.15 })
              .to(el, { rotate: 0, duration: 0.4, ease: 'elastic.out(1.2, 0.4)' }),
        }}
      >
        <img
          src={art(18, '1 1')}
          alt=""
          width={160}
          height={160}
          style={{ borderRadius: 'var(--greese-radius-lg)' }}
        />
      </Motion>
    </Replay>
  ),
}
