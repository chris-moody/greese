import type { Meta, StoryObj } from '@storybook/react-vite'
import { Card, Carousel, CarouselSlide, Heading, Image, Stack, Text } from '@greese/react'
import { art } from '../_shared/fixtures.tsx'

const stops = ['Harbour', 'Ridge', 'Meadow', 'Coast']

/** The tour's slides; with `ids`, each deep-linkable (`#tour-coast`). */
const tour = (ids = false) =>
  stops.map((stop, i) => (
    <CarouselSlide key={stop} id={ids ? `tour-${stop.toLowerCase()}` : undefined}>
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <Image alt="" src={art(40 + i * 50)} ratio={16 / 9} placeholder="#ccd" />
        <Stack gap={1} p={4}>
          <Heading level={3} variant="h6">
            {stop}
          </Heading>
          <Text variant="p3" tone="muted">
            Stop {i + 1} of {stops.length}
          </Text>
        </Stack>
      </Card>
    </CarouselSlide>
  ))

const meta = {
  title: 'Content/Carousel',
  component: Carousel,
  subcomponents: { CarouselSlide },
  args: { label: 'Tour', children: tour(), style: { maxInlineSize: '32rem' } },
  argTypes: {
    enter: { control: 'text' },
    exit: { control: 'text' },
  },
} satisfies Meta<typeof Carousel>
export default meta

type Story = StoryObj<typeof meta>

/**
 * One slide at a time. The theme's `carousel` roles move it: by default the
 * new slide slides in the way it moves, the old one slides out.
 */
export const Playground: Story = {}

/** Any entrance and exit, by name: here a crossfade. */
export const Crossfade: Story = { args: { enter: 'fadeIn', exit: 'fadeOut' } }

/** Going back can differ: forward pockets left, back irises out. */
export const BackEffects: Story = {
  args: {
    enter: 'pocketLeft',
    exit: 'pocketOutLeft',
    back: { enter: 'fadeIn', exit: 'irisOut' },
  },
}

/**
 * Deep links: each slide has an `id`, so a page opened on `#tour-coast` shows
 * that slide before the first paint, a link to `#tour-coast` moves there, and
 * `syncHash` keeps the address on the slide shown.
 */
export const DeepLinked: Story = { args: { children: tour(true), syncHash: true } }

/** Next on the last slide wraps to the first. */
export const Looping: Story = { args: { loop: true, indicators: false } }
