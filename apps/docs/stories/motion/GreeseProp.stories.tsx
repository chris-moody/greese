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
  type GreesePreset,
} from '@greese-ui/react'
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

const meta = {
  title: 'Motion/greese prop',
  component: Motion,
  args: { greese: 'fade-up', children: 'Any element, animated with the greese prop' },
  argTypes: {
    greese: {
      control: 'select',
      options: [
        'fade',
        'fade-up',
        'fade-down',
        'fade-start',
        'fade-end',
        'scale-in',
        'blur-in',
        'slide-up',
        'pop',
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
  'fade',
  'fade-up',
  'fade-down',
  'fade-start',
  'fade-end',
  'scale-in',
  'blur-in',
  'slide-up',
  'pop',
]

/** Entrance presets are pure CSS: they render on the server and need no JavaScript. */
export const Presets: Story = {
  render: () => (
    <Replay>
      <Grid minChildWidth="10rem" gap={3}>
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
      <Stack gap={2} greese={{ enter: 'fade-start', stagger: 0.06, distance: '2rem' }}>
        {['Design', 'Build', 'Test', 'Ship', 'Celebrate'].map((step) => (
          <Card key={step} variant="filled">
            {step}
          </Card>
        ))}
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
        <Card key={n} greese={{ inView: n % 2 ? 'fade-up' : 'scale-in' }}>
          <Heading level={3} size="md">
            Card {n}
          </Heading>
        </Card>
      ))}
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
        <Text size="lg" greese={{ text: 'type' }}>
          Typed on, one letter at a time.
        </Text>
        <Stack direction="row" gap={2} align="center">
          <Text size="2xl" weight="bold" greese={{ text: 'count', duration: 1.5 }}>
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
      greese={{ enter: 'pop', exit: 'scale-out' }}
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
