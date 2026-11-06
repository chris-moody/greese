import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  Button,
  Card,
  Carousel,
  CarouselIndicator,
  CarouselNext,
  CarouselPrevious,
  CarouselSlide,
  Heading,
  Image,
  Stack,
  Text,
} from '@greese/react'
import { art } from '../_shared/fixtures.tsx'

const stops = ['Harbour', 'Ridge', 'Meadow', 'Coast']

const tour = () =>
  stops.map((stop, i) => (
    <CarouselSlide key={stop}>
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
  subcomponents: { CarouselSlide, CarouselPrevious, CarouselNext, CarouselIndicator },
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
 * Controlled: your state holds the slide, and anything can move it. This is
 * how deep links work: Carousel doesn't read the address, your app does.
 * Pass the slide a route names (`/tour/coast`) as `index`, or as
 * `defaultIndex` from a server-rendered or prerendered page, so it's there
 * from the first paint with no transition; write the address in
 * `onIndexChange`.
 */
export const Controlled: Story = {
  render: function Controlled(args) {
    const [index, setIndex] = useState(3)
    return (
      <Stack gap={3}>
        <Carousel {...args} index={index} onIndexChange={setIndex} />
        <Stack direction="row" gap={1} wrap="wrap">
          {stops.map((stop, i) => (
            <Button
              key={stop}
              size="sm"
              variant={i === index ? 'solid' : 'outline'}
              onClick={() => setIndex(i)}
            >
              {stop}
            </Button>
          ))}
        </Stack>
      </Stack>
    )
  },
}

/** Next on the last slide wraps to the first. */
export const Looping: Story = { args: { loop: true, indicators: false } }

/**
 * Every name it reads out is yours: `previousLabel` and `nextLabel`, and
 * functions for each slide (`slideLabel`) and dot (`indicatorLabel`), from
 * the index and the number of slides.
 */
export const Labels: Story = {
  args: {
    label: 'Visite',
    previousLabel: 'Diapositive précédente',
    nextLabel: 'Diapositive suivante',
    slideLabel: (i, count) => `${i + 1} sur ${count}`,
    indicatorLabel: (i) => `Aller à la diapositive ${i + 1}`,
  },
}

/**
 * Your own controls and dots: `controls` and `indicators` take anything,
 * placed where the buttons and dots go, that uses the carousel's parts.
 * With `asChild`, your element (here a Button, or a router link) gets the
 * behaviour and wiring, and keeps its own look. `announce={false}` quiets
 * the viewport, for a page that announces slide changes itself.
 */
export const CustomControls: Story = {
  args: {
    announce: false,
    controls: (
      <Stack direction="row" gap={2} justify="center">
        <CarouselPrevious asChild>
          <Button variant="outline">Back</Button>
        </CarouselPrevious>
        <CarouselNext asChild>
          <Button>Next</Button>
        </CarouselNext>
      </Stack>
    ),
    indicators: (
      <Stack direction="row" gap={1} justify="center">
        {stops.map((stop, i) => (
          <CarouselIndicator key={stop} index={i} asChild>
            <Button size="sm" variant="ghost" aria-label={`Go to ${stop}`}>
              {i + 1}
            </Button>
          </CarouselIndicator>
        ))}
      </Stack>
    ),
  },
}
